import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Theming {
  private themeSignal = signal<'light' | 'dark' | 'auto'>('auto');
  private contrastSignal = signal<'low' | 'medium' | 'high' | 'default'>('medium');

  public readonly theme = this.themeSignal.asReadonly();
  public readonly contrast = this.contrastSignal.asReadonly();

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    const savedTheme: string | null = localStorage.getItem('theme');
    const savedContrast: string | null = localStorage.getItem('contrast');

    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.themeSignal.set(savedTheme);
    }
    if (savedContrast === 'low' || savedContrast === 'medium' || savedContrast === 'high') {
      this.contrastSignal.set(savedContrast);
    }

    effect(() => {
      let theme = this.themeSignal();
      if (this.themeSignal() === 'auto') {
        localStorage.removeItem('theme');
        theme = this.mediaQuery.matches ? 'dark' : 'light';
      }
      document.body.style.colorScheme = theme;
      let contrast = this.contrastSignal();
      if (this.contrastSignal() === 'default') {
        localStorage.removeItem('contrast');
        contrast = 'medium';
      }
      // document.body.style.setProperty('color-contrast', contrast);
    });
  }

  public setTheme(theme?: 'light' | 'dark' | 'auto', contrast?: 'low' | 'medium' | 'high' | 'default'): void {
    if (theme) {
      if (theme === 'auto') {
        this.themeSignal.set('auto');
      } else {
        localStorage.setItem('theme', theme);
        this.themeSignal.set(theme);
      }
    }
    if (contrast) {
      if (contrast === 'default') {
        this.contrastSignal.set('medium');
      } else {
        localStorage.setItem('contrast', contrast);
        this.contrastSignal.set(contrast);
      }
    }
  }

  public toggle(): void {
    const cycle = {
      light: 'dark',
      dark: 'auto',
      auto: 'light'
    } as const;
    this.setTheme(cycle[this.themeSignal()]);
  }
}
