import { Component, OnInit, Input, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from '../errormatcher';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-meeting-password',
  templateUrl: './meeting-password.component.html',
  styleUrls: ['./meeting-password.component.css']
})
export class MeetingPasswordComponent implements OnInit {
  form;
  matcher = new MyErrorStateMatcher();
  constructor(private fb: FormBuilder, private activatedRoute: ActivatedRoute, @Inject(MAT_DIALOG_DATA) public data) {
    this.form = fb.group({
      meeting_id: [data, Validators.required],
      meeting_password: ['', Validators.required]
    });
   }

  ngOnInit(): void {
   // this.form.get('meeting_id').disable();
  }

}
