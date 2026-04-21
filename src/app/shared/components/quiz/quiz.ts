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
  forceRestart = input<boolean>(false);
  previewData = input<string | null>(null);
  forceValidated = input<boolean>(false);
  // Bascule: `true` pour utiliser le système actuel en attendant le backend, `false` pour la nouvelle API
  useMockApi = false;

  quizResource = httpResource<any>(() => {
    if (this.previewData()) return undefined; // Pas besoin d'appeler l'API si previewData est là
    const id = this.quizId();
    if (!id) return undefined;

    return { 
      url: `/api/nodes/${id}/`,
      method: 'GET'
    } as HttpResourceRequest;
  });

  userAnswers = signal<boolean[][]>([]);
  quizSubmitted = signal(false);
  userDidSubmit = signal(false);
  QuizCorrection = computed<QuizResult>(() => {
    if (!this.quizSubmitted()) return [];
    const data = this.parsedQuizData();
    if (!data) return [];
    return data.map(q => [q.answers || [], q.explanation || '']);
  });

  score = computed<number | null>(() => {
     const resp = this.quizResource.value();
     if (resp?.user_progress?.done && !this.forceRestart() && resp.user_progress.score !== undefined) {
         return resp.user_progress.score;
     }

     if (!this.quizSubmitted()) return null;
     const correction = this.QuizCorrection();
     if (!correction || correction.length === 0) return null;
     
     let currentScore = 0;
     for (let i = 0; i < correction.length; i++) {
        const userA = this.userAnswers()[i] || [];
        const trueA = correction[i][0] || [];
        for (let j = 0; j < trueA.length; j++) {
            if (userA[j] === trueA[j]) currentScore++;
        }
     }
     return currentScore;
  });

  maxScore = computed<number | null>(() => {
     const resp = this.quizResource.value();
     if (resp?.user_progress?.done && !this.forceRestart() && resp.user_progress.max_score !== undefined) {
         return resp.user_progress.max_score;
     }

     if (!this.quizSubmitted()) return null;
     const correction = this.QuizCorrection();
     if (!correction || correction.length === 0) return null;
     
     let currentMax = 0;
     for (let i = 0; i < correction.length; i++) {
        const trueA = correction[i][0] || [];
        currentMax += trueA.length;
     }
     return currentMax;
  });

  // 1. On parse la donnée UNE SEULE FOIS de manière centralisée
  parsedQuizData = computed(() => {
    let rawContent: any = null;
    const preview = this.previewData();

    if (preview) {
      try {
        rawContent = JSON.parse(preview);
      } catch (e) {
        return null;
      }
    } else {
      const resp = this.quizResource.value();
      if (!resp?.content) return null;
      rawContent = resp.content || resp;
    }

    try {
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
    // 2. Effect unifié : init userAnswers + restauration si déjà fait
    effect(() => {
      const data = this.parsedQuizData();
      if (!data) return;

      untracked(() => {
        // Cas 0: Mode edit forcé — on pré-coche les bonnes réponses
        if (this.forceValidated()) {
          this.quizSubmitted.set(true);
          const correctAnswersList = data.map((q: QuizItem) => q.answers || new Array(q.options.length).fill(false));
          this.userAnswers.set(correctAnswersList);
          return;
        }

        // Cas 1: Restauration — l'utilisateur a déjà fait le quiz
        const resp = this.quizResource.value();
        if (resp?.user_progress?.done && !this.forceRestart()) {
          this.quizSubmitted.set(true);
          if (resp.user_progress.submission) {
            this.userAnswers.set(resp.user_progress.submission);
          } else {
            const initialState = data.map((q: QuizItem) => new Array(q.options.length).fill(false));
            this.userAnswers.set(initialState);
          }
          return;
        }

        // Cas 2: Initialisation classique (quiz pas encore fait ou restart)
        if (this.userAnswers().length === 0 || this.userAnswers().length !== data.length) {
          const initialState = data.map((q: QuizItem) => new Array(q.options.length).fill(false));
          this.userAnswers.set(initialState);
        }
      });
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

  // Elle s'active UNIQUEMENT quand l'utilisateur clique sur "Vérifier mes réponses"
  submitResource = httpResource<any>(() => {
    if (!this.userDidSubmit()) return undefined;
    if (this.previewData()) return undefined; // Pas de POST en mode éditeur
    if (this.forceValidated()) return undefined; // Pas de POST en mode forcé
    const id = this.quizId();
    if (!id) return undefined;
    
    const node = this.quizResource.value();
    const modified_at = node?.modified_at;

    return {
      url: `/api/nodes/${id}/answer/`,
      method: 'POST',
      body: { answer: this.userAnswers(), modified_at }
    } as HttpResourceRequest;
  });

  // Quand le submitResource renvoie une réponse, on met à jour le quizResource pour récupérer les answers
  submitEffect = effect(() => {
    const resp = this.submitResource.value();
    if (resp) {
      // Le POST a réussi : on recharge le quiz pour obtenir les answers (maintenant qu'un Attempt existe)
      this.quizResource.reload();
    }
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