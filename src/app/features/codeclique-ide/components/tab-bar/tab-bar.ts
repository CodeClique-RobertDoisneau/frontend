import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkspaceService } from '../../services/workspace';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss'
})
export class TabBar {
  workspace = inject(WorkspaceService);
  
  toggleConsole = output<void>();

  onToggleConsole() {
    this.toggleConsole.emit();
  }

  addNewTab() {
    this.workspace.addNewTab();
  }

  closeTab(index: number, event: Event) {
    this.workspace.closeTab(index, event);
  }

  selectTab(index: number) {
    this.workspace.activeContextIndex.set(index);
  }

  startEditing(index: number, name: string, event: Event) {
    event.stopPropagation();
    this.workspace.startEditing(index, name);
  }

  saveName(index: number) {
    this.workspace.saveName(index);
  }

  cancelEditing() {
    this.workspace.cancelEditing();
  }
}
