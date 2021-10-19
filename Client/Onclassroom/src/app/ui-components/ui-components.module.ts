import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MatCardModule } from '@angular/material/card';
import { DialogsComponent } from './dialogs/dialogs.component';



@NgModule({
  declarations: [PageNotFoundComponent, DialogsComponent],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [PageNotFoundComponent]
})
export class UiComponentsModule { }
