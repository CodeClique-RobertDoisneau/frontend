import { Component, effect, ElementRef, viewChild, inject, afterNextRender, input, forwardRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkspaceService } from '../../services/workspace';
import { TabHandler } from '../../services/tab-handler';
import { IdeTabView } from '../ide-tab-view/ide-tab-view';

@Component({
  selector: 'app-repl',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './repl.html',
  styleUrl: './repl.scss'
})
export class Repl {
  tab = input.required<TabHandler>();
  public tabView = inject(forwardRef(() => IdeTabView));
  workspace = inject(WorkspaceService);
  private injector = inject(Injector);

  private replScrollContainer = viewChild<ElementRef>('replScrollContainer');
  private waitingInput = viewChild<ElementRef<HTMLInputElement>>('waitingInput');
  private replInput = viewChild<ElementRef<HTMLInputElement>>('replInput');

  constructor() {
    effect(() => {
      // Trigger effect on history or state changes
      this.tab().replHistory();
      this.tab().waitingForInput();

      // Schedule DOM operations for after the next render cycle
      // We pass the injector explicitly to satisfy the injection context requirement
      afterNextRender(() => {
        this.scrollToBottom();
        this.focus();
      }, { injector: this.injector });
    });
  }

  focus() {
    if (this.tab().waitingForInput()) {
      this.waitingInput()?.nativeElement.focus();
    } else {
      this.replInput()?.nativeElement.focus();
    }
  }

  handleExecute() {
    const cmd = this.tab().replCommand().trim();
    if (cmd) {
      this.workspace.addToRepl(this.tab(), 'input', cmd);
      this.tabView.run(cmd);
      this.tab().replCommand.set('');
      this.focus();
    }
  }

  submitInput() {
    if (this.tab().waitingForInput()) {
      const input = this.tab().userInput();
      this.workspace.addToRepl(this.tab(), 'output', input + '\n');
      this.tabView.sendInput(input);
      this.tab().waitingForInput.set(false);
      this.tab().userInput.set('');
    }
  }

  clearConsole() {
    this.tab().replHistory.set([]);
  }

  private scrollToBottom() {
    const container = this.replScrollContainer();
    if (container) {
      const el = container.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
