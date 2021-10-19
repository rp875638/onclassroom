import { Inject, Injectable } from '@angular/core';
import { Device, Transport, Producer, Consumer, DataProducer, DataConsumer, RtpCapabilities } from 'mediasoup-client/lib/types';
import { SocketService } from './socket.service';
import * as MediasoupClient from 'mediasoup-client';
import { Subject } from 'rxjs';

const PC_PROPRIETARY_CONSTRAINTS =
{
  optional : [ { googDscp: true } ]
};

@Injectable({
  providedIn: 'root'
})
export class MediasoupService extends SocketService {
  mediasoupDevice: Device;
  transport: Map<string, Transport> = new Map();
  producer: Map<string, Producer> = new Map();
  consumer: Map<string, Consumer> = new Map();
  dataProducer: Map<string, DataProducer> = new Map();
  dataConsumer: Map<string, DataConsumer> = new Map();
  localStreams: Map<string, MediaStream> = new Map();
  streams: Map<string, MediaStream> = new Map();
  remoteStreams: Map<string, MediaStream> = new Map();
  remoteScreenStream: MediaStream;
  constructor(@Inject('token') token) {
    super(token);
   }

   async promoteAllLobbyPeers()
   {
     console.log('promoteAllLobbyPeers()');

     try
     {
       await this.sendRequest({ method: 'promoteAllPeers' });
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
       await this.sendRequest({ method: 'promotePeer', data: { peerId } });
     }
     catch (error)
     {
       console.error('promoteLobbyPeer() [error:"%o"]', error);
     }
   }

   async modifyPeerConsumer(peerId, type, mute)
   {
     console.log('modifyPeerConsumer() [peerId:"%s", type:"%s"]', peerId, type);

     try
     {
       for (const consumer of this.consumer.values())
       {
         if (consumer.appData.peerId === peerId && consumer.appData.source === type)
         {
           if (mute) {
             await this._pauseConsumer(consumer);
           }
           else {
             await this._resumeConsumer(consumer);
           }
         }
       }
     }
     catch (error)
     {
       console.error('modifyPeerConsumer() [error:"%o"]', error);
     }
   }

   async _pauseConsumer(consumer)
   {
     console.log('_pauseConsumer() [consumer:"%o"]', consumer);

     if (consumer.paused || consumer.closed) {
       return;
     }

     try
     {
       await this.sendRequest({ method: 'pauseConsumer', data: { consumerId: consumer.id } });

       consumer.pause();
     }
     catch (error)
     {
       console.error('_pauseConsumer() [error:"%o"]', error);
     }
   }

   async _resumeConsumer(consumer)
   {
     console.log('_resumeConsumer() [consumer:"%o"]', consumer);

     if (!consumer.paused || consumer.closed) {
       return;
     }

     try
     {
       await this.sendRequest({ method: 'resumeConsumer', data: { consumerId: consumer.id } });
       consumer.resume();
     }
     catch (error)
     {
       console.error('_resumeConsumer() [error:"%o"]', error);
     }
   }

   async setMaxSendingSpatialLayer(spatialLayer)
   {
     console.log('setMaxSendingSpatialLayer() [spatialLayer:"%s"]', spatialLayer);

     try
     {
       if (this.producer.get('video')) {
         await this.producer.get('video').setMaxSpatialLayer(spatialLayer);
       }
       if (this.producer.get('screen')) {
         await this.producer.get('screen').setMaxSpatialLayer(spatialLayer);
       }
     }
     catch (error)
     {
       console.error('setMaxSendingSpatialLayer() [error:"%o"]', error);
     }
   }

   async setConsumerPreferredLayers(consumerId, spatialLayer, temporalLayer)
   {
     console.log(
       'setConsumerPreferredLayers() [consumerId:"%s", spatialLayer:"%s", temporalLayer:"%s"]',
       consumerId, spatialLayer, temporalLayer);

     try
     {
       await this.sendRequest({ method: 'setConsumerPreferedLayers', data: { consumerId, spatialLayer, temporalLayer } });
     }
     catch (error)
     {
       console.error('setConsumerPreferredLayers() [error:"%o"]', error);
     }
   }

