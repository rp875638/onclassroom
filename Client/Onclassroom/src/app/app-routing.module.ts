import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { LogingaurdService } from './gaurds/logingaurd.service';

const routes: Routes = [
  {path: 'login', component: IndexComponent, canActivate: [LogingaurdService]}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
