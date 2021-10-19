const EventEmitter = require('events').EventEmitter;
const config = require('../../config/config');
const { v4: uuidv4 } = require('uuid');
const Lobby = require('./Lobby');
const {AwaitQueue} = require('awaitqueue');
const jwt = require('jsonwebtoken');

const ROUTER_SCALE_SIZE = 40;
class Room extends EventEmitter {
	static getLeastLoadedRouter(mediasoupWorkers, peers, mediasoupRouters)
	{

		const routerLoads = new Map();

		const workerLoads = new Map();

		const pipedRoutersIds = new Set();

		for (const peer of peers.values())
		{
			const routerId = peer.routerId;

			if (routerId)
			{
				if (mediasoupRouters.has(routerId))
				{
					pipedRoutersIds.add(routerId);
				}

				if (routerLoads.has(routerId))
				{
					routerLoads.set(routerId, routerLoads.get(routerId) + 1);
				}
				else
				{
					routerLoads.set(routerId, 1);
				}
			}
		}

		for (const worker of mediasoupWorkers)
		{
			for (const router of worker._routers)
			{
				const routerId = router._internal.routerId;

				if (workerLoads.has(worker._pid))
				{
					workerLoads.set(worker._pid, workerLoads.get(worker._pid) +
						(routerLoads.has(routerId)?routerLoads.get(routerId):0));
				}
				else
				{
					workerLoads.set(worker._pid,
						(routerLoads.has(routerId)?routerLoads.get(routerId):0));
				}
			}
		}

		const sortedWorkerLoads = new Map([ ...workerLoads.entries() ].sort(
			(a, b) => a[1] - b[1]));

		// we don't care about if router is piped, just choose the least loaded worker
		if (pipedRoutersIds.size === 0 ||
			pipedRoutersIds.size === mediasoupRouters.size)
		{
			const workerId = sortedWorkerLoads.keys().next().value;

			for (const worker of mediasoupWorkers)
			{
				if (worker._pid === workerId)
				{
					for (const router of worker._routers)
					{
						const routerId = router._internal.routerId;

						if (mediasoupRouters.has(routerId))
						{
							return routerId;
						}
					}
				}
			}
		}
		else
		{
			// find if there is a piped router that is on a worker that is below limit
			for (const [ workerId, workerLoad ] of sortedWorkerLoads.entries())
			{
				for (const worker of mediasoupWorkers)
				{
					if (worker._pid === workerId)
					{
						for (const router of worker._routers)
						{
							const routerId = router._internal.routerId;

							// on purpose we check if the worker load is below the limit,
							// as in reality the worker load is imortant,
							// not the router load
							if (mediasoupRouters.has(routerId) &&
								pipedRoutersIds.has(routerId) &&
								workerLoad < ROUTER_SCALE_SIZE)
							{
								return routerId;
							}
						}
					}
				}
			}

			// no piped router found, we need to return router from least loaded worker
			const workerId = sortedWorkerLoads.keys().next().value;

			for (const worker of mediasoupWorkers)
			{
				if (worker._pid === workerId)
				{
					for (const router of worker._routers)
					{
						const routerId = router._internal.routerId;

						if (mediasoupRouters.has(routerId))
						{
							return routerId;
						}
					}
				}
			}
		}
	}


	static async create({ mediasoupWorkers, roomId, peers, host_peer })
	{
		console.info('create() [roomId:"%s"]', roomId);
		// Router media codecs.
		const mediaCodecs = config.mediasoup.router.mediaCodecs;

		const mediasoupRouters = new Map();

		for (const worker of mediasoupWorkers)
		{
			const router = await worker.createRouter({ mediaCodecs });

			mediasoupRouters.set(router.id, router);
		}

		const firstRouter = mediasoupRouters.get(Room.getLeastLoadedRouter(
			mediasoupWorkers, peers, mediasoupRouters));

		// Create a mediasoup AudioLevelObserver on first router
		const audioLevelObserver = await firstRouter.createAudioLevelObserver(
			{
				maxEntries : 1,
				threshold  : -80,
				interval   : 800
			});

		return new Room({
			roomId,
			mediasoupRouters,
			audioLevelObserver,
			mediasoupWorkers,
			host_peer
		});
	}

    constructor({roomId,mediasoupRouters,audioLevelObserver,mediasoupWorkers,host_peer}) {
		super();
		this.setMaxListeners(Infinity);
		this._mediasoupWorkers = mediasoupWorkers;
		this._uuid = uuidv4();
        this._roomId = roomId;
        this._locked = false;
        this.host_peer = host_peer;
		this._activeSpeaker = null;
		this._lobby = new Lobby();
		this._queue = new AwaitQueue();
		this._peers = [];
		this._lastN = [];
		this._closed = false;
		this._mediasoupRouters = mediasoupRouters;
		this._audioLevelObserver = audioLevelObserver;
		this._selfDestructTimeout =null;
		this._handleLobby();
		this._handleAudioLevelObserver();
    }

