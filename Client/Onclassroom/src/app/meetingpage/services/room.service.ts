import { Injectable, Inject } from '@angular/core';
import { MediasoupService } from './mediasoup.service';
import { RoomObservable } from './room.observables';
import * as MediasoupClient from 'mediasoup-client';
import { Router } from '@angular/router';

const videoAspectRatio = 1.777;
const VIDEO_CONSTRAINS =
{
  low :
  {
    width       : { ideal: 320 },
    aspectRatio : videoAspectRatio
  },
  medium :
  {
    width       : { ideal: 640 },
    aspectRatio : videoAspectRatio
  },
  high :
  {
    width       : { ideal: 1260 },
    aspectRatio : videoAspectRatio
  },
  veryhigh :
  {
    width       : { ideal: 1920 },
    aspectRatio : videoAspectRatio
  },
  ultra :
  {
    width       : { ideal: 3840 },
    aspectRatio : videoAspectRatio
  }
};

const VIDEO_SIMULCAST_ENCODINGS =
[
  { scaleResolutionDownBy: 4, maxBitRate: 100000 },
  { scaleResolutionDownBy: 1, maxBitRate: 1200000 }
];

// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS =
[
  { scalabilityMode: 'S3T3_KEY' }
];

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS =
[
  { scalabilityMode: 'S3T3', dtx: true }
];

@Injectable({
  providedIn: 'root'
})

export class RoomService extends MediasoupService{
  roomId: string;
  closed = false;
  peers: Map<string, any> = new Map();
  audioOutputDevices: {};
  audioDevices: any;
  webcams: {};
  roomObservable: RoomObservable;
  joinVideo = true;
  joinAudio = true;
  displayName: any;
  spotlights: any;
  useSimulcast = true;
  soundAlert: any;
  useSharingSimulcast = true;
  peerId: any;
  isJoined = false;
  private spotlightPeer: any;
  constructor(@Inject('token') token: string, private router: Router) {

    super(token);
    this.observable();

    this.useSimulcast = true;
    this.roomObservable.setready = false;
    this.roomObservable.setIsJoined = false;
    this.socketRequest();

   }

   observable(){
    this.roomObservable = new RoomObservable();

    this.roomObservable.isAudio$.subscribe(data => {
      this.joinAudio = data;
    });

    this.roomObservable.isVideo$.subscribe(data => {
      this.joinVideo = data;
    });

    this.roomObservable.isJoined$.subscribe(data => {
      this.isJoined = data;
    });
   }

