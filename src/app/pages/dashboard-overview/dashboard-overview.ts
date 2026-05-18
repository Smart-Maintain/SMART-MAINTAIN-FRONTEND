import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.scss'
})
export class DashboardOverview implements OnInit {
  pendingTasks = 0;
  inProgressTasks = 0;
  completedTasks = 0;
  criticalAlerts = 2; // Keep mock for alerts unless there's an API

  recentNotifications = [
    { id: 1, message: 'GP-7200 turbine temperature exceeding threshold', type: 'critical', time: '2 min ago' },
    { id: 2, message: 'TF-2841 fan blade inspection due in 3 cycles', type: 'warning', time: '15 min ago' },
    { id: 3, message: 'LE-1A32 vibration analysis complete - all normal', type: 'info', time: '1 hr ago' },
    { id: 4, message: 'New maintenance task created for CF-5672', type: 'info', time: '2 hrs ago' },
    { id: 5, message: 'PW-1100 EGT calibration successful', type: 'success', time: '3 hrs ago' },
  ];

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
  }
}
