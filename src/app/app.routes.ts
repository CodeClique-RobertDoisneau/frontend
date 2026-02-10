import { Routes } from '@angular/router';
import { Landing } from '@features/landing/landing'

export const routes: Routes = [
  {
    title: 'Accueil',
    path: '',
    component: Landing,
  },
  {
    title: 'Dashboard',
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    title: 'IDE Libre Python',
    path: 'free-python-ide',
    loadComponent: () => import('@features/free-python-ide/free-python-ide').then(m => m.FreePythonIde)
  },
  {
    title: 'Catalogue des cours',
    path: 'courses',
    loadComponent: () => import('@features/courses-catalog/courses-catalog').then(m => m.CoursesCatalog)
  },
  {
    title: 'Markdown Render Testing',
    path: 'test-viewer',
    loadComponent: () => import('@features/test-viewer/test-viewer').then(m => m.TestViewer)
  },
  {
    title: 'Mon Profil',
    path: 'profile',
    loadComponent: () => import('@features/profile/profile').then(m => m.Profile)
  },
  {
    title: 'Paramètres',
    path: 'settings',
    loadComponent: () => import('@features/settings/settings').then(m => m.Settings)
  },
  {
    title: 'Politique de confidentialité',
    path: 'privacy-policy',
    loadComponent: () => import('@features/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy)
  },
  {
    title: 'Erreur',
    path: 'error/:code',
    loadComponent: () => import('@features/error/error').then(m => m.Error)
  },
  { 
    title: 'Page non trouvée',
    path: '**',
    redirectTo: '/error/404'
  }
];