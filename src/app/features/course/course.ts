import { Component, ChangeDetectionStrategy, input, inject, computed, effect } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Tag } from '@shared/components/tag/tag';


import { Node, NodeInfo, SUBJECT_LABELS, GRADE_LABELS, TYPE_LABELS } from '@shared/services/node/node';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { BreadcrumbService, BreadcrumbItem } from '@shared/services/breadcrumb.service';
import { Auth } from '@shared/services/auth/auth';
import { QuizComponent } from './components/quiz/quiz';
import { Lesson } from './components/lesson/lesson';
import { Exercise } from './components/exercise/exercise';

@Component({
  selector: 'app-course',
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    QuizComponent,
    Lesson,
    Exercise,
    Tag,
  ],
  templateUrl: './course.html',
  styleUrl: './course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Pyodide]
})
export class Course {
  // Course identifier input
  readonly id = input.required<string>();

  private nodeService = inject(Node);
  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(Auth);

  course = this.nodeService.getNode(() => this.id());
  data = computed(() => this.course.value());

  subjectLabel = computed(() => {
    const sub = this.data()?.subject;
    return sub ? SUBJECT_LABELS[sub] || sub : null;
  });

  gradeLabel = computed(() => {
    const grade = this.data()?.grade_level;
    return grade ? GRADE_LABELS[grade] || grade : null;
  });

  typeLabel = computed(() => {
    const type = this.data()?.type;
    return type ? TYPE_LABELS[type] || type : null;
  });

  difficultyLabel = computed(() => {
    const diff = this.data()?.difficulty;
    if (!diff) return null;
    if (diff <= 1) return 'Facile';
    if (diff === 2) return 'Moyen';
    return 'Difficile';
  });

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
      this.authService.getMe().catch(() => { });
    }
  }

  onItemCompleted() {
    this.course.reload();
  }
}
