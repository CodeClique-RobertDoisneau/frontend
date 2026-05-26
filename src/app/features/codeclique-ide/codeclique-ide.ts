import { Component, inject, signal, OnInit, ElementRef, viewChild, OnDestroy, viewChildren, computed } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkspaceService } from './services/workspace';
import { ShortcutService } from '@shared/services/shortcut/shortcut';
import { MenuBar } from './components/menu-bar/menu-bar';
import { IdeTabView } from './components/ide-tab-view/ide-tab-view';
import { IdeTour, TourStep } from './components/ide-tour/ide-tour';

@Component({
  selector: 'app-codeclique-ide',
  imports: [
    MenuBar,
    IdeTabView,
    IdeTour
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

  showTour = signal<boolean>(false);
  tourSteps: TourStep[] = [
    {
      title: "Bienvenue sur CodeClique IDE",
      content: "Nous sommes ravis de vous accueillir ! Suivez ce guide interactif pour prendre en main votre environnement de programmation Python en quelques secondes.",
      position: 'center'
    },
    {
      title: "L'Éditeur de Code",
      content: "C'est ici, sur la gauche, que vous rédigez vos scripts Python. Profitez de l'auto-complétion intelligente et de la coloration syntaxique pour coder rapidement.",
      selector: '.editor-section',
      position: 'left'
    },
    {
      title: "Gestion des Onglets",
      content: "Gérez plusieurs fichiers en parallèle. Cliquez sur '+' pour ouvrir un nouvel onglet, ou double-cliquez sur le nom d'un onglet pour le renommer !",
      selector: 'app-tab-bar',
      position: 'left'
    },
    {
      title: "Exécution Instantanée",
      content: "Cliquez sur ce bouton Play (ou utilisez F5 / Ctrl + Enter) pour exécuter immédiatement votre script Python grâce à notre moteur embarqué.",
      selector: '.execution-controls',
      position: 'bottom'
    },
    {
      title: "La Console REPL",
      content: "À droite s'affichent les sorties de vos scripts. Utilisez l'invite interactive en bas pour exécuter des commandes en direct !",
      selector: '.repl-panel',
      position: 'right'
    },
    {
      title: "Bibliothèques & Outils",
      content: "Le menu supérieur vous permet d'importer des packages de calcul (numpy, matplotlib...) en un clic ou de charger des exemples de projets !",
      selector: 'app-menu-bar',
      position: 'bottom'
    },
    {
      title: "C'est parti",
      content: "La visite est terminée. Vous pouvez re-déclencher ce guide à tout moment via le menu Aide > Visite guidée. Excellent code à vous !",
      position: 'center'
    }
  ];

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

    setTimeout(() => {
      const tourCompleted = localStorage.getItem('codeclique_ide_tour_completed');
      if (!tourCompleted) {
        this.startTour();
      }
    }, 1200);
  }

  ngOnDestroy() {
    this.shortcutUnregister.forEach(unreg => unreg());
  }

  startTour() {
    this.showTour.set(true);
  }

  closeTour() {
    this.showTour.set(false);
    localStorage.setItem('codeclique_ide_tour_completed', 'true');
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
