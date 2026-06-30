import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './technician.scss',
})
export class Technician implements OnInit {
  statusFilter = 'all';
  priorityFilter = 'all';

  allTasks: any[] = [];
  isLoading = true;
  notes: Record<string, string> = {};
  reportContents: Record<string, string> = {};

  availablePieces: any[] = [];
  pieceRequestData: Record<string, { pieceId: string; quantite: number }> = {};

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

  constructor(
    public auth: AuthService,
    private dataService: DataService,
  ) {}

  ngOnInit() {
    console.log('Technician page initialized');
    this.loadTasks();
    this.loadPieces();
    this.loadTeams();
  }

  loadPieces() {
    this.dataService.getPieces().subscribe((res) => {
      this.availablePieces = res;
    });
  }

  loadTasks() {
    this.isLoading = true;
    const user = this.auth.user();
    this.dataService.getTasks(user?.role, user?.name).subscribe({
      next: (tasks) => {
        console.log('Technician fetched tasks:', tasks);
        // Map backend Tache entities to frontend format if needed
        this.allTasks = tasks.map((t) => {
          this.pieceRequestData[t.id] = this.pieceRequestData[t.id] || { pieceId: '', quantite: 1 };
          return {
            id: t.id,
            title: t.description || 'Unknown Task',
            description: t.description,
            engineName: t.taxonomie?.nom || 'Unknown Engine',
            category: 'maintenance',
            priority: t.priorite || 'medium',
            status: t.status || 'pending',
            dueDate: '2026-05-20', // Backend doesn't have dueDate yet
            technicianNote: t.technicianNote || '',
            reportStatus: t.rapports?.[0]?.status || '',
            totalCost: t.totalCost || 0,
            pieceRequests: t.pieceRequests || [],
            subTasks: t.subTasks || [],
            equipe: t.equipe,
          };
        });
        console.log('Technician mapped tasks:', this.allTasks.length, this.allTasks);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoading = false;
      },
    });
  }

  get filteredTasks() {
    let filtered = this.allTasks;

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === this.statusFilter);
    }
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.priority === this.priorityFilter);
    }
    return filtered;
  }

  get myPending() {
    return this.filteredTasks.filter((t) => t.status === 'pending').length;
  }
  get myInProgress() {
    return this.filteredTasks.filter((t) => t.status === 'in_progress').length;
  }
  get myCompleted() {
    return this.filteredTasks.filter((t) => t.status === 'completed').length;
  }
  get criticalCount() {
    return this.filteredTasks.filter((t) => t.priority === 'critical' && t.status !== 'completed')
      .length;
  }

  handleStartTask(id: string) {
    this.dataService.updateTaskStatus(id, 'in_progress').subscribe(() => {
      this.loadTasks();
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
        this.loadTasks(); // revert changes
      }
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
    this.dataService
      .createReport({
        type: 'TASK',
        tacheId: task.id,
        maintenanceId: null,
        title: `Task rapport #${task.id}`,
        content,
        authorRole: 'TECHNICIAN',
        authorEmail: user?.email || '',
      })
      .subscribe((report) => {
        this.dataService.submitReport(report.id).subscribe(() => {
          this.reportContents[task.id] = '';
          this.loadTasks();
        });
      });
  }

  requestPiece(task: any) {
    const data = this.pieceRequestData[task.id];
    if (!data || !data.pieceId || !data.quantite || Number(data.quantite) <= 0) return;

    const payload = {
      tacheId: task.id,
      pieceId: data.pieceId,
      quantite: Number(data.quantite),
      requestedBy: this.auth.user()?.email || 'technician',
    };

    this.dataService.createPieceRequest(payload).subscribe({
      next: () => {
        this.loadTasks();
        data.pieceId = '';
        data.quantite = 1;
      },
      error: (err) => console.error('Failed to request piece', err),
    });
  }

  // Inline subtask creation
  newSubTaskForms: Record<string, { description: string; assignedMemberId: string; assignedMemberName: string; open: boolean }> = {};
  teams: any[] = [];

  loadTeams() {
    this.dataService.getTeams().subscribe((teams) => (this.teams = teams));
  }

  getTeamMembersForTask(task: any): { id: string; name: string }[] {
    if (!task.equipe) return [];
    const team = this.teams.find((t) => t.id === task.equipe.id);
    if (!team) return [];
    const members: { id: string; name: string }[] = [];
    // Add the leader
    if (team.leaderEngineerId && team.leaderEngineerName) {
      members.push({ id: team.leaderEngineerId, name: team.leaderEngineerName });
    }
    // Add technicians
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
        this.loadTasks();
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
