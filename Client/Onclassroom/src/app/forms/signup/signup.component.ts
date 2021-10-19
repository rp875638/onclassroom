import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';
import { MyErrorStateMatcher } from '../errormatcher';


@Component({
  selector: 'signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
form;
matcher = new MyErrorStateMatcher();
  constructor(private fb: FormBuilder) {
    this.form = fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  property(value){
    return this.form.get(value);
  }

  ngOnInit(): void {
  }

}
