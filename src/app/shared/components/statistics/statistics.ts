import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-statistics',
  imports: [MatCardModule, MatProgressSpinnerModule, MatProgressBarModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics {
  value = 80;
}
