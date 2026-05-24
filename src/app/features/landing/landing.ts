import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Theming } from '@shared/services/theming/theming';
import { CodeBlock } from '@shared/components/code-block/code-block';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { QuizComponent } from '../course/components/quiz/quiz';
import { VideoBlock } from '@shared/components/video-block/video-block';

@Component({
  selector: 'app-landing',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink, CodeBlock, QuizComponent, VideoBlock],
  providers: [Pyodide],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit {
  theming = inject(Theming);
  pyodide = inject(Pyodide);

  quizData = JSON.stringify([
    {
      question: "Quelle est la syntaxe correcte pour une boucle en Python ?",
      options: [
        "for (int i=0; i<5; i++)",
        "for i in range(5):",
        "foreach i in range(5)"
      ],
      answers: [false, true, false],
      explanation: "En Python, on utilise la structure 'for i in range(N):' terminée par les deux points ':'."
    }
  ]);

  ngOnInit() {
    this.pyodide.init();
  }
}
