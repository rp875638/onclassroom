import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomepageComponent } from './homepage.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MeetingsComponent } from './meetings/meetings.component';
import { PaperComponent } from './paper/paper.component';
import { ProfileComponent } from './profile/profile.component';
import { TestComponent } from './test/test.component';
import { SettingsComponent } from './settings/settings.component';
import { ResultComponent } from './result/result.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterModule } from '@angular/router';
import {MatInputModule} from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MeetingsService } from './meetings/meetings.service';
import { PaperService } from './paper/paper.service';
import { ProfileService } from './profile/profile.service';
import { ResultService } from './result/result.service';
import { SettingsService } from './settings/settings.service';
import { TestService } from './test/test.service';
import { HttpClientModule } from '@angular/common/http';
import { HomepageRoutingModule } from './homepage-routing.module';
import { ExamsComponent } from './exams/exams.component';
import { ExamsService } from './exams/exams.service';
import { homepageObservable } from './homepage.observable';


@NgModule({
  declarations: [
    HomepageComponent,
    MeetingsComponent,
    PaperComponent,
    ProfileComponent,
    TestComponent,
    SettingsComponent,
    ResultComponent,
    ExamsComponent
  ],
  imports: [
    CommonModule,
    LayoutModule,
    RouterModule,
    HomepageRoutingModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatCardModule,
    MatGridListModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatRadioModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    MeetingsService,
    PaperService,
    ProfileService,
    ResultService,
    SettingsService,
    TestService,
    ExamsService,
    homepageObservable
  ]
})
export class HomepageModule { }
