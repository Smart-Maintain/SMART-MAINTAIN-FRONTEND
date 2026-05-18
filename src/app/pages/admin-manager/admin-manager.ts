import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-manager.html',
  styleUrl: './admin-manager.scss'
})
export class AdminManager implements OnInit {
  activeTab: 'overview' | 'team' | 'costs' = 'overview';

  performanceData = [
    { metric: 'Availability', value: 99.7 },
    { metric: 'Efficiency', value: 94.2 },
    { metric: 'Reliability', value: 97.8 },
    { metric: 'Compliance', value: 100 },
    { metric: 'Cost Control', value: 88.5 },
    { metric: 'Safety', value: 99.9 },
  ];

  monthlyCosts = [
    { month: 'Jan', scheduled: 450000, unscheduled: 120000 },
    { month: 'Feb', scheduled: 420000, unscheduled: 85000 },
    { month: 'Mar', scheduled: 580000, unscheduled: 95000 },
    { month: 'Apr', scheduled: 390000, unscheduled: 45000 },
    { month: 'May', scheduled: 510000, unscheduled: 32000 },
  ];

  teamPerformance = [
    { name: 'Team Alpha', tasks: 24, efficiency: 94 },
    { name: 'Team Bravo', tasks: 18, efficiency: 88 },
    { name: 'Team Charlie', tasks: 31, efficiency: 91 },
    { name: 'Team Delta', tasks: 15, efficiency: 96 },
  ];

  tasks: any[] = [];
  isLoadingTasks = true;

  healthReadings = [
    { id: 1, engineName: 'TF-2841', status: 'normal' },
    { id: 2, engineName: 'CF-5672', status: 'warning' },
    { id: 3, engineName: 'GP-7200', status: 'critical' },
  ];

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoadingTasks = true;
    this.dataService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks.map(t => ({
          id: t.id,
          title: t.description || 'Unknown Task',
          engineName: t.taxonomie?.nom || 'Unknown Engine',
          priority: t.priorite || 'medium',
          status: t.status || 'pending',
          dueDate: '2026-05-20'
        }));
        this.isLoadingTasks = false;
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoadingTasks = false;
      }
    });
  }

  setActiveTab(tab: 'overview' | 'team' | 'costs') {
    this.activeTab = tab;
  }

  completeTask(id: string) {
    this.dataService.updateTaskStatus(id, 'completed').subscribe(() => {
      this.loadTasks();
    });
  }

  get criticalAlertsCount() {
    return this.healthReadings.filter(h => h.status === 'critical').length;
  }

  getBadgeColor(type: string, value: string) {
    if (type === 'priority') {
      return value === 'critical' ? '#ff6b6b' : value === 'high' ? '#F28C28' : value === 'medium' ? '#00A8E8' : '#8A8A93';
    } else if (type === 'status') {
      return value === 'completed' ? '#00A8E8' : value === 'in_progress' ? '#F28C28' : value === 'pending' ? '#8A8A93' : '#ff6b6b';
    }
    return '#8A8A93';
  }
}
