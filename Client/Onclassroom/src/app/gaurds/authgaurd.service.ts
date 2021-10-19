import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthgaurdService implements CanActivate {

  constructor(private router: Router, private authService: AuthenticationService) { }

  canActivate(){
    if (this.authService.isLogined){
      return true;
    }
    else{
      this.router.navigate(['login']);
      return false;
    }
  }
}