   socketRequest(){
    this.socket.on('disconnect', (reason) =>
    {
      console.warn('signaling Peer "disconnect" event [reason:"%s"]', reason);

      if (this.closed) {
        return;
      }

      if (reason === 'io server disconnect')
      {
        this.close();
      }

      if (this.producer.get('screen'))
      {
        this.producer.get('screen').close();

        this.producer.delete('screen');
      }

      if (this.producer.get('video'))
      {
        this.producer.get('video').close();

        this.producer.delete('video');
      }

      if (this.producer.get('audio'))
      {
        this.producer.get('audio').close();

        this.producer.delete('audio');
      }

      if (this.transport.get('send'))
      {
        this.transport.get('send').close();

        this.transport.delete('send');
      }

      if (this.transport.get('receive'))
      {
        this.transport.get('receive').close();

        this.transport.delete('receive');
      }

      // this.spotlights.clearSpotlights();
    });
    this.socket.on('reconnect_failed', () =>
    {
      console.warn('signaling Peer "reconnect_failed" event');

      this.close();
    });

    this.socket.on('reconnect', (attemptNumber) =>
    {
      console.log('signaling Peer "reconnect" event [attempts:"%s"]', attemptNumber);
    });

    this.socket.on('notification', async (notification) =>
    {
      console.log(
        'socket "notification" event [method:"%s", data:"%o"]',
        notification.method, notification.data);

      try
      {
        switch (notification.method)
        {

          case 'enteredLobby':
          {
            this.roomObservable.setNotification = 'Entered in loby';
            break;
          }

          case 'roomReady':
          {
            const { peerId } = notification.data;
            this.peerId = peerId;
            this.roomObservable.setready = true;
            this.roomObservable.setNotification = 'Room is ready';
            break;
          }

          case 'roomBack':
          {
            const { peerId } = notification.data;
            this.peerId = peerId;
            this.roomObservable.setready = true;
            this.roomObservable.setNotification = 'You are back in room';
            break;
          }

          case 'lockRoom':
          {
            this.roomObservable.setNotification = 'Room is locked';
            break;
          }

          case 'unlockRoom':
          {
            this.roomObservable.setNotification = 'Room is unlocked';
            break;
          }

          case 'parkedPeer':
          {
            this.roomObservable.setNotification = 'Park peer ' + notification.data.displayName;
            this.roomObservable.setLobyPeer = notification.data;
            // this._soundNotification();
            break;
          }

          case 'parkedPeers':
          {
            const { lobbyPeers } = notification.data;
            this.roomObservable.setLobyPeer = notification.data;
            break;
          }

          case 'lobby:peerClosed':
          {
            const { peerId } = notification.data;
            break;
          }

          case 'lobby:promotedPeer':
          {
            // this.roomObservable.setLobyPeer = notification.data;
            this.roomObservable.setNotification = 'Park peer ' + notification.data.displayName;
            break;
          }

          case 'setAccessCode':
          {
            const { accessCode } = notification.data;

            break;
          }

          case 'setJoinByAccessCode':
          {
            const { joinByAccessCode } = notification.data;

            if (joinByAccessCode)
            {
            }
            else
            {
            }

            break;
          }

          case 'activeSpeaker':
          {
            this.getVideo(notification.data.peerId);
            break;
          }

          case 'raisedHand':
          {
            const peer: any = this.peers.get(notification.data.peerId);
            peer.raisedHand = notification.data.raisedHand;
            peer.raisedHandTimestamp = notification.data.raisedHandTimestamp;
            this.roomObservable.setPeer = this.peers;
            this.roomObservable.setNotification = 'Raise hand ' + peer.displayName;
            // this._soundNotification();
            break;
          }

          case 'producerScore':
          {
            const { producerId, score } = notification.data;
            break;
          }

          case 'newPeer':
          {
            this.roomObservable.setNotification = notification.data.displayName + ' has joined';
            this.peers.set(notification.data.id, notification.data);
            this.roomObservable.setPeer = this.peers;
            // this._soundNotification();

            break;
          }

          case 'peerClosed':
          {
            const { peerId } = notification.data;
            this.peers.delete(peerId);

            this.roomObservable.setPeer = this.peers;
            break;
          }

          case 'consumerClosed':
          {
            const { consumerId } = notification.data;
            const consumer = this.consumer.get(consumerId);

            if (!consumer) {
              break;
            }

            if (consumer.appData.source === 'screen'){
              this.remoteScreenStream = null;
              this.getVideo(notification.data.peerId);
            }
            else {
              this.remoteStreams.get(consumer.appData.peerId).removeTrack(consumer.track);
            }
            consumer.close();

            this.consumer.delete(consumerId);

            const { peerId } = consumer.appData;


            break;
          }

          case 'consumerPaused':
          {
            const { consumerId } = notification.data;
            const consumer = this.consumer.get(consumerId);

            if (!consumer) {
              break;
            }
            consumer.pause();
            break;
          }

          case 'consumerResumed':
          {
            const { consumerId } = notification.data;
            const consumer = this.consumer.get(consumerId);

            if (!consumer) {
              break;
            }
            consumer.resume();
            break;
          }

          case 'consumerLayersChanged':
          {
            const { consumerId, spatialLayer, temporalLayer } = notification.data;
            const consumer = this.consumer.get(consumerId);

            if (!consumer) {
              break;
            }
            break;
          }

          case 'consumerScore':
          {
            const { consumerId, score } = notification.data;
            break;
          }

          case 'dataConsumerClosed':
            {
              const { dataConsumerId } = notification.data;
              const consumer = this.dataConsumer.get(dataConsumerId);

              if (!consumer) {
                break;
              }

              consumer.close();

              this.dataConsumer.delete(dataConsumerId);

              break;
            }

          case 'moderator:mute':
          {
            if (this.producer.get('audio') && !this.producer.get('audio').paused)
            {
              this.roomObservable.setNotification = 'Admin has mute yourself';
              this.disableMic();
            }
            break;
          }

          case 'moderator:stopVideo':
          {
            this.roomObservable.setNotification = 'Admin has stoped your video';
            this.disableWebcam();
            break;
          }

          case 'moderator:stopScreenSharing':
          {
            this.roomObservable.setNotification = 'Admin has stoped your screensharing';
            this.disableScreenSharing();
            break;
          }

          case 'moderator:kick':
          {
            this.roomObservable.setNotification = 'Admin has removed you';
            await this.close();
            this.router.navigate(['']);

            break;
          }

          case 'moderator:lowerHand':
          {
            this.roomObservable.setNotification = 'Admin has lower hand';
            this.roomObservable.setRaiseHand = notification.data;
            break;
          }

          default:
          {
            this.roomObservable.setNotification = 'unknown notification.method ' + notification.method;
            console.log('unknown notification.method ' + notification.method);
          }
        }
      }
      catch (error)
      {
        this.roomObservable.setNotification = 'error on socket "notification" event [error:"%o"]' + error.message;

      }

    });

    this.socket.on('request', async (request, cb) =>
     {
       console.log(
         'socket "request" event [method:"%s", data:"%o"]',
         request.method, request.data);

       switch (request.method)
       {
         case 'newConsumer':
         {
           const {
             peerId,
             producerId,
             id,
             kind,
             rtpParameters,
             type,
             appData,
             producerPaused
           } = request.data;

           const consumer = await this.transport.get('receive').consume(
             {
               id,
               producerId,
               kind,
               rtpParameters,
               appData : { ...appData, peerId } // Trick.
             });

           // Store in the map.
           this.consumer.set(consumer.id, consumer);

           consumer.on('transportclose', () =>
           {
             this.consumer.delete(consumer.id);
           });

           const { spatialLayers, temporalLayers } =
             MediasoupClient.parseScalabilityMode(
               consumer.rtpParameters.encodings[0].scalabilityMode);
           // We are ready. Answer the request so the server will
           // resume this Consumer (which was paused for now).
           cb(null);

           switch (consumer.appData.source){
            case 'webcam':
              {
                this.peers.get(consumer.appData.peerId).isVideo = true;
                break;
              }
            case 'mic':
              {
                this.peers.get(consumer.appData.peerId).isMic = true;
                break;
              }
            case 'screen':
              {
                this.peers.get(consumer.appData.peerId).isScreen = true;
                break;
              }
          }
           this.roomObservable.setPeer = this.peers;

           if (consumer.appData.source === 'screen'){
            const stream = new MediaStream();
            stream.addTrack(consumer.track);
            this.remoteScreenStream = stream;
            this.roomObservable.setlocalStream = stream;
           }
           else{
            if (this.remoteStreams.get(peerId))
            {
             this.remoteStreams.get(peerId).addTrack(consumer.track);
             this.getVideo(peerId);
            }else{
             const stream = new MediaStream();
             stream.addTrack(consumer.track);
             this.remoteStreams.set(peerId, stream);
             this.getVideo(peerId);
            }
           }

           break;
         }
         case 'newDataConsumer':
         {
           const {
             peerId,
             dataProducerId,
             id,
             label,
             sctpStreamParameters,
             type,
             appData,
             protocol
           } = request.data;
           const consumer = await this.transport.get('receive').consumeData(
             {
               id,
               dataProducerId,
               label,
               sctpStreamParameters,
               protocol,
               appData : { ...appData, peerId } // Trick.
             });

           // Store in the map.
           this.dataConsumer.set(consumer.id, consumer);
           consumer.on('transportclose', () =>
           {
             this.consumer.delete(consumer.id);
           });

           consumer.on('message', (data) =>
           {
             this.roomObservable.setMessage = {displayName: (this.peers.get(peerId) as any).displayName, message: data};
           });


           // We are ready. Answer the request so the server will
           // resume this Consumer (which was paused for now).
           cb(null);
           break;
         }

         default:
         {
           console.error('unknown request.method "%s"', request.method);

           cb(500, `unknown request.method "${request.method}"`);
         }
       }
     });
   }

