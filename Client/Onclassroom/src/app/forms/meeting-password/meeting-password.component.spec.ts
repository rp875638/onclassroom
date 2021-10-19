import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingPasswordComponent } from './meeting-password.component';

describe('MeetingPasswordComponent', () => {
  let component: MeetingPasswordComponent;
  let fixture: ComponentFixture<MeetingPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeetingPasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeetingPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
