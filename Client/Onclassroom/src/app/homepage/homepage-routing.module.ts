import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MeetingsComponent } from './meetings/meetings.component';
import { PaperComponent } from './paper/paper.component';
import { ProfileComponent } from './profile/profile.component';
import { ResultComponent } from './result/result.component';
import { SettingsComponent } from './settings/settings.component';
import { TestComponent } from './test/test.component';
import { HomepageComponent } from './homepage.component';
import { AuthgaurdService } from 'src/app/gaurds/authgaurd.service';
import { ExamsComponent } from './exams/exams.component';

const routes: Routes = [
  {path: '', component: HomepageComponent, canActivate: [AuthgaurdService],
  children: [
    {path: '', component: MeetingsComponent, canActivate: [AuthgaurdService]},
    {path: 'paper/:id', component: PaperComponent, canActivate: [AuthgaurdService]},
    {path: 'exams', component: ExamsComponent, canActivate: [AuthgaurdService]},
    {path: 'profile', component: ProfileComponent, canActivate: [AuthgaurdService]},
    {path: 'result', component: ResultComponent, canActivate: [AuthgaurdService]},
    {path: 'setting', component: SettingsComponent, canActivate: [AuthgaurdService]},
    {path: 'test', component: TestComponent, canActivate: [AuthgaurdService]}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomepageRoutingModule { }
