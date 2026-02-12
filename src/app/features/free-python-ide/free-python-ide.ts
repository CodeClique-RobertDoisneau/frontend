import { Component, inject } from '@angular/core';
import { MarkdownViewer } from '@shared/components/markdown-viewer/markdown-viewer';
import { Pyodide } from '@shared/services/pyodide/pyodide';

@Component({
  selector: 'app-free-python-ide',
  imports: [MarkdownViewer],
  templateUrl: './free-python-ide.html',
  styleUrl: './free-python-ide.scss',
  providers: [Pyodide]
})
export class FreePythonIde {
  pyodide = inject(Pyodide);

  markdown = `
# Editeur libre de python

Vous pouvez écrire tout le code qui vous passe par la tête.
Seuls les packages **numpy** et **matplotlib** sont disponibles, mais vous pouvez faire plein de choses avec !

Voici un exemple de code que vous pouvez exécuter :

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title("Sine Wave")
plt.xlabel("x")
plt.ylabel("sin(x)")
plt.grid()
\`\`\`
`;
}
