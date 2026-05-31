import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-engineer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './engineer.html',
  styleUrl: './engineer.scss'
})
export class Engineer implements OnInit {
  engines: any[] = [];
  teams: any[] = [];
  maintenances: any[] = [];
  taskReports: any[] = [];
  reviewNotes: Record<string, string> = {};
  isLoadingData = true;

  taskHistory = [
    { week: 'W1', created: 5, completed: 4 },
    { week: 'W2', created: 3, completed: 5 },
    { week: 'W3', created: 7, completed: 3 },
    { week: 'W4', created: 4, completed: 6 },
  ];

  formData = {
    title: '',
    description: '',
    engineId: '',
    engineName: '',
    equipeId: '',
    maintenanceId: '',
    priority: 'medium',
    category: 'inspection',
    dueDate: '',
  };

  assignmentReportForm = {
    maintenanceId: '',
    title: '',
    content: '',
  };

  submitted = false;
  isPending = false;

  myTasks: any[] = [];
  
  expandedTaskId: string | null = null;
  toggleTask(id: string) {
    this.expandedTaskId = this.expandedTaskId === id ? null : id;
  }

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoadingData = true;
    
    // Load Equipements (Engines)
    this.dataService.getEquipements().subscribe({
      next: (eqs) => {
        console.log('Fetched equipments:', eqs);
        this.engines = eqs.map(e => ({
          id: e.id,
          name: `${e.nom} - ${e.model} (${e.reference})`,
          taxonomieId: e.taxonomie?.id
        }));
      },
      error: (err) => {
        console.error('Error fetching equipments:', err);
      }
    });

    this.dataService.getTeams().subscribe(teams => this.teams = teams);
    this.dataService.getMaintenances().subscribe(maintenances => this.maintenances = maintenances);
    this.dataService.getReports().subscribe(reports => {
      this.taskReports = reports.filter(report => report.type === 'TASK' && report.status === 'SUBMITTED');
    });

    // Load Tasks
    this.dataService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Fetched tasks:', tasks);
        this.myTasks = tasks.map(t => ({
          id: t.id,
          title: t.description || 'Unknown Task',
          description: t.description,
          engineName: t.taxonomie?.nom || 'Unknown Engine',
          priority: t.priorite || 'medium',
          status: t.status || 'pending',
          equipeId: t.equipe?.id || '',
          maintenanceId: t.maintenance?.id || '',
          taxonomieId: t.taxonomie?.id || ''
        }));
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err);
        this.isLoadingData = false;
      }
    });
  }

  get pendingTasksCount() {
    return this.myTasks.filter(t => t.status === 'pending').length;
  }

  handleEngineChange() {
    const engine = this.engines.find(eng => eng.id == this.formData.engineId);
    this.formData.engineName = engine?.name || '';
  }

  handleSubmit() {
    if (!this.formData.title || !this.formData.engineId) return;

    this.isPending = true;
    
    const engine = this.engines.find(eng => eng.id == this.formData.engineId);

    const newTask = {
      description: this.formData.title + (this.formData.description ? ': ' + this.formData.description : ''),
      priorite: this.formData.priority,
      status: 'pending',
      taxonomieId: engine?.taxonomieId,
      equipeId: this.formData.equipeId || null,
      maintenanceId: this.formData.maintenanceId || null
    };

    this.dataService.createTask(newTask).subscribe({
      next: () => {
        this.isPending = false;
        this.loadData();
        
        this.formData = {
          title: '',
          description: '',
          engineId: '',
          engineName: '',
          equipeId: '',
          maintenanceId: '',
          priority: 'medium',
          category: 'inspection',
          dueDate: '',
        };
        
        this.submitted = true;
        setTimeout(() => this.submitted = false, 3000);
      },
      error: () => {
        this.isPending = false;
      }
    });
  }

  updateTaskStatus(id: string, status: string) {
    this.dataService.updateTaskStatus(id, status).subscribe(() => {
      this.loadData();
    });
  }

  editTask(task: any) {
    const description = window.prompt('Task description', task.title);
    if (!description) return;
    this.dataService.updateTask(task.id, {
      description,
      priorite: task.priority,
      status: task.status,
      equipeId: task.equipeId || null,
      maintenanceId: task.maintenanceId || null,
      taxonomieId: task.taxonomieId || null
    }).subscribe(() => this.loadData());
  }

  deleteTask(id: string) {
    this.dataService.deleteTask(id).subscribe(() => this.loadData());
  }

  reviewTaskReport(report: any, status: 'APPROVED' | 'MODIFICATION_REQUESTED') {
    this.dataService.reviewReport(report.id, status, this.reviewNotes[report.id] || '').subscribe(() => {
      this.reviewNotes[report.id] = '';
      this.loadData();
    });
  }

  sendAssignmentReport() {
    if (!this.assignmentReportForm.maintenanceId || !this.assignmentReportForm.title || !this.assignmentReportForm.content) return;
    const user = this.auth.user();
    this.dataService.createReport({
      type: 'ASSIGNMENT',
      tacheId: null,
      maintenanceId: this.assignmentReportForm.maintenanceId,
      title: this.assignmentReportForm.title,
      content: this.assignmentReportForm.content,
      authorRole: 'ENGINEER',
      authorEmail: user?.email || ''
    }).subscribe(report => {
      this.dataService.submitReport(report.id).subscribe(() => {
        this.assignmentReportForm = { maintenanceId: '', title: '', content: '' };
        this.loadData();
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
