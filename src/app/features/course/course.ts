import { Component, ChangeDetectionStrategy, input, inject, computed, effect, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { httpResource } from '@angular/common/http';

import { QuizComponent } from './components/quiz/quiz';
import { Lesson } from './components/lesson/lesson';
import { Exercise } from './components/exercise/exercise';
import { Toc } from './components/toc/toc';
import { NodeService, NodeInfo } from '@shared/services/node.service';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { BreadcrumbService, BreadcrumbItem } from '@shared/services/breadcrumb.service';
import { AuthService } from '@shared/services/auth.service';

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
    Toc,
  ],
  templateUrl: './course.html',
  styleUrl: './course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Pyodide]
})
export class Course {
  readonly id = input.required<string>();
  pyodide = inject(Pyodide);

  private location = inject(Location);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(AuthService);

  restartMode = signal(false);

  dataResource = httpResource<NodeInfo>(() => `/api/nodes/${this.id()}/`);
  data = computed(() => this.dataResource.value());

  constructor() {
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

    if (!this.authService.currentUser()) {
      this.authService.getMe().subscribe();
    }

    this.route.queryParams.subscribe(params => {
      this.restartMode.set(params['restart'] === 'true');
    });
  }

  onItemCompleted() {
    this.dataResource.reload();
  }

  doRestart() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { restart: 'true', review: null },
      queryParamsHandling: 'merge'
    });
  }
}