    get lock() {
        return this.locked = true;
    }
    set lock(lock) {
        this._locked = lock;
	}
	
	verifyPeer({ id, token })
	{
		try
		{
			const decoded = jwt.verify(token, this._uuid);

			console.info('verifyPeer() [decoded:"%o"]', decoded);

			return decoded.id === id;
		}
		catch (err)
		{
			console.warn('verifyPeer() | invalid token');
		}

		return false;
	}

	async handlePeer({ peer, returning })
	{
		console.info('handlePeer() [peer:"%s", roles:"%s", returning:"%s"]', peer.id, peer.roles, returning);

		// Should not happen
		if (this._peers[peer.id])
		{
			console.warn(
				'handleConnection() | there is already a peer with same peerId [peer:"%s"]',
				peer.id);
		}

		// Returning user
		if (returning)
			this._peerJoining(peer, true);
		// Has a role that is allowed to bypass room lock
		else if (this.host_peer && this.host_peer.id === peer.id)
		{
			await this._peerJoining(peer);
			console.log("Admin peer")
		}
			
		else 
			this._parkPeer(peer);
	}

	_peerJoining(peer, returning = false)
	{
		this._queue.push(async () =>
		{
			peer.socket.join(this._roomId);

			// If we don't have this peer, add to end
			!this._lastN.includes(peer.id) && this._lastN.push(peer.id);

			this._peers[peer.id] = peer;

			// Assign routerId
			peer.routerId = await this._getRouterId();

			this._handlePeer(peer);

			if (returning)
			{
				this._notification(peer.socket, 'roomBack',{peerId:peer.id});
			}
			
			this._notification(peer.socket, 'roomReady',{peerId:peer.id});

		})
			.catch((error) =>
			{
				console.error('_peerJoining() [error:"%o"]', error);
			});
	}

	_handlePeer(peer)
	{
		console.debug('_handlePeer() [peer:"%s"]', peer.id);

		peer.on('close', () =>
		{
			this._handlePeerClose(peer);
		});

		peer.on('displayNameChanged', ({ oldDisplayName }) =>
		{
			// Ensure the Peer is joined.
			if (!peer.joined)
				return;

			// Spread to others
			this._notification(peer.socket, 'changeDisplayName', {
				peerId         : peer.id,
				displayName    : peer.displayName,
				oldDisplayName : oldDisplayName
			}, true);
		});

		peer.on('pictureChanged', () =>
		{
			// Ensure the Peer is joined.
			if (!peer.joined)
				return;

			// Spread to others
			this._notification(peer.socket, 'changePicture', {
				peerId  : peer.id,
				picture : peer.picture
			}, true);
		});

		peer.on('gotRole', ({ newRole }) =>
		{
			// Ensure the Peer is joined.
			if (!peer.joined)
				return;

			// Spread to others
			this._notification(peer.socket, 'gotRole', {
				peerId : peer.id,
				roleId : newRole.id
			}, true, true);

			// Got permission to promote peers, notify peer of
			// peers in lobby
			if (roomPermissions.PROMOTE_PEER.some((role) => role.id === newRole.id))
			{
				const lobbyPeers = this._lobby.peerList();

				lobbyPeers.length > 0 && this._notification(peer.socket, 'parkedPeers', {
					lobbyPeers
				});
			}
		});

		peer.on('lostRole', ({ oldRole }) =>
		{
			// Ensure the Peer is joined.
			if (!peer.joined)
				return;

			// Spread to others
			this._notification(peer.socket, 'lostRole', {
				peerId : peer.id,
				roleId : oldRole.id
			}, true, true);
		});

		peer.socket.on('request', (request, cb) =>
		{
			console.debug(
				'Peer "request" event [method:"%s", peerId:"%s"]',
				request.method, peer.id);

			this._handleSocketRequest(peer, request, cb)
				.catch((error) =>
				{
					console.error('"request" failed [error:"%o"]', error);

					cb(error);
				});
		});

		// Peer left before we were done joining
		if (peer.closed)
			this._handlePeerClose(peer);
	}

	_parkPeer(parkPeer)
	{
		this._lobby.parkPeer(parkPeer);
	 	this.host_peer?
		 this._notification(this.host_peer.socket, 'parkedPeer', { id: parkPeer.id, displayName:parkPeer.displayName})
		 :'';
		 console.log("After park peer notification")
	}

