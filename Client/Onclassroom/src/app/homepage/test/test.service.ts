import { Injectable } from '@angular/core';
import { HomepageService } from '../homepage.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TestService extends HomepageService{

  constructor(http: HttpClient) {
    super(http);
  }
}
