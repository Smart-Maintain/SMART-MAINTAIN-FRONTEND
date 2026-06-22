import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ChatbotWidget } from '../../components/chatbot-widget/chatbot-widget';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChatbotWidget],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  collapsed = false;
  notifications: any[] = [];
  showNotificationsPanel = false;
  
  bugModalOpen = false;
  bugDescription = '';
  bugSubmitting = false;
  bugSuccess = false;

  navItems = [
    { path: '/dashboard', label: 'Overview', icon: '■', roles: ['admin', 'manager', 'engineer', 'technician', 'user'] },
    { path: '/dashboard/admin', label: 'Admin Control', icon: '◆', roles: ['admin', 'manager'] },
    { path: '/dashboard/engineer', label: 'Engineering', icon: '▲', roles: ['admin', 'manager', 'engineer'] },
    { path: '/dashboard/tasks', label: 'Task Execution', icon: '●', roles: ['admin', 'manager', 'engineer', 'technician'] },
    { path: '/dashboard/chat', label: 'AI Assistant', icon: '✦', roles: ['admin', 'manager', 'engineer', 'technician', 'user'] },
  ];

  constructor(
    public auth: AuthService, 
    public router: Router,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    // Poll notifications every 10 seconds
    setInterval(() => this.loadNotifications(), 10000);
  }

  loadNotifications() {
    const user = this.auth.user();
    if (!user) return;
    this.dataService.getNotifications(user.email, user.role).subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Error loading notifications', err)
    });
  }

  get unreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  toggleNotificationsPanel() {
    this.showNotificationsPanel = !this.showNotificationsPanel;
  }

  clickNotification(notif: any) {
    this.dataService.markNotificationAsRead(notif.id).subscribe(() => {
      this.loadNotifications();
    });
    this.showNotificationsPanel = false;

    // Redirect based on target and type
    const role = this.auth.user()?.role || '';
    if (notif.type === 'TASK') {
      if (role === 'technician') {
        this.router.navigate(['/technician/tasks']);
      } else if (role === 'engineer') {
        this.router.navigate(['/engineer/tasks']);
      } else if (role === 'manager') {
        this.router.navigate(['/manager/tasks']);
      }
    } else if (notif.type === 'REPORT' && notif.targetId) {
      this.router.navigate([`/${role}/rapport`, notif.targetId]);
    }
  }

  markAllAsRead() {
    const unread = this.unreadNotifications;
    if (unread.length === 0) return;
    unread.forEach(n => {
      this.dataService.markNotificationAsRead(n.id).subscribe(() => {
        this.loadNotifications();
      });
    });
  }

  // Bug Feedback logic
  toggleBugModal() {
    this.bugModalOpen = !this.bugModalOpen;
    this.bugDescription = '';
    this.bugSuccess = false;
  }

  submitBugFeedback() {
    if (!this.bugDescription.trim()) return;
    this.bugSubmitting = true;
    const user = this.auth.user();
    const payload = {
      reporterEmail: user?.email || 'anonymous',
      reporterRole: user?.role || 'user',
      description: this.bugDescription
    };

    this.dataService.createBugFeedback(payload).subscribe({
      next: () => {
        this.bugSubmitting = false;
        this.bugSuccess = true;
        setTimeout(() => this.toggleBugModal(), 1500);
      },
      error: (err) => {
        console.error('Error reporting bug', err);
        this.bugSubmitting = false;
      }
    });
  }

  private navCache: any[] | null = null;
  private lastRole: string | null = null;

  get filteredNav() {
    const role = this.auth.user()?.role || '';
    if (this.navCache && this.lastRole === role) {
      return this.navCache;
    }
    
    this.lastRole = role;
    if (role === 'admin') {
      this.navCache = [
        { path: '/admin/dashboard', label: 'Admin Control', icon: '◆' },
        { path: '/admin/stock', label: 'Gestion Stock', icon: '📦' },
        { path: '/admin/predictions', label: 'Predictions', icon: '🔔' },
        { path: '/admin/chat', label: 'AI Assistant', icon: '✦' }
      ];
    } else if (role === 'manager') {
      this.navCache = [
        { path: '/manager/dashboard', label: 'Overview', icon: '■' },
        { path: '/manager/admin', label: 'Admin Control', icon: '◆' },
        { path: '/manager/predictions', label: 'Predictions', icon: '🔔' },
        { path: '/manager/tasks', label: 'Task Execution', icon: '●' },
        { path: '/manager/approvals', label: 'Approvals', icon: '✓' },
        { path: '/manager/chat', label: 'AI Assistant', icon: '✦' }
      ];
    } else if (role === 'engineer') {
      this.navCache = [
        { path: '/engineer/dashboard', label: 'Overview', icon: '■' },
        { path: '/engineer/predictions', label: 'Predictions', icon: '🔔' },
        { path: '/engineer/tasks', label: 'Task Execution', icon: '●' },
        { path: '/engineer/chat', label: 'AI Assistant', icon: '✦' }
      ];
    } else if (role === 'technician') {
      this.navCache = [
        { path: '/technician/predictions', label: 'Predictions', icon: '🔔' },
        { path: '/technician/tasks', label: 'Task Execution', icon: '●' },
        { path: '/technician/chat', label: 'AI Assistant', icon: '✦' }
      ];
    } else {
      this.navCache = [];
    }
    return this.navCache;
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
