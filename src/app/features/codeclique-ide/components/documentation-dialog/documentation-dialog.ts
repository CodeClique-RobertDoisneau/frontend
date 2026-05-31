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
## Guide de démarrage rapide

Bienvenue dans l'environnement de programmation **CodeClique** ! 

Que vous soyez débutant ou développeur expérimenté, cet IDE complet vous permet d'écrire, d'exécuter et de tester du code Python directement depuis votre navigateur. Voici comment il fonctionne en 3 étapes simples :

1. **Écrire votre code**  
   Dans la zone de gauche, vous trouverez l'**Éditeur**. C'est ici que vous tapez vos scripts Python. Vous pouvez ouvrir plusieurs fichiers en utilisant les onglets en haut de l'éditeur (comme dans un navigateur web).

2. **Exécuter le script**  
   Cliquez sur le bouton **Play (Exécuter)** vert en haut à droite (ou appuyez sur la combinaison **Ctrl + Enter** de votre clavier). Votre code sera immédiatement exécuté en arrière-plan grâce à notre moteur Python embarqué.

3. **Interagir avec la Console (REPL)**  
   À droite se trouve la **Console**. C'est ici que s'affichent les résultats de vos scripts (comme les \`print()\`).  
   En bas de la console, vous pouvez saisir des commandes Python interactives (REPL) en direct pour tester rapidement des variables ou des fonctions !

---

### Vos premières lignes de code

Essayez de copier-coller ceci dans l'éditeur et d'appuyer sur **Ctrl + Enter** :
\`\`\`python
nom = "Apprenti Développeur"
print(f"Bonjour {nom} ! Bienvenue sur CodeClique.")

for i in range(3):
    print(f"Étape {i+1} : Prêt à coder !")
\`\`\`

---

## Fonctionnalités
- **Console REPL** : Exécutez des commandes Python en direct.
- **Gestion des packages** : Chargez des bibliothèques comme \`numpy\`, \`pandas\`, etc. via le menu dédié.

## Exécution
- **Ctrl + Enter** : Exécuter le code de l'onglet actif.
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
