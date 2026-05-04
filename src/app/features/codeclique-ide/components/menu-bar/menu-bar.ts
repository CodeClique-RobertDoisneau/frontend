import { Component, inject, ElementRef, viewChild, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { WorkspaceService } from '../../services/workspace';
import { EXAMPLES } from '../../codeclique-ide.constants';
import { PythonExample } from '../../codeclique-ide.types';
import { DocumentationDialog } from '../documentation-dialog/documentation-dialog';
import { AboutDialog } from '../about-dialog/about-dialog';

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './menu-bar.html',
  styleUrl: './menu-bar.scss'
})
export class MenuBar {
  workspace = inject(WorkspaceService);
  dialog = inject(MatDialog);

  isReady = input<boolean>(false);
  isRunning = input<boolean>(false);

  run = output<void>();
  stop = output<void>();
  reset = output<void>();
  loadPackageEvent = output<string>();

  private fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  examples = EXAMPLES;

  addNewTab() {
    this.workspace.addNewTab();
  }

  runCode() {
    this.run.emit();
  }

  stopExecution() {
    this.stop.emit();
  }

  resetEnvironment() {
    this.reset.emit();
  }

  loadExample(example: PythonExample) {
    this.workspace.addNewTab(example.filename, example.code, example.dependencies);
  }

  loadPackage(pkgName: string) {
    this.loadPackageEvent.emit(pkgName);
  }

  importFile() {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.workspace.addNewTab(file.name, content);
      };
      reader.readAsText(file);
    }
  }

  exportFile() {
    const tabHandler = this.workspace.activeTabHandler();
    if (tabHandler) this.workspace.exportFile(tabHandler);
  }

  renameActiveFile() {
    const tabHandler = this.workspace.activeTabHandler();
    if (tabHandler) {
      this.workspace.startEditing(this.workspace.activeTabHandlerIndex(), tabHandler.name());
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
}
