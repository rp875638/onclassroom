
import * as MediasoupClient from 'mediasoup-client';
import {Socket} from 'socket.io-client';
import { Subject } from 'rxjs';
import { RtpCapabilities, Device, Producer, DataProducer, Consumer, DataConsumer, Transport } from 'mediasoup-client/lib/types';

export class MediasoupServices {
 mediasoupDevice: Device;

    transport: Map<string, Transport> = new Map();
    producer: Map<string, Producer> = new Map();
    dataProducer: Map<string, DataProducer> = new Map();
    localStreams: Map<string, MediaStream> = new Map();

    audioConsumers: Map<string, Consumer> = new Map();
    videoConsumers: Map<string, Consumer> = new Map();
    consumer: Map<string, Map<number, Consumer>> = new Map();
    messageConsumers: Map<string, DataConsumer> = new Map();
    fileConsumers: Map<string, DataConsumer> = new Map();
    members: object;
    remoteVideos: Map<number, MediaStream> = new Map();
    activeSpeaker: Map<string, MediaStream> = new Map();

      // Observable string sources
  private locked = new Subject<boolean>();
  private isJoined = new Subject<boolean>();
  private isMeetingEnd = new Subject<boolean>();
  private recording = new Subject<boolean>();
  private activeSpeakerStream = new Subject<MediaStream>();
  private remoteStreams = new Subject<MediaStream>();
  private messages = new Subject<string>();
  private participants = new Subject<object>();
  private files = new Subject<string>();
  private devices = new Subject<string>();

  // Observable string streams
  locked$ = this.locked.asObservable();
  isJoined$ = this.isJoined.asObservable();
  isMeetingEnd$ = this.isMeetingEnd.asObservable();
  recording$ = this.recording.asObservable();
  activeSpeakerStream$ = this.activeSpeakerStream.asObservable();
  remoteStreams$ = this.remoteStreams.asObservable();
  messages$ = this.messages.asObservable();
  participants$ = this.participants.asObservable();
  files$ = this.files.asObservable();
  devices$ = this.devices.asObservable();

  constructor(private readonly socket: Socket, private roomId) {
    this.socket.on('endMeeting', () => {
        this.isMeetingEnd.next(true);
    });
    this.socket.on('newProducer', (message) => {
        const remoteId = message.socketId;
        const prdId = message.producerId;
        const kind = message.kind;
        if (kind === 'video') {
            console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
            this.consumeAdd(this.transport.get('consumer'), remoteId, prdId, kind);
        } else if (kind === 'audio') {
            console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
            this.consumeAdd(this.transport.get('consumer'), remoteId, prdId, kind);
        } else if (kind === 'screen') {
            console.log('--try consumeAdd remoteId=' + remoteId + ', prdId=' + prdId + ', kind=' + kind);
            this.consumeAdd(this.transport.get('consumer'), remoteId, prdId, kind);
        }
    });
    this.socket.on('newUser', (data) => {
        this.members[data.userId] = data.name;
        this.participants.next(this.members);

    });
    this.socket.on('user-disconnected', (data) => {
       delete this.members[data.userId];
       this.participants.next(this.members);

      });
    this.socket.on('newDataProducer', (message) => {
        const remoteId = message.socketId;
        const prdId = message.dataProducerId;
        const label = message.label;
        if (label === 'message') {
            console.log('--try consumeDataAdd remoteId=' + remoteId + ', prdId=' + prdId + ', label=' + label);
            this.consumeDataAdd(this.transport.get('consumer'), remoteId, prdId, label);
        } else if (label === 'file') {
            console.log('--try consumeDataAdd remoteId=' + remoteId + ', prdId=' + prdId + ', label=' + label);
            this.consumeDataAdd(this.transport.get('consumer'), remoteId, prdId, label);
        }
    });

    this.socket.on('producerClosed', (message) => {
        const localId = message.localId;
        const remoteId = message.remoteId;
        const kind = message.kind;
        console.log('--try removeConsumer remoteId=%s, localId=%s, track=%s', remoteId, localId, kind);
        this.removeConsumer(remoteId, kind);
    });

    this.socket.on('dataProducerClosed', (message) => {
        const localId = message.localId;
        const remoteId = message.remoteId;
        const label = message.label;
        console.log('--try removeConsumer remoteId=%s, localId=%s, label=%s', remoteId, localId, label);
        this.removeConsumer(remoteId, label);
    });

    this.socket.on('activeSpeaker', (data) => {
        this.activeSpeakerStream.next(this.remoteVideos.get(data.id));
    });
  }

