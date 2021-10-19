import { Component, AfterViewInit } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { ProfileService } from './profile.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/forms/errormatcher';
import { homepageObservable } from '../homepage.observable';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements AfterViewInit {
  /** Based on the screen size, switch from standard to one column per row */
  profile: any;
  form;
  matcher = new MyErrorStateMatcher();
  constructor(private homepageobservable: homepageObservable, private service: ProfileService, private fb: FormBuilder) {
    this.form = fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
    });

  }
ngAfterViewInit(){
  this.homepageobservable.notification$.subscribe(response => {
    console.log(response);
  });

  this.service.get('profile')
    .subscribe((response: any) => {
      delete response.user._id;
      this.form.setValue(response.user);
      this.form.disable();
    });
}

  formEdit(){
    this.form.enable();
  }

  save(value){
    this.form.disable();
    this.service.update('profile', value)
    .subscribe(response => {
      this.homepageobservable.notification = response;
    });
  }
  property(value){
    return this.form.get(value);
  }
}
