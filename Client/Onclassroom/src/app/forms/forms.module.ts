import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignupComponent } from './signup/signup.component';
import { SigninComponent } from './signin/signin.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { CreateMeetingComponent } from './create-meeting/create-meeting.component';
import { ScheduleMeetingComponent } from './schedule-meeting/schedule-meeting.component';
import { ProfileComponent } from './profile/profile.component';
import { QuestionsComponent } from './questions/questions.component';
import { ExamComponent } from './exam/exam.component';
import { MeetingPasswordComponent } from './meeting-password/meeting-password.component';
import { AdmitPeerComponent } from './admit-peer/admit-peer.component';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MeetingSettingComponent } from './meeting-setting/meeting-setting.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';



@NgModule({
  declarations: [
    SignupComponent,
    SigninComponent,
    ChangepasswordComponent,
    CreateMeetingComponent,
    ScheduleMeetingComponent,
    ProfileComponent,
    QuestionsComponent,
    ExamComponent,
    MeetingPasswordComponent,
    AdmitPeerComponent,
    MeetingSettingComponent
  ],
  imports: [
    CommonModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatListModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule
  ],
  exports: [
    SignupComponent,
    SigninComponent,
    QuestionsComponent
  ]
})
export class FormModule { }
