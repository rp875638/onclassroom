import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root'
})
export class LogingaurdService implements CanActivate{

  constructor(private router: Router, private authService: AuthenticationService) { }
  canActivate(){
    if (!this.authService.isLogined){
      return true;
    }
    else{
      this.router.navigate(['']);
      return false;
    }
  }
}
