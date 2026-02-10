import { Component, input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-outline',
  imports: [MatIconModule],
  templateUrl: './outline.html',
  styleUrl: './outline.scss',
})
export class Outline {
  outlineType = input<string>();
  content = input<string>();
}

