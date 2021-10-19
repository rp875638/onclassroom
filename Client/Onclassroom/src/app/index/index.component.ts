import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from '../authentication.service';
import { SignupComponent } from '../forms/signup/signup.component';
import { SigninComponent } from '../forms/signin/signin.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {

  constructor(private dialog: MatDialog, private authService: AuthenticationService, private router: Router) { }
  openSignUp(){
    this.openDialog(SignupComponent)
    .subscribe(result => {
      if (result){
        this.authService.signup(result)
        .subscribe(results => {
          console.log(results);
        });
      }
    });
  }

  openLogin(){
    this.openDialog(SigninComponent)
    .subscribe(result => {
      if (result){
      this.authService.login(result)
      .subscribe(results => {
        if (results){
          this.router.navigate(['']);
        }
      });
      }
    });
  }

  openDialog(component){
    return this.dialog.open(component)
    .afterClosed();
  }
  ngOnInit(): void {
  }

}
