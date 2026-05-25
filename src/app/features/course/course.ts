import { Component, ChangeDetectionStrategy, input, inject, computed, effect, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


import { httpResource } from '@angular/common/http';

import { QuizComponent } from './components/quiz/quiz';
import { Lesson } from './components/lesson/lesson';
import { Exercise } from './components/exercise/exercise';
import { Node, NodeInfo } from '@shared/services/node/node';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { BreadcrumbService, BreadcrumbItem } from '@shared/services/breadcrumb.service';
import { Auth } from '@shared/services/auth/auth';

@Component({
  selector: 'app-course',
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    FormsModule,
    QuizComponent,
    Lesson,
    Exercise,
  ],
  templateUrl: './course.html',
  styleUrl: './course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Pyodide]
})
export class Course {
  // Course identifier input
  readonly id = input.required<string>();
  pyodide = inject(Pyodide);


  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(Auth);



  course = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);
  data = computed(() => this.course.value());

  constructor() {
    // Breadcrumbs
    effect(() => {
      const d = this.data();
      if (d) {
        const lastChapter = this.breadcrumbService.getLastChapter();
        const crumbs: BreadcrumbItem[] = [];
        if (lastChapter) {
          crumbs.push({ label: lastChapter.title, url: `/chapter/${lastChapter.id}` });
        }
        crumbs.push({ label: d.title });
        this.breadcrumbService.setBreadcrumbs(crumbs);
      }
    });

    // Ensure user data is loaded for progress tracking if logged in
    if (!this.authService.currentUser()) {
      this.authService.getMe().catch(() => {});
    }
  }

  onItemCompleted() {
    this.course.reload();
  }


}
