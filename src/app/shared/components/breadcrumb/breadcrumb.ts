import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, MatIconModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  protected service = inject(BreadcrumbService);

  /**
   * Computed breadcrumbs from the service.
   */
  breadcrumbs = this.service.breadcrumbs;
}
