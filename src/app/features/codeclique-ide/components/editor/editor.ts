import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';
import { basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { Theming } from '@shared/services/theming/theming';
import { WorkspaceService } from '../../services/workspace';

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
  workspace = inject(WorkspaceService);
  theming = inject(Theming);
  languages = languages;
  editorExtensions = [basicSetup, python()];

  onCodeChange(newCode: string) {
    const context = this.workspace.activeContext();
    if (context) {
      context.code.set(newCode);
    }
  }
}
