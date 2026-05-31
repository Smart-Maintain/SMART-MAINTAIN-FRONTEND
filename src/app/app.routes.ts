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
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) }
    ]
  },
  {
    path: 'manager',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['manager', 'admin'])],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard-overview/dashboard-overview').then(m => m.DashboardOverview) },
      { path: 'admin', loadComponent: () => import('./pages/admin-manager/admin-manager').then(m => m.AdminManager) },
      { path: 'tasks', loadComponent: () => import('./pages/technician/technician').then(m => m.Technician) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) }
    ]
  },
  {
    path: 'engineer',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['engineer', 'manager', 'admin'])],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard-overview/dashboard-overview').then(m => m.DashboardOverview) },
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
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) }
    ]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['admin', 'manager', 'engineer', 'technician', 'user'])],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard-overview/dashboard-overview').then(m => m.DashboardOverview) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.ChatPage) },
      { path: 'admin', loadComponent: () => import('./pages/admin-manager/admin-manager').then(m => m.AdminManager) },
      { path: 'engineer', loadComponent: () => import('./pages/technician/technician').then(m => m.Technician) },
      { path: 'tasks', loadComponent: () => import('./pages/technician/technician').then(m => m.Technician) },
      { path: 'rapport/:taskId', loadComponent: () => import('./pages/rapport/rapport').then(m => m.Rapport) }
    ]
  },
  { path: '**', redirectTo: '' }
];
