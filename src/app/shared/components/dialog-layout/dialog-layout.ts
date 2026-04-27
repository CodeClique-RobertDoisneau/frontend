import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-layout',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './dialog-layout.html',
  styleUrl: './dialog-layout.scss'
})
export class DialogLayout {
  title = input.required<string>();
  close = output<void>();

  onClose() {
    this.close.emit();
  }
}
