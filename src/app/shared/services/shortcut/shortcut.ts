import { Injectable, OnDestroy } from '@angular/core';
import { Subject, fromEvent, takeUntil } from 'rxjs';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ShortcutService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private shortcuts: ShortcutConfig[] = [];

  constructor() {
    fromEvent<KeyboardEvent>(window, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.handleKeydown(event));
  }

  register(config: ShortcutConfig) {
    this.shortcuts.push(config);
    return () => {
      this.shortcuts = this.shortcuts.filter(s => s !== config);
    };
  }

  private handleKeydown(event: KeyboardEvent) {
    const shortcut = this.shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!s.ctrl === event.ctrlKey;
      const altMatch = !!s.alt === event.altKey;
      const shiftMatch = !!s.shift === event.shiftKey;
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
