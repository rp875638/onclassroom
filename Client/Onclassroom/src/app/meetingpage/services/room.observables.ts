import { Subject } from 'rxjs';

export class RoomObservable {

      // Observable string sources
  private locked = new Subject<boolean>();
  private raisedHand = new Subject<object>();
  private isJoined = new Subject<boolean>();
  private isAdmin = new Subject<boolean>();
  private isVideo = new Subject<boolean>();
  private isScreenVideo = new Subject<boolean>();
  private isAudio = new Subject<boolean>();
  private isMeetingEnd = new Subject<boolean>();
  private recording = new Subject<boolean>();
  private remoteStreams = new Subject<MediaStream[]>();
  private messages = new Subject<object>();
  private peer = new Subject<any>();
  private videoInputDevices = new Subject<object>();
  private audioInputDevices = new Subject<object>();
  private audioOutputDevices = new Subject<object>();
  private lobyPeers = new Subject<object>();
  private autoMuteThreshold = new Subject<number>();
  private localStream = new Subject<MediaStream>();
  private ready = new Subject<boolean>();
  private notification = new Subject<string>();

  // Observable string streams
  locked$ = this.locked.asObservable();
  raiseHand$ = this.raisedHand.asObservable();
  isJoined$ = this.isJoined.asObservable();
  isAdmin$ = this.isAdmin.asObservable();
  isVideo$ = this.isVideo.asObservable();
  isScreenVideo$ = this.isScreenVideo.asObservable();
  isAudio$ = this.isAudio.asObservable();
  isMeetingEnd$ = this.isMeetingEnd.asObservable();
  recording$ = this.recording.asObservable();
  remoteStreams$ = this.remoteStreams.asObservable();
  messages$ = this.messages.asObservable();
  peer$ = this.peer.asObservable();
  videoInputDevices$ = this.videoInputDevices.asObservable();
  audioInputDevices$ = this.audioInputDevices.asObservable();
  audioOutputDevices$ = this.audioOutputDevices.asObservable();
  lobyPeers$ = this.lobyPeers.asObservable();
  autoMuteThreshold$ = this.autoMuteThreshold.asObservable();
  localStream$ = this.localStream.asObservable();
  ready$ = this.ready.asObservable();
  notification$ = this.notification.asObservable();

  constructor() {}
    set setlock(value){
        this.locked.next(value);
    }

    set setRaiseHand(value){
        this.raisedHand.next(value);
    }

    set setIsJoined(value){
        this.isJoined.next(value);
    }

    set setIsAdmin(value){
        this.isAdmin.next(value);
    }

    set setIsVideo(value){
        this.isVideo.next(value);
    }
    set setIsScreenVideo(value){
        this.isScreenVideo.next(value);
    }

    set setIsAudio(value){
        this.isAudio.next(value);
    }

    set setIsMeetingEnd(value){
        this.isMeetingEnd.next(value);
    }

    set setRecording(value){
        this.recording.next(value);
    }

    set setMessage(value){
        this.messages.next(value);
    }

    set setPeer(value){
        this.peer.next(value);
    }

    set setRemoteStream(value){
        this.remoteStreams.next(value);
    }

    set setVideoInputDevices(value){
        this.videoInputDevices.next(value);
    }

    set setAudioInputDevices(value){
        this.audioInputDevices.next(value);
    }

    set setAudioOutputDevices(value){
        this.audioOutputDevices.next(value);
    }

    set setLobyPeer(value){
        this.lobyPeers.next(value);
    }
    set setautoMuteThreshold(value){
        this.autoMuteThreshold.next(value);
    }

    set setlocalStream(value){
        this.localStream.next(value);
    }
    set setready(value){
        this.ready.next(value);
    }
    set setNotification(value){
        this.notification.next(value);
    }
}
