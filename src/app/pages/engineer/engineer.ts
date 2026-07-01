import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './engineer.scss',
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

  constructor(
    public auth: AuthService,
    private dataService: DataService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoadingData = true;

    // Load Equipements (Engines)
    this.dataService.getEquipements().subscribe({
      next: (eqs) => {
        this.engines = eqs.map((e) => ({
          id: e.id,
          name: `${e.nom} - ${e.model} (${e.reference})`,
          taxonomieId: e.taxonomie?.id,
        }));
      },
      error: (err) => {
        console.error('Error fetching equipments:', err);
      },
    });

    this.dataService.getTeams().subscribe((teams) => (this.teams = teams));
    this.dataService
      .getMaintenances()
      .subscribe((maintenances) => (this.maintenances = maintenances));
    this.dataService.getReports().subscribe((reports) => {
      this.taskReports = reports.filter(
        (report) => report.type === 'TASK' && report.status === 'SUBMITTED',
      );
    });

    // Load Tasks
    this.dataService.getTasks().subscribe({
      next: (tasks) => {
        this.myTasks = tasks.map((t) => ({
          id: t.id,
          title: t.description || 'Unknown Task',
          description: t.description,
          engineName: t.taxonomie?.nom || 'Unknown Engine',
          priority: t.priorite || 'medium',
          status: t.status || 'pending',
          equipeId: t.equipe?.id || '',
          maintenanceId: t.maintenance?.id || '',
          taxonomieId: t.taxonomie?.id || '',
          subTasks: t.subTasks || [],
        }));
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err);
        this.isLoadingData = false;
      },
    });
  }

  get pendingTasksCount() {
    return this.myTasks.filter((t) => t.status === 'pending').length;
  }

  handleEngineChange() {
    const engine = this.engines.find((eng) => eng.id == this.formData.engineId);
    this.formData.engineName = engine?.name || '';
  }

  handleSubmit() {
    if (!this.formData.title || !this.formData.engineId) return;

    this.isPending = true;

    const engine = this.engines.find((eng) => eng.id == this.formData.engineId);

    const newTask = {
      description:
        this.formData.title + (this.formData.description ? ': ' + this.formData.description : ''),
      priorite: this.formData.priority,
      status: 'pending',
      taxonomieId: engine?.taxonomieId,
      equipeId: this.formData.equipeId || null,
      maintenanceId: this.formData.maintenanceId || null,
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
        setTimeout(() => (this.submitted = false), 3000);
      },
      error: () => {
        this.isPending = false;
      },
    });
  }

  updateSubTaskStatus(taskId: string, subTaskId: string, status: string) {
    const username = this.auth.user()?.name || '';
    this.dataService.updateSubTaskStatus(taskId, subTaskId, status, username).subscribe({
      next: (res) => {
        // Optimistically updated
      },
      error: (err) => {
        console.error('Error updating subtask status', err);
        alert('Failed to update subtask status. Make sure you are authorized.');
        this.loadData(); // revert changes
      }
    });
  }

  updateTaskStatus(id: string, status: string) {
    this.dataService.updateTaskStatus(id, status).subscribe(() => {
      this.loadData();
    });
  }

  editTaskModalOpen = false;
  editingTask: any = null;
  editTaskForm: any = {
    description: '',
    priorite: 'medium',
    status: 'pending',
    equipeId: '',
    maintenanceId: '',
    taxonomieId: '',
    subTasks: [] as any[],
  };

  getTeamMembers(equipeId: string) {
    if (!equipeId) return [];
    const team = this.teams.find((t) => t.id === equipeId);
    if (!team || !team.technicianIds) return [];
    const members = [];
    for (let i = 0; i < team.technicianIds.length; i++) {
      members.push({
        id: team.technicianIds[i],
        name: team.technicianNames[i],
      });
    }
    return members;
  }

  openEditTask(task: any) {
    this.editTaskModalOpen = true;
    this.editingTask = task;
    this.editTaskForm = {
      description: task.description || task.title,
      priorite: task.priority || 'medium',
      status: task.status || 'pending',
      equipeId: task.equipeId || '',
      maintenanceId: task.maintenanceId || '',
      taxonomieId: task.taxonomieId || '',
      subTasks: (task.subTasks || []).map((st: any) => ({ ...st })),
    };
  }

  closeEditTask() {
    this.editTaskModalOpen = false;
    this.editingTask = null;
  }

  addEditSubTask() {
    this.editTaskForm.subTasks.push({
      description: '',
      status: 'PENDING',
      assignedMemberId: null,
      assignedMemberName: null,
    });
  }

  removeEditSubTask(index: number) {
    this.editTaskForm.subTasks.splice(index, 1);
  }

  updateSubTaskAssignment(st: any, memberId: string) {
    st.assignedMemberId = memberId || null;
    if (memberId) {
      const members = this.getTeamMembers(this.editTaskForm.equipeId);
      const member = members.find((m) => m.id === memberId);
      st.assignedMemberName = member ? member.name : null;
    } else {
      st.assignedMemberName = null;
    }
  }

  saveTask() {
    if (!this.editingTask) return;
    this.dataService
      .updateTask(this.editingTask.id, {
        description: this.editTaskForm.description,
        priorite: this.editTaskForm.priorite,
        status: this.editTaskForm.status,
        equipeId: this.editTaskForm.equipeId || null,
        maintenanceId: this.editTaskForm.maintenanceId || null,
        taxonomieId: this.editTaskForm.taxonomieId || null,
        subTasks: this.editTaskForm.subTasks,
      })
      .subscribe(() => {
        this.closeEditTask();
        this.loadData();
      });
  }

  deleteTask(id: string) {
    this.dataService.deleteTask(id).subscribe(() => this.loadData());
  }

  reviewTaskReport(report: any, status: 'APPROVED' | 'MODIFICATION_REQUESTED') {
    this.dataService
      .reviewReport(report.id, status, this.reviewNotes[report.id] || '')
      .subscribe(() => {
        this.reviewNotes[report.id] = '';
        this.loadData();
      });
  }

  sendAssignmentReport() {
    if (
      !this.assignmentReportForm.maintenanceId ||
      !this.assignmentReportForm.title ||
      !this.assignmentReportForm.content
    )
      return;
    const user = this.auth.user();
    this.dataService
      .createReport({
        type: 'ASSIGNMENT',
        tacheId: null,
        maintenanceId: this.assignmentReportForm.maintenanceId,
        title: this.assignmentReportForm.title,
        content: this.assignmentReportForm.content,
        authorRole: 'ENGINEER',
        authorEmail: user?.email || '',
      })
      .subscribe((report) => {
        this.dataService.submitReport(report.id).subscribe(() => {
          this.assignmentReportForm = { maintenanceId: '', title: '', content: '' };
          this.loadData();
        });
      });
  }

  // Inline subtask creation
  newSubTaskForms: Record<string, { description: string; assignedMemberId: string; assignedMemberName: string; open: boolean }> = {};

  getTeamMembersForTask(task: any): { id: string; name: string }[] {
    if (!task.equipeId) return [];
    const team = this.teams.find((t) => t.id === task.equipeId);
    if (!team) return [];
    const members: { id: string; name: string }[] = [];
    if (team.leaderEngineerId && team.leaderEngineerName) {
      members.push({ id: team.leaderEngineerId, name: team.leaderEngineerName });
    }
    if (team.technicianIds && team.technicianNames) {
      for (let i = 0; i < team.technicianIds.length; i++) {
        members.push({ id: team.technicianIds[i], name: team.technicianNames[i] });
      }
    }
    return members;
  }

  isLeaderOrAdmin(): boolean {
    const role = this.auth.user()?.role;
    return role === 'admin' || role === 'manager' || role === 'engineer';
  }

  toggleNewSubTaskForm(taskId: string) {
    if (!this.newSubTaskForms[taskId]) {
      this.newSubTaskForms[taskId] = { description: '', assignedMemberId: '', assignedMemberName: '', open: false };
    }
    this.newSubTaskForms[taskId].open = !this.newSubTaskForms[taskId].open;
  }

  onSubTaskAssignChange(taskId: string, task: any) {
    const form = this.newSubTaskForms[taskId];
    if (form.assignedMemberId) {
      const members = this.getTeamMembersForTask(task);
      const member = members.find((m) => m.id === form.assignedMemberId);
      form.assignedMemberName = member ? member.name : '';
    } else {
      form.assignedMemberName = '';
    }
  }

  addInlineSubTask(taskId: string) {
    const form = this.newSubTaskForms[taskId];
    if (!form || !form.description.trim()) return;
    this.dataService.addSubTask(taskId, {
      description: form.description,
      assignedMemberId: form.assignedMemberId || undefined,
      assignedMemberName: form.assignedMemberName || undefined,
    }).subscribe({
      next: () => {
        form.description = '';
        form.assignedMemberId = '';
        form.assignedMemberName = '';
        form.open = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to add subtask', err);
        alert('Failed to add subtask.');
      },
    });
  }

  getBadgeColor(type: string, value: string) {
    if (type === 'priority') {
      return value === 'critical'
        ? '#ff6b6b'
        : value === 'high'
          ? '#F28C28'
          : value === 'medium'
            ? '#00A8E8'
            : '#8A8A93';
    } else if (type === 'status') {
      return value === 'completed'
        ? '#00A8E8'
        : value === 'in_progress'
          ? '#F28C28'
          : value === 'pending'
            ? '#8A8A93'
            : '#ff6b6b';
    }
    return '#8A8A93';
  }
}
