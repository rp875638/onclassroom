import { Component } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { ExamsService } from './exams.service';
import { Router } from '@angular/router';
import { ExamComponent } from 'src/app/forms/exam/exam.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-exams',
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.css']
})
export class ExamsComponent {
  /** Based on the screen size, switch from standard to one column per row */

  constructor(private service: ExamsService, private router: Router, private dialog: MatDialog) {}
papers: any;
ngOnInit(){
 this.service.get('paper')
 .subscribe((response: any) => {
   this.papers = response.papers;
 });
}


createPaper(){
  this.openDialog(ExamComponent)
  .subscribe(data => {
    if (data) {
    this.service.create('paper', data)
    .subscribe((response: any) => {
      this.papers.push(response.exam);
      this.router.navigate([`paper/${response.exam._id}`]);
    });
    }
  });
}

deletePaper(id, index){
  this.papers.splice(index, 1);
  this.service.delete('paper/' + id)
.subscribe(response => {
  console.log(response);
});
}

editQuestion(id){
  this.router.navigate([`paper/${id}`]);
}

openDialog(component){
  return this.dialog.open(component)
  .afterClosed();
}

}
