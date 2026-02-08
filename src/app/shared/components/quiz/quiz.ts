import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-quiz',
  imports: [MatCheckboxModule, MatRadioModule, MatIconModule, MatButtonModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz {
  http = inject(HttpClient);
  cdr = inject(ChangeDetectorRef);


  //Initialisation of variables
  quiz_mode: string = "loading";
  items: any[] = [];
  user_answer: boolean[][] = [];
  real_answer: boolean[][] = [];
  result_verification: string[][] = [];


  //API
  fetchQuestions() {
    this.http.get<any[]>('http://localhost/api/getquiz').subscribe({
      next: (data) => {
        this.items = data;
        this.user_answer = this.items.map(item => new Array(item.options.length).fill(false));
        this.quiz_mode = "answering";
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching quiz data:', err);
      }
    });
  }

  giveAndFetchAnswers() {
    this.http.post<any>('http://localhost/api/postStudentQuiz', this.user_answer).subscribe({
      next: (data) => {
        this.real_answer = data.real_answer;
        this.quiz_mode = "correction";
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching quiz data:', err);
      }
    });
  }


  //A l'initialisation
  ngOnInit() {
    this.fetchQuestions();
  }

  //Quand on verifie le quiz
  check_quiz() {
    this.giveAndFetchAnswers();
  }

  update_user_answer(questionIndex: number, optionIndex: number) {
    const isMultiple = this.items[questionIndex].multiple_answers === true;

    if (isMultiple) {
      this.user_answer[questionIndex][optionIndex] = !this.user_answer[questionIndex][optionIndex];
    } else {
      this.user_answer[questionIndex].fill(false);
      this.user_answer[questionIndex][optionIndex] = true;
    }
    this.cdr.markForCheck();
  }

}
