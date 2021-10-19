import { Component } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { QuestionsComponent } from 'src/app/forms/questions/questions.component';
import { FormBuilder, Validators, FormArray } from '@angular/forms';
import { PaperService } from './paper.service';

@Component({
  selector: 'app-paper',
  templateUrl: './paper.component.html',
  styleUrls: ['./paper.component.css']
})
export class PaperComponent {
  /** Based on the screen size, switch from standard to one column per row */

paperId: string;
questions: any[] = [];
edit = false;
question: string;
option1: string;
option2: string;
option3: string;
option4: string;
answer: string;
forms;
  constructor(
              private activatedRouter: ActivatedRoute,
              private paperService: PaperService,
              private dialog: MatDialog,
              private fb: FormBuilder)
              {

              this.paperId = activatedRouter.snapshot.paramMap.get('id');
              paperService.get(`paper/${this.paperId}`)
              .subscribe(response => {

                this.questions = (response as any).papers.questions;
    });

              this.forms = fb.array([]);
  }
  formEdit(index){
    this.questions[index].edit = true;
  }

 addforms(value){
  const form = this.fb.group({
    title: [value.title, [Validators.required]],
    options: this.fb.array([
      this.fb.control(value.options[0], [Validators.required]),
      this.fb.control(value.options[1], [Validators.required]),
      this.fb.control(value.options[2], [Validators.required]),
      this.fb.control(value.options[3], [Validators.required]),
    ]),
    answer: [value.answer, [Validators.required]],
  });
  this.getforms.push(form);
 }

get getforms(){
  return this.forms as FormArray;
}

remove(id){
    this.paperService.delete(`question/${this.paperId}?id=${id}`)
    .subscribe(response => {
      this.questions.splice(id, 1);
      console.log(response);
    });
}

  save(id, i){
    this.paperService.update(`question/${id}`, this.questions[i])
    .subscribe(response => {
      console.log(response);
    });
  }

  createQuestion(){
    this.openDialog(QuestionsComponent)
    .pipe(switchMap(data => {
      return data ? this.paperService.update(`paper/add/${this.paperId}`, data) : null;
    }))
    .subscribe(response => response ? this.questions.push((response as any).question) : '');
  }
  openDialog(component){
    return this.dialog.open(component)
    .afterClosed();
  }
}
