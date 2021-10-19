import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomepageService {
  private baseUrl = `${environment.baseURL}api/`;
  constructor(private http: HttpClient ) { }

  get(url){
    const options = this.header;
    return this.http.get(this.baseUrl + url, options)
   .pipe(catchError(this.handleError));
  }
  create(url, data){
    const options = this.header;
    return this.http.post(this.baseUrl + url, data, options)
    .pipe(catchError(this.handleError));
  }
  update(url, data){
    const options = this.header;
    return this.http.put(this.baseUrl + url, data, options)
    .pipe(catchError(this.handleError));
  }
  delete(url){
    const options = this.header;
    return this.http.delete(this.baseUrl + url, options)
    .pipe(catchError(this.handleError));
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
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }
}
