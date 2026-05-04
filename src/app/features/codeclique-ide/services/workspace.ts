import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TabHandler } from './tab-handler';
import { ReplLine } from '../codeclique-ide.types';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService implements OnDestroy {
  private snackBar = inject(MatSnackBar);

  tabHandlers = signal<TabHandler[]>([]);
  activeTabHandlerIndex = signal<number>(0);
  activeTabHandler = computed(() => this.tabHandlers()[this.activeTabHandlerIndex()]);

  editingTabIndex = signal<number | null>(null);
  editingName = signal<string>('');

  maxTabs = 20;
  availablePackageList = [
    'numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn', 'networkx',
    'beautifulsoup4', 'pillow', 'requests', 'sympy', 'scikit-image',
    'statsmodels', 'tqdm', 'sqlalchemy', 'biopython', 'astropy', 'opencv-python'
  ];

  addNewTab(name?: string, code?: string, dependencies: string[] = []) {
    if (this.tabHandlers().length >= this.maxTabs) {
      this.snackBar.open(`Limite de ${this.maxTabs} onglets atteinte`, 'OK', { duration: 3000 });
      return;
    }

    const newTab = new TabHandler(
      name,
      code,
      dependencies,
      this.availablePackageList
    );

    this.tabHandlers.update(prev => [...prev, newTab]);
    this.activeTabHandlerIndex.set(this.tabHandlers().length - 1);
  }

  closeTab(index: number, event?: Event) {
    if (event) event.stopPropagation();

    const tabToRemove = this.tabHandlers()[index];
    if (!tabToRemove) return;

    this.tabHandlers.update(prev => prev.filter((_, i) => i !== index));

    if (this.activeTabHandlerIndex() >= this.tabHandlers().length) {
      this.activeTabHandlerIndex.set(Math.max(0, this.tabHandlers().length - 1));
    }

    if (this.tabHandlers().length === 0) {
      this.addNewTab();
    }
  }

  addToRepl(tab: TabHandler, type: 'input' | 'output' | 'error', content: string) {
    if (!content) return;
    tab.replHistory.update(prev => [...prev, { type, content }]);
  }

  exportFile(tab: TabHandler) {
    const blob = new Blob([tab.code()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab.name();
    a.click();
    window.URL.revokeObjectURL(url);
  }

  startEditing(index: number, name: string) {
    this.editingTabIndex.set(index);
    this.editingName.set(name);
  }

  saveName(index: number) {
    const handlers = this.tabHandlers();
    if (handlers[index]) {
      let newName = this.editingName().trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      
      if (!newName || newName === '.py') {
        newName = `script_${index + 1}.py`;
      } else if (!newName.endsWith('.py')) {
        newName += '.py';
      }
      
      handlers[index].name.set(newName);
    }
    this.editingTabIndex.set(null);
  }

  cancelEditing() {
    this.editingTabIndex.set(null);
  }

  ngOnDestroy() {
    // Component lifecycle will handle tab destruction now
  }
}
