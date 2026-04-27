import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Pyodide } from '@shared/services/pyodide/pyodide';
import { IdeTab, ReplLine } from '../codeclique-ide.types';

@Injectable({
  providedIn: 'root'
})
export class IdeTabs implements OnDestroy {
  private snackBar = inject(MatSnackBar);

  tabs = signal<IdeTab[]>([]);
  activeTabIndex = signal<number>(0);
  activeTab = computed(() => this.tabs()[this.activeTabIndex()]);

  maxTabs = navigator.hardwareConcurrency || 4;
  availablePackageList = [
    'numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn', 'networkx',
    'beautifulsoup4', 'pillow', 'requests', 'sympy', 'scikit-image',
    'statsmodels', 'tqdm', 'sqlalchemy', 'biopython', 'astropy', 'opencv-python'
  ];

  constructor() {
    // Initial tab is added by the component if needed, or we can do it here
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
      packages: this.availablePackageList.map(pkgName => ({
        name: pkgName,
        loaded: dependencies.includes(pkgName)
      }))
    };

    this.tabs.update(prev => [...prev, newTab]);
    this.activeTabIndex.set(this.tabs().length - 1);
  }

  closeTab(index: number, event?: Event) {
    if (event) event.stopPropagation();

    const tabToRemove = this.tabs()[index];
    if (!tabToRemove) return;

    tabToRemove.pyodide.ngOnDestroy();
    this.tabs.update(prev => prev.filter((_, i) => i !== index));

    if (this.activeTabIndex() >= this.tabs().length) {
      this.activeTabIndex.set(Math.max(0, this.tabs().length - 1));
    }

    if (this.tabs().length === 0) {
      this.addNewTab();
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

  loadPackage(packageName: string) {
    const tab = this.activeTab();
    if (!tab) return;

    const pkg = tab.packages.find((p) => p.name === packageName);
    if (pkg && !pkg.loaded) {
      tab.pyodide.loadPackage([packageName]);
      pkg.loaded = true;
      this.snackBar.open(`Chargement de ${packageName}...`, 'OK', { duration: 2000 });
    }
  }

  ngOnDestroy() {
    this.tabs().forEach(tab => tab.pyodide.ngOnDestroy());
  }
}
