import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-admit-peer',
  templateUrl: './admit-peer.component.html',
  styleUrls: ['./admit-peer.component.css']
})
export class AdmitPeerComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<AdmitPeerComponent>, @Inject(MAT_DIALOG_DATA) public data) {
  }
  ngOnInit(): void {
  }

  admit(peerId){
    this.dialogRef.close();
    console.log(peerId);
  }
  cancel(peerId){
    this.dialogRef.close();
    console.log(peerId);
  }
}
