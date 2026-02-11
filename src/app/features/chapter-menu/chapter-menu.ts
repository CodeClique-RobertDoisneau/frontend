import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export type ItemType = 'Cours' | 'Quiz' | 'Exercice';

export interface Item {
  id: number;
  title: string; 
  type: ItemType; 
}

export interface Parts {
  id: number;
  title: string;
  items: Item[];
  isOpen: boolean;
  description: string;
}


export interface Chapter {
  id: number;
  title: string;
  description: string;
  parts: Parts[];
}

@Component({
  selector: 'app-chapter-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatButtonModule,
    MatIcon,
    MatProgressBarModule,
  ],
  templateUrl: './chapter-menu.html',
  styleUrl: './chapter-menu.scss',
})

export class ChapterMenu {
  chapter = input.required<Chapter>();
  togglePart(part: Parts) {
    part.isOpen = !part.isOpen;
  }
  isAdmin = input<boolean>(false);
}

