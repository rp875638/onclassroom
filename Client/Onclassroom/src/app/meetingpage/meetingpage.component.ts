import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService } from './services/room.service';
import { MeetingPasswordComponent } from '../forms/meeting-password/meeting-password.component';
import { MeetingpageService } from './meetingpage.service';
import { AdmitPeerComponent } from '../forms/admit-peer/admit-peer.component';
import { MeetingSettingComponent } from '../forms/meeting-setting/meeting-setting.component';
import { switchMap } from 'rxjs/operators';

interface Message{
  displayName: string;
  message: string;
}

@Component({
  selector: 'app-meetingpage',
  templateUrl: './meetingpage.component.html',
  styleUrls: ['./meetingpage.component.css'],
  providers: [

    {provide: 'roomId', useValue: 'container'},
  ]
})
export class MeetingpageComponent implements OnInit{
  isLocked = false;
  isVideo = true;
  isMic = true;
  isRecord = false;
  isScreen = false;
  localVideoStream: any;
  localAudioStream: any;
  isJoined = false;
  prepared = false;
  screenStream: any;
  message;
  isAdmin = false;
  messages: Message[] = [];
  peers: any[] = [];
  roomService: RoomService;
  @ViewChild('localVideo', { static: false }) localVideo: ElementRef;
  @ViewChild('remoteVideos', { static: false }) remoteVideos: ElementRef[];
  isRaiseHand = false;
  meetingId: string;

  constructor(
    public dialog: MatDialog,
   // private wssService: WssService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activateRouter: ActivatedRoute,
    private meetingService: MeetingpageService
    ) {

      activateRouter.paramMap.subscribe(params => {
        this.meetingId = params.get('id');
      });
    // this.wssService.is_locked$.subscribe(locked=>{
    //     this.isLocked = locked;
    //   });
  }

  ngOnInit(){
    this.meetingDialog(this.meetingId);
  }

  openDialog() {
    this.dialog.open(MeetingSettingComponent, {
      data: this.roomService,
      restoreFocus: false});
  }

  admitDialog(data) {
    this.dialog.open(AdmitPeerComponent, {
      data,
      disableClose: true,
      restoreFocus: false})
      .afterClosed()
      .subscribe(response => {
        if (response.admited){
          this.roomService.promoteLobbyPeer(response.peerId);
        }else if (response.cancel){

        }
      });
  }

  meetingDialog(data) {
    const dialogRef = this.dialog.open(MeetingPasswordComponent, {
      data,
      restoreFocus: false,
      disableClose: true})
    .afterClosed()
    .pipe(switchMap(response => {
      return this.meetingService.join(response);
    }))
    .subscribe(response => {
        this.roomService = new RoomService(response as string, this.router);
        this.initObservable();

    });
  }

  // init observables
  async initObservable(): Promise<void>{

  this.roomService.roomObservable.localStream$.subscribe(value => {
  this.localVideo.nativeElement.srcObject = value;
});

  this.roomService.roomObservable.raiseHand$.subscribe((value: any) => {
  this.isRaiseHand = value;
});

  this.roomService.roomObservable.ready$.subscribe(value => {
  this.prepared = value;
});

  this.roomService.roomObservable.isJoined$.subscribe(value => {
  this.isJoined = value;
});

  this.roomService.roomObservable.isAdmin$.subscribe(value => {
  this.isAdmin = value;
});

  this.roomService.roomObservable.notification$.subscribe(value => {
  this.openSnakBar(value, '');
});

  this.roomService.roomObservable.messages$.subscribe(value => {
  this.messages.push((value as any));
});

  this.roomService.roomObservable.peer$.subscribe(value => {
   this.peers = value;
});

  this.roomService.roomObservable.isVideo$.subscribe(value => {
  this.isVideo = value;
});
  this.roomService.roomObservable.isScreenVideo$.subscribe(value => {
  this.isScreen = value;
});

  this.roomService.roomObservable.isAudio$.subscribe(value => {
  this.isMic = value;
});

  this.roomService.roomObservable.locked$.subscribe(value => {
  this.isLocked = value;
});

  this.roomService.roomObservable.lobyPeers$.subscribe(value => {
  this.admitDialog([value]);
});
}

join(){
 // this.wssService.mediasoup.joinMeeting();
 this.roomService.joinRoom({joinVideo: true, joinAudio: true, _produce: true, displayName: 'Rampavesh yadav'});
}

playStop() {
  if (this.isVideo) {
  this.roomService.disableWebcam();
  }
  else {
  this.roomService.updateWebcam({init: true, start: true});
  }
}

muteUnmute() {
  if (this.isMic) {
  this.roomService.disableMic();
  }
  else {
  this.roomService.updateMic({start: true});
  }
}

screenShare() {
  if (this.isScreen) {
  this.roomService.disableScreenSharing();
  }
  else {
  this.roomService.updateScreenSharing({start: true});
  }
                // this.wssService.mediasoup.screenShare()
}

sendMessage(){
  this.roomService.sendChatMessage(this.message);
  // this.wssService.mediasoup.sendMessage(this.message);
  this.messages.push({displayName: 'Me', message: this.message});
  this.message = '';

}

lock(){
  if (this.isLocked){
    this.roomService.unlockRoom();
  }else{
    this.roomService.lockRoom();
  }
  // this.wssService.mediasoup.lockUnlock(this.isLocked);
}

raiseHand(){
  if (!this.isRaiseHand){
    this.roomService.setRaisedHand(true);
  }
  // this.wssService.mediasoup.lockUnlock(this.isLocked);
}

record(){
  // this.wssService.mediasoup.recordMeeting(this.isRecord);
}

getVideo(id){
  this.localVideo.nativeElement.srcObject = this.roomService.remoteStreams.get(id);
}

async leaveMeeting(){
  await this.roomService.close();
  this.router.navigate(['']);
}

async endMeeting(){
  await this.roomService.closeMeeting();
  this.router.navigate(['']);
  // this.wssService.mediasoup.endMeeting();
}


openSnakBar(message, action){
  this.snackBar.open(message, action, {
    duration: 5000,
    verticalPosition: 'top',
    horizontalPosition: 'right'
  });
}
}
