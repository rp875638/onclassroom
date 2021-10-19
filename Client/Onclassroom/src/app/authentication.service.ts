import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { retry, map } from 'rxjs/operators';
import {environment} from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
url = `${environment.baseURL}api`;
  constructor(private http: HttpClient) {
   }
   login(data){
    return this.http.post(this.url + '/login', data)
    .pipe(map((response: any) => {
      if (response.user){
        localStorage.setItem('token', response.user.token);
        delete response.user.token;
        return response.user;
      }
      else{
        return response.user;
      }
    }), catchError(this.handleError));
   }
   signup(data){
    return this.http.post(this.url + '/signup', data)
    .pipe(retry(5), map((response: any) => {
      if (response.user){
        localStorage.setItem('token', response.user.token);
        delete response.user.token;
        return response.user;
      }
      else{
        return response.user;
      }
    }), catchError(this.handleError));
   }
   logout(){
    const options = this.header;
    this.http.get(this.url + '/logout', options).subscribe(response => {

     });
    localStorage.removeItem('token');
   }

  get isLogined(){
    const token = localStorage.getItem('token');
    if (token){
      return true;
    }
    else{
      return false;
    }
   }

currentUser(){
    const options = this.header;
    return this.http.get(this.url + '/currentuser', options)
    .pipe(retry(5), catchError(this.handleError));
  }
  private get header(){
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({Authorization: 'Token ' + token});
    return{
        headers
      };
  }

   private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      if (error.status === 400){
        console.log('User not login');
      }
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }

  private handleLoginError(error: HttpErrorResponse){
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      if (error.status === 400){

      }
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }
}
