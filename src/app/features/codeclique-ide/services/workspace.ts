import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CodeCliqueIdeContext } from '../codeclique-ide.context';
import { PythonRuntime } from './python-runtime';
import { IdeRuntime } from '../codeclique-ide.types';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService implements OnDestroy {
  private snackBar = inject(MatSnackBar);

  contexts = signal<CodeCliqueIdeContext[]>([]);
  activeContextIndex = signal<number>(0);
  activeContext = computed(() => this.contexts()[this.activeContextIndex()]);

  editingTabIndex = signal<number | null>(null);
  editingName = signal<string>('');

  maxTabs = navigator.hardwareConcurrency || 4;
  availablePackageList = [
    'numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn', 'networkx',
    'beautifulsoup4', 'pillow', 'requests', 'sympy', 'scikit-image',
    'statsmodels', 'tqdm', 'sqlalchemy', 'biopython', 'astropy', 'opencv-python'
  ];

  /**
   * Factory method to create a runtime for a specific language.
   * Currently only supports 'python'.
   */
  private createRuntime(language: string = 'python'): IdeRuntime {
    if (language === 'python') {
      return new PythonRuntime();
    }
    throw new Error(`Unsupported language: ${language}`);
  }

  addNewTab(name?: string, code?: string, dependencies: string[] = []) {
    if (this.contexts().length >= this.maxTabs) {
      this.snackBar.open(`Limite de ${this.maxTabs} onglets atteinte`, 'OK', { duration: 3000 });
      return;
    }

    const runtime = this.createRuntime('python');
    const newContext = new CodeCliqueIdeContext(
      runtime,
      name,
      code,
      dependencies,
      this.availablePackageList
    );

    this.contexts.update(prev => [...prev, newContext]);
    this.activeContextIndex.set(this.contexts().length - 1);
  }

  closeTab(index: number, event?: Event) {
    if (event) event.stopPropagation();

    const contextToRemove = this.contexts()[index];
    if (!contextToRemove) return;

    contextToRemove.destroy();
    this.contexts.update(prev => prev.filter((_, i) => i !== index));

    if (this.activeContextIndex() >= this.contexts().length) {
      this.activeContextIndex.set(Math.max(0, this.contexts().length - 1));
    }

    if (this.contexts().length === 0) {
      this.addNewTab();
    }
  }

  addToRepl(context: CodeCliqueIdeContext, type: 'input' | 'output' | 'error', content: string) {
    if (!content) return;
    context.replHistory.update(prev => [...prev, { type, content }]);
  }

  exportFile(context: CodeCliqueIdeContext) {
    const blob = new Blob([context.code()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = context.name();
    a.click();
    window.URL.revokeObjectURL(url);
  }

  startEditing(index: number, name: string) {
    this.editingTabIndex.set(index);
    this.editingName.set(name);
  }

  saveName(index: number) {
    const contexts = this.contexts();
    if (contexts[index]) {
      let newName = this.editingName().trim();
      if (newName && !newName.endsWith('.py')) {
        newName += '.py';
      }
      contexts[index].name.set(newName || 'script.py');
    }
    this.editingTabIndex.set(null);
  }

  cancelEditing() {
    this.editingTabIndex.set(null);
  }

  ngOnDestroy() {
    this.contexts().forEach(ctx => ctx.destroy());
  }
}