  async joinMeeting(){
    try{
        this.mediasoupDevice = new MediasoupClient.Device();
        console.log('before request');
        const data: any = await this.sendRequest({ type: 'getRouterRtpCapabilities', data: { roomId: this.roomId, name: 'Rampravesh' } });
        this.members = data.members;
        this.participants.next(this.members);
        console.log('device creted');
        if (!this.mediasoupDevice.loaded){
                await this.mediasoupDevice.load({routerRtpCapabilities: data.rtpCapabilities});
            }

        await this.createProducertranport();

        console.log('video track', this.localStreams.get('video'));
        await this.createProducer();
        await this.createDataProducer('message');
        await this.createDataProducer('file');
        await this.createConsumerTransport();
        await this.consumeAllProducer(this.socket.id);
        this.isJoined.next(true);
    }
    catch (error){
        if (error.name === 'UnsupportedError') {
            console.error('browser not supported');
        }
    }

  }

   private async createProducertranport(): Promise<void> {
        const params: any = await this.sendRequest({ type: 'createProducerTransport', data: {} });
        this.transport.set('producer', this.mediasoupDevice.createSendTransport(params));
        this.transport.get('producer').on('connect', async ({ dtlsParameters }, callback, errback) => {
            this.sendRequest({ type: 'connectProducerTransport', data: { dtlsParameters } })
                .then(callback)
                .catch(errback);
        });

        this.transport.get('producer').on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
                const { id }: any = await this.sendRequest({
                                                            type: 'produce',
                                                            data: {
                                                                    transportId: this.transport.get('producer').id,
                                                                     kind,
                                                                     rtpParameters,
                                                                     appData } });
                callback({ id });
            } catch (err) {
                errback(err);
            }
        });
        this.transport.get('producer').on('producedata', async (parameters, callback, errback) => {
            try {
                const { id }: any = await this.sendRequest({
                                                            type: 'producedata',
                                                            data: {
                                                                    transportId: this.transport.get('producer').id,
                                                                    sctpStreamParameters: parameters.sctpStreamParameters,
                                                                    label: parameters.label, protocol: parameters.protocol, } });
                callback({ id });
            } catch (err) {
                errback(err);
            }
        });

        this.transport.get('producer').on('connectionstatechange', (state) => {
            switch (state) {
                case 'connecting':
                    console.log('publishing...');
                    break;

                case 'connected':
                    console.log('published');
                    break;

                case 'failed':
                    console.log('failed');
                    this.transport.get('producer').close();
                    break;

                default:
                    break;
            }
        });
    }

    private async  createProducer(): Promise<void> {

        const videoTrack = this.localStreams.get('video').getVideoTracks()[0];
        if (videoTrack) {
            const trackParams = {
                track: videoTrack,
                encodings: [
                    { maxBitrate: 100000 },
                    { maxBitrate: 300000 },
                    { maxBitrate: 900000 }
                ],
                appData: { mediaTag: 'cam-video' }
            };
            this.producer.set('video', await this.transport.get('producer').produce(trackParams)) ;
        }

        const audioTrack = this.localStreams.get('audio').getAudioTracks()[0];
        if (audioTrack) {
            const trackParams = {
                track: audioTrack,
                appData: { mediaTag: 'cam-audio' }
            };
            this.producer.set('audio', await this.transport.get('producer').produce(trackParams));
        }
    }

    private async createDataProducer(label): Promise<void> {
        const dataProducer = await this.transport.get('producer').produceData({
            label
        });
        dataProducer.on('transportclose', () => {
            console.log('Transport close');
        });
        dataProducer.on('error', () => {
            console.log('Erro occured');
        });
        switch (label){
            case 'message':
                this.dataProducer.set('message', dataProducer);
                break;
            case 'file':
                this.dataProducer.set('file', dataProducer);
        }
    }

    async createConsumerTransport(): Promise<void> {
            const params: any = await this.sendRequest({ type: 'createConsumerTransport', data: {} });

            this.transport.set('consumer', await this.mediasoupDevice.createRecvTransport(params));
            this.transport.get('consumer').on('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log('consumer transport created');
                this.sendRequest({ type: 'connectConsumerTransport', data: { dtlsParameters } })
                    .then(callback)
                    .catch(errback);
            });

            this.transport.get('consumer').on('connectionstatechange', (state) => {
                switch (state) {
                    case 'connecting':
                        console.log('subscribing...');
                        break;

                    case 'connected':
                        console.log('subscribed');
                        break;

                    case 'failed':
                        console.log('failed');
                        this.transport.get('producer').close();
                        break;

                    default:
                        break;
                }
            });
    }

    private async consumeAllProducer(clientId): Promise<void>{
        const remoteInfo: any = await this.sendRequest({ type: 'getCurrentProducers', data: { localId: clientId } });
        remoteInfo.remoteVideoIds.forEach(rId => {
         this.consumeAdd(this.transport.get('consumer'), rId, null, 'video').then(() => {
            remoteInfo.remoteAudioIds.forEach(async remoteId => {
                this.consumeAdd(this.transport.get('consumer'), remoteId, null, 'audio');
            });
         });
        });
        remoteInfo.remoteMessageIds.forEach( rId => {
             this.consumeDataAdd(this.transport.get('consumer'), rId, null, 'message');
        });
        remoteInfo.remoteFileIds.forEach( rId => {
             this.consumeDataAdd(this.transport.get('consumer'), rId, null, 'file');
        });
    }

    private async consumeAdd(transport, remoteSocketId, prdId, trackKind): Promise<void> {
        console.log('--start of consumeAdd -- kind=%s', trackKind);
        const { rtpCapabilities } = this.mediasoupDevice;
        const data: any = await this.sendRequest({
                                                    type: 'consumeAdd',
                                                    data: {
                                                            rtpCapabilities,
                                                            remoteId: remoteSocketId,
                                                            kind: trackKind
                                                        }
                                                    })
            .catch(err => {
                console.error('consumeAdd ERROR:', err);
            });
        const {producerId, id, kind, rtpParameters} = data;
        if (prdId && (prdId !== producerId)) {
            console.warn('producerID NOT MATCH');
        }

        const codecOptions = {};
        const consumer = await transport.consume({id, producerId, kind, rtpParameters, codecOptions});
        switch (kind){
            case 'video':
                const newStream = new MediaStream();
                newStream.addTrack(consumer.track);
                this.remoteVideos.set(remoteSocketId, newStream);
                this.videoConsumers.set(remoteSocketId, consumer);

                break;
            case 'audio':
                const stream =  this.remoteVideos.get(remoteSocketId);
                stream.addTrack(consumer.track);
                this.remoteVideos.set(remoteSocketId, stream);
                this.audioConsumers.set(remoteSocketId, consumer);
                break;
        }
        consumer.remoteId = remoteSocketId;
        consumer.on('transportclose', () => {
            console.log('--consumer transport closed. remoteId=' + consumer.remoteId);
        });
        consumer.on('producerclose', () => {
            console.log('--consumer producer closed. remoteId=' + consumer.remoteId);
            consumer.close();
            this.removeConsumer(consumer.remoteId, consumer.kind);
        });
        consumer.on('trackended', () => {
            console.log('--consumer trackended. remoteId=' + consumer.remoteId);
        });
        console.log('--end of consumeAdd');

        if (kind === 'video') {
            console.log('--try resumeAdd --');
            this.sendRequest({ type: 'resumeAdd', data: { remoteId: remoteSocketId, kind } })
                .then(() => {
                    console.log('resumeAdd OK');
                })
                .catch(err => {
                    console.error('resumeAdd ERROR:', err);
                });
        }
    }

    private async consumeDataAdd(transport, remoteSocketId, prdId, plabel) {
        console.log('--start of consumeDataAdd -- label=%s', plabel);
        const { rtpCapabilities } = this.mediasoupDevice;
        console.log({ remoteId: remoteSocketId, label: plabel });
        const data: any = await this.sendRequest({ type: 'consumeDataAdd', data: { remoteId: remoteSocketId, label: plabel } })
            .catch(err => {
                console.error('consumeDataAdd ERROR:', err);
            });
        const {producerId, id, label, sctpStreamParameters, protocol} = data;
        if (prdId && (prdId !== producerId)) {
            console.warn('producerID NOT MATCH');
        }
        const consumer = await transport.consumeData({id, dataProducerId: producerId, label, sctpStreamParameters, protocol, });
        this.addConsumer(remoteSocketId, consumer, label);
        switch (label){
            case 'message':
                    consumer.on('message', (message) => {
                        this.messages.next(message);
                    });
                    this.messageConsumers.set(remoteSocketId, consumer);
                    break;
                case 'message':
                    consumer.on('message', (message) => {
                        this.files.next(message);
                    });
                    this.fileConsumers.set(remoteSocketId, consumer);
                    break;

        }
        consumer.remoteId = remoteSocketId;
        consumer.on('transportclose', () => {
            console.log('--consumer transport closed. remoteId=' + consumer.remoteId);
        });
        consumer.on('dataproducerclose', () => {
            console.log('--consumer producer closed. remoteId=' + consumer.remoteId);
            consumer.close();
            this.removeConsumer( consumer.remoteId,  consumer.kind);
        });

        console.log('--end of consumeDataAdd');

    }

    async screenShare() {
        if (this.localStreams.has('screen')) {
            this.producer.get('screen').close();
            this.producer.delete('screen');
            this.localStreams.delete('screen');
        } else {
            // @ts-ignore
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(async (stream) => {
                this.localStreams.set('screen', stream);

                const videoTrack = this.localStreams.get('screen').getVideoTracks()[0];
                const trackParams = {
                    track: videoTrack,
                    appData: { mediaTag: 'screen-video' }
                };
                this.producer.set('screen', await this.transport.get('producer').produce(trackParams));
                this.producer.get('screen').observer.on('trackended', () => {
                    console.log('Track ended');
                });
                this.producer.get('screen').observer.on('close', () => {
                    console.log('Track close');
                });
                this.remoteVideos[this.socket.id] = this.localStreams.get('screen');
                // this.activeSpeaker.id=this.socket.id;
                // this.localStreams.get('screen').getVideoTracks()[0].onended = this.screenShare();
            }).catch(err => {
                console.log(err.message);
            });
        }

    }

   private disconnect() {
       this.producer.forEach((value, key) => {
        value.close();
       });
       this.producer.clear();
       this.dataProducer.forEach((value, key) => {
        value.close();
    });
       this.dataProducer.clear();
       this.transport.forEach((value, key) => {
        value.close();
    });
       this.transport.clear();
       this.localStreams.forEach((value, key) => {
        this.stopLocalStream(value);
    });
       this.localStreams.clear();

       for (const key in this.videoConsumers) {
           if (key){
            const consumer = this.videoConsumers[key];
            consumer.close();
            delete this.videoConsumers[key]; }
        }
       for (const key in this.audioConsumers) {
           if (key){
            const consumer = this.audioConsumers[key];
            consumer.close();
            delete this.audioConsumers[key];
        }
        }
       for (const key in this.messageConsumers) {
           if (key){
            const consumer = this.messageConsumers[key];
            consumer.close();
            delete this.messageConsumers[key];
        }
        }
       for (const key in this.fileConsumers) {
           if (key){
            const consumer = this.fileConsumers[key];
            consumer.close();
            delete this.fileConsumers[key];
        }
        }
    }
   private stopLocalStream(stream) {
        const tracks = stream.getTracks();
        if (!tracks) {
            console.warn('NO tracks');
            return;
        }

        tracks.forEach(track => track.stop());
    }

     private addConsumer(id, consumer, kind) {
         switch (kind){
            case 'video':
                this.videoConsumers.set(id, consumer);
                break;
            case 'audio':
                this.audioConsumers.set(id, consumer);
                break;
            case 'message':
                this.messageConsumers.set(id, consumer);
                break;
            case 'file':
                this.fileConsumers.set(id, consumer);
                break;
            default:
                console.warn('UNKNOWN consumer kind=' + kind);

         }
    }

     private removeConsumer(id, kind) {
        switch (kind){
            case 'video':
               this.videoConsumers.delete(id);
               break;
            case 'audio':
                this.audioConsumers.delete(id);
                break;
            case 'message':
                this.messageConsumers.delete(id);
                break;
            case 'file':
                this.fileConsumers.delete(id);
                break;
            default:
                console.warn('UNKNOWN consumer kind=' + kind);

         }
    }
    lockUnlock(value: boolean){
        if (value){
            this.sendRequest({type: 'unlock', data: {roomId: this.roomId}});
            this.locked.next(false);
        }
        else{
            this.sendRequest({type: 'lock', data: {roomId: this.roomId}});
            this.locked.next(true);
        }
    }
    recordMeeting(value){
        if (value){
            this.sendRequest({type: 'stopRecording', data: {roomId: this.roomId}});
            this.recording.next(false);
        }
        else{
            this.sendRequest({type: 'startRecording', data: {roomId: this.roomId}});
            this.recording.next(true);
        }
    }

    endMeeting(){
        this.sendRequest({type: 'endMeeting'});
    }
    sendMessage(message){
        this.dataProducer.get('message').send(message);
    }
    public sendRequest({ type, data = {} }: { type; data?: {}; }) {
        return new Promise((resolve, reject) => {
            this.socket.emit(type, data, (err, response) => {
                if (!err) {
                    // Success response, so pass the mediasoup response to the local Room.
                    resolve(response);
                } else {
                    reject(err);
                }
            });
        });
    }
}
