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

import { EXAMPLES, PythonExample } from './examples/python-examples';
import { IdeDocumentationDialog } from './dialogs/ide-documentation-dialog/ide-documentation-dialog';
import { IdeAboutDialog } from './dialogs/ide-about-dialog/ide-about-dialog';

interface ReplLine {
  type: 'input' | 'output' | 'error';
  content: string;
}

interface IdeTab {
  id: string;
  name: string;
  code: WritableSignal<string>;
  pyodide: Pyodide;
  replHistory: WritableSignal<ReplLine[]>;
  isRunning: WritableSignal<boolean>;
  executionId: string | null;
  plot: WritableSignal<string>;
  waitingForInput: WritableSignal<boolean>;
  userInput: WritableSignal<string>;
  packages: { name: string; loaded: boolean }[];
}

@Component({
  selector: 'app-free-python-ide',
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
  templateUrl: './free-python-ide.html',
  styleUrl: './free-python-ide.scss'
})
export class FreePythonIde implements OnInit, OnDestroy {
  theming = inject(Theming);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);

  @ViewChild('replScrollContainer') private replScrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  languages = languages;

  tabs = signal<IdeTab[]>([]);
  activeTabIndex = signal<number>(0);

  activeTab = computed<IdeTab | undefined>(() => this.tabs()[this.activeTabIndex()]);

  @ViewChild('resizeHandle') resizeHandle!: ElementRef;
  @ViewChild('ideContainer') ideContainer!: ElementRef;

  replCommand = signal<string>('');
  maxTabs = navigator.hardwareConcurrency || 4;

  availablePackageList = ['numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn', 'networkx'];
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
      }
    });
  }

  ngOnInit() {
    this.addNewTab();
  }

  ngOnDestroy() {
    this.tabs().forEach(tab => tab.pyodide.ngOnDestroy());
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
    if (this.tabs().length >= this.maxTabs) {
      this.snackBar.open(`Limite de ${this.maxTabs} onglets atteinte`, 'OK', { duration: 3000 });
      return;
    }

    const pyodide = new Pyodide();
    pyodide.init(dependencies);

    const newTab: IdeTab = {
      id: crypto.randomUUID(),
      name: name || `script_${this.tabs().length + 1}.py`,
      code: signal(code || '# Écrivez votre code Python ici\nprint("Bonjour de CodeClique !")\n'),
      pyodide: pyodide,
      replHistory: signal([]),
      isRunning: signal(false),
      executionId: null,
      plot: signal(''),
      waitingForInput: signal(false),
      userInput: signal(''),
      packages: this.availablePackageList.map(name => ({
        name,
        loaded: dependencies.includes(name)
      }))
    };

    this.tabs.update(prev => [...prev, newTab]);
    this.activeTabIndex.set(this.tabs().length - 1);
  }

  closeTab(index: number, event?: Event) {
    if (event) event.stopPropagation();

    const tabToRemove = this.tabs()[index];
    tabToRemove.pyodide.ngOnDestroy();

    this.tabs.update(prev => prev.filter((_, i) => i !== index));

    if (this.activeTabIndex() >= this.tabs().length) {
      this.activeTabIndex.set(Math.max(0, this.tabs().length - 1));
    }

    if (this.tabs().length === 0) {
      this.addNewTab();
    }
  }

  runCode() {
    const tab = this.activeTab();
    if (!tab || !tab.pyodide.isReady() || tab.isRunning()) return;

    tab.plot.set('');

    const { executionId, isRunning } = tab.pyodide.run(
      tab.code(),
      (out) => this.addToRepl(tab, 'output', out),
      (err) => this.addToRepl(tab, 'error', err),
      (base64) => tab.plot.set(base64),
      () => tab.waitingForInput.set(true)
    );

    tab.executionId = executionId;
    tab.isRunning = isRunning;
  }

  stopExecution() {
    const tab = this.activeTab();
    if (tab && tab.executionId) {
      tab.pyodide.interruptExecution(tab.executionId);
      tab.waitingForInput.set(false);
    }
  }

  resetEnvironment() {
    const tab = this.activeTab();
    if (tab) {
      tab.pyodide.reset();
      tab.replHistory.set([]);
      tab.plot.set('');
      this.snackBar.open('Environnement réinitialisé', 'OK', { duration: 2000 });
    }
  }

  executeRepl() {
    const tab = this.activeTab();
    const cmd = this.replCommand().trim();
    if (!tab || !cmd || !tab.pyodide.isReady()) return;

    this.addToRepl(tab, 'input', cmd);
    this.replCommand.set('');

    const { isRunning } = tab.pyodide.run(
      cmd,
      (out) => this.addToRepl(tab, 'output', out),
      (err) => this.addToRepl(tab, 'error', err),
      (base64) => tab.plot.set(base64),
      () => tab.waitingForInput.set(true)
    );

    tab.isRunning = isRunning;
  }

  submitInput() {
    const tab = this.activeTab();
    if (tab && tab.executionId && tab.waitingForInput()) {
      const input = tab.userInput();
      this.addToRepl(tab, 'output', input + '\n');
      tab.pyodide.sendInput(tab.executionId, input);
      tab.waitingForInput.set(false);
      tab.userInput.set('');
    }
  }

  addToRepl(tab: IdeTab, type: 'input' | 'output' | 'error', content: string) {
    if (!content) return;
    tab.replHistory.update(prev => [...prev, { type, content }]);
  }

  clearConsole() {
    const tab = this.activeTab();
    if (tab) {
      tab.replHistory.set([]);
    }
  }

  loadExample(example: PythonExample) {
    this.addNewTab(example.filename, example.code, example.dependencies);
  }

  loadPackage(pkgName: string) {
    const tab = this.activeTab();
    if (tab) {
      const pkg = tab.packages.find(p => p.name === pkgName);
      if (pkg && !pkg.loaded) {
        tab.pyodide.loadPackage([pkgName]);
        pkg.loaded = true;
        this.snackBar.open(`Chargement de ${pkgName}...`, 'OK', { duration: 2000 });
      }
    }
  }

  importFile() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
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
    this.dialog.open(IdeDocumentationDialog, {
      width: '800px',
      maxWidth: '90vw'
    });
  }

  openAbout() {
    this.dialog.open(IdeAboutDialog, {
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
