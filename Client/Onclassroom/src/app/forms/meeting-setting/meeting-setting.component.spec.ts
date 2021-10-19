import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingSettingComponent } from './meeting-setting.component';

describe('MeetingSettingComponent', () => {
  let component: MeetingSettingComponent;
  let fixture: ComponentFixture<MeetingSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeetingSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeetingSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
