import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-audio-template',
  templateUrl: './audio-template.component.html',
  styleUrls: ['./audio-template.component.css']
})
export class AudioTemplateComponent implements OnInit, AfterViewInit {
@Input('stream') stream: MediaStream;
@ViewChild('audioGrid', { static: false }) audioGrid: ElementRef;
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.audioGrid.nativeElement.srcObject = this.stream;
  }
}
