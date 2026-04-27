import { Component, inject, signal, OnInit, ElementRef, ViewChild, effect, OnDestroy, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragMove } from '@angular/cdk/drag-drop';
import { HostListener } from '@angular/core';

import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';

import { Pyodide } from '@shared/services/pyodide/pyodide';
import { Theming } from '@shared/services/theming/theming';

import { EXAMPLES, PythonExample } from './codeclique-ide-examples';
import { DocumentationDialog } from './components/documentation-dialog/documentation-dialog';
import { AboutDialog } from './components/about-dialog/about-dialog';
import { IdeTab, ReplLine } from './codeclique-ide.types';
import { IdeTabs } from './services/ide-tabs';

@Component({
  selector: 'app-codeclique-ide',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    DragDropModule,
    CodeEditor
  ],
  templateUrl: './codeclique-ide.html',
  styleUrl: './codeclique-ide.scss'
})
export class CodeCliqueIde implements OnInit, OnDestroy {
  theming = inject(Theming);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  ideService = inject(IdeTabs);

  @ViewChild('replScrollContainer') private replScrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('replInput') private replInput!: ElementRef<HTMLInputElement>;
  @ViewChild('waitingInput') private waitingInput!: ElementRef<HTMLInputElement>;

  languages = languages;

  tabs = this.ideService.tabs;
  activeTabIndex = this.ideService.activeTabIndex;
  activeTab = this.ideService.activeTab;

  @ViewChild('resizeHandle') resizeHandle!: ElementRef;
  @ViewChild('ideContainer') ideContainer!: ElementRef;

  replCommand = signal<string>('');
  examples = EXAMPLES;

  consoleWidth = signal<number>(450);
  isConsoleVisible = signal<boolean>(true);

  constructor() {
    effect(() => {
      const tab = this.activeTab();
      if (tab) {
        // Trigger scroll when history changes
        tab.replHistory();
        setTimeout(() => this.scrollToBottom(), 0);

        // Refocus waiting input if it appears
        if (tab.waitingForInput()) {
          setTimeout(() => this.waitingInput?.nativeElement.focus(), 50);
        }
      }
    });
  }

  ngOnInit() {
    // Initial tab is handled by the service constructor or here
    if (this.tabs().length === 0) {
      this.ideService.addNewTab();
    }
  }

  ngOnDestroy() {
    // We don't destroy the service if it's providedIn root, 
    // but we might want to clean up tabs if this component is the only consumer.
    // However, the user said "fragmented", so maybe root service is what they want.
  }

  onDragMoved(event: CdkDragMove) {
    if (!this.ideContainer) return;

    const container = this.ideContainer.nativeElement as HTMLElement;
    const rect = container.getBoundingClientRect();

    const newWidth = rect.right - event.pointerPosition.x;
    const min = rect.width * 0.25;
    const max = rect.width * 0.75;

    if (newWidth >= min && newWidth <= max) {
      this.consoleWidth.set(newWidth);
    }

    event.source._dragRef.reset();
  }

  toggleConsole() {
    this.isConsoleVisible.update(v => !v);
  }

  addNewTab(name?: string, code?: string, dependencies: string[] = []) {
    this.ideService.addNewTab(name, code, dependencies);
  }

  closeTab(index: number, event?: Event) {
    this.ideService.closeTab(index, event);
  }

  runCode() {
    const tab = this.activeTab();
    if (!tab || !tab.pyodide.isReady() || tab.isRunning()) return;

    tab.plot.set('');

    const { executionId } = tab.pyodide.run(
      tab.code(),
      (out) => this.ideService.addToRepl(tab, 'output', out),
      (err) => this.ideService.addToRepl(tab, 'error', err),
      (base64) => tab.plot.set(base64),
      () => tab.waitingForInput.set(true),
      tab.isRunning
    );

    tab.executionId = executionId;
  }

  stopExecution() {
    const tab = this.activeTab();
    if (tab && tab.executionId) {
      tab.pyodide.interruptExecution(tab.executionId);
      tab.waitingForInput.set(false);
    }
  }

  resetEnvironment() {
    this.ideService.resetEnvironment();
  }

  executeRepl() {
    const tab = this.activeTab();
    const cmd = this.replCommand().trim();
    if (!tab || !cmd || !tab.pyodide.isReady()) return;

    this.ideService.addToRepl(tab, 'input', cmd);
    this.replCommand.set('');

    tab.pyodide.run(
      cmd,
      (out) => this.ideService.addToRepl(tab, 'output', out),
      (err) => this.ideService.addToRepl(tab, 'error', err),
      (base64) => tab.plot.set(base64),
      () => tab.waitingForInput.set(true),
      tab.isRunning
    );
    
    // Refocus the REPL input
    setTimeout(() => this.replInput?.nativeElement.focus(), 0);
  }

  submitInput() {
    const tab = this.activeTab();
    if (tab && tab.executionId && tab.waitingForInput()) {
      const input = tab.userInput();
      this.ideService.addToRepl(tab, 'output', input + '\n');
      tab.pyodide.sendInput(tab.executionId, input);
      tab.waitingForInput.set(false);
      tab.userInput.set('');
    }
  }

  clearConsole() {
    this.ideService.clearConsole();
  }

  loadExample(example: PythonExample) {
    this.addNewTab(example.filename, example.code, example.dependencies);
  }

  loadPackage(pkgName: string) {
    this.ideService.loadPackage(pkgName);
  }

  importFile() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.addNewTab(file.name);
        const tab = this.tabs()[this.tabs().length - 1];
        tab.code.set(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  }

  exportFile() {
    const tab = this.activeTab();
    if (!tab) return;
    const blob = new Blob([tab.code()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab.name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private scrollToBottom() {
    if (this.replScrollContainer) {
      const el = this.replScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  openDocumentation() {
    this.dialog.open(DocumentationDialog, {
      width: '800px',
      maxWidth: '90vw'
    });
  }

  openAbout() {
    this.dialog.open(AboutDialog, {
      width: '500px'
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // F5: Run
    if (event.key === 'F5') {
      event.preventDefault();
      this.runCode();
    }

    // Ctrl + B: Toggle Console
    if (event.ctrlKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.toggleConsole();
    }

    // Ctrl + S: Export
    if (event.ctrlKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.exportFile();
    }

    // Ctrl + L: Clear Console
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      this.clearConsole();
    }

    // Ctrl + Alt + N: New Tab
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.addNewTab();
    }
  }
}
