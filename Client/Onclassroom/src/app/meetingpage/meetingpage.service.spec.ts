import { TestBed } from '@angular/core/testing';

import { MeetingpageService } from './meetingpage.service';

describe('MeetingpageService', () => {
  let service: MeetingpageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeetingpageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
