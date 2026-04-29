import { Component, effect, ElementRef, viewChild, inject, afterNextRender } from '@angular/core';
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

  private replScrollContainer = viewChild<ElementRef>('replScrollContainer');
  private waitingInput = viewChild<ElementRef<HTMLInputElement>>('waitingInput');
  private replInput = viewChild<ElementRef<HTMLInputElement>>('replInput');

  constructor() {
    effect(() => {
      const tabHandler = this.activeTabHandler();
      if (!tabHandler) return;

      // Auto-scroll when history changes
      tabHandler.replHistory();
      
      // Focus handling based on state
      tabHandler.waitingForInput();

      afterNextRender(() => {
        this.scrollToBottom();
        this.focus();
      });
    });
  }

  focus() {
    const tabHandler = this.activeTabHandler();
    if (!tabHandler) return;

    if (tabHandler.waitingForInput()) {
      this.waitingInput()?.nativeElement.focus();
    } else {
      this.replInput()?.nativeElement.focus();
    }
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
    const container = this.replScrollContainer();
    if (container) {
      const el = container.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
