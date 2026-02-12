import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum GradeLevel {
  SECONDE = 'SECONDE',
  PREMIERE = 'PREMIERE',
  TERMINALE = 'TERMINALE',
}

export enum ItemType {
  LESSON = 'LESSON',
  EXERCICE = 'EXERCICE',
  QUIZZ = 'QUIZZ',
}

export interface Item {
  id: number;
  title: string;
  item_type: ItemType;
  content?: string;
  difficulty: number;
  sections: number[];
}

export interface Section {
  id: number;
  title: string;
  description: string;
  difficulty: number;
  chapters: number[];
  items?: Item[]; // Only present in SectionDetail
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  grade_level: GradeLevel;
  sections?: Section[]; // Only present in ChapterDetail
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getChapter(id: string | number): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.apiUrl}/chapter/${id}/`);
  }

  getSection(id: string | number): Observable<Section> {
    return this.http.get<Section>(`${this.apiUrl}/section/${id}/`);
  }

  getItem(id: string | number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/item/${id}/`);
  }
}