   async setConsumerPriority(consumerId, priority)
   {
     console.log('setConsumerPriority() [consumerId:"%s", priority:%d]', consumerId, priority);
     try
     {
       await this.sendRequest({ method: 'setConsumerPriority', data: { consumerId, priority } });

     }
     catch (error)
     {
       console.error('setConsumerPriority() [error:"%o"]', error);
     }
   }

   async requestConsumerKeyFrame(consumerId)
   {
     console.log('requestConsumerKeyFrame() [consumerId:"%s"]', consumerId);

     try
     {
       await this.sendRequest({ method: 'requestConsumerKeyFrame', data: { consumerId } });
     }
     catch (error)
     {
       console.error('requestConsumerKeyFrame() [error:"%o"]', error);
     }
   }

    async loadDevice(){
      this.mediasoupDevice = new MediasoupClient.Device();
      const routerRtpCapabilities: RtpCapabilities =
        await this.sendRequest({ method: 'getRouterRtpCapabilities' });
      routerRtpCapabilities.headerExtensions = routerRtpCapabilities.headerExtensions
        .filter((ext) => ext.uri !== 'urn:3gpp:video-orientation');

      await this.mediasoupDevice.load({ routerRtpCapabilities });
    }

    async webrtcTransport(forceTcp, producing, consuming){
      return await this.sendRequest(
        {
        method: 'createWebRtcTransport',
        data: {
          forceTcp,
          producing,
          consuming
        }
        });
    }
    async sendTransport(){
      const {id, iceParameters, iceCandidates, dtlsParameters, sctpParameters}: any = await this.webrtcTransport(false, true, false);
      const sendTransport = await this.mediasoupDevice.createSendTransport(
        {
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters,
          proprietaryConstraints : PC_PROPRIETARY_CONSTRAINTS
        });
      this.transport.set('send', sendTransport);
      sendTransport.on(
          'connect', async ({ dtlsParameters }, callback, errback) => // eslint-disable-line no-shadow
          {
            await this.sendRequest(
              {
              method: 'connectWebRtcTransport', data: {
                transportId: this.transport.get('send').id,
                dtlsParameters
              }
              })
              .then(callback)
              .catch(errback);
          });

      sendTransport.on(
          'produce', async ({ kind, rtpParameters, appData }, callback, errback) =>
          {
            try
            {
              // eslint-disable-next-line no-shadow
              const { id }: any = await this.sendRequest(
                {
                  method: 'produce', data: {
                                             transportId: this.transport.get('send').id,
                                             kind,
                                             rtpParameters,
                                             appData
                }
                });

              callback({ id });
            }
            catch (error)
            {
              errback(error);
            }
          });

      sendTransport.on(
            'producedata', async ({label, sctpStreamParameters, protocol, appData }, callback, errback) =>
            {
              try
              {
                // eslint-disable-next-line no-shadow
                const { id }: any = await this.sendRequest(
                  {
                    method: 'producedata', data: {
                                                transportId: sendTransport.id,
                                               label,
                                               sctpStreamParameters,
                                               protocol,
                                               appData
                  }
                  });
                callback({ id });
              }
              catch (error)
              {
                errback(error);
              }
            });
    }
    async recvTransport(){
      const {id, iceParameters, iceCandidates, dtlsParameters, sctpParameters}: any = await this.webrtcTransport(false, false, true);
      const recvTransport = await this.mediasoupDevice.createRecvTransport(
        {
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters,
        });

      this.transport.set('receive', recvTransport);
      recvTransport.on(
          'connect', async ({ dtlsParameters }, callback, errback) => // eslint-disable-line no-shadow
          {
           await this.sendRequest(
              {
              method: 'connectWebRtcTransport', data: {
                transportId: this.transport.get('receive').id,
                dtlsParameters
              }
              })
              .then(callback)
              .catch(errback);
          });
    }

    async joinRequest(){
      return await this.sendRequest(
        { method: 'join', data: {
          rtpCapabilities: this.mediasoupDevice.rtpCapabilities
        }
        });
    }

    async createDataProducer(label){
    const dataProducer =  await this.transport.get('send').produceData({label});

    this.dataProducer.set('message', dataProducer);

    }

}
