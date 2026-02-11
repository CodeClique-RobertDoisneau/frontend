import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';

import { ChapterMenu, Chapter } from '../chapter-menu/chapter-menu';
import { MatAnchor } from "@angular/material/button"; 

@Component({
  selector: 'app-chapter-showcase',
  standalone: true,
  imports: [CommonModule, ChapterMenu, MatButtonModule], 
  templateUrl: './chapter-showcase.html',
  styleUrls: ['./chapter-showcase.scss']
})
export class ChapterShowcaseComponent {
  isAdmin = false;
  toggleRole() {
    this.isAdmin = !this.isAdmin;
  }

  testChapter: Chapter = {
    id: 1,
    title: "Les conditions et boucles",
    description: "Les boucles et les structures conditionnelles sont...",
    parts: [
{
        id: 1,
        isOpen: true,
        title: "Notion 1 : Introduction",
        items: [
          { id: 10, title: 'Bienvenue dans ce chapitre', type: 'Cours' },
          { id: 11, title: 'Pourquoi utiliser des conditions ?', type: 'Cours' },
          { id: 12, title: 'Quiz de pré-requis', type: 'Quiz' }
        ],
        description: "Petites boucles tranquillement."
      },
      {
        id: 2,
        isOpen: false,
        title: "Notion 2 : Découverte des fonctions",
        items: [
          { id: 101, title: 'Lorem ipsum blabla', type: 'Cours' },
          { id: 102, title: 'Lorem ipsum blabla', type: 'Quiz' },
          { id: 103, title: 'Lorem ipsum blabla', type: 'Exercice' },
        ],
        description: "Description de la notion 2."
      }
    ]
  }
}