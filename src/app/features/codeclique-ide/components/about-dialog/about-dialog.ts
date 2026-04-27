import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DialogLayout } from '../../../../shared/components/dialog-layout/dialog-layout';

@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DialogLayout
  ],
  templateUrl: './about-dialog.html',
  styleUrl: './about-dialog.scss',
})
export class AboutDialog {
  dialogRef = inject(MatDialogRef<AboutDialog>);

  close() {
    this.dialogRef.close();
  }
}
