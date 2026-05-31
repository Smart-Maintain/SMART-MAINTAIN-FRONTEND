import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-technician',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './technician.html',
  styleUrl: './technician.scss'
})
export class Technician implements OnInit {
  statusFilter = 'all';
  priorityFilter = 'all';

  allTasks: any[] = [];
  isLoading = true;
  notes: Record<string, string> = {};
  reportContents: Record<string, string> = {};

  mockWeeklyProgress = [
    { day: 'Mon', completed: 2, assigned: 3 },
    { day: 'Tue', completed: 3, assigned: 4 },
    { day: 'Wed', completed: 1, assigned: 2 },
    { day: 'Thu', completed: 4, assigned: 4 },
    { day: 'Fri', completed: 2, assigned: 3 },
    { day: 'Sat', completed: 1, assigned: 1 },
    { day: 'Sun', completed: 0, assigned: 0 },
  ];

  expandedTaskId: string | null = null;
  hoveredRow: string | null = null;

  toggleTask(id: string) {
    this.expandedTaskId = this.expandedTaskId === id ? null : id;
  }

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    console.log('Technician page initialized');
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading = true;
    this.dataService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Technician fetched tasks:', tasks);
        // Map backend Tache entities to frontend format if needed
        this.allTasks = tasks.map(t => ({
          id: t.id,
          title: t.description || 'Unknown Task',
          description: t.description,
          engineName: t.taxonomie?.nom || 'Unknown Engine',
          category: 'maintenance',
          priority: t.priorite || 'medium',
          status: t.status || 'pending',
          dueDate: '2026-05-20', // Backend doesn't have dueDate yet
          technicianNote: t.technicianNote || '',
          reportStatus: t.rapports?.[0]?.status || ''
        }));
        console.log('Technician mapped tasks:', this.allTasks.length, this.allTasks);
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
    this.dataService.checkTaskDone(id).subscribe(() => {
      this.loadTasks();
    });
  }

  saveNote(task: any) {
    const note = this.notes[task.id] || task.technicianNote || '';
    this.dataService.addTechnicianNote(task.id, note).subscribe(() => {
      this.notes[task.id] = '';
      this.loadTasks();
    });
  }

  sendTaskReport(task: any) {
    const content = (this.reportContents[task.id] || '').trim();
    if (!content) return;
    const user = this.auth.user();
    this.dataService.createReport({
      type: 'TASK',
      tacheId: task.id,
      maintenanceId: null,
      title: `Task rapport #${task.id}`,
      content,
      authorRole: 'TECHNICIAN',
      authorEmail: user?.email || ''
    }).subscribe(report => {
      this.dataService.submitReport(report.id).subscribe(() => {
        this.reportContents[task.id] = '';
        this.loadTasks();
      });
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