  close()
  {
    if (this.closed) {
      return;
    }

    this.closed = true;

    console.log('close()');

    this.socket.close();

    // Close mediasoup Transports.
    if (this.transport.get('send')) {
      this.transport.get('send').close();
    }

    if (this.transport.get('receive')) {
      this.transport.get('receive').close();
    }

   // window.location.href = `/${this._roomId}`;
  }

  _soundNotification()
  {
      const alertPromise = this.soundAlert.play();

      if (alertPromise !== undefined)
      {
        alertPromise
          .then()
          .catch((error) =>
          {
            console.error('soundAlert.play() [error:"%o"]', error);
          });
      }
  }

  async promoteAllLobbyPeers()
  {
    console.log('promoteAllLobbyPeers()');
    try
    {
      await this.sendRequest({method: 'promoteAllPeers'});
    }
    catch (error)
    {
      console.error('promoteAllLobbyPeers() [error:"%o"]', error);
    }
   }

  async promoteLobbyPeer(peerId)
  {
    console.log('promoteLobbyPeer() [peerId:"%s"]', peerId);

    try
      {
        await this.sendRequest({method: 'promotePeer', data: { peerId }});
      }
    catch (error)
      {
        console.error('promoteLobbyPeer() [error:"%o"]', error);
      }
     }

