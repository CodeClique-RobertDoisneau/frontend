import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page'

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'chapter-menu',
    loadComponent: () => import('./pages/chapter-showcase/chapter-showcase').then(m => m.ChapterShowcaseComponent)
  },
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage)
  // },
  {
    path: 'courses',
    loadComponent: () => import('./pages/course-viewer/course-viewer').then(m => m.CourseViewer)
  },
  // {
  //   path: 'admin',
  //   loadComponent: () => import('./pages/admin-page/admin-page').then(m => m.AdminPage)
  // },
];

// { path: 'user/:id/:social-media', component: SocialMediaFeed },
// { path: 'user/:id', component: UserProfile }
