import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from '../errormatcher';


@Component({
  selector: 'signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  account;
  matcher = new MyErrorStateMatcher();
  constructor(private fb: FormBuilder) {
    this.account = fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
   }

   get username(){
     return this.account.get('username');
   }
   get password(){
    return this.account.get('password');
  }

  ngOnInit(): void {
  }

}
