import { Component, input, computed, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { SUBJECT_LABELS } from '@shared/services/node/node';

@Component({
  selector: 'app-persona',
  templateUrl: './persona.html',
  styleUrl: './persona.scss',
})

export class Persona {
  private sanitizer = inject(DomSanitizer);

  subject = input<string>('MA');
  pose = input<string>('Default');

  subjectName = computed(
    () => SUBJECT_LABELS[this.subject()] || 'Maths'
  );

  imagePath = computed<SafeResourceUrl>(() => {
    const url = `img/persona/${this.subjectName()}-${this.pose()}.webp`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  personaDesc = computed(() =>
    `Illustration du professeur de ${this.subjectName()} en pose ${this.pose()}`
  );
}