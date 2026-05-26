import { Component, signal, computed, ChangeDetectionStrategy, effect, untracked, input, output, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, firstValueFrom } from 'rxjs';
import { Api } from '@shared/services/api/api';
import { Node } from '@shared/services/node/node';


export interface QuizItem {
  question: string;
  options: string[];
  multiple_answers?: boolean;
  instruction?: string;
  explanation?: string;
  answers?: boolean[];
}

export interface ItemResponse {
  id: number;
  name: string;
  content: string; // On a le JSON ici
  difficulty: number;
}

export type QuizResult = [boolean[], string][];

@Component({
  selector: 'app-quiz',
  imports: [MatCheckboxModule, MatRadioModule, MatIconModule, MatProgressBarModule, MatButtonModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-quiz-page'
  }
})



export class QuizComponent {
  quizId = input<string | number | undefined>(undefined);
  mode = input<'practice' | 'graded'>('graded');
  private route = inject(ActivatedRoute);
  private api = inject(Api);
  forceRestart = toSignal(
    this.route.queryParams.pipe(
      map(params => params['restart'] === 'true')
    ),
    { initialValue: false }
  );
  showCorrectionOnly = input<boolean>(false);
  previewData = input<string | null>(null);//for edit mode


  userAnswers = signal<boolean[][]>([]);
  quizSubmitted = signal(false);
  _internalRestart = signal(false);
  submitted = output<void>();

  private nodeService = inject(Node);
  quizResource = this.nodeService.getNode(() => this.previewData() ? undefined : this.quizId());

  attemptsResource = this.nodeService.getAttempts(() => {
    if (this.previewData() || this.mode() === 'practice') return undefined;
    return this.quizId();
  });


  QuizCorrection = computed<QuizResult>(() => {
    if (!this.quizSubmitted()) return [];
    const data = this.parsedQuizData();
    if (!data) return [];
    return data.map(q => [q.answers || [], q.explanation || '']);
  });

  isAlreadyFinished = computed(() => {
    if (this.mode() === 'practice') return false;
    const progress = this.quizResource.value()?.progress;
    const attempts = this.attemptsResource.value();
    const hasAttempts = attempts && attempts.length > 0;
    const isCompleted = progress?.status === 'CO' || hasAttempts;
    return !!isCompleted && !this.forceRestart() && !this._internalRestart();
  });

