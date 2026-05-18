import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-technician',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './technician.html',
  styleUrl: './technician.scss'
})
export class Technician implements OnInit {
  statusFilter = 'all';
  priorityFilter = 'all';

  allTasks: any[] = [];
  isLoading = true;

  mockWeeklyProgress = [
    { day: 'Mon', completed: 2, assigned: 3 },
    { day: 'Tue', completed: 3, assigned: 4 },
    { day: 'Wed', completed: 1, assigned: 2 },
    { day: 'Thu', completed: 4, assigned: 4 },
    { day: 'Fri', completed: 2, assigned: 3 },
    { day: 'Sat', completed: 1, assigned: 1 },
    { day: 'Sun', completed: 0, assigned: 0 },
  ];

  hoveredRow: number | null = null;

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading = true;
    this.dataService.getTasks().subscribe({
      next: (tasks) => {
        // Map backend Tache entities to frontend format if needed
        this.allTasks = tasks.map(t => ({
          id: t.id,
          title: t.description || 'Unknown Task',
          description: t.description,
          engineName: t.taxonomie?.nom || 'Unknown Engine',
          category: 'maintenance',
          priority: t.priorite || 'medium',
          status: t.status || 'pending',
          dueDate: '2026-05-20' // Backend doesn't have dueDate yet
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoading = false;
      }
    });
  }

  get filteredTasks() {
    let filtered = this.allTasks;
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === this.statusFilter);
    }
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === this.priorityFilter);
    }
    return filtered;
  }

  get myPending() { return this.filteredTasks.filter(t => t.status === 'pending').length; }
  get myInProgress() { return this.filteredTasks.filter(t => t.status === 'in_progress').length; }
  get myCompleted() { return this.filteredTasks.filter(t => t.status === 'completed').length; }
  get criticalCount() { return this.filteredTasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length; }

  handleStartTask(id: string) {
    this.dataService.updateTaskStatus(id, 'in_progress').subscribe(() => {
      this.loadTasks();
    });
  }

  handleCompleteTask(id: string) {
    this.dataService.updateTaskStatus(id, 'completed').subscribe(() => {
      this.loadTasks();
    });
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
