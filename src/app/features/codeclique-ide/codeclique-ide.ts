import { Component, inject, signal, OnInit, ElementRef, viewChild, OnDestroy, viewChildren, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkspaceService } from './services/workspace';
import { ShortcutService } from '@shared/services/shortcut/shortcut';
import { MenuBar } from './components/menu-bar/menu-bar';
import { IdeTabView } from './components/ide-tab-view/ide-tab-view';

@Component({
  selector: 'app-codeclique-ide',
  standalone: true,
  imports: [
    CommonModule,
    MenuBar,
    IdeTabView
  ],
  templateUrl: './codeclique-ide.html',
  styleUrl: './codeclique-ide.scss'
})
export class CodeCliqueIde implements OnInit, OnDestroy {
  workspace = inject(WorkspaceService);
  shortcutService = inject(ShortcutService);

  private shortcutUnregister: (() => void)[] = [];

  private ideContainer = viewChild.required<ElementRef>('ideContainer');
  private tabViews = viewChildren(IdeTabView);

  consoleWidth = signal<number>(450);
  isConsoleVisible = signal<boolean>(true);

  activeIsReady = computed(() => {
    const activeTab = this.workspace.activeTabHandler();
    return this.tabViews().find(v => v.tab() === activeTab)?.pyodide.isReady() ?? false;
  });

  activeIsRunning = computed(() => {
    const activeTab = this.workspace.activeTabHandler();
    return this.tabViews().find(v => v.tab() === activeTab)?.isRunning() ?? false;
  });

  constructor() { }

  ngOnInit() {
    if (this.workspace.tabHandlers().length === 0) {
      this.workspace.addNewTab();
    }
    this.registerShortcuts();
  }

  ngOnDestroy() {
    this.shortcutUnregister.forEach(unreg => unreg());
  }

  runActive() {
    const activeTab = this.workspace.activeTabHandler();
    this.tabViews().find(v => v.tab() === activeTab)?.run();
  }

  stopActive() {
    const activeTab = this.workspace.activeTabHandler();
    this.tabViews().find(v => v.tab() === activeTab)?.stop();
  }

  resetActive() {
    const activeTab = this.workspace.activeTabHandler();
    this.tabViews().find(v => v.tab() === activeTab)?.reset();
  }

  loadPackageActive(pkgName: string) {
    const activeTab = this.workspace.activeTabHandler();
    this.tabViews().find(v => v.tab() === activeTab)?.loadPackage(pkgName);
  }

  private registerShortcuts() {
    this.shortcutUnregister.push(
      this.shortcutService.register({ 
        key: 'F5', 
        action: () => this.runActive()
      }),
      this.shortcutService.register({ 
        key: 'Enter', 
        ctrl: true, 
        action: () => this.runActive()
      }),
      this.shortcutService.register({ key: 'b', ctrl: true, action: () => this.toggleConsole() }),
      this.shortcutService.register({
        key: 's',
        ctrl: true,
        action: () => {
          const tabHandler = this.workspace.activeTabHandler();
          if (tabHandler) this.workspace.exportFile(tabHandler);
        }
      }),
      this.shortcutService.register({
        key: 'l',
        ctrl: true,
        action: () => this.workspace.activeTabHandler()?.replHistory.set([])
      }),
      this.shortcutService.register({ key: 'n', ctrl: true, alt: true, action: () => this.workspace.addNewTab() })
    );
  }

  toggleConsole() {
    this.isConsoleVisible.update(v => !v);
  }

  startResizing(event: MouseEvent) {
    event.preventDefault();

    const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');

    mouseMove$.pipe(takeUntil(mouseUp$)).subscribe((moveEvent: MouseEvent) => {
      const container = this.ideContainer().nativeElement as HTMLElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - moveEvent.clientX;
      const min = rect.width * 0.2;
      const max = rect.width * 0.8;

      if (newWidth >= min && newWidth <= max) {
        this.consoleWidth.set(newWidth);
      }
    });
  }
}
