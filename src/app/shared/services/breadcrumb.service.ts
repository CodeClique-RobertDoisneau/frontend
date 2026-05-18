import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const isCoursePage = event.urlAfterRedirects.match(/^\/(courses|course|chapter)/);
      if (!isCoursePage) {
        this.breadcrumbs.set([]);
        this.lastChapter.set(null);
      }
    });
  }

  /**
   * Current breadcrumb items to display.
   */
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  /**
   * Temp storage for the last chapter visited, 
   * to allow "re-building" the breadcrumb on a course page.
   */
  private lastChapter = signal<{id: string | number, title: string} | null>(null);

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this.breadcrumbs.set(items);
  }

  setLastChapter(id: string | number, title: string) {
    this.lastChapter.set({ id, title });
  }

  getLastChapter() {
    return this.lastChapter();
  }

  /**
   * Helper to build the default chapter path.
   */
  getChapterBreadcrumbs(chapterTitle: string, chapterId: string | number): BreadcrumbItem[] {
    return [
      { label: chapterTitle, url: `/chapter/${chapterId}` }
    ];
  }

}
