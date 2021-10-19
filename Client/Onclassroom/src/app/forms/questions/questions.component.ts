import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MyErrorStateMatcher } from '../errormatcher';
import { FormBuilder, Validators, FormArray } from '@angular/forms';
import { from } from 'rxjs';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent implements OnInit {
  form;
  @Input('data') data;
  @Input('sdisable') sdisable;
  @Output('savedata') savedata = new EventEmitter();

  matcher = new MyErrorStateMatcher();
    constructor(private fb: FormBuilder) {
      this.form = fb.group({
        title: [{value: '', disabled: this.sdisable}, [Validators.required]],
        options: fb.array([
          fb.control({value: '', disabled: this.sdisable}, [Validators.required]),
          fb.control({value: '', disabled: this.sdisable}, [Validators.required]),
          fb.control({value: '', disabled: this.sdisable}, [Validators.required]),
          fb.control({value: '', disabled: this.sdisable}, [Validators.required]),
        ]),
        answer: [{value: '', disabled: this.sdisable}, [Validators.required]],
      });
    }

    ngOnInit(): void {
      if (this.data){
        this.form.setValue(this.data);
        this.form.disable = true;
      }
    }

  get options(){
    return this.form.get('options') as FormArray;
  }

  property(value){
    return this.form.get(value);
  }

  edit(){
    this.form.enable();
  }

  save(value){
    this.savedata.emit(value);
  }

}
