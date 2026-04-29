import { signal } from '@angular/core';
import { ReplLine } from '../codeclique-ide.types';

export class TabHandler {
  readonly id = crypto.randomUUID();
  readonly name = signal<string>('script.py');
  readonly code = signal<string>('# Écrivez votre code Python ici\nprint("Bonjour de CodeClique !")\n');

  readonly replHistory = signal<ReplLine[]>([]);
  readonly plot = signal<string>('');
  readonly waitingForInput = signal<boolean>(false);
  readonly userInput = signal<string>('');
  readonly replCommand = signal<string>('');
  
  packages: { name: string; loaded: boolean }[] = [];

  constructor(
    name?: string,
    code?: string,
    dependencies: string[] = [],
    availablePackages: string[] = []
  ) {
    if (name) this.name.set(name);
    if (code) this.code.set(code);

    this.packages = availablePackages.map(pkgName => ({
      name: pkgName,
      loaded: dependencies.includes(pkgName)
    }));
  }
}