  async getTransportStats()
  {
    try
    {
      if (this.transport.get('receive'))
      {
        console.log('getTransportStats() - recv [transportId: "%s"]', this.transport.get('receive').id);

        const recv = await this.sendRequest({ method: 'getTransportStats', data: { transportId: this.transport.get('receive').id } });

      }

      if (this.transport.get('send'))
      {
        console.log('getTransportStats() - send [transportId: "%s"]', this.transport.get('send').id);

        const send = await this.sendRequest({ method: 'getTransportStats', data: { transportId: this.transport.get('send').id } });

      }
    }
    catch (error)
    {
      console.error('getTransportStats() [error:"%o"]', error);
    }
  }

  async sendChatMessage(chatMessage)
  {
    try
    {
      this.dataProducer.get('message').send(chatMessage);
    }
    catch (error)
    {
      console.error('sendChatMessage() [error:"%o"]', error);

    }
  }

  addSelectedPeer(peerId)
  {
    console.log('addSelectedPeer() [peerId:"%s"]', peerId);

    this.spotlights.addPeerToSpotlight(peerId);

  }

  removeSelectedPeer(peerId)
  {
    console.log('removeSelectedPeer() [peerId:"%s"]', peerId);

    this.spotlights.removePeerSpotlight(peerId);
  }

  getVideo(id){
    if (id !== this.spotlightPeer && !this.remoteScreenStream)
    {
    this.spotlightPeer = id;
    this.roomObservable.setlocalStream = this.remoteStreams.get(id);
  }
  }
  // Updated consumers based on spotlights
  async updateSpotlights(spotlights)
  {
    console.log('updateSpotlights()');

    try
    {
      for (const consumer of this.consumer.values())
      {
        if (consumer.kind === 'video')
        {
          if (spotlights.includes(consumer.appData.peerId)) {
            await this._resumeConsumer(consumer);
          }
          else
          {
            await this._pauseConsumer(consumer);
          }
        }
      }
    }
    catch (error)
    {
      console.error('updateSpotlights() [error:"%o"]', error);
    }
  }

  async changeAudioOutputDevice(deviceId)
  {
    console.log('changeAudioOutputDevice() [deviceId:"%s"]', deviceId);

    try
    {
      const device = this.audioOutputDevices[deviceId];

      if (!device) {
        throw new Error('Selected audio output device no longer available');
      }

      await this._updateAudioOutputDevices();
    }
    catch (error)
    {
      console.error('changeAudioOutputDevice() [error:"%o"]', error);
    }
  }

  // Only Firefox supports applyConstraints to audio tracks
  // See:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=796964

  async muteMic()
  {
    console.log('muteMic()');

    this.producer.get('audio').pause();

    try
    {
      await this.sendRequest(
        { method: 'pauseProducer', data: { producerId: this.producer.get('audio').id } });
      this.producer.get('audio').pause();

    }
    catch (error)
    {
      console.error('muteMic() [error:"%o"]', error);
    }
  }

  async unmuteMic()
  {
    console.log('unmuteMic()');

    if (!this.producer.get('audio'))
    {
      this.updateMic({ start: true });
    }
    else
    {
      this.producer.get('audio').resume();

      try
      {
        await this.sendRequest(
          { method: 'resumeProducer', data: { producerId: this.producer.get('audio').id } });

      }
      catch (error)
      {
        console.error('unmuteMic() [error:"%o"]', error);
      }
    }
  }

  async mutePeer(peerId)
  {
    console.log('mutePeer() [peerId:"%s"]', peerId);

    try
    {
      await this.sendRequest({ method: 'moderator:mute', data: { peerId } });
    }
    catch (error)
    {
      console.error('mutePeer() [error:"%o"]', error);
    }

  }

