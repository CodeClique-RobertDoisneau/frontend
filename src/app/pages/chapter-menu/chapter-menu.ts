import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
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

