import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  {
    path: 'admin',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['admin'])],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/admin-manager/admin-manager').then(m => m.AdminManager) },
      { path: 'predictions', loadComponent: () => import('./pages/predictions/predictions').then(m => m.Predictions) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) },
      { path: 'stock', loadComponent: () => import('./pages/stock/stock').then(m => m.Stock) }
    ]
  },
  {
    path: 'manager',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['manager', 'admin'])],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard-overview/dashboard-overview').then(m => m.DashboardOverview) },
      { path: 'admin', loadComponent: () => import('./pages/admin-manager/admin-manager').then(m => m.AdminManager) },
      { path: 'predictions', loadComponent: () => import('./pages/predictions/predictions').then(m => m.Predictions) },
      { path: 'tasks', loadComponent: () => import('./pages/technician/technician').then(m => m.Technician) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) },
      { path: 'approvals', loadComponent: () => import('./pages/approvals/approvals').then(m => m.Approvals) }
    ]
  },
  {
    path: 'engineer',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['engineer', 'manager', 'admin'])],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard-overview/dashboard-overview').then(m => m.DashboardOverview) },
      { path: 'predictions', loadComponent: () => import('./pages/predictions/predictions').then(m => m.Predictions) },
      { path: 'tasks', loadComponent: () => import('./pages/technician/technician').then(m => m.Technician) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) }
    ]
  },
  {
    path: 'technician',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['technician', 'engineer', 'manager', 'admin'])],
    children: [
      { path: 'tasks', loadComponent: () => import('./pages/technician/technician').then(m => m.Technician) },
      { path: 'predictions', loadComponent: () => import('./pages/predictions/predictions').then(m => m.Predictions) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) }
    ]
  },
  { path: '**', redirectTo: '' }
];
