import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [roleGuard(['admin', 'manager', 'engineer', 'technician', 'user'])],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard-overview/dashboard-overview').then(m => m.DashboardOverview) },
      { 
        path: 'admin', 
        loadComponent: () => import('./pages/admin-manager/admin-manager').then(m => m.AdminManager),
        canActivate: [roleGuard(['admin', 'manager'])]
      },
      { 
        path: 'engineer', 
        loadComponent: () => import('./pages/engineer/engineer').then(m => m.Engineer),
        canActivate: [roleGuard(['admin', 'manager', 'engineer'])]
      },
      { 
        path: 'technician', 
        loadComponent: () => import('./pages/technician/technician').then(m => m.Technician),
        canActivate: [roleGuard(['admin', 'manager', 'engineer', 'technician'])]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
