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
  activeTabHandler = this.workspace.activeTabHandler;


  @ViewChild('replScrollContainer') private replScrollContainer!: ElementRef;
  @ViewChild('waitingInput') private waitingInput!: ElementRef<HTMLInputElement>;
  @ViewChild('replInput') private replInput!: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      const tabHandler = this.activeTabHandler();
      if (!tabHandler) return;

      // Auto-scroll when history changes
      const history = tabHandler.replHistory();
      if (history) {
        setTimeout(() => this.scrollToBottom(), 50);
      }

      // Focus handling based on state
      this.focus();
    });
  }

  focus() {
    setTimeout(() => {
      const tabHandler = this.activeTabHandler();
      if (!tabHandler) return;

      if (tabHandler.waitingForInput()) {
        this.waitingInput?.nativeElement.focus();
      } else {
        this.replInput?.nativeElement.focus();
      }
    }, 50);
  }

  handleExecute() {
    const tabHandler = this.activeTabHandler();
    if (!tabHandler) return;
    
    const cmd = tabHandler.replCommand().trim();
    if (cmd) {
      this.workspace.addToRepl(tabHandler, 'input', cmd);
      tabHandler.run((type, content) => this.workspace.addToRepl(tabHandler, type, content), cmd);
      tabHandler.replCommand.set('');
      // Refocus after execution
      this.focus();
    }
  }

  submitInput() {
    const tabHandler = this.activeTabHandler();
    if (tabHandler && tabHandler.waitingForInput()) {
      const input = tabHandler.userInput();
      this.workspace.addToRepl(tabHandler, 'output', input + '\n');
      tabHandler.runtime.sendInput(input);
      tabHandler.waitingForInput.set(false);
      tabHandler.userInput.set('');
    }
  }

  clearConsole() {
    this.activeTabHandler()?.replHistory.set([]);
  }

  private scrollToBottom() {
    if (this.replScrollContainer) {
      const el = this.replScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