  async kickPeer(peerId)
  {
    console.log('kickPeer() [peerId:"%s"]', peerId);

    try
    {
      await this.sendRequest({ method: 'moderator:kickPeer', data: { peerId } });
    }
    catch (error)
    {
      console.error('kickPeer() [error:"%o"]', error);
    }
  }

  async stopPeerVideo(peerId)
  {
    console.log('stopPeerVideo() [peerId:"%s"]', peerId);

    try
    {
      await this.sendRequest({ method: 'moderator:stopVideo', data: { peerId } });
    }
    catch (error)
    {
      console.error('stopPeerVideo() [error:"%o"]', error);
    }
  }

  async stopPeerScreenSharing(peerId)
  {
    console.log('stopPeerScreenSharing() [peerId:"%s"]', peerId);

    try
    {
      await this.sendRequest({ method: 'moderator:stopScreenSharing', data: { peerId } });
    }
    catch (error)
    {
      console.error('stopPeerScreenSharing() [error:"%o"]', error);
    }

  }

  async muteAllPeers()
  {
    console.log('muteAllPeers()');

    try
    {
      await this.sendRequest({ method: 'moderator:muteAll' });
    }
    catch (error)
    {
      console.error('muteAllPeers() [error:"%o"]', error);
    }
  }

  async stopAllPeerVideo()
  {
    console.log('stopAllPeerVideo()');

    try
    {
      await this.sendRequest({ method: 'moderator:stopAllVideo' });
    }
    catch (error)
    {
      console.error('stopAllPeerVideo() [error:"%o"]', error);
    }
  }

  async stopAllPeerScreenSharing()
  {
    console.log('stopAllPeerScreenSharing()');

    try
    {
      await this.sendRequest({ method: 'moderator:stopAllScreenSharing' });
    }
    catch (error)
    {
      console.error('stopAllPeerScreenSharing() [error:"%o"]', error);
    }
  }

  async closeMeeting()
  {
    console.log('closeMeeting()');

    try
    {
      await this.sendRequest({ method: 'moderator:closeMeeting' });
    }
    catch (error)
    {
      console.error('closeMeeting() [error:"%o"]', error);
    }
  }

  async lowerPeerHand(peerId)
  {
    console.log('lowerPeerHand() [peerId:"%s"]', peerId);

    try
    {
      await this.sendRequest({ method: 'moderator:lowerHand', data: { peerId } });
    }
    catch (error)
    {
      console.error('lowerPeerHand() [error:"%o"]', error);
    }

  }

  async setRaisedHand(raisedHand)
  {
    console.log('setRaisedHand: ', raisedHand);


    try
    {
      await this.sendRequest({ method: 'raisedHand', data: { raisedHand } });
      this.roomObservable.setRaiseHand = true;
    }
    catch (error)
    {
      console.error('setRaisedHand() [error:"%o"]', error);
    }
  }

  async lockRoom()
  {
    console.log('lockRoom()');

    try
    {
      await this.sendRequest({ method: 'moderator:lockRoom' });
      this.roomObservable.setlock = true;
    }
    catch (error)
    {
      console.error('lockRoom() [error:"%o"]', error);
    }
  }

  async unlockRoom()
  {
    console.log('unlockRoom()');

    try
    {
      await this.sendRequest({ method: 'moderator:unlockRoom' });
      this.roomObservable.setlock = false;
    }
    catch (error)
    {
      console.error('unlockRoom() [error:"%o"]', error);
    }
  }

  async setAccessCode(code)
  {
    console.log('setAccessCode()');

    try
    {
      await this.sendRequest({ method: 'setAccessCode', data: { accessCode: code } });
    }
    catch (error)
    {
      console.error('setAccessCode() [error:"%o"]', error);
    }
  }

  async setJoinByAccessCode(value)
  {
    console.log('setJoinByAccessCode()');

    try
    {
      await this.sendRequest({ method: 'setJoinByAccessCode', data: { joinByAccessCode: value } });
    }
    catch (error)
    {
      console.error('setAccessCode() [error:"%o"]', error);
    }
  }

