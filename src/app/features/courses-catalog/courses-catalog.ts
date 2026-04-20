import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorizontalSlider } from '@shared/components/horizontal-slider/horizontal-slider';
import { SyllabusService, ClassGroupInfo } from '@shared/services/syllabus.service';
import { NodeInfo } from '@shared/services/node.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { forkJoin, of } from 'rxjs';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';
import { AuthService } from '@shared/services/auth.service';

const SUBJECT_LABELS: Record<string, string> = {

  'MA': 'Maths',
  'PH': 'Physique',
  'NS': 'NSI',
};

const GRADE_LABELS: Record<string, string> = {
  'SE': 'Seconde',
  'PR': 'Première',
  'TE': 'Terminale',
};

// Mapping groupId → liste d'IDs syllabus
interface GroupSyllabi {
  groupId: number;
  syllabusIds: number[];
}

@Component({
  selector: 'app-courses-catalog',
  imports: [HorizontalSlider, MatChipsModule, MatIconModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './courses-catalog.html',
  styleUrl: './courses-catalog.scss',
})
export class CoursesCatalog implements OnInit {
  private syllabusService = inject(SyllabusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(AuthService);


  // Données
  allSyllabi = signal<NodeInfo[]>([]);
  classGroups = signal<ClassGroupInfo[]>([]);
  groupSyllabiMap = signal<GroupSyllabi[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Filtres actifs
  activeSubject = signal<string | null>(null);
  activeGrade = signal<string | null>(null);
  activeGroupId = signal<number | null>(null);

  // Options de filtres
  subjects = Object.entries(SUBJECT_LABELS);
  grades = Object.entries(GRADE_LABELS);

  // Syllabi filtrés
  filteredSyllabiIds = computed(() => {
    let syllabi = this.allSyllabi();
    const subject = this.activeSubject();
    const grade = this.activeGrade();
    const groupId = this.activeGroupId();

    // Filtre par class group
    if (groupId) {
      const mapping = this.groupSyllabiMap().find(m => m.groupId === groupId);
      if (mapping) {
        const allowedIds = new Set(mapping.syllabusIds);
        syllabi = syllabi.filter(s => allowedIds.has(Number(s.id)));
      } else {
        syllabi = [];
      }
    }

    if (subject) {
      syllabi = syllabi.filter(s => s.subject === subject);
    }
    if (grade) {
      syllabi = syllabi.filter(s => s.grade_level === grade);
    }
    return syllabi.map(s => s.id);
  });

  getSubjectLabel(code: string): string {
    return SUBJECT_LABELS[code] || code;
  }

  getGradeLabel(code: string): string {
    return GRADE_LABELS[code] || code;
  }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([]);

    this.route.queryParams.subscribe(params => {
      this.activeSubject.set(params['subject'] || null);
      this.activeGrade.set(params['grade'] || null);
      this.activeGroupId.set(params['group'] ? Number(params['group']) : null);
    });

    this.authService.getMe().subscribe({
      next: (user: any) => {
        const userId = user.id;

        this.syllabusService.getUserClassGroups(userId).subscribe({
          next: (groups: ClassGroupInfo[]) => {
            this.classGroups.set(groups);

            const mappings: GroupSyllabi[] = [];
            const allSyllabusIds = new Set<number>();

            for (const group of groups) {
              const ids = (group.syllabus || []).map((url: any) => this.syllabusService.extractIdPublic(url));
              mappings.push({ groupId: group.id, syllabusIds: ids });
              ids.forEach((id: number) => allSyllabusIds.add(id));
            }
            this.groupSyllabiMap.set(mappings);

            if (allSyllabusIds.size === 0) {
              this.allSyllabi.set([]);
              this.isLoading.set(false);
              return;
            }

            this.syllabusService.getUserSyllabi(userId).subscribe({
              next: (nodes: NodeInfo[]) => {
                this.allSyllabi.set(nodes);
                this.isLoading.set(false);
              },
              error: (err: any) => {
                if (err.status === 403) {
                  this.error.set("Vous n'êtes pas autorisé à accéder à cette page.");
                } else {
                  this.error.set('Impossible de charger les cours.');
                }
                this.isLoading.set(false);
              }
            });
          },
          error: (err: any) => {
            if (err.status === 403) {
              this.error.set("Vous n'êtes pas autorisé à accéder à cette page.");
            } else {
              this.error.set('Impossible de charger les groupes.');
            }
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.error.set("Veuillez vous connecter pour voir vos cours.");
        this.isLoading.set(false);
      }
    });
  }

  toggleSubject(code: string) {
    const newVal = this.activeSubject() === code ? null : code;
    this.updateQueryParams({ subject: newVal });
  }

  toggleGrade(code: string) {
    const newVal = this.activeGrade() === code ? null : code;
    this.updateQueryParams({ grade: newVal });
  }

  onGroupChange(groupId: number | null) {
    this.updateQueryParams({ group: groupId ? String(groupId) : null });
  }

  clearFilters() {
    this.updateQueryParams({ subject: null, grade: null, group: null });
  }

  hasActiveFilters(): boolean {
    return !!(this.activeSubject() || this.activeGrade() || this.activeGroupId());
  }

  private updateQueryParams(params: Record<string, string | null>) {
    const current = { ...this.route.snapshot.queryParams };
    Object.assign(current, params);
    for (const key of Object.keys(current)) {
      if (current[key] === null || current[key] === undefined) delete current[key];
    }
    this.router.navigate([], { queryParams: current });
  }
}
