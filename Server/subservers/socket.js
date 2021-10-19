const socketio = require('socket.io');
const {AwaitQueue} = require('awaitqueue');
const passport = require('passport');
const jwt = require('jsonwebtoken')

const Room = require('./mediasoup/myroom');
const Peer = require('./mediasoup/Peer');

const queue = new AwaitQueue();
const rooms = new Map();
const peers =new Map();

exports.ioserver = function(webServer,mediasoupWorkers) {


	io = socketio(webServer,{cors: {
		origin: "*",
		methods: ["GET", "POST"]
	  }});

	// Handle connections from clients.
	io.on('connection', (socket) =>
	{
		const { token } =socket.handshake.auth;
		const decoded = jwt.decode(token,{secret:'secret'});
		console.log(decoded)
		if (!decoded._id || !decoded.meetingId)
		{
			console.warn('connection request without roomId and/or ');

			socket.disconnect(true);

			return;
		}

		console.info('connection request [roomId:"%s", peerId:"%s"]', decoded.meetingId, decoded._id);

		queue.push(async () =>
		{	let peer = peers.get(decoded._id)
			let returning = false;
			if(peer){
				console.log("Peer is avail")
				await peer.close();
				returning =true;
			}			

			peer = new Peer({ id: decoded._id, roomId:decoded.meetingId,displayName:decoded.displayName, socket });
			peer.on('close', () =>
			{
				console.log("Peer closed")
				peers.delete(decoded._id);

			});
         peers.set(decoded._id, peer);
         
         const room = decoded.is_host?await getOrCreateRoom({ roomId:decoded.meetingId, mediasoupWorkers, host_peer:peer}):await getOrCreateRoom({ roomId:decoded.meetingId, mediasoupWorkers});

			room.handlePeer({ peer, returning });
		})
			.catch((error) =>
			{
				console.error('room creation or room joining failed [error:"%o"]', error);

				if (socket)
					socket.disconnect(true);

				return;
			});
	});
}

async function getOrCreateRoom({ roomId, mediasoupWorkers,host_peer=null})
{
	let room = rooms.get(roomId);

	// If the Room does not exist create a new one.
	if (!room)
	{
		console.info('creating a new Room [roomId:"%s"]', roomId);
      
		room = await Room.create({ mediasoupWorkers, roomId, peers ,host_peer});

		rooms.set(roomId, room);

		room.on('close',async () =>
		{
			console.log("room closed")
			await rooms.delete(roomId);
		});
	}
	if(host_peer){
		room.host_peer = host_peer;
	}
	return room;
}