import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-engineer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './engineer.html',
  styleUrl: './engineer.scss'
})
export class Engineer implements OnInit {
  engines: any[] = [];
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
    priority: 'medium',
    category: 'inspection',
    dueDate: '',
  };

  submitted = false;
  isPending = false;

  myTasks: any[] = []; 

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
          status: t.status || 'pending'
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
      taxonomie: { id: engine?.taxonomieId } // Basic mapping
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

  getBadgeColor(type: string, value: string) {
    if (type === 'priority') {
      return value === 'critical' ? '#ff6b6b' : value === 'high' ? '#F28C28' : value === 'medium' ? '#00A8E8' : '#8A8A93';
    } else if (type === 'status') {
      return value === 'completed' ? '#00A8E8' : value === 'in_progress' ? '#F28C28' : value === 'pending' ? '#8A8A93' : '#ff6b6b';
    }
    return '#8A8A93';
  }
}
