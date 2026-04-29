import { Component, input, inject, signal, computed, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { ExecutionContext } from '@shared/services/pyodide/pyodide.types';
import { TabHandler } from '../../services/tab-handler';
import { Editor } from '../editor/editor';
import { Repl } from '../repl/repl';
import { TabBar } from '../tab-bar/tab-bar';

@Component({
  selector: 'app-ide-tab-view',
  standalone: true,
  imports: [CommonModule, Editor, Repl, TabBar],
  templateUrl: './ide-tab-view.html',
  styleUrl: './ide-tab-view.scss',
  providers: [Pyodide]
})
export class IdeTabView implements OnInit {
  tab = input.required<TabHandler>();
  consoleWidth = input<number>(450);
  isConsoleVisible = input<boolean>(true);
  
  startResizing = output<MouseEvent>();
  toggleConsole = output<void>();
  
  pyodide = inject(Pyodide);

  private currentContext = signal<ExecutionContext | null>(null);
  isRunning = computed(() => this.currentContext()?.isRunning() ?? false);

  ngOnInit() {
    const initialPkgs = this.tab().packages
      .filter(p => p.loaded)
      .map(p => p.name);
    this.pyodide.init(initialPkgs);
  }

  onResize(event: MouseEvent) {
    this.startResizing.emit(event);
  }

  onToggleConsole() {
    this.toggleConsole.emit();
  }

  run(customCode?: string) {
    if (!this.pyodide.isReady() || this.isRunning()) return;

    this.tab().plot.set('');
    const codeToRun = customCode || this.tab().code();

    const context = this.pyodide.run(codeToRun);
    this.currentContext.set(context);

    context
      .onOutput(out => this.addToRepl('output', out))
      .onError(err => this.addToRepl('error', err))
      .onPlot(base64 => this.tab().plot.set(base64))
      .onStdinRequest(() => this.tab().waitingForInput.set(true));
  }

  stop() {
    this.currentContext()?.interrupt();
    this.tab().waitingForInput.set(false);
  }

  sendInput(text: string) {
    this.currentContext()?.provideInput(text);
  }

  reset() {
    this.pyodide.reset();
    this.tab().replHistory.set([]);
    this.tab().plot.set('');
    this.tab().waitingForInput.set(false);
    this.tab().userInput.set('');
    this.currentContext.set(null);
  }

  loadPackage(pkgName: string) {
    const pkg = this.tab().packages.find(p => p.name === pkgName);
    if (pkg && !pkg.loaded) {
      this.pyodide.loadPackages([pkgName]);
      pkg.loaded = true;
    }
  }

  private addToRepl(type: 'input' | 'output' | 'error', content: string) {
    if (!content) return;
    this.tab().replHistory.update(prev => [...prev, { type, content }]);
  }
}
