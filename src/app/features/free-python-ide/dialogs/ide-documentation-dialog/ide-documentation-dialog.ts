import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';

@Component({
  selector: 'app-ide-documentation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MarkdownViewer
  ],
  templateUrl: './ide-documentation-dialog.html',
  styleUrl: './ide-documentation-dialog.scss',
})
export class IdeDocumentationDialog {
  dialogRef = inject(MatDialogRef<IdeDocumentationDialog>);

  documentation = `
Bienvenue dans votre environnement de développement Python intégré !

## Fonctionnalités
- **Éditeur de code** : Coloration syntaxique et support complet de Python.
- **Console REPL** : Exécutez des commandes Python en direct et interagissez avec vos scripts.
- **Graphiques** : Support complet de \`matplotlib\` pour l'affichage de graphiques directement dans la console.
- **Gestion des packages** : Chargez des bibliothèques populaires comme \`numpy\`, \`pandas\`, et \`scipy\`.

## Raccourcis Clavier
- **F5** : Exécuter le code de l'onglet actif.
*   **Ctrl + B** : Afficher/Masquer la console.
*   **Ctrl + S** : Enregistrer (Exporter) le fichier actuel.
*   **Ctrl + L** : Effacer l'historique de la console.
*   **Ctrl + Alt + N** : Créer un nouvel onglet.

## Bibliothèques Disponibles
L'IDE utilise **Pyodide**, une distribution WebAssembly de CPython. Vous pouvez importer les packages standard ainsi que ceux installés via le menu "Bibliothèques".
  `;

  close() {
    this.dialogRef.close();
  }
}
