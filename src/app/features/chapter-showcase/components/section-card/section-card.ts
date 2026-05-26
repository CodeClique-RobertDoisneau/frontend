import { Component, input, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NodeInfo, Node } from '@shared/services/node/node';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItemCard } from '.././item-card/item-card';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-section-card',
  imports: [MatIconModule, MatChipsModule, MatDividerModule, MatButtonModule, MatProgressSpinnerModule, ItemCard, MatExpansionModule],
  templateUrl: './section-card.html',
  styleUrl: './section-card.scss',
})
export class SectionCard {
  readonly id = input.required<string>();
  private nodeService = inject(Node);

  sectionInfo = this.nodeService.getNode(() => this.id());

  itemIds = computed(
    () => {
      const node = this.sectionInfo.value();
      if (!node || !node.children) return [];
      return node.children.map(
        (child: any) => {
          if (typeof child === 'object') {
            return (child.child && child.child.id) ? child.child.id : child.id;
          }
          return child;
        }
      );
    }
  );

}