import { Component, inject, signal, computed, ChangeDetectionStrategy, effect, untracked, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpResourceRequest } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';


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
  imports: [MatCheckboxModule, MatRadioModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-quiz-page'
  }
})



export class QuizComponent {
  quizId = input<string | number | undefined>(undefined);
  // Bascule: `true` pour utiliser le système actuel en attendant le backend, `false` pour la nouvelle API
  useMockApi = false;

  quizResource = httpResource<any>(() => {
    const id = this.quizId();
    if (!id) return undefined;

    return { 
      url: `/api/nodes/${id}/`,
      method: 'GET'
    } as HttpResourceRequest;
  });

  userAnswers = signal<boolean[][]>([]);
  quizSubmitted = signal(false);
  QuizCorrection = signal<QuizResult>([]);
  score = signal<number | null>(null);
  maxScore = signal<number | null>(null);

  // 1. On parse la donnée UNE SEULE FOIS de manière centralisée
  parsedQuizData = computed(() => {
    const resp = this.quizResource.value();
    if (!resp?.content) return null;

    try {
      const rawContent: any = resp.content || resp;
      let items: QuizItem[] = [];

      // Nouvelle structure: le tableau de questions est dans .quiz
      if (rawContent.quiz && Array.isArray(rawContent.quiz)) {
        items = rawContent.quiz;
      } else {
        // Fallback: si rawContent lui même est un tableau ou .data est un tableau
        const contentData = rawContent.data !== undefined ? rawContent.data : rawContent;
        if (typeof contentData === 'string') {
          items = JSON.parse(contentData) as QuizItem[];
        } else if (Array.isArray(contentData)) {
          items = contentData as QuizItem[];
        }
      }

      if (!items || !Array.isArray(items)) return null;

      // Si le backend oublie multiple_answers, on le déduit
      return items.map(item => ({
        ...item,
        multiple_answers: item.multiple_answers ?? (item.answers ? item.answers.filter(a => a).length > 1 : false)
      }));
    } catch (e) {
      console.error("Failed to parse quizResource content", e);
      return null;
    }
  });

  //Permet de setup le userAnswers
  constructor() {
    // 2. L'effect écoute le signal computed (très propre)
    effect(() => {
      const data = this.parsedQuizData();
      if (data) {
        untracked(() => {
          if (this.userAnswers().length === 0) {
            const initialState = data.map((q: QuizItem) => new Array(q.options.length).fill(false));
            this.userAnswers.set(initialState);
          }
        });
      }
    });

    // Pour les corrections (après clic sur valider)
    effect(() => {
      const resp = this.submitResource.value();
      if (resp?.content) {
        try {
          const rawContent: any = resp.content;
          let items: QuizItem[] = [];

          // On utilise la même logique que parsedQuizData pour trouver les questions
          if (rawContent.quiz && Array.isArray(rawContent.quiz)) {
            items = rawContent.quiz;
          } else {
            const contentData = rawContent.data !== undefined ? rawContent.data : rawContent;
            if (Array.isArray(contentData)) {
              items = contentData;
            } else if (typeof contentData === 'string' && contentData.trim().startsWith('[')) {
              items = JSON.parse(contentData);
            }
          }

          if (items.length > 0) {
            const correctionData: QuizResult = items.map(q => [q.answers || [], q.explanation || '']);
            this.QuizCorrection.set(correctionData);
          }

          // On récupère aussi le score renvoyé par le back
          if (resp.score !== undefined) {
             this.score.set(resp.score);
             this.maxScore.set(resp.max_score);
          }
        } catch (e) {
          console.error("Erreur de parsing de la correction :", e);
        }
      }
    });

    // Restaurer l'état si déjà terminé (chargement initial)
    effect(() => {
      const resp = this.quizResource.value();
      if (resp?.user_progress?.done) {
        untracked(() => {
          this.quizSubmitted.set(true);
          if (resp.user_progress.submission) {
            this.userAnswers.set(resp.user_progress.submission);
          }
          if (resp.user_progress.score !== undefined) {
            this.score.set(resp.user_progress.score);
            this.maxScore.set(resp.user_progress.max_score);
          }
          
          // Re-generer la correction depuis les données déjà présentes (car done=true -> non filtré)
          const data = this.parsedQuizData();
          if (data && data.some(q => q.answers)) {
            const correctionData: QuizResult = data.map(q => [q.answers || [], q.explanation || '']);
            this.QuizCorrection.set(correctionData);
          }
        });
      }
    });
  }


  // 3. FormState ne fait plus que lire les données déjà parsées !
  formState = computed(() => {
    const data = this.parsedQuizData();
    if (!data) return null;
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

  // Elle s'active automatiquement quand quizSubmitted passe à true
  submitResource = httpResource<any>(() => {
    if (!this.quizSubmitted()) return undefined;
    const id = this.quizId();
    if (!id) return undefined;

    return {
      url: `/api/nodes/${id}/verif/`,
      method: 'POST',
      body: { submission: this.userAnswers() }
    } as HttpResourceRequest;
  });


  // 5. Logique de mise à jour (Action utilisateur)
  updateAnswer(qIdx: number, oIdx: number, isMultiple: boolean) {
    if (this.quizSubmitted()) return;

    this.userAnswers.update((allAnswers: boolean[][]) => {
      const newAnswers = [...allAnswers.map((a: boolean[]) => [...a])];

      if (isMultiple) {
        newAnswers[qIdx][oIdx] = !newAnswers[qIdx][oIdx];
      } else {
        // Mode Radio : on décoche tout pour cette question, puis on coche l'index
        newAnswers[qIdx] = newAnswers[qIdx].fill(false);
        newAnswers[qIdx][oIdx] = true;
      }
      return newAnswers;
    });
  }
}