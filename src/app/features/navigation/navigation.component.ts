import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  Router,
  ActivatedRoute,
  RouterOutlet,
  RouterLink,
  NavigationEnd
} from '@angular/router';


import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';


import { Footer } from '@shared/components/footer/footer';
import { Theming } from '@shared/services/theming/theming';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    Footer,
  ]
})
export class NavigationComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  theming = inject(Theming);

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
}
