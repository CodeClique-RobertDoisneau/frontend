import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-persona',
  imports: [],
  templateUrl: './persona.html',
  styleUrl: './persona.scss',
})
export class Persona {
  subject = input<String>('Maths');
  pose = input<String>('Default');



  imagePath = computed(() => {
    'img/persona/' + this.subject() + '-' + this.pose() + '.webp'
  });
}

