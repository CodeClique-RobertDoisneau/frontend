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

  constructor() {
    effect(() => {
      // Auto-scroll when history changes
      const history = this.tab().replHistory();
      if (history) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  handleExecute() {
    const cmd = this.replCommand().trim();
    if (cmd) {
      this.execute.emit(cmd);
      this.replCommand.set('');
    }
  }

  private scrollToBottom() {
    if (this.replScrollContainer) {
      const el = this.replScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