	_handlePeerClose(peer)
	{
		console.debug('_handlePeerClose() [peer:"%s"]', peer.id);

		if (this._closed)
			return;

		// If the Peer was joined, notify all Peers.
		if (peer.joined)
			this._notification(peer.socket, 'peerClosed', { peerId: peer.id }, true);

		// Remove from lastN
		this._lastN = this._lastN.filter((id) => id !== peer.id);

		delete this._peers[peer.id];


		// If this is the last Peer in the room and
		// lobby is empty, close the room after a while.
		if (this.checkEmpty() && this._lobby.checkEmpty())
			this.selfDestructCountdown();
	}

	_handleLobby()
	{
		this._lobby.on('promotePeer', (promotedPeer) =>
		{
			console.info('promotePeer() [promotedPeer:"%s"]', promotedPeer.id);

			const { id } = promotedPeer;

			this._peerJoining(promotedPeer);

			this._notification(this.host_peer.socket, 'lobby:promotedPeer', { peerId: id });
		});

		this._lobby.on('peerRolesChanged', (peer) =>
		{
			// Has a role that is allowed to bypass room lock
			if (this._hasAccess(peer, BYPASS_ROOM_LOCK))
			{
				this._lobby.promotePeer(peer.id);

				return;
			}

			if ( // Has a role that is allowed to bypass lobby
				!this._locked &&
				this._hasAccess(peer, BYPASS_LOBBY)
			)
			{
				this._lobby.promotePeer(peer.id);

				return;
			}
		});

		this._lobby.on('changeDisplayName', (changedPeer) =>
		{
			const { id, displayName } = changedPeer;

				this._notification(this.host_peer.socket, 'lobby:changeDisplayName', { peerId: id, displayName });
		});

		this._lobby.on('changePicture', (changedPeer) =>
		{
			const { id, picture } = changedPeer;
			this._notification(this.host_peer.socket, 'lobby:changePicture', { peerId: id, picture });
		
		});

		this._lobby.on('peerClosed', (closedPeer) =>
		{
			console.info('peerClosed() [closedPeer:"%s"]', closedPeer.id);

			const { id } = closedPeer;

			this._notification(this.host_peer.socket, 'lobby:peerClosed', { peerId: id });
		});

		// If nobody left in lobby we should check if room is empty too and initiating
		// rooms selfdestruction sequence  
		this._lobby.on('lobbyEmpty', () =>
		{
			if (this.checkEmpty())
			{
				this.selfDestructCountdown();
			}
		});
	}

	_handleAudioLevelObserver()
	{
		// Set audioLevelObserver events.
		this._audioLevelObserver.on('volumes', (volumes) =>
		{
			const { producer, volume } = volumes[0];

			let peer = this._peers[producer.appData.peerId];
			this._notification(
				peer.socket,
				'activeSpeaker',
				{
					peerId : producer.appData.peerId,
					volume : volume
				},
				true);
			// Notify all Peers.
		});
	}



	selfDestructCountdown()
	{
		console.debug('selfDestructCountdown() started');

		if (this._selfDestructTimeout)
			clearTimeout(this._selfDestructTimeout);

		this._selfDestructTimeout = setTimeout(() =>
		{
			if (this._closed)
				return;

			if (this.checkEmpty() && this._lobby.checkEmpty())
			{
				console.info(
					'Room deserted for some time, closing the room [roomId:"%s"]',
					this._roomId);
				this.close();
			}
			else
				console.debug('selfDestructCountdown() aborted; room is not empty!');
		}, 10000);
	}

	selfDestructCountdown()
	{
		console.debug('selfDestructCountdown() started');

		if (this._selfDestructTimeout)
			clearTimeout(this._selfDestructTimeout);

		this._selfDestructTimeout = setTimeout(() =>
		{
			if (this._closed)
				return;

			if (this.checkEmpty() && this._lobby.checkEmpty())
			{
				console.info('Room deserted for some time, closing the room [roomId:"%s"]',this._roomId);
				this.close();
			}
			else
				console.debug('selfDestructCountdown() aborted; room is not empty!');
		}, 10000);
	}

	close()
	{
		console.debug('close()1');

		this._closed = true;

		this._queue.close();

		this._queue = null;

		if (this._selfDestructTimeout)
			clearTimeout(this._selfDestructTimeout);

		this._selfDestructTimeout = null;

		this._lobby.close();

		this._lobby = null;

		// Close the peers.
		for (const peer in this._peers)
		{
			if (!this._peers[peer].closed)
				this._peers[peer].close();
		}

		this._peers = null;

		// Close the mediasoup Routers.
		for (const router of this._mediasoupRouters.values())
		{
			router.close();
		}

		this._mediasoupWorkers = null;

		this._mediasoupRouters.clear();

		this._audioLevelObserver = null;

		// Emit 'close' event.
		this.emit('close');
	}

