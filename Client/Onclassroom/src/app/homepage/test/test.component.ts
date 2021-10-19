import { Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { TestService } from './test.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent {
  /** Based on the screen size, switch from standard to one column per row */

  seasons: string[] = ['Winter', 'Spring', 'Summer', 'Autumn'];
  paperId: string;
  questions: string[];
  constructor(private testService: TestService, private activatedRoute: ActivatedRoute) {
    // this.paperId = activatedRoute.snapshot.paramMap.get('id');
    // testService.get(`paper/${this.paperId}`)
    //           .subscribe(response=>{
    //             this.questions = (response as any).papers.questions
    // });
  }
}
