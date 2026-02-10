import { Component } from '@angular/core';
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

  quiz_mode = true;

  items = [
    {
      question: "Quel est le résultat de l’expression suivante en Python ?",
      options: [
        "print(a)",
        "print('a')",
        "print(aa)",
      ],
      multriple_answers: false
    },
    {
      question: "Quel est le résultat de l’expression suivante en Python ?",
      options: [
        "a=a+1",
        "a+=1"
      ],
      multiple_answers: true
    }

  ]

  user_answer: boolean[][] = [];
  result_verification: string[][] = [];

  real_answer = [
    [true, false, false],
    [true, true]
  ]

  ngOnInit() {
    this.user_answer = this.items.map(item => new Array(item.options.length).fill(false));
  }

  check_quiz() {
    this.quiz_mode = false;
    this.result_verification = [];

    for (let i = 0; i < this.user_answer.length; i++) {
      const row = [];
      for (let j = 0; j < this.user_answer[i].length; j++) {
        if (this.user_answer[i][j] !== this.real_answer[i][j]) {
          row.push('❌');
        } else {
          row.push('✅');
        }
      }
      this.result_verification.push(row);
    }
  }

}
