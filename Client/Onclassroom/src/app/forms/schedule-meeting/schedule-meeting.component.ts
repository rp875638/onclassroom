import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from '../errormatcher';

@Component({
  selector: 'app-schedule-meeting',
  templateUrl: './schedule-meeting.component.html',
  styleUrls: ['./schedule-meeting.component.css']
})
export class ScheduleMeetingComponent implements OnInit {
  form;
  matcher = new MyErrorStateMatcher();
    constructor(private fb: FormBuilder) {
      this.form = fb.group({
        discription: ['', [Validators.required]],
        dateTime: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
      });
    }

    property(value){
      return this.form.get(value);
    }

    ngOnInit(): void {
    }


}
