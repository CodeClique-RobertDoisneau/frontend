import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { HorizontalSlider } from '@shared/components/horizontal-slider/horizontal-slider';

@Component({
  selector: 'app-landing',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink, HorizontalSlider],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {

}