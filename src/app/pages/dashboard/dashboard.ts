import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  collapsed = false;
  navItems = [
    { path: '/dashboard', label: 'Overview', icon: '■', roles: ['admin', 'manager', 'engineer', 'technician', 'user'] },
    { path: '/dashboard/admin', label: 'Admin Control', icon: '◆', roles: ['admin', 'manager'] },
    { path: '/dashboard/engineer', label: 'Engineering', icon: '▲', roles: ['admin', 'manager', 'engineer'] },
    { path: '/dashboard/technician', label: 'Task List', icon: '●', roles: ['admin', 'manager', 'engineer', 'technician'] },
  ];

  constructor(public auth: AuthService) {}

  get filteredNav() {
    const role = this.auth.user()?.role || '';
    return this.navItems.filter(item => item.roles.includes(role));
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  logout() {
    this.auth.logout();
  }

  get todayDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }
}
