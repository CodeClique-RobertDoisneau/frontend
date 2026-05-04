import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';
import { Theming } from '@shared/services/theming/theming';
import { TabHandler } from '../../services/tab-handler';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CodeEditor
  ],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor {
  tab = input.required<TabHandler>();
  theming = inject(Theming);
  languages = languages;
}
