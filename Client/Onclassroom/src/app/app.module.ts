import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MeetingpageModule } from './meetingpage/meetingpage.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HomepageModule } from './homepage/homepage.module';
import { FormModule } from './forms/forms.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { UiComponentsModule } from './ui-components/ui-components.module';
import { AuthenticationService } from './authentication.service';
import { IndexComponent } from './index/index.component';
import { AuthgaurdService } from './gaurds/authgaurd.service';
import { QuestionsComponent } from './forms/questions/questions.component';
import { AudioTemplateComponent } from './audio-template/audio-template.component';

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    AudioTemplateComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    BrowserAnimationsModule,
    MeetingpageModule,
    HomepageModule,
    ReactiveFormsModule,
    FormsModule,
    FormModule,
    MatDialogModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatCardModule,
    MatInputModule,
    MatMenuModule,
    UiComponentsModule
  ],
  providers: [AuthenticationService, AuthgaurdService],
  bootstrap: [AppComponent]
})
export class AppModule { }
