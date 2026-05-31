import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { DialogLayout } from '../../../../shared/components/dialog-layout/dialog-layout';

@Component({
  selector: 'app-documentation-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MarkdownViewer,
    DialogLayout
  ],
  templateUrl: './documentation-dialog.html',
  styleUrl: './documentation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationDialog {
  dialogRef = inject(MatDialogRef<DocumentationDialog>);

  documentation = `
## Fonctionnalités
- **Console REPL** : Saisie et exécution de commandes Python interactives en direct.
- **Gestion des packages** : Chargement à la demande de bibliothèques scientifiques et de calcul (comme \`numpy\`, \`matplotlib\`, etc.) via le menu supérieur.

## Raccourcis clavier d'exécution
- **Ctrl + Enter** : Exécuter le code de l'onglet actif.
- **Ctrl + B** : Afficher ou masquer le panneau de la console.
- **Ctrl + L** : Effacer l'historique et le contenu de la console.

## Raccourcis clavier d'édition
- **Ctrl + /** : Commenter ou décommenter les lignes de code sélectionnées.
- **Ctrl + F** : Rechercher du texte dans le fichier actif.
- **Ctrl + H** : Rechercher et remplacer dans le fichier actif.
- **Ctrl + D** : Dupliquer la ligne de code actuelle.
- **Ctrl + Alt + N** : Créer un nouvel onglet d'édition.
- **Ctrl + S** : Exporter et enregistrer le fichier actuel localement.
- **Double-clic sur l'onglet** : Renommer le fichier actif.
  `;

  close() {
    this.dialogRef.close();
  }
}
