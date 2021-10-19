import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioTemplateComponent } from './audio-template.component';

describe('AudioTemplateComponent', () => {
  let component: AudioTemplateComponent;
  let fixture: ComponentFixture<AudioTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AudioTemplateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
