import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from '../errormatcher';


@Component({
  selector: 'app-create-meeting',
  templateUrl: './create-meeting.component.html',
  styleUrls: ['./create-meeting.component.css']
})
export class CreateMeetingComponent implements OnInit {
  form;
  matcher = new MyErrorStateMatcher();
    constructor(private fb: FormBuilder) {
      this.form = fb.group({
        discription: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
      });
    }

    property(value){
      return this.form.get(value);
    }

    ngOnInit(): void {
    }


}
