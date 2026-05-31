import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tag',
  imports: [MatIconModule],
  templateUrl: './tag.html',
  styleUrl: './tag.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tag {
  readonly color = input<string>('primary');
  readonly icon = input<string | null>(null);
  readonly size = input<'small' | 'large'>('large');
}
