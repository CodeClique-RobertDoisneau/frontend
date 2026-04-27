import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ide-about-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ide-about-dialog.html',
  styleUrl: './ide-about-dialog.scss',
})
export class IdeAboutDialog {
  dialogRef = inject(MatDialogRef<IdeAboutDialog>);

  close() {
    this.dialogRef.close();
  }
}
