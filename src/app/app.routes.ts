import { Routes } from '@angular/router';
import { Home } from '@features/home/home'

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'free-python-ide',
    loadComponent: () => import('./features/free-python-ide/free-python-ide').then(m => m.FreePythonIde)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.Settings)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy)
  }
];

// { path: 'user/:id/:social-media', component: SocialMediaFeed },
// { path: 'user/:id', component: UserProfile }
