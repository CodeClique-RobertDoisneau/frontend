import { signal } from '@angular/core';
import { ReplLine, IdeRuntime } from './codeclique-ide.types';

export class CodeCliqueIdeContext {
  readonly id = crypto.randomUUID();
  readonly name = signal<string>('script.py');
  readonly code = signal<string>('# Écrivez votre code Python ici\nprint("Bonjour de CodeClique !")\n');

  readonly runtime: IdeRuntime;
  readonly replHistory = signal<ReplLine[]>([]);
  readonly plot = signal<string>('');
  readonly waitingForInput = signal<boolean>(false);
  readonly userInput = signal<string>('');
  readonly replCommand = signal<string>('');
  
  packages: { name: string; loaded: boolean }[] = [];

  constructor(
    runtime: IdeRuntime,
    name?: string,
    code?: string,
    dependencies: string[] = [],
    availablePackages: string[] = []
  ) {
    this.runtime = runtime;
    if (name) this.name.set(name);
    if (code) this.code.set(code);

    this.runtime.init(dependencies);

    this.packages = availablePackages.map(pkgName => ({
      name: pkgName,
      loaded: dependencies.includes(pkgName)
    }));
  }

  run(addToRepl: (type: 'input' | 'output' | 'error', content: string) => void, customCode?: string) {
    if (!this.runtime.isReady() || this.runtime.isRunning()) return;

    this.plot.set('');
    const codeToRun = customCode || this.code();

    this.runtime.run(
      codeToRun,
      (out) => addToRepl('output', out),
      (err) => addToRepl('error', err),
      (base64) => this.plot.set(base64),
      () => this.waitingForInput.set(true),
      this.runtime.isRunning
    );
  }

  stop() {
    this.runtime.stop();
    this.waitingForInput.set(false);
  }

  reset() {
    this.runtime.reset();
    this.replHistory.set([]);
    this.plot.set('');
    this.waitingForInput.set(false);
    this.userInput.set('');
  }

  loadPackage(packageName: string) {
    const pkg = this.packages.find((p) => p.name === packageName);
    if (pkg && !pkg.loaded) {
      this.runtime.loadPackage?.([packageName]);
      pkg.loaded = true;
    }
  }

  destroy() {
    this.runtime.destroy();
  }
}
