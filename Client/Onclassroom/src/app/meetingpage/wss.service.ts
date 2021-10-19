import { Injectable } from '@angular/core';
import {io, Socket} from 'socket.io-client';
import { MediasoupServices } from './wss.mediasoup';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class WssService {
socket: any;
mediasoup: MediasoupServices;
joined = false;
prepared = false;

private islocked = new Subject<boolean>();

islocked$ = this.islocked.asObservable();

  constructor() { }

 connectSocket(roomId) {
    this.socket = io('http://127.0.0.1:3030/?peerId=rp8756&roomId=1345677');
    this.socket.on('disconnect', (evt) => {
      console.log('socket.io disconnect:', evt);
  });
    this.mediasoup = new MediasoupServices(this.socket, roomId);
    this.socket.on('connect', async () => {
    await this.mediasoup.sendRequest({type: 'prepare_room', data: {roomId}})
    .then((data: any) => {
        this.prepared = data.prepared;
    });
    });
    this.socket.on('confirm', (data) => {
    });

    this.socket.on('locked', () => {
        this.islocked.next(true);

    });

    this.socket.on('unlocked', () => {
        this.islocked.next(false);

    });

  }

}
