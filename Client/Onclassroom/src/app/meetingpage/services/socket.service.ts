import { Inject, Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  socket: any;
  constructor(@Inject('token') token: string) {
    this.socket = io(`${environment.baseURL}`, {
      auth: {
        token
      }
    });

    this.socket.on('disconnect', (event) => {
        console.log('Socket disconnected to server');
    });
    this.socket.on('connect', () => {
      console.log('Socket connected to server');

    });
   }

   sendRequest({method, data= {}})
   {
     return new Promise((resolve, reject) =>
     {
       if (!this.socket)
       {
         reject('No socket connection');
       }
       else
       {
         this.socket.emit('request', { method, data }, (err, response) =>
           {
             if (err) {
               reject(err);
             }
             else {
               resolve(response);
             }
           });
       }
     });
   }
}
