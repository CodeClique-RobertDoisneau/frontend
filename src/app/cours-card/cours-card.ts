import { Component, signal } from '@angular/core';

interface Cours {
  id?: number;
  name?: string;
}

@Component({
  selector: 'cours-card',
  imports: [],
  templateUrl: './cours-card.html',
  styleUrl: './cours-card.scss'
})
export class CoursCard {
  cours: Cours[] = [
    {
      id: 1839,
      name: "le cours de while"
    }
  ];

  constructor() {
    const cour1: Cours = {
      id: 1839,
      name: "le cours de while"
    };
    this.cours = [cour1];
  }
}
