import { of } from 'rxjs'; // pour simuler une réponse de l'API (à retirer une fois le backend prêt)
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { ChapterMenu, Chapter } from '../chapter-menu/chapter-menu';

const MOCK_DJANGO_RESPONSE = {
  id: 1,
  title: "Chapitre 1 : Les Variables",
  description: "Les variables sont des conteneurs pour stocker des données.",
  sections: [
    {
      id: 10,
      isOpen: true,
      title: "Introduction aux variables",
      description: "les bases",
      items: [
        { id: 101, name: "Le concept de boîte", content: "...",type: 'Cours'},
        { id: 102, name: "Quiz rapide", content: "...", type: 'Quiz' }
      ]
    },
    {
      id: 20,
      title: "Les types de données",
      description: "bla bla bla",
      items: [
        { id: 201, name: "Exercice : String ou Int ?", content: "...",type: 'Exercice' }
      ]
    }
  ]
};

@Component({
  selector: 'app-chapter-showcase',
  standalone: true,
  imports: [CommonModule, ChapterMenu, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './chapter-showcase.html',
  styleUrls: ['./chapter-showcase.scss']
})
export class ChapterShowcaseComponent implements OnInit{
  http = inject(HttpClient);
  chapterData: Chapter | undefined;
  isAdmin = false;
  toggleRole() {
    this.isAdmin = !this.isAdmin;
  }

  ngOnInit() {
    //this.http.get<any>('http://localhost:8000/api/chapter/1') (à décommenter une fois le backend prêt)
    of(MOCK_DJANGO_RESPONSE) // à retirer une fois le backend prêt
      .subscribe(response => {
        this.chapterData = {
          id: response.id,
          title: response.title,
          description: response.description,
          parts: response.sections.map((sec: any) => ({
            id: sec.id,
            title: sec.title,
            isOpen: sec.isOpen || false, 
            description: sec.description,
            items: sec.items.map((it: any) => ({
              id: it.id,
              title: it.name,
              type: it.type,   
            }))
          }))
        };
        
      });
  }
}