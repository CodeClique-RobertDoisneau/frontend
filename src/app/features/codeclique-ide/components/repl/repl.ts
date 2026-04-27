import { Component, input, output, signal, effect, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IdeTab } from '../../codeclique-ide.types';
import { IdeTabs } from '../../services/ide-tabs';

@Component({
  selector: 'app-repl',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './repl.html',
  styleUrl: './repl.scss'
})
export class IdeReplComponent {
  tab = input.required<IdeTab>();
  execute = output<string>();

  replCommand = signal('');
  private ideService = inject(IdeTabs);
  @ViewChild('replScrollContainer') private replScrollContainer!: ElementRef;
  @ViewChild('waitingInput') private waitingInput!: ElementRef<HTMLInputElement>;
  @ViewChild('replInput') private replInput!: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      // Auto-scroll when history changes
      const history = this.tab().replHistory();
      if (history) {
        setTimeout(() => this.scrollToBottom(), 50);
      }

      // Focus waiting input if it appears
      if (this.tab().waitingForInput()) {
        setTimeout(() => this.waitingInput?.nativeElement.focus(), 50);
      } else {
        // Focus main input otherwise
        this.focus();
      }
    });
  }

  focus() {
    setTimeout(() => {
      if (this.tab().waitingForInput()) {
        this.waitingInput?.nativeElement.focus();
      } else {
        this.replInput?.nativeElement.focus();
      }
    }, 50);
  }

  handleExecute() {
    const cmd = this.replCommand().trim();
    if (cmd) {
      this.execute.emit(cmd);
      this.replCommand.set('');
      // Refocus after execution
      setTimeout(() => this.replInput?.nativeElement.focus(), 50);
    }
  }

  submitInput() {
    const tab = this.tab();
    if (tab && tab.executionId && tab.waitingForInput()) {
      const input = tab.userInput();
      this.ideService.addToRepl(tab, 'output', input + '\n');
      tab.pyodide.sendInput(tab.executionId, input);
      tab.waitingForInput.set(false);
      tab.userInput.set('');
    }
  }

  private scrollToBottom() {
    if (this.replScrollContainer) {
      const el = this.replScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
