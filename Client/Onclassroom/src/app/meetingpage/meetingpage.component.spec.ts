import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingpageComponent } from './meetingpage.component';

describe('MeetingpageComponent', () => {
  let component: MeetingpageComponent;
  let fixture: ComponentFixture<MeetingpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeetingpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeetingpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
