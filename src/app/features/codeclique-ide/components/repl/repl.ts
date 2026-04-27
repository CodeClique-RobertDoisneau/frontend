import { Component, signal, effect, ElementRef, ViewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkspaceService } from '../../services/workspace';

@Component({
  selector: 'app-repl',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './repl.html',
  styleUrl: './repl.scss'
})
export class Repl {
  workspace = inject(WorkspaceService);
  activeContext = this.workspace.activeContext;


  @ViewChild('replScrollContainer') private replScrollContainer!: ElementRef;
  @ViewChild('waitingInput') private waitingInput!: ElementRef<HTMLInputElement>;
  @ViewChild('replInput') private replInput!: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      const context = this.activeContext();
      if (!context) return;

      // Auto-scroll when history changes
      const history = context.replHistory();
      if (history) {
        setTimeout(() => this.scrollToBottom(), 50);
      }

      // Focus handling
      if (context.waitingForInput()) {
        setTimeout(() => this.waitingInput?.nativeElement.focus(), 50);
      } else {
        this.focus();
      }
    });
  }

  focus() {
    setTimeout(() => {
      const context = this.activeContext();
      if (!context) return;

      if (context.waitingForInput()) {
        this.waitingInput?.nativeElement.focus();
      } else {
        this.replInput?.nativeElement.focus();
      }
    }, 50);
  }

  handleExecute() {
    const context = this.activeContext();
    if (!context) return;
    
    const cmd = context.replCommand().trim();
    if (cmd) {
      this.workspace.addToRepl(context, 'input', cmd);
      context.run((type, content) => this.workspace.addToRepl(context, type, content), cmd);
      context.replCommand.set('');
      // Refocus after execution
      setTimeout(() => this.replInput?.nativeElement.focus(), 50);
    }
  }

  submitInput() {
    const context = this.activeContext();
    if (context && context.waitingForInput()) {
      const input = context.userInput();
      this.workspace.addToRepl(context, 'output', input + '\n');
      context.runtime.sendInput(input);
      context.waitingForInput.set(false);
      context.userInput.set('');
    }
  }

  clearConsole() {
    this.activeContext()?.replHistory.set([]);
  }

  private scrollToBottom() {
    if (this.replScrollContainer) {
      const el = this.replScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