	checkEmpty()
	{
		return Object.keys(this._peers).length === 0;
	}

	async _handleSocketRequest(peer, request, cb)
	{
		const router = this._mediasoupRouters.get(peer.routerId);

		switch (request.method)
		{
			case 'getRouterRtpCapabilities':
			{
				cb(null, router.rtpCapabilities);

				break;
			}

			case 'join':
			{
				// Ensure the Peer is not already joined.
				if (peer.joined)
					throw new Error('Peer already joined');

				const {
					rtpCapabilities
				} = request.data;

				// Store client data into the Peer data object.
				peer.rtpCapabilities = rtpCapabilities;

				// Tell the new Peer about already joined Peers.
				// And also create Consumers for existing Producers.
				// Mark the new Peer as joined.
				peer.joined = true;

				const peerInfos = this.getJoinedPeers().map((joinedPeer) => (joinedPeer.peerInfo));

				let lobbyPeers = [];

				// Allowed to promote peers, notify about lobbypeers
				if (this.host_peer.id === peer.id)
					lobbyPeers = this._lobby.peerList();

				cb(null, {
					peers                : peerInfos,
					authenticated        : peer.authenticated,
					isAdmin            : this.host_peer.id === peer.id,
					lastNHistory         : this._lastN,
					locked				: this.locked,
					lobbyPeers           : lobbyPeers,
				});



				for (const joinedPeer of this.getJoinedPeers(peer))
				{
					// Create Consumers for existing Producers.
					for (const producer of joinedPeer.producers.values())
					{
						this._createConsumer(
							{
								consumerPeer : peer,
								producerPeer : joinedPeer,
								producer
							});
					}
					for (const dataProducer of joinedPeer.dataProducers.values())
					{
						this._createDataConsumer(
							{
								consumerPeer : peer,
								producerPeer : joinedPeer,
								dataProducer
							});
							console.log("data proucecres")
					}
				}
				this._notification(peer.socket,'newPeer',peer.peerInfo,true);
				
				console.debug('peer joined [peer: "%s"]',peer.id);

				break;
			}

			case 'createWebRtcTransport':
			{
				// NOTE: Don't require that the Peer is joined here, so the client can
				// initiate mediasoup Transports and be ready when he later joins.

				const { forceTcp, producing, consuming } = request.data;

				const webRtcTransportOptions =
				{
					...config.mediasoup.webRtcTransport,
					appData : { producing, consuming }
				};

				webRtcTransportOptions.enableTcp = true;

				if (forceTcp)
					webRtcTransportOptions.enableUdp = false;
				else
				{
					webRtcTransportOptions.enableUdp = true;
					webRtcTransportOptions.preferUdp = true;
				}

				const transport = await router.createWebRtcTransport(
					webRtcTransportOptions
				);

				transport.on('dtlsstatechange', (dtlsState) =>
				{
					if (dtlsState === 'failed' || dtlsState === 'closed')
						console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s]', dtlsState);
				});

				// Store the WebRtcTransport into the Peer data Object.
				peer.addTransport(transport.id, transport);

				cb(
					null,
					{
						id             : transport.id,
						iceParameters  : transport.iceParameters,
						iceCandidates  : transport.iceCandidates,
						dtlsParameters : transport.dtlsParameters,
						sctpParameters : transport.sctpParameters
					});

				const { maxIncomingBitrate } = config.mediasoup.webRtcTransport;

				// If set, apply max incoming bitrate limit.
				if (maxIncomingBitrate)
				{
					try { await transport.setMaxIncomingBitrate(maxIncomingBitrate); }
					catch (error) {}
				}

				break;
			}

			case 'connectWebRtcTransport':
			{
				const { transportId, dtlsParameters } = request.data;
				const transport = peer.getTransport(transportId);

				if (!transport)
					throw new Error(`transport with id "${transportId}" not found`);

				await transport.connect({ dtlsParameters });

				cb();

				break;
			}

			case 'restartIce':
			{
				const { transportId } = request.data;
				const transport = peer.getTransport(transportId);

				if (!transport)
					throw new Error(`transport with id "${transportId}" not found`);

				const iceParameters = await transport.restartIce();

				cb(null, iceParameters);

				break;
			}

			case 'produce':
			{
				let { appData } = request.data;

				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { transportId, kind, rtpParameters } = request.data;
				const transport = peer.getTransport(transportId);

				if (!transport)
					throw new Error(`transport with id "${transportId}" not found`);

				// Add peerId into appData to later get the associated Peer during
				// the 'loudest' event of the audioLevelObserver.
				appData = { ...appData, peerId: peer.id };

				const producer =
					await transport.produce({ kind, rtpParameters, appData });

				const pipeRouters = this._getRoutersToPipeTo(peer.routerId);
				console.log("pipeRouter",pipeRouters,peer.routerId);

				for (const [ routerId, destinationRouter ] of this._mediasoupRouters)
				{
					if (pipeRouters.includes(routerId))
					{console.log("pipe to router in produce")
						await router.pipeToRouter({
							producerId : producer.id,
							router     : destinationRouter
						});
					}
				}

				// Store the Producer into the Peer data Object.
				peer.addProducer(producer.id, producer);

				// Set Producer events.
				producer.on('score', (score) =>
				{
					this._notification(peer.socket, 'producerScore', { producerId: producer.id, score });
				});

				producer.on('videoorientationchange', (videoOrientation) =>
				{
					console.debug(
						'producer "videoorientationchange" event [producerId:"%s", videoOrientation:"%o"]',
						producer.id, videoOrientation);
				});

				cb(null, { id: producer.id });

				// Optimization: Create a server-side Consumer for each Peer.
				for (const otherPeer of this.getJoinedPeers(peer))
				{
					this._createConsumer(
						{
							consumerPeer : otherPeer,
							producerPeer : peer,
							producer
						});
				}

				// Add into the audioLevelObserver.
				if (kind === 'audio')
				{
					this._audioLevelObserver.addProducer({ producerId: producer.id })
						.catch(() => {});
				}

				break;
			}

			case 'producedata':
			{
				let { appData } = request.data;

				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { transportId, label, sctpStreamParameters,protocol } = request.data;

				const transport = peer.getTransport(transportId);

				if (!transport)
					throw new Error(`transport with id "${transportId}" not found`);

				// Add peerId into appData to later get the associated Peer during
				// the 'loudest' event of the audioLevelObserver.
				appData = { ...appData, peerId: peer.id };

				const dataProducer =
					await transport.produceData({ label, sctpStreamParameters,protocol, appData });

				const pipeRouters = this._getRoutersToPipeTo(peer.routerId);
				console.log("pipeRouter",pipeRouters);
				for (const [ routerId, destinationRouter ] of this._mediasoupRouters)
				{
					if (pipeRouters.includes(routerId))
					{
						console.log("pipe to router in producedata")
						await router.pipeToRouter({
							producerId : dataProducer.id,
							router     : destinationRouter
						});
					}
				}

				// Store the Producer into the Peer data Object.
				peer.addDataProducer(dataProducer.id, dataProducer);


				cb(null, { id: dataProducer.id });

				// Optimization: Create a server-side Consumer for each Peer.
				for (const otherPeer of this.getJoinedPeers(peer))
				{
					this._createDataConsumer(
						{
							consumerPeer : otherPeer,
							producerPeer : peer,
							dataProducer
						});
				}

				break;
			}

			case 'closeProducer':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { producerId } = request.data;
				const producer = peer.getProducer(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				producer.close();

				// Remove from its map.
				peer.removeProducer(producer.id);

				cb();

				break;
			}

			case 'closeDataProducer':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { producerId } = request.data;
				const producer = peer.getDataProducer(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				producer.close();

				// Remove from its map.
				peer.removeDataProducer(producer.id);

				cb();

				break;
			}

			case 'pauseProducer':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { producerId } = request.data;
				const producer = peer.getProducer(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				await producer.pause();

				cb();

				break;
			}

			case 'resumeProducer':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { producerId } = request.data;
				const producer = peer.getProducer(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				await producer.resume();

				cb();

				break;
			}

			case 'pauseConsumer':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { consumerId } = request.data;
				const consumer = peer.getConsumer(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.pause();

				cb();

				break;
			}

			case 'resumeConsumer':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { consumerId } = request.data;
				const consumer = peer.getConsumer(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.resume();

				cb();

				break;
			}

			case 'setConsumerPreferedLayers':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { consumerId, spatialLayer, temporalLayer } = request.data;
				const consumer = peer.getConsumer(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.setPreferredLayers({ spatialLayer, temporalLayer });

				cb();

				break;
			}

			case 'setConsumerPriority':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { consumerId, priority } = request.data;
				const consumer = peer.getConsumer(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.setPriority(priority);

				cb();

				break;
			}

			case 'requestConsumerKeyFrame':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { consumerId } = request.data;
				const consumer = peer.getConsumer(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.requestKeyFrame();

				cb();

				break;
			}

			case 'getTransportStats':
			{
				const { transportId } = request.data;
				const transport = peer.getTransport(transportId);

				if (!transport)
					throw new Error(`transport with id "${transportId}" not found`);

				const stats = await transport.getStats();

				cb(null, stats);

				break;
			}

			case 'getProducerStats':
			{
				const { producerId } = request.data;
				const producer = peer.getProducer(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				const stats = await producer.getStats();

				cb(null, stats);

				break;
			}

			case 'getConsumerStats':
			{
				const { consumerId } = request.data;
				const consumer = peer.getConsumer(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				const stats = await consumer.getStats();

				cb(null, stats);

				break;
			}

			case 'changeDisplayName':
			{
				// Ensure the Peer is joined.
				if (!peer.joined)
					throw new Error('Peer not yet joined');

				const { displayName } = request.data;

				peer.displayName = displayName;

				// This will be spread through events from the peer object

				// Return no error
				cb();

				break;
			}

			case 'moderator:clearChat':
			{
				if (!this._hasPermission(peer, MODERATE_CHAT))
					throw new Error('peer not authorized');

				this._chatHistory = [];

				// Spread to others
				this._notification(peer.socket, 'moderator:clearChat', null, true);

				// Return no error
				cb();

				break;
			}

			case 'moderator:lockRoom':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				this._locked = true;

				// Spread to others
				this._notification(peer.socket, 'lockRoom', {
					peerId : peer.id
				}, true);

				// Return no error
				cb();

				break;
			}

			case 'moderator:unlockRoom':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				this._locked = false;

				// Spread to others
				this._notification(peer.socket, 'unlockRoom', {
					peerId : peer.id
				}, true);

				// Return no error
				cb();

				break;
			}

			case 'setAccessCode':
			{
				const { accessCode } = request.data;

				this._accessCode = accessCode;

				// Spread to others
				// if (request.public) {
				this._notification(peer.socket, 'setAccessCode', {
					peerId     : peer.id,
					accessCode : accessCode
				}, true);
				// }

				// Return no error
				cb();

				break;
			}

			case 'setJoinByAccessCode':
			{
				const { joinByAccessCode } = request.data;

				this._joinByAccessCode = joinByAccessCode;

				// Spread to others
				this._notification(peer.socket, 'setJoinByAccessCode', {
					peerId           : peer.id,
					joinByAccessCode : joinByAccessCode
				}, true);

				// Return no error
				cb();

				break;
			}

			case 'promotePeer':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				const { peerId } = request.data;
				console.log(request.data);

				this._lobby.promotePeer(peerId);

				// Return no error
				cb();

				break;
			}

