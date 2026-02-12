import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { ChapterMenu, Chapter } from '../chapter-menu/chapter-menu';
import { forkJoin, map, of, switchMap } from 'rxjs';



@Component({
  selector: 'app-chapter-showcase',
  standalone: true,
  imports: [CommonModule, ChapterMenu, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './chapter-showcase.html',
  styleUrls: ['./chapter-showcase.scss']
})
export class ChapterShowcaseComponent {
  http = inject(HttpClient);
  chapterData = signal<Chapter | undefined>(undefined);
  isAdmin = signal(false);
  toggleRole() {
    this.isAdmin.update((value) => !value);
  }

  ngOnInit() {
    this.http.get<any>('/api/chapter/1/').pipe(
      switchMap(chapter => {
        const sectionRequests = (chapter.sections ?? []).map((sec: any) =>
          this.http.get<any>(`/api/section/${sec.id}/`)
        );
        if (sectionRequests.length === 0) {
          return of({ chapter, sections: [] });
        }
        return forkJoin(sectionRequests).pipe(
          map(sections => ({ chapter, sections }))
        );
      })
    ).subscribe({
      next: ({ chapter, sections }: any) => {
        this.chapterData.set({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          parts: (sections as any[]).map((sec: any) => ({
            id: sec.id,
            title: sec.title,
            isOpen: true,
            description: sec.description ?? '',
            items: (sec.items ?? []).map((it: any) => ({
              id: it.id,
              title: it.name,
              type: it.type ?? 'Cours',
            }))
          }))
        });
      },
      error: (err: unknown) => {
        console.error('Chapter load failed', err);
      }
    });
  }
}