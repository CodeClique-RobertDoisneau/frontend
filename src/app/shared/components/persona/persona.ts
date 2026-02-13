import { Component, input, computed, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-persona',
  templateUrl: './persona.html',
  styleUrl: './persona.scss',
})

export class Persona {
  private sanitizer = inject(DomSanitizer);

  subject = input<string>('Maths');
  pose = input<string>('Default');

  // Trust the URL for the [data] binding
  imagePath = computed<SafeResourceUrl>(() => {
    const url = `img/persona/${this.subject()}-${this.pose()}.webp`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // Create a dynamic description for accessibility
  personaDesc = computed(() =>
    `Illustration of a ${this.subject()} teacher in a ${this.pose()} pose`
  );
}