import { Component, effect, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';


import { Footer } from '@shared/components/footer/footer';
import { Breadcrumb } from '@shared/components/breadcrumb/breadcrumb';
import { Theming } from '@shared/services/theming/theming';
import { Auth } from '@shared/services/auth/auth';


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  imports: [
    MatButtonToggleGroup,
    MatButtonToggle,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    Footer,
    Breadcrumb,
  ]

})
export class NavigationComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  theming = inject(Theming);
  authService = inject(Auth);

  constructor() {
    this.authService.getMe().catch(() => {});
  }

  title = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.title || 'CodeClique';
      })
    ),
    { initialValue: 'CodeClique' }
  );

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  logout() {
    this.authService.logout();
  }
}
