import { Component, inject, signal, OnInit, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from './services/workspace';
import { ShortcutService } from '@shared/services/shortcut/shortcut';
import { MenuBar } from './components/menu-bar/menu-bar';
import { TabBar } from './components/tab-bar/tab-bar';
import { Editor } from './components/editor/editor';
import { Repl } from './components/repl/repl';

@Component({
  selector: 'app-codeclique-ide',
  standalone: true,
  imports: [
    CommonModule,
    MenuBar,
    TabBar,
    Editor,
    Repl
  ],
  templateUrl: './codeclique-ide.html',
  styleUrl: './codeclique-ide.scss'
})
export class CodeCliqueIde implements OnInit, OnDestroy {
  workspace = inject(WorkspaceService);
  shortcutService = inject(ShortcutService);

  private shortcutUnregister: (() => void)[] = [];

  @ViewChild('ideContainer') ideContainer!: ElementRef;
  @ViewChild(Repl) private replComponent?: Repl;

  consoleWidth = signal<number>(450);
  isConsoleVisible = signal<boolean>(true);
  private isResizing = false;

  constructor() { }

  ngOnInit() {
    if (this.workspace.contexts().length === 0) {
      this.workspace.addNewTab();
    }
    this.registerShortcuts();
  }

  ngOnDestroy() {
    this.shortcutUnregister.forEach(unreg => unreg());
  }

  private runActiveContext() {
    const context = this.workspace.activeContext();
    if (context) {
      context.run((type, content) => this.workspace.addToRepl(context, type, content));
    }
  }

  private registerShortcuts() {
    this.shortcutUnregister.push(
      this.shortcutService.register({ 
        key: 'F5', 
        action: () => this.runActiveContext()
      }),
      this.shortcutService.register({ 
        key: 'Enter', 
        ctrl: true, 
        action: () => this.runActiveContext()
      }),
      this.shortcutService.register({ key: 'b', ctrl: true, action: () => this.toggleConsole() }),
      this.shortcutService.register({
        key: 's',
        ctrl: true,
        action: () => {
          const context = this.workspace.activeContext();
          if (context) this.workspace.exportFile(context);
        }
      }),
      this.shortcutService.register({
        key: 'l',
        ctrl: true,
        action: () => this.workspace.activeContext()?.replHistory.set([])
      }),
      this.shortcutService.register({ key: 'n', ctrl: true, alt: true, action: () => this.workspace.addNewTab() })
    );
  }

  toggleConsole() {
    this.isConsoleVisible.update(v => !v);
    if (this.isConsoleVisible()) {
      this.replComponent?.focus();
    }
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
}
