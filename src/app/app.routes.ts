import { Routes } from '@angular/router';
import { Home } from './features/home/home'

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'courses',
    loadComponent: () => import('./features/course/course').then(m => m.Course)
  },
  {
    path: 'exercises',
    loadComponent: () => import('./features/exercise/exercise').then(m => m.Exercise)
  },
  {
    path: 'chapters',
    loadComponent: () => import('./features/chapter/chapter').then(m => m.Chapter)
  },
  {
    path: 'free-code',
    loadComponent: () => import('./features/free-code/free-code').then(m => m.FreeCode)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.Settings)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
  }
  // {
  //   path: 'admin',
  //   loadComponent: () => import('./features/admin/admin').then(m => m.Admin)
  // },
];

// { path: 'user/:id/:social-media', component: SocialMediaFeed },
// { path: 'user/:id', component: UserProfile }
