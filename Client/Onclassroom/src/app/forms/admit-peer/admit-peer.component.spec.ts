import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmitPeerComponent } from './admit-peer.component';

describe('AdmitPeerComponent', () => {
  let component: AdmitPeerComponent;
  let fixture: ComponentFixture<AdmitPeerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdmitPeerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdmitPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
