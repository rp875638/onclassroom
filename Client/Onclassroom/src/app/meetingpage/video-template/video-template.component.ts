import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'video-template',
  templateUrl: './video-template.component.html',
  styleUrls: ['./video-template.component.css']
})
export class VideoTemplateComponent implements OnInit, AfterViewInit {
@Input('stream') stream: MediaStream;
@Input('admin') admin: boolean;
@Input('id') id: string;
@Output('changeVideo') changeVideo = new EventEmitter();
@ViewChild('videoGrid', { static: false }) videoGrid: ElementRef;
  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit(){
    this.videoGrid.nativeElement.srcObject = this.stream;
  }

  setId(id){
    if (id) {
    this.changeVideo.emit(id);
    }
  }

}
