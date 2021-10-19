import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-meeting-setting',
  templateUrl: './meeting-setting.component.html',
  styleUrls: ['./meeting-setting.component.css']
})
export class MeetingSettingComponent implements AfterViewInit {

  audioInputDevices: any[];
  audioOutputDevices: any[];
  videoInputDevices: any[] = [];
  layout: string[] = ['Tiled', 'Spotlite'];
  constructor(
    private dialogRef: MatDialogRef<MeetingSettingComponent>, @Inject(MAT_DIALOG_DATA) public data) {}
    close(){
      this.dialogRef.close();
    }

    ngAfterViewInit(): void {
      this.updateDevices();
      navigator.mediaDevices.addEventListener('devicechange', event => {
        this.updateDevices();
    });
    }

    updateDevices(){
      navigator.mediaDevices.enumerateDevices().then(devices => {
        this.videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        this.audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        this.audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');

      }).catch(error => {
          console.log(error.message);
      });
    }

}
