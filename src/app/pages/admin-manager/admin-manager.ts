import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-manager.html',
  styleUrl: './admin-manager.scss'
})
export class AdminManager implements OnInit {
  activeTab: 'overview' | 'teams' | 'assignments' | 'reports' | 'team' | 'costs' | 'accounts' | 'feedbacks' = 'overview';

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
  teams: any[] = [];
  maintenances: any[] = [];
  engineers: any[] = [];
  technicians: any[] = [];
  equipements: any[] = [];
  reports: any[] = [];
  selectedTechnicianIds: string[] = [];
  reviewNotes: Record<string, string> = {};

  users: any[] = [];
  bugFeedbacks: any[] = [];
  
  userForm = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role: 'INGENIEUR'
  };
  
  editingUser: any = null;
  createUserModalOpen = false;

  expandedTaskId: string | null = null;
  
  toggleTask(id: string) {
    this.expandedTaskId = this.expandedTaskId === id ? null : id;
  }

  teamForm = {
    nom: '',
    specialite: '',
    leaderEngineerId: '',
  };

  assignmentForm = {
    description: '',
    typeMaintenance: 'PREVENTIVE',
    equipementId: '',
    equipeId: '',
    dateDebut: '',
    dateFin: '',
  };

  taskForm = {
    description: '',
    priorite: 'medium',
    status: 'pending',
    equipeId: '',
    maintenanceId: '',
    taxonomieId: '',
  };

  healthReadings = [
    { id: 1, engineName: 'TF-2841', status: 'normal' },
    { id: 2, engineName: 'CF-5672', status: 'warning' },
    { id: 3, engineName: 'GP-7200', status: 'critical' },
  ];

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    this.loadTasks();
    this.loadOperationsData();
    this.loadAccounts();
    this.loadFeedbacks();
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
          dueDate: '2026-05-20',
          equipeId: t.equipe?.id || '',
          maintenanceId: t.maintenance?.id || '',
          taxonomieId: t.taxonomie?.id || ''
        }));
        this.isLoadingTasks = false;
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoadingTasks = false;
      }
    });
  }

  loadOperationsData() {
    this.dataService.getTeams().subscribe(teams => this.teams = teams);
    this.dataService.getMaintenances().subscribe(maintenances => this.maintenances = maintenances);
    this.dataService.getEquipements().subscribe(equipements => {
      this.equipements = equipements.map(e => ({
        ...e,
        label: `${e.nom} - ${e.model || 'Model'}`
      }));
    });
    this.dataService.getReports().subscribe(reports => {
      this.reports = reports.filter(report => report.type === 'ASSIGNMENT' && report.status === 'SUBMITTED');
    });
    this.dataService.getUsersByRole('INGENIEUR').subscribe({
      next: users => this.engineers = users,
      error: () => this.engineers = [{ id: '00000000-0000-0000-0000-000000000001', prenom: 'Engineer', nom: 'Lead', email: 'engineer@test.com' }]
    });
    this.dataService.getUsersByRole('OPERATEUR').subscribe({
      next: users => this.technicians = users,
      error: () => this.technicians = [{ id: '00000000-0000-0000-0000-000000000002', prenom: 'Tech', nom: 'One', email: 'tech1@test.com' }]
    });
  }

  setActiveTab(tab: 'overview' | 'teams' | 'assignments' | 'reports' | 'team' | 'costs' | 'accounts' | 'feedbacks') {
    this.activeTab = tab;
  }

  completeTask(id: string) {
    this.dataService.updateTaskStatus(id, 'completed').subscribe(() => {
      this.loadTasks();
    });
  }

  errorMessage: string | null = null;

  createTeam() {
    this.errorMessage = null;
    if (!this.teamForm.leaderEngineerId) {
      this.errorMessage = 'Please select a leader engineer.';
      return;
    }
    if (!this.selectedTechnicianIds || this.selectedTechnicianIds.length === 0) {
      this.errorMessage = 'Please select at least one technician.';
      return;
    }

    const leader = this.engineers.find(engineer => engineer.id === this.teamForm.leaderEngineerId);
    const selectedTechnicians = this.technicians.filter(technician => this.selectedTechnicianIds.includes(technician.id));
    const payload = {
      ...this.teamForm,
      leaderEngineerName: this.userLabel(leader),
      technicianIds: this.selectedTechnicianIds,
      technicianNames: selectedTechnicians.map(technician => this.userLabel(technician))
    };

    this.dataService.createTeam(payload).subscribe({
      next: () => {
        this.teamForm = { nom: '', specialite: '', leaderEngineerId: '' };
        this.selectedTechnicianIds = [];
        this.loadOperationsData();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create team. Please try again.';
      }
    });
  }

  deleteTeam(id: string) {
    this.dataService.deleteTeam(id).subscribe(() => this.loadOperationsData());
  }

  createMaintenance() {
    const payload = {
      description: this.assignmentForm.description,
      status: 'IN_PROGRESS',
      dateDebut: this.assignmentForm.dateDebut || null,
      dateFin: this.assignmentForm.dateFin || null,
      equipementId: this.assignmentForm.equipementId ? Number(this.assignmentForm.equipementId) : null,
      equipeId: this.assignmentForm.equipeId || null,
      typeMaintenance: this.assignmentForm.typeMaintenance
    };

    this.dataService.createMaintenance(payload).subscribe(() => {
      this.assignmentForm = {
        description: '',
        typeMaintenance: 'PREVENTIVE',
        equipementId: '',
        equipeId: '',
        dateDebut: '',
        dateFin: '',
      };
      this.loadOperationsData();
    });
  }

  createTask() {
    const payload = {
      description: this.taskForm.description,
      priorite: this.taskForm.priorite,
      status: this.taskForm.status,
      equipeId: this.taskForm.equipeId || null,
      maintenanceId: this.taskForm.maintenanceId || null,
      taxonomieId: this.taskForm.taxonomieId ? Number(this.taskForm.taxonomieId) : null,
    };

    this.dataService.createTask(payload).subscribe(() => {
      this.taskForm.description = '';
      this.loadTasks();
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
      taxonomieId: task.taxonomieId || null,
    }).subscribe(() => this.loadTasks());
  }

  deleteTask(id: string) {
    this.dataService.deleteTask(id).subscribe(() => this.loadTasks());
  }

  reviewReport(report: any, status: 'APPROVED' | 'MODIFICATION_REQUESTED') {
    this.dataService.reviewReport(report.id, status, this.reviewNotes[report.id] || '').subscribe(() => {
      this.reviewNotes[report.id] = '';
      this.loadOperationsData();
    });
  }

  get criticalAlertsCount() {
    return this.healthReadings.filter(h => h.status === 'critical').length;
  }

  userLabel(user: any) {
    if (!user) return '';
    return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || user.id;
  }

  getBadgeColor(type: string, value: string) {
    if (type === 'priority') {
      return value === 'critical' ? '#ff6b6b' : value === 'high' ? '#F28C28' : value === 'medium' ? '#00A8E8' : '#8A8A93';
    } else if (type === 'status') {
      return value === 'completed' ? '#00A8E8' : value === 'in_progress' ? '#F28C28' : value === 'pending' ? '#8A8A93' : '#ff6b6b';
    }
    return '#8A8A93';
  }

  loadAccounts() {
    this.dataService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (err) => console.error('Error loading users', err)
    });
  }

  get pendingUsers() {
    return this.users.filter(u => u.accountStatus === 'PENDING_APPROVAL');
  }

  loadFeedbacks() {
    this.dataService.getBugFeedbacks().subscribe({
      next: (data) => {
        this.bugFeedbacks = data;
      },
      error: (err) => console.error('Error loading feedbacks', err)
    });
  }

  approveUser(user: any) {
    this.dataService.updateUserStatus(user.id, 'APPROVED').subscribe(() => {
      this.loadAccounts();
    });
  }

  suspendUser(user: any) {
    this.dataService.updateUserStatus(user.id, 'SUSPENDED').subscribe(() => {
      this.loadAccounts();
    });
  }

  unsuspendUser(user: any) {
    this.dataService.updateUserStatus(user.id, 'APPROVED').subscribe(() => {
      this.loadAccounts();
    });
  }

  deleteUserAccount(userId: string) {
    if (!confirm('Are you sure you want to delete this account?')) return;
    this.dataService.deleteUser(userId).subscribe(() => {
      this.loadAccounts();
    });
  }

  openCreateUserModal() {
    this.createUserModalOpen = true;
    this.editingUser = null;
    this.userForm = { nom: '', prenom: '', email: '', motDePasse: '', role: 'INGENIEUR' };
  }

  openEditUserModal(user: any) {
    this.createUserModalOpen = true;
    this.editingUser = user;
    this.userForm = {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      motDePasse: '',
      role: user.role
    };
  }

  closeUserModal() {
    this.createUserModalOpen = false;
    this.editingUser = null;
  }

  saveUser() {
    if (!this.userForm.email || !this.userForm.nom || !this.userForm.prenom) return;
    
    if (this.editingUser) {
      const payload = {
        nom: this.userForm.nom,
        prenom: this.userForm.prenom,
        email: this.userForm.email,
        motDePasse: this.userForm.motDePasse || undefined
      };
      this.dataService.updateUser(this.editingUser.id, payload).subscribe(() => {
        this.closeUserModal();
        this.loadAccounts();
      });
    } else {
      if (!this.userForm.motDePasse) return;
      this.dataService.createUser(this.userForm.role, this.userForm).subscribe(() => {
        this.closeUserModal();
        this.loadAccounts();
      });
    }
  }
}