			case 'promoteAllPeers':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				this._lobby.promoteAllPeers();

				// Return no error
				cb();

				break;
			}

			case 'raisedHand':
			{
				const { raisedHand } = request.data;

				peer.raisedHand = raisedHand;

				// Spread to others
				this._notification(peer.socket, 'raisedHand', {
					peerId              : peer.id,
					raisedHand          : raisedHand,
					raisedHandTimestamp : peer.raisedHandTimestamp
				}, true);

				// Return no error
				cb();

				break;
			}

			case 'moderator:mute':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				const { peerId } = request.data;

				const mutePeer = this._peers[peerId];

				if (!mutePeer)
					throw new Error(`peer with id "${peerId}" not found`);

				this._notification(mutePeer.socket, 'moderator:mute');

				cb();

				break;
			}

			case 'moderator:muteAll':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				// Spread to others
				this._notification(peer.socket, 'moderator:mute', null, true);

				cb();

				break;
			}

			case 'moderator:stopVideo':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				const { peerId } = request.data;

				const stopVideoPeer = this._peers[peerId];

				if (!stopVideoPeer)
					throw new Error(`peer with id "${peerId}" not found`);

				this._notification(stopVideoPeer.socket, 'moderator:stopVideo');

				cb();

				break;
			}

			case 'moderator:stopAllVideo':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				// Spread to others
				this._notification(peer.socket, 'moderator:stopVideo', null, true);

				cb();

				break;
			}

			case 'moderator:stopAllScreenSharing':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				// Spread to others
				this._notification(peer.socket, 'moderator:stopScreenSharing', null, true);

				cb();

				break;
			}

			case 'moderator:stopScreenSharing':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				const { peerId } = request.data;

				const stopVideoPeer = this._peers[peerId];

				if (!stopVideoPeer)
					throw new Error(`peer with id "${peerId}" not found`);

				this._notification(stopVideoPeer.socket, 'moderator:stopScreenSharing');

				cb();

				break;
			}

			case 'moderator:closeMeeting':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				this._notification(peer.socket, 'moderator:kick', true,	true);

				cb();

				// Close the room
				this.close();

				break;
			}

			case 'moderator:kickPeer':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				const { peerId } = request.data;

				const kickPeer = this._peers[peerId];

				if (!kickPeer)
					throw new Error(`peer with id "${peerId}" not found`);

				this._notification(kickPeer.socket, 'moderator:kick');

				kickPeer.close();

				cb();

				break;
			}

			case 'lowerHand':
			{
				if (this.host_peer.id !== peer.id)
					throw new Error('peer not authorized');

				const { peerId } = request.data;

				const lowerPeer = this._peers[peerId];

				if (!lowerPeer)
					throw new Error(`peer with id "${peerId}" not found`);

				this._notification(lowerPeer.socket, 'moderator:lowerHand');

				cb();

				break;
			}

			default:
			{
				console.error('unknown request.method "%s"', request.method);

				cb(500, `unknown request.method "${request.method}"`);
			}
		}
	}

	async _createConsumer({ consumerPeer, producerPeer, producer })
	{
		console.debug(
			'_createConsumer() [consumerPeer:"%s", producerPeer:"%s", producer:"%s"]',
			consumerPeer.id,
			producerPeer.id,
			producer.id
		);

		const router = this._mediasoupRouters.get(producerPeer.routerId);

		// Optimization:
		// - Create the server-side Consumer. If video, do it paused.
		// - Tell its Peer about it and wait for its response.
		// - Upon receipt of the response, resume the server-side Consumer.
		// - If video, this will mean a single key frame requested by the
		//   server-side Consumer (when resuming it).

		// NOTE: Don't create the Consumer if the remote Peer cannot consume it.
		if (
			!consumerPeer.rtpCapabilities ||
			!router.canConsume(
				{
					producerId      : producer.id,
					rtpCapabilities : consumerPeer.rtpCapabilities
				})
		)
		{
			return;
		}

		// Must take the Transport the remote Peer is using for consuming.
		const transport = consumerPeer.getConsumerTransport();

		// This should not happen.
		if (!transport)
		{
			console.warn('_createConsumer() | Transport for consuming not found');

			return;
		}

		// Create the Consumer in paused mode.
		let consumer;

		try
		{
			consumer = await transport.consume(
				{
					producerId      : producer.id,
					rtpCapabilities : consumerPeer.rtpCapabilities,
					paused          : producer.kind == 'video'
				});

			if (producer.kind === 'audio')
				await consumer.setPriority(255);
		}
		catch (error)
		{
			console.warn('_createConsumer() | [error:"%o"]', error);

			return;
		}

		// Store the Consumer into the consumerPeer data Object.
		consumerPeer.addConsumer(consumer.id, consumer);

		// Set Consumer events.
		consumer.on('transportclose', () =>
		{
			// Remove from its map.
			consumerPeer.removeConsumer(consumer.id);
		});

		consumer.on('producerclose', () =>
		{
			// Remove from its map.
			consumerPeer.removeConsumer(consumer.id);

			this._notification(consumerPeer.socket, 'consumerClosed', { consumerId: consumer.id });
		});

		consumer.on('producerpause', () =>
		{
			this._notification(consumerPeer.socket, 'consumerPaused', { consumerId: consumer.id });
		});

		consumer.on('producerresume', () =>
		{
			this._notification(consumerPeer.socket, 'consumerResumed', { consumerId: consumer.id });
		});

		consumer.on('score', (score) =>
		{
			this._notification(consumerPeer.socket, 'consumerScore', { consumerId: consumer.id, score });
		});

		consumer.on('layerschange', (layers) =>
		{
			this._notification(
				consumerPeer.socket,
				'consumerLayersChanged',
				{
					consumerId    : consumer.id,
					spatialLayer  : layers ? layers.spatialLayer : null,
					temporalLayer : layers ? layers.temporalLayer : null
				}
			);
		});

		// Send a request to the remote Peer with Consumer parameters.
		try
		{
			await this._request(
				consumerPeer.socket,
				'newConsumer',
				{
					peerId         : producerPeer.id,
					kind           : consumer.kind,
					producerId     : producer.id,
					id             : consumer.id,
					rtpParameters  : consumer.rtpParameters,
					type           : consumer.type,
					appData        : producer.appData,
					producerPaused : consumer.paused
				}
			);
			// Now that we got the positive response from the remote Peer and, if
			// video, resume the Consumer to ask for an efficient key frame.
			await consumer.resume();

			this._notification(
				consumerPeer.socket,
				'consumerScore',
				{
					consumerId : consumer.id,
					score      : consumer.score,
					puaused: consumer.paused
				}
			);
		}
		catch (error)
		{
			console.warn('_createConsumer() | [error:"%o"]', error);
		}
	}

	async _createDataConsumer({ consumerPeer, producerPeer, dataProducer })
	{
		console.debug(
			'_createDataConsumer() [consumerPeer:"%s", producerPeer:"%s", producer:"%s"]',
			consumerPeer.id,
			producerPeer.id,
			dataProducer.id
		);

		const transport = consumerPeer.getConsumerTransport();

		// This should not happen.
		if (!transport)
		{
			console.warn('_createDataConsumer() | Transport for consuming not found');

			return;
		}

		// Create the Consumer in paused mode.
		let consumer;

		try
		{
			consumer = await transport.consumeData(
				{
					dataProducerId      : dataProducer.id,
				});

		}
		catch (error)
		{
			console.warn('_createDataConsumer() | [error:"%o"]', error);

			return;
		}

		// Store the Consumer into the consumerPeer data Object.
		consumerPeer.addDataConsumer(consumer.id, consumer);

		// Set Consumer events.
		consumer.on('transportclose', () =>
		{
			// Remove from its map.
			consumerPeer.removeDataConsumer(consumer.id);
		});

		consumer.on('dataproducerclose', () =>
		{
			// Remove from its map.
			consumerPeer.removeDataConsumer(consumer.id);

			this._notification(consumerPeer.socket, 'dataConsumerClosed', { dataConsumerId: consumer.id });
		});
		consumer.on('message',(message,ppid)=>{
			console.log(message,ppid)
		})

		// Send a request to the remote Peer with Consumer parameters.
		try
		{
			await this._request(
				consumerPeer.socket,
				'newDataConsumer',
				{
					peerId         : producerPeer.id,
					label           : consumer.label,
					dataProducerId     : consumer.dataProducerId,
					id             : consumer.id,
					sctpStreamParameters  : consumer.sctpStreamParameters,
					type           : consumer.type,
					protocol : consumer.protocol,
					appData        : dataProducer.appData,
					
				}
			);

		}
		catch (error)
		{
			console.warn('_createConsumer() | [error:"%o"]', error);
		}
	}

	_sendRequest(socket, method, data = {})
	{
		return new Promise((resolve, reject) =>
		{
			socket.emit(
				'request',
				{ method, data },(err,response)=>{
					if (err)
					{
						reject(err);
					}
					else
					{
						resolve(response);
					}
				}
			);
		});
	}

	async _request(socket, method, data)
	{
		console.debug('_request() [method:"%s", data:"%o"]', method, data);

		try
			{
				return await this._sendRequest(socket, method, data);
			}
			catch (error)
			{
					throw error;
			}
	}

	_notification(socket, method, data = {}, broadcast = false, includeSender = false)
	{
		if (broadcast)
		{
			socket.broadcast.to(this._roomId).emit(
				'notification', { method, data }
			);

			if (includeSender)
				socket.emit('notification', { method, data });
		}
		else
		{
			socket.emit('notification', { method, data });
		}
	}

	async _pipeProducersToRouter(routerId)
	{
		const router =await this._mediasoupRouters.get(routerId);

		const peersToPipe =await
			Object.values(this._peers)
				.filter((peer) => peer.routerId !== routerId && peer.routerId !== null);
		for (const peer of peersToPipe)
		{
			const srcRouter =await this._mediasoupRouters.get(peer.routerId);
			for (const producerId of peer.producers.keys())
			{
				if (router._producers.has(producerId))
				{
					continue;
				}

				await srcRouter.pipeToRouter({
					producerId : producerId,
					router     : router
				});
			}
		}
	}

	async _getRouterId()
	{
		const routerId = Room.getLeastLoadedRouter(
			this._mediasoupWorkers, this._peers, this._mediasoupRouters);

		await this._pipeProducersToRouter(routerId);

		return routerId;
	}

	// Returns an array of router ids we need to pipe to
	_getRoutersToPipeTo(originRouterId)
	{
		return Object.values(this._peers)
			.map((peer) => peer.routerId)
			.filter((routerId, index, self) =>
				routerId !== originRouterId && self.indexOf(routerId) === index
			);
	}
	
	getJoinedPeers(excludePeer = undefined)
	{
		return Object.values(this._peers)
			.filter((peer) => peer.joined && peer !== excludePeer);
	}
}



module.exports = Room;