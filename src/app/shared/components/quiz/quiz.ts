import { Component, inject, signal, computed, ChangeDetectionStrategy, effect, untracked } from '@angular/core';
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
  multiple_answers: boolean;
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
  quizResource = httpResource<ItemResponse>(() => `http://localhost/api/item/7/`);

  userAnswers = signal<boolean[][]>([]);
  quizSubmitted = signal(false);
  QuizCorrection = signal<QuizResult>([]);

  //Permet de setup le userAnswers
  constructor() {
    //Pour les reposes du user
    effect(() => {
      const resp = this.quizResource.value();
      if (resp?.content) {
        try {
          const data = JSON.parse(resp.content) as QuizItem[];
          untracked(() => {
            if (this.userAnswers().length === 0) {
              const initialState = data.map((q: QuizItem) => new Array(q.options.length).fill(false));
              this.userAnswers.set(initialState);
            }
          });
        } catch (e) {
          console.error("Failed to parse quiz content (user answers)", e);
        }
      }
    });

    //Pour les corrections
    effect(() => {
      const resp = this.submitResource.value();
      console.log("Tentative de correction, ressource:", resp);
      if (resp?.content) {
        try {
          const data = JSON.parse(resp.content) as QuizResult;
          console.log("Données de correction parsées :", data);
          this.QuizCorrection.set(data);
        } catch (e) {
          console.error("Erreur de parsing de la correction :", e);
        }
      }
    });
  }

  //Permet d'afficher les quiz de quizResource une fois reçut
  formState = computed(() => {
    const resp = this.quizResource.value();
    if (!resp?.content) return null;

    try {
      const data = JSON.parse(resp.content) as QuizItem[];
      if (this.userAnswers().length !== data.length) return null;
      return data;
    } catch (e) {
      return null;
    }
  });


  // Elle s'active automatiquement quand quizSubmitted passe à true
  submitResource = httpResource<ItemResponse>(() => {
    if (!this.quizSubmitted()) return undefined;
    console.log("ON A ENVOYÉ")
    return {
      //url: `http://localhost/api/postStudentQuiz`,
      url: `http://localhost/api/item/6/`,
      //method: 'POST',
      method: 'GET',
      //body: { answers: this.userAnswers() }
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