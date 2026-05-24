import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  stats = [
    { label: 'Cours finis', value: '3', icon: 'school', trend: '+1 ce mois-ci', trendClass: 'positive' },
    { label: 'Exercices résolus', value: '142', icon: 'check_circle', trend: '+18 cette semaine', trendClass: 'positive' },
    { label: 'Score d\'XP', value: '4 850 pts', icon: 'emoji_events', trend: 'Niveau 8 (Ninja Python)', trendClass: 'neutral' },
    { label: 'Série de jours', value: '5 jours', icon: 'local_fire_department', trend: 'Record à battre : 12j', trendClass: 'positive' }
  ];

  courses = [
    { title: 'Les fondamentaux de Python', progress: 85, color: 'primary', lastActive: 'Il y a 2 heures', lessonsCompleted: 17, totalLessons: 20 },
    { title: 'Structures conditionnelles et boucles', progress: 42, color: 'accent', lastActive: 'Hier', lessonsCompleted: 5, totalLessons: 12 },
    { title: 'Introduction à la NSI', progress: 15, color: 'warn', lastActive: 'Le 20 mai', lessonsCompleted: 2, totalLessons: 15 }
  ];

  badges = [
    { name: 'Premier Script', desc: 'A compilé son premier code', icon: 'code', color: 'bronze' },
    { name: 'Boucleur Fou', desc: '100 boucles for exécutées', icon: 'repeat', color: 'silver' },
    { name: 'Sans Erreur', desc: 'A validé un exercice du premier coup', icon: 'verified', color: 'gold' },
    { name: 'Ninja Python', desc: 'A atteint le score de 4 000 XP', icon: 'psychology', color: 'platinum' }
  ];

  achievements = [
    { title: 'Relever le défi de la semaine', desc: 'Écrire une fonction récursive pour trier une liste.', points: '+250 XP', icon: 'star', actionLabel: 'Rejoindre le défi' },
    { title: 'Participer au quiz express', desc: 'Répondre à 5 questions pièges sur les dictionnaires.', points: '+100 XP', icon: 'quiz', actionLabel: 'Lancer le quiz' }
  ];

  relevantCourse = {
    title: 'Maîtriser les Structures Conditionnelles avancées',
    category: 'Python Intermédiaire',
    description: 'Apprenez à structurer des conditions imbriquées complexes et optimisez vos algorithmes de décision.',
    duration: '2h 15m',
    lessons: '8 leçons',
    xp: '+150 XP'
  };
}