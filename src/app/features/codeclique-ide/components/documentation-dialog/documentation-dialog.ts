import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { DialogLayout } from '../../../../shared/components/dialog-layout/dialog-layout';

@Component({
  selector: 'app-documentation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MarkdownViewer,
    DialogLayout
  ],
  templateUrl: './documentation-dialog.html',
  styleUrl: './documentation-dialog.scss',
})
export class DocumentationDialog {
  dialogRef = inject(MatDialogRef<DocumentationDialog>);

  documentation = `
## Fonctionnalités
- **Console REPL** : Exécutez des commandes Python en direct.
- **Gestion des packages** : Chargez des bibliothèques comme \`numpy\`, \`pandas\`, etc. via le menu dédié.

## Exécution
- **F5** ou **Ctrl + Enter** : Exécuter le code de l'onglet actif.
- **Ctrl + B** : Afficher/Masquer la console.
- **Ctrl + L** : Effacer l'historique de la console.

## Édition
- **Ctrl + /** : Commenter/Décommenter les lignes sélectionnées.
- **Ctrl + F** : Rechercher dans le fichier.
- **Ctrl + H** : Remplacer.
- **Ctrl + D** : Dupliquer la ligne actuelle.
- **Ctrl + Alt + N** : Créer un nouvel onglet.
- **Ctrl + S** : Enregistrer (Exporter) le fichier actuel.
- **Double-clic sur l'onglet** : Renommer le fichier.
  `;

  close() {
    this.dialogRef.close();
  }
}
