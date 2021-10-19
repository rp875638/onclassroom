import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MeetingpageRoutingModule } from './meetingpage-routing.module';
import { FooterComponent } from './footer/footer.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SectionComponent } from './section/section.component';
import { MeetingpageComponent } from './meetingpage.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {MatButtonModule} from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatDialogModule} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { SocketService } from './services/socket.service';
import { RoomService } from './services/room.service';
import { MediasoupService } from './services/mediasoup.service';
import { VideoTemplateComponent } from './video-template/video-template.component';
import { AudioTemplateComponent } from './audio-template/audio-template.component';


@NgModule({
  declarations: [FooterComponent, SidebarComponent, SectionComponent, MeetingpageComponent, VideoTemplateComponent, AudioTemplateComponent],
  providers: [SocketService, RoomService, MediasoupService],
  imports: [
    CommonModule,
    MeetingpageRoutingModule,
    MatGridListModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDialogModule,
    FormsModule,
    MatSnackBarModule
  ]
})
export class MeetingpageModule { }
