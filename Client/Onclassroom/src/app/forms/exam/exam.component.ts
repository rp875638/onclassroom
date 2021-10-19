import { Component, OnInit } from '@angular/core';
import { MyErrorStateMatcher } from '../errormatcher';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-exam',
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css']
})
export class ExamComponent implements OnInit {
  form;
  matcher = new MyErrorStateMatcher();
    constructor(private fb: FormBuilder) {
      this.form = fb.group({
        title: ['', [Validators.required]],
        dateTime: ['', [Validators.required]],
        duration: ['', [Validators.required]],
        totalMark: ['', Validators.required],
      });
    }

    property(value){
      return this.form.get(value);
    }

    ngOnInit(): void {
    }

}
