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
import { HostListener } from '@angular/core';

import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';

import { Theming } from '@shared/services/theming/theming';

import { EXAMPLES } from './codeclique-ide.constants';
import { DocumentationDialog } from './components/documentation-dialog/documentation-dialog';
import { AboutDialog } from './components/about-dialog/about-dialog';
import { PythonExample } from './codeclique-ide.types';
import { IdeTabs } from './services/ide-tabs';
import { IdeReplComponent } from './components/repl/repl';
import { ShortcutService } from '@shared/services/shortcut/shortcut';

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
    MatDialogModule,
    CodeEditor,
    IdeReplComponent
  ],
  templateUrl: './codeclique-ide.html',
  styleUrl: './codeclique-ide.scss'
})
export class CodeCliqueIde implements OnInit, OnDestroy {
  theming = inject(Theming);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  ideService = inject(IdeTabs);
  shortcutService = inject(ShortcutService);
  private shortcutUnregister: (() => void)[] = [];

  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(IdeReplComponent) private replComponent?: IdeReplComponent;

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
  private isResizing = false;

  constructor() { }

  ngOnInit() {
    // Initial tab is handled by the service constructor or here
    if (this.tabs().length === 0) {
      this.ideService.addNewTab();
    }

    this.registerShortcuts();
  }

  ngOnDestroy() {
    // Cleanup shortcuts
    this.shortcutUnregister.forEach(unreg => unreg());
  }

  private registerShortcuts() {
    this.shortcutUnregister.push(
      this.shortcutService.register({ key: 'F5', action: () => this.runCode() }),
      this.shortcutService.register({ key: 'b', ctrl: true, action: () => this.toggleConsole() }),
      this.shortcutService.register({ key: 's', ctrl: true, action: () => this.exportFile() }),
      this.shortcutService.register({ key: 'l', ctrl: true, action: () => this.clearConsole() }),
      this.shortcutService.register({ key: 'n', ctrl: true, alt: true, action: () => this.addNewTab() })
    );
  }

  startResizing(event: MouseEvent) {
    this.isResizing = true;
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing || !this.ideContainer) return;

    const container = this.ideContainer.nativeElement as HTMLElement;
    const rect = container.getBoundingClientRect();
    const newWidth = rect.right - event.clientX;

    const min = rect.width * 0.2;
    const max = rect.width * 0.8;

    if (newWidth >= min && newWidth <= max) {
      this.consoleWidth.set(newWidth);
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isResizing = false;
  }

  toggleConsole() {
    this.isConsoleVisible.update(v => !v);
    if (this.isConsoleVisible()) {
      this.replComponent?.focus();
    }
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

  executeRepl(cmd: string) {
    const tab = this.activeTab();
    if (!tab || !cmd || !tab.pyodide.isReady()) return;

    this.ideService.addToRepl(tab, 'input', cmd);

    tab.pyodide.run(
      cmd,
      (out) => this.ideService.addToRepl(tab, 'output', out),
      (err) => this.ideService.addToRepl(tab, 'error', err),
      (base64) => tab.plot.set(base64),
      () => tab.waitingForInput.set(true),
      tab.isRunning
    );
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
}
