import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { MeetingsService } from './meetings.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateMeetingComponent } from 'src/app/forms/create-meeting/create-meeting.component';
import { ScheduleMeetingComponent } from 'src/app/forms/schedule-meeting/schedule-meeting.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-meetings',
  templateUrl: './meetings.component.html',
  styleUrls: ['./meetings.component.css']
})
export class MeetingsComponent implements OnInit{
  /** Based on the screen size, switch from standard to one column per row */
  meetings: any;
  joinInput: string;
  constructor(private meetingService: MeetingsService, private dialog: MatDialog, private router: Router) {}

  ngOnInit(){
    this.meetingService.get('meeting')
    .subscribe((data: any) => {
      this.meetings = data.meeting;
    });
  }

  createMeeting(){
    this.openDialog(CreateMeetingComponent)
    .pipe(switchMap(data => {
     return data ? this.meetingService.create('meeting', data) : null;
    }))
    .subscribe((response: any) => response ? this.meetings.push(response.meeting) : null);
  }

  scheduleMeeting(){
    this.openDialog(ScheduleMeetingComponent)
    .pipe(switchMap((data: any) => {
      return data ? this.meetingService.create('meeting/schedulemeeting', data) : null;
    }))
    .subscribe((response: any) =>  response ? this.meetings.push(response.meeting) : null);
  }

  deleteMeeting(id, index){
    this.meetings.splice(index, 1);
    this.meetingService.delete('meeting/' + id)
  .subscribe(response => {
  });
  }

  joinMeeting(id){
      if (id){this.router.navigate([`meeting/${id}`]); }
  }

  openDialog(component){
    return this.dialog.open(component)
    .afterClosed();
  }

}
