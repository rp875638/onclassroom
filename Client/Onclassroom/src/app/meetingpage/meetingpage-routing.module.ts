import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MeetingpageComponent } from './meetingpage.component';
import { AuthgaurdService } from 'src/app/gaurds/authgaurd.service';

const routes: Routes = [
  {path: 'meeting',
  children: [
    {path: ':id', component: MeetingpageComponent, canActivate: [AuthgaurdService]}
  ]
},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MeetingpageRoutingModule { }
