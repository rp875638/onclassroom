import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Onclassroom';
  sdata = {title: 'What is computer',
          options: ['computer', 'mechanical', 'software', 'hardware'],
        answer: 'computer'};
  constructor(private authService: AuthenticationService){
  }
  ngOnInit(){
    }

  save(data){
      console.log(data);
    }

}