  async updateScreenSharing({
    start = false,
    newResolution = null,
    newFrameRate = null
  } = {})
  {
    console.log('updateScreenSharing() [start:"%s"]', start);

    if (this.remoteScreenStream || this.localStreams.get('screen')){
      this.roomObservable.setNotification = 'Screensharing is available now';
      return;
    }
    let track;

    try
    {

      if (!this.mediasoupDevice.canProduce('video')) {
        throw new Error('cannot produce video');
      }

      const options = {
        video: {
          ...VIDEO_CONSTRAINS.high,
          height: 600,
          newFrameRate
        }
      };

      if (start)
      {
        const stream = await this.startScreenShare(options);
        ([ track ] = stream.getVideoTracks());
        track.onended = () => {
          this.disableScreenSharing();
        };
        if (this.useSharingSimulcast)
        {
          // If VP9 is the only available video codec then use SVC.
          const firstVideoCodec = this.mediasoupDevice
            .rtpCapabilities
            .codecs
            .find((c) => c.kind === 'video');

          let encodings;

          if (firstVideoCodec.mimeType.toLowerCase() === 'video/vp9')
          {
            encodings = VIDEO_SVC_ENCODINGS;
          }
          else
          {
            encodings = VIDEO_SIMULCAST_ENCODINGS
              .map((encoding) => ({ ...encoding, dtx: true }));
          }

          const screenSharingProducer = await this.transport.get('send').produce(
            {
              track,
              encodings,
              codecOptions :
              {
                videoGoogleStartBitrate : 1000
              },
              appData :
              {
                source : 'screen'
              }
            });
          this.producer.set('screen', screenSharingProducer);
        }
        else
        {
         const screenSharingProducer = await this.transport.get('send').produce({
            track,
            appData :
            {
              source : 'screen'
            }
          });
         this.producer.set('screen', screenSharingProducer);
        }


        this.producer.get('screen').on('transportclose', () =>
        {
          this.producer.delete('screen');
        });

        this.producer.get('screen').on('trackended', () =>
        {

          this.disableScreenSharing();
        });
      }
      else if (this.producer.get('screen'))
      {
        ({ track } = this.producer.get('screen'));

        await track.applyConstraints(
          {
            ...VIDEO_CONSTRAINS[newResolution],
            frameRate : newFrameRate
          }
        );
      }
    }
    catch (error)
    {
      console.error('updateScreenSharing() [error:"%o"]', error);

      if (track) {
        track.stop();
      }
    }
  }

  async disableScreenSharing()
  {
    console.log('disableScreenSharing()');

    if (!this.producer.get('screen')) {
      return;
    }

    this.producer.get('screen').close();
    try
    {
      await this.sendRequest(
        { method: 'closeProducer', data: { producerId: this.producer.get('screen').id } });
    }
    catch (error)
    {
      console.error('disableScreenSharing() [error:"%o"]', error);
    }

    this.producer.delete('screen');

    this.stopScreenShare();
  }

  async updateMic({
    start = false,
    restart = true,
    newDeviceId = null
  } = {})
  {
    console.log(
      'updateMic() [start:"%s", restart:"%s", newDeviceId:"%s"]',
      start,
      restart,
      newDeviceId
    );

    let track;

    try
    {
      if (!this.mediasoupDevice.canProduce('audio')) {
        throw new Error('cannot produce audio');
      }

      if (newDeviceId && !restart) {
        throw new Error('changing device requires restart');
      }


      const sampleRate = 96000;
      const channelCount = 1;
      const volume = 1.0;
      const sampleSize = 16;
      const opusStereo = false;
      const opusDtx = true;
      const opusFec = true;
      const opusPtime = 20;
      const opusMaxPlaybackRate = 96000;


      if (
        (restart && this.producer.get('audio')) ||
        start
      )
      {

        if (this.producer.get('audio'))
         {
          this.localStreams.delete('audio');
          await this.disableMic();
        }

        const stream = await navigator.mediaDevices.getUserMedia(
          {
            audio : {
              sampleRate,
              channelCount,
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true,
              sampleSize
            }
          }
        );
        this.roomObservable.setIsAudio = true;
        ([ track ] = stream.getAudioTracks());

        const { deviceId: trackDeviceId } = track.getSettings();


        const micProducer = await this.transport.get('send').produce(
          {
            track,
            codecOptions :
            {
              opusStereo,
              opusDtx,
              opusFec,
              opusPtime,
              opusMaxPlaybackRate
            },
            appData :
            { source: 'mic' }
          });

        this.producer.set('audio', micProducer);

        this.producer.get('audio').on('transportclose', () =>
        {
          this.producer.delete('audio');
        });

        this.producer.get('audio').on('trackended', () =>
        {
          this.disableMic();
        });
      }
      else if (this.producer.get('audio'))
      {
        ({ track } = this.producer.get('audio'));

        await track.applyConstraints(
          {
            sampleRate,
            channelCount,
            volume,
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
            sampleSize
          }
        );
      }

      await this._updateAudioDevices();
    }
    catch (error)
    {
      console.error('updateMic() [error:"%o"]', error);


      if (track) {
        track.stop();
      }
    }
  }

