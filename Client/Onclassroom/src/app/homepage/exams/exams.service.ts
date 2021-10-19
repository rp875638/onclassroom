import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HomepageService } from '../homepage.service';

@Injectable({
  providedIn: 'root'
})
export class ExamsService extends HomepageService {

  constructor(http: HttpClient) {
    super(http);
  }
}