  score = computed(() => {
    if (this.mode() === 'practice') return null;
    const attempts = this.attemptsResource.value();
    if (!attempts || attempts.length === 0) return null;

    // Get latest attempt sorted by date descending
    const sorted = [...attempts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    if (!latest || !latest.attempt) return null;

    const userAnswers = latest.attempt.answer || [];
    const data = this.parsedQuizData();
    if (!data || data.length === 0) return null;

    // Calculate score
    let s = 0;
    const correctAnswers = data.map(q => q.answers || []);
    for (let i = 0; i < data.length; i++) {
      const uAns = userAnswers[i];
      const cAns = correctAnswers[i];
      if (uAns && cAns && JSON.stringify(uAns) === JSON.stringify(cAns)) {
        s++;
      }
    }
    return s;
  });

  maxScore = computed(() => {
    const data = this.parsedQuizData();
    return data ? data.length : null;
  });

  isRestart = computed(() => this.forceRestart() || this._internalRestart());

  // 1. On parse la donnée UNE SEULE FOIS de manière centralisée
  parsedQuizData = computed<QuizItem[] | null>(() => {
    let rawContent: any = null;
    const preview = this.previewData();

    if (preview) {
      try {
        rawContent = JSON.parse(preview);
      } catch (e) { return null; }
    } else {
      const resp = this.quizResource.value();
      if (!resp) return null;
      // On cherche le contenu soit dans .content, soit à la racine
      rawContent = resp.content ?? resp;
    }

    if (!rawContent) return null;

    // Si on a encore une string, on parse
    if (typeof rawContent === 'string') {
      try {
        rawContent = JSON.parse(rawContent);
      } catch (e) { return null; }
    }

    try {
      // Fonction helper pour extraire les items d'un objet donné de manière récursive (profondeur limitée)
      const extractItems = (obj: any, depth = 0): any[] | null => {
        if (depth > 3) return null;
        if (Array.isArray(obj)) return obj;
        if (!obj || typeof obj !== 'object') return null;

        // On check les propriétés classiques : .quiz, .content
        const keys = ['quiz', 'content'];
        for (const key of keys) {
          const val = obj[key];
          if (!val) continue;

          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val);
              const found = extractItems(parsed, depth + 1);
              if (found) return found;
            } catch (e) { }
          } else if (typeof val === 'object') {
            const found = extractItems(val, depth + 1);
            if (found) return found;
          }
        }
        return null;
      };

      const items = extractItems(rawContent);

      if (items === null) return null;
      if (items.length === 0) return [];

      return items.map(item => ({
        ...item,
        multiple_answers: item.multiple_answers ?? (item.answers ? item.answers.filter((a: any) => a).length > 1 : false)
      })) as QuizItem[];
    } catch (e) {
      console.error("Failed to parse quiz content", e);
      return null;
    }
  });

  //Permet de setup le userAnswers
  constructor() {
    // 2. Effect unifié : init userAnswers + restauration si déjà fait
    effect(() => {
      const data = this.parsedQuizData();
      if (!data) return;

      const fRestart = this.isRestart();
      const fValidated = this.showCorrectionOnly();
      const attempts = this.attemptsResource.value(); // Track attempts resource

      untracked(() => {
        // Cas 0: Mode edit forcé — on pré-coche les bonnes réponses
        if (fValidated) {
          this.quizSubmitted.set(true);
          const correctAnswersList = data.map((q: QuizItem) => q.answers || new Array(q.options.length).fill(false));
          this.userAnswers.set(correctAnswersList);
          return;
        }

        // Cas 1: Restauration — l'utilisateur a déjà fait le quiz ET on ne force pas le restart
        const isFinished = this.isAlreadyFinished();
        if (isFinished && !fRestart) {
          this.quizSubmitted.set(true);
          const latest = attempts && attempts.length > 0
            ? [...attempts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;
          const submission = latest?.attempt?.answer;
          if (submission && Array.isArray(submission) && submission.length === data.length) {
            this.userAnswers.set(submission);
          } else {
            // Fallback si pas de submission ou taille incohérente
            const initialState = data.map((q: QuizItem) => new Array(q.options.length).fill(false));
            this.userAnswers.set(initialState);
          }
          return;
        }

        // Cas 2: Initialisation classique ou RESTART
        // On effectue le reset si on est en mode restart OU si on n'a pas encore de réponses
        if (fRestart || this.userAnswers().length !== data.length) {
          this.quizSubmitted.set(false);
          const initialState = data.map((q: QuizItem) => new Array(q.options.length).fill(false));
          this.userAnswers.set(initialState);
        }
      });
    });

  }


  // 3. FormState ne fait plus que lire les données déjà parsées !
  formState = computed(() => {
    const data = this.parsedQuizData();
    if (!data || data.length === 0) return null;
    // On s'assure que userAnswers est synchro avant d'afficher
    if (this.userAnswers().length !== data.length) return null;
    return data;
  });


  // 4. Helper pour afficher "Réponse : 1), 2)"
  getCorrectAnswersText(correction: boolean[] | undefined): string {
    if (!correction) return '';
    const indices = correction.map((isCorrect, i) => isCorrect ? (i + 1).toString() : null).filter(val => val !== null);
    if (indices.length === 0) return 'Aucune bonne réponse';
    return `Réponse : ${indices.join('), ')}${indices.length > 0 ? ')' : ''}`;
  }

  async submit() {
    if (this.mode() === 'practice') {
      this.quizSubmitted.set(true);
      this.submitted.emit();
      return;
    }

    const id = this.quizId();
    if (!id || this.previewData() || this.showCorrectionOnly()) return;

    try {
      const node = this.quizResource.value();
      const modified_at = node?.modified_at || '';
      const answer = this.userAnswers();

      await this.nodeService.submitAnswer(id, answer, modified_at);

      this.quizSubmitted.set(true);
      this._internalRestart.set(false);

      if (this.mode() === 'graded') {
        try {
          await this.nodeService.updateProgress(id, 'completed');
        } catch (err) {
          console.error("Failed to update progress status:", err);
        }
      }

      this.quizResource.reload();
      this.attemptsResource.reload();
      this.submitted.emit();
    } catch (error) {
      console.error("Quiz submission failed:", error);
    }
  }

  doRestart() {
    this._internalRestart.set(true);
    this.quizSubmitted.set(false);
  }


  // 5. Logique de mise à jour (Action utilisateur)
  updateAnswer(qIdx: number, oIdx: number, isMultiple: boolean) {
    if (this.quizSubmitted()) return;

    this.userAnswers.update((allAnswers: boolean[][]) => {
      const newAnswers = [...allAnswers.map((a: boolean[]) => [...a])];

      if (isMultiple) {
        newAnswers[qIdx][oIdx] = !newAnswers[qIdx][oIdx];
      } else {
        // Mode Radio : on décoche tout pour cette question, puis on coche l'index
        newAnswers[qIdx] = new Array(newAnswers[qIdx].length).fill(false);
        newAnswers[qIdx][oIdx] = true;
      }
      return newAnswers;
    });
  }
}