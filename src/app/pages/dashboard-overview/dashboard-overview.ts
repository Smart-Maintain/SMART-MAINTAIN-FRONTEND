import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.scss'
})
export class DashboardOverview implements OnInit {
  pendingTasks = 0;
  inProgressTasks = 0;
  completedTasks = 0;
  criticalAlerts = 2; // Keep mock for alerts unless there's an API

  recentNotifications: any[] = [];
  teams: any[] = [];
  selectedTeamIds: Record<number, string> = {};

  healthReadings = [
    { id: 1, engineName: 'TF-2841', metricType: 'vibration_level', value: 2.3, unit: 'mm/s', status: 'normal', recordedAt: new Date().toISOString() },
    { id: 2, engineName: 'CF-5672', metricType: 'temperature', value: 540, unit: 'C', status: 'warning', recordedAt: new Date().toISOString() },
    { id: 3, engineName: 'GP-7200', metricType: 'temperature', value: 580, unit: 'C', status: 'critical', recordedAt: new Date().toISOString() },
  ];

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getTasks().subscribe(tasks => {
      this.pendingTasks = tasks.filter(t => t.status === 'pending').length;
      this.inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      this.completedTasks = tasks.filter(t => t.status === 'completed').length;
    });

    this.dataService.getTeams().subscribe(teams => {
      this.teams = teams;
    });

    this.loadAlerts();
  }

  loadAlerts() {
    this.dataService.getAlerts().subscribe(alerts => {
      // Sort alerts descending by timestamp
      alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      this.recentNotifications = alerts.map(a => ({
        id: a.id,
        message: a.message,
        type: a.type || 'info',
        time: new Date(a.timestamp).toLocaleString(),
        status: a.status
      }));
      this.criticalAlerts = alerts.filter(a => a.status === 'PENDING').length;
    });
  }

  convertToTask(alertId: number) {
    const equipeId = this.selectedTeamIds[alertId];
    this.dataService.convertAlertToTask(alertId, equipeId).subscribe(() => {
      this.loadAlerts();
    });
  }
}
