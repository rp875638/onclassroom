import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeetingpageService {
   url = `${environment.baseURL}api/meeting/joinmeeting`;
  constructor(private http: HttpClient) { }

  join(data){
    const options = this.header;
    return this.http.post(this.url, data, options)
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