  async _updateAudioDevices()
  {
    console.log('_updateAudioDevices()');

    // Reset the list.
    this.audioDevices = {};

    try
    {
      console.log('_updateAudioDevices() | calling enumerateDevices()');

      const devices = await navigator.mediaDevices.enumerateDevices();

      for (const device of devices)
      {
        if (device.kind !== 'audioinput') {
          continue;
        }

        this.audioDevices[device.deviceId] = device;
      }

      this.roomObservable.setAudioInputDevices = this.audioDevices;
    }
    catch (error)
    {
      console.error('_updateAudioDevices() [error:"%o"]', error);
    }
  }

  async disableMic()
  {
    console.log('disableMic()');
    this.roomObservable.setIsAudio = false;
    if (!this.producer.get('audio')) {
      return;
    }

    this.producer.get('audio').close();

    try
    {
      await this.sendRequest(
        { method: 'closeProducer', data: { producerId: this.producer.get('audio').id } });
    }
    catch (error)
    {
      console.error('disableMic() [error:"%o"]', error);
    }

    this.producer.delete('audio');
  }

  async updateWebcam({
    init = false,
    start = false,
    restart = false,
    newDeviceId = null,
    newResolution = null,
    newFrameRate = null,
    deviceId= null
  } = {})
  {
    console.log(
      'updateWebcam() [start:"%s", restart:"%s", newDeviceId:"%s", newResolution:"%s", newFrameRate:"%s"]',
      start,
      restart,
      newDeviceId,
      newResolution,
      newFrameRate
    );

    let track;

    try
    {
      if (!this.mediasoupDevice.canProduce('video')) {
        throw new Error('cannot produce video');
      }

      if (newDeviceId && !restart) {
        throw new Error('changing device requires restart');
      }

      if ((restart && this.producer.get('video')) || start)
      {
        if (this.producer.get('video'))
          {
            this.localStreams.delete('video');
            await this.disableWebcam();
          }

        const stream = await navigator.mediaDevices.getUserMedia(
          {
            video : true
          });

        if (this.remoteStreams.size === 0) {
          this.roomObservable.setlocalStream = stream;
        }

        this.localStreams.set('video', stream);
        this.remoteStreams.set(this.peerId, stream);
        this.roomObservable.setIsVideo = true;
        ([ track ] = stream.getVideoTracks());

        if (this.useSimulcast)
        {
          // If VP9 is the only available video codec then use SVC.
          const firstVideoCodec = this.mediasoupDevice
            .rtpCapabilities
            .codecs
            .find((c) => c.kind === 'video');

          let encodings;

          if (firstVideoCodec.mimeType.toLowerCase() === 'video/vp9') {
            encodings = VIDEO_KSVC_ENCODINGS;
          }
          else {
            encodings = VIDEO_SIMULCAST_ENCODINGS;
          }

          const webcamProducer = await this.transport.get('send').produce(
            {
              track,
              encodings,
              codecOptions :
              {
                videoGoogleStartBitrate : 1000
              },
              appData :
              {
                source : 'webcam'
              }
            });
          this.producer.set('video', webcamProducer);
        }
        else
        {
          const webcamProducer = await this.transport.get('send').produce({
            track,
            appData :
            {
              source : 'webcam'
            }
          });
          this.producer.set('video', webcamProducer);
        }


        this.producer.get('video').on('transportclose', () =>
        {
          this.producer.delete('video');
        });

        this.producer.get('video').on('trackended', () =>
        {
          this.disableWebcam();
        });
      }
      else if (this.producer.get('video'))
      {
        ({ track } = this.producer.get('video'));

        await track.applyConstraints(
          {
            ...VIDEO_CONSTRAINS[newResolution],
            newFrameRate
          }
        );

      }

      await this._updateWebcams();
    }
    catch (error)
    {
      console.error('updateWebcam() [error:"%o"]', error);

      if (track) {
        track.stop();
      }
    }
  }

