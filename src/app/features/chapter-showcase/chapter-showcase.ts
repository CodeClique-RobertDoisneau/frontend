import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { CourseService } from '@features/course/course.service';
import { ChapterMenu } from '@shared/components/chapter-menu/chapter-menu';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-chapter-showcase',
  imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, RouterLink, ChapterMenu],
  templateUrl: './chapter-showcase.html',
  styleUrl: './chapter-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterShowcase {
  readonly id = input.required<string>();

  private courseService = inject(CourseService);

  readonly chapter = toSignal(
    toObservable(this.id).pipe(
      switchMap(id => this.courseService.getChapter(id))
    )
  );
}