import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home',    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent) },
  { path: 'grants',  loadComponent: () => import('./features/grants/grants').then(m => m.GrantsComponent) },
  { path: 'exports', loadComponent: () => import('./features/exports/exports').then(m => m.ExportsComponent) },
  { path: '**', redirectTo: 'home' },
];