  async _updateWebcams()
  {
    console.log('_updateWebcams()');

    // Reset the list.
    this.webcams = {};

    try
    {
      console.log('_updateWebcams() | calling enumerateDevices()');

      const devices = await navigator.mediaDevices.enumerateDevices();

      for (const device of devices)
      {
        if (device.kind !== 'videoinput') {
          continue;
        }

        this.webcams[device.deviceId] = device;
      }

      this.roomObservable.setVideoInputDevices = this.webcams;
    }
    catch (error)
    {
      console.error('_updateWebcams() [error:"%o"]', error);
    }
  }

  async disableWebcam()
  {
    console.log('disableWebcam()');
    this.roomObservable.setIsVideo = false;
    if (!this.producer.get('video')) {
      return;
    }
    this.localStreams.delete('video');
    this.remoteStreams.delete(this.peerId);
    this.producer.get('video').close();


    try
    {
      await this.sendRequest(
        { method: 'closeProducer', data: { producerId: this.producer.get('video').id } });
      this.producer.delete('video');

    }
    catch (error)
    {
      console.error('disableWebcam() [error:"%o"]', error);
    }

  }

  async _updateAudioOutputDevices()
  {
    console.log('_updateAudioOutputDevices()');

    // Reset the list.
    this.audioOutputDevices = {};

    try
    {
      console.log('_updateAudioOutputDevices() | calling enumerateDevices()');

      const devices = await navigator.mediaDevices.enumerateDevices();

      for (const device of devices)
      {
        if (device.kind !== 'audiooutput') {
          continue;
        }

        this.audioOutputDevices[device.deviceId] = device;
      }

      this.roomObservable.setAudioOutputDevices = this.audioOutputDevices;
    }
    catch (error)
    {
      console.error('_updateAudioOutputDevices() [error:"%o"]', error);
    }
  }

  async joinRoom({ joinVideo, joinAudio, _produce, displayName })
  {
    console.log('_joinRoom()');

    try
    { this.roomObservable.setIsJoined = true;
      await this.loadDevice();
      if (_produce)
      {
       await this.sendTransport();
      }

      await this.recvTransport();

      const {
        peers,
        lastNHistory,
        isAdmin,
        locked,
        lobbyPeers
      }: any = await this.joinRequest();
      for (const peer of peers)
      {
        this.peers.set(peer.id, peer);
      }
      if (this.peers.size > 0) {
        this.roomObservable.setPeer = this.peers;
      }
      this.roomObservable.setlock = locked;
      this.roomObservable.setIsAdmin = isAdmin;

      // tslint:disable-next-line:no-unused-expression
      (lobbyPeers.length > 0) && lobbyPeers.forEach((peer) => this.roomObservable.setLobyPeer = peer);

      // Don't produce if explicitly requested to not to do it.
      if (_produce)
      {
        if (this.joinVideo && this.mediasoupDevice.canProduce('audio'))
        {
         await this.updateWebcam({ init: true, start: true });
        }

        if (this.joinAudio && this.mediasoupDevice.canProduce('audio'))
           { await this.updateMic({ start: true });
             const autoMuteThreshold = 4;

             if (autoMuteThreshold && peers.length >= autoMuteThreshold) {
            await  this.muteMic();
             }
            }
      }

      await this._updateAudioOutputDevices();
      this.createDataProducer('message');

    //   this.spotlights.addPeers(peers);

    //   if (lastNHistory.length > 0)
    //   {
    //     console.log('_joinRoom() | got lastN history');

    //     this.spotlights.addSpeakerList(
    //       lastNHistory.filter((peerId) => peerId !== this.peerId)
    //     );
    //   }
    }
    catch (error)
    {this.roomObservable.setIsJoined = false;
     console.error('_joinRoom() [error:"%o"]', error);

     this.close();
    }
  }

  startScreenShare(constraints = {})
  {
      // @ts-ignore
    return navigator.mediaDevices.getDisplayMedia(constraints)
            .then((stream) =>
                {
                  this.localStreams.set('screen', stream);
                  this.getVideo(this.peerId);
                  return Promise.resolve(stream);
                });
  }

  stopScreenShare()
  {
    if (this.localStreams.get('screen') instanceof MediaStream === false)
    {
      return;
    }

    this.localStreams.get('screen').getTracks().forEach((track) => track.stop());
    this.localStreams.delete('screen');
    if (this.localStreams.get('video')){
      this.getVideo(this.peerId);
    }
  }
}
