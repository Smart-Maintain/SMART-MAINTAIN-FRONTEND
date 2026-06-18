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
  activeTab: 'overview' | 'teams' | 'assignments' | 'reports' | 'team' | 'costs' | 'accounts' | 'feedbacks' | 'engines' = 'overview';

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

  dynamicTeamPerformance: any[] = [];

  tasks: any[] = [];
  isLoadingTasks = true;
  teams: any[] = [];
  maintenances: any[] = [];
  engineers: any[] = [];
  technicians: any[] = [];
  managers: any[] = [];
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

  specialties = [
    'Engine Maintenance',
    'Avionics',
    'Landing Gear',
    'Hydraulics',
    'Airframe Structural',
    'Electrical Systems',
    'Systems Calibration'
  ];
  
  toggleTask(id: string) {
    this.expandedTaskId = this.expandedTaskId === id ? null : id;
  }

  teamForm = {
    nom: '',
    specialite: 'Engine Maintenance',
    leaderEngineerId: '',
  };

  editingTeam: any = null;
  editTeamForm = {
    nom: '',
    specialite: 'Engine Maintenance',
    leaderEngineerId: '',
    technicianIds: [] as string[]
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

  // Engine Addition properties
  taxonomies: any[] = [];
  engineForm = {
    nom: '',
    reference: '',
    model: '',
    status: 'En service',
    taxonomieId: ''
  };
  taxonomyForm = {
    code: '',
    nom: '',
    description: ''
  };
  showCreateTaxonomy = false;

  constructor(public auth: AuthService, private dataService: DataService) {}

  ngOnInit() {
    this.loadTasks();
    this.loadOperationsData();
    this.loadAccounts();
    this.loadFeedbacks();
    this.loadTaxonomies();
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
          dueDate: '2026-06-01',
          equipeId: t.equipe?.id || '',
          maintenanceId: t.maintenance?.id || '',
          taxonomieId: t.taxonomie?.id || '',
          description: t.description,
          technicianNote: t.note,
          category: t.taxonomie?.code || 'General'
        }));
        this.isLoadingTasks = false;
        this.calculateTeamPerformance();
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoadingTasks = false;
      }
    });
  }

  loadOperationsData() {
    this.dataService.getTeams().subscribe(teams => {
      this.teams = teams;
      this.calculateTeamPerformance();
    });
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
      error: () => this.engineers = []
    });
    this.dataService.getUsersByRole('OPERATEUR').subscribe({
      next: users => this.technicians = users,
      error: () => this.technicians = []
    });
    this.dataService.getUsersByRole('MANAGER' as any).subscribe({
      next: users => this.managers = users,
      error: () => this.managers = []
    });
  }

  loadTaxonomies() {
    this.dataService.getTaxonomies().subscribe({
      next: data => this.taxonomies = data,
      error: err => console.error('Failed to load taxonomies', err)
    });
  }

  createTaxonomy() {
    if (!this.taxonomyForm.code || !this.taxonomyForm.nom) return;
    this.dataService.createTaxonomie(this.taxonomyForm).subscribe({
      next: () => {
        this.taxonomyForm = { code: '', nom: '', description: '' };
        this.showCreateTaxonomy = false;
        this.loadTaxonomies();
      },
      error: err => console.error('Failed to create taxonomy', err)
    });
  }

  createEngine() {
    if (!this.engineForm.nom || !this.engineForm.reference || !this.engineForm.taxonomieId) return;
    const payload = {
      nom: this.engineForm.nom,
      reference: this.engineForm.reference,
      model: this.engineForm.model,
      status: this.engineForm.status,
      taxonomie: {
        id: Number(this.engineForm.taxonomieId)
      }
    };
    this.dataService.createEquipement(payload).subscribe({
      next: () => {
        this.engineForm = { nom: '', reference: '', model: '', status: 'En service', taxonomieId: '' };
        this.loadOperationsData();
      },
      error: err => console.error('Failed to create engine', err)
    });
  }

  get leaderCandidates() {
    return [...this.engineers, ...this.managers];
  }

  get technicianCandidates() {
    return [...this.technicians, ...this.managers];
  }

  calculateTeamPerformance() {
    if (!this.teams || this.teams.length === 0) return;
    this.dynamicTeamPerformance = this.teams.map(team => {
      const teamTasks = this.tasks.filter(t => t.equipeId === team.id);
      const completed = teamTasks.filter(t => t.status === 'completed').length;
      const left = teamTasks.filter(t => t.status !== 'completed').length;
      const assigned = teamTasks.length;
      const efficiency = assigned > 0 ? Math.round((completed / assigned) * 100) : 95;

      return {
        id: team.id,
        name: team.nom,
        specialite: team.specialite,
        assigned: assigned,
        completed: completed,
        left: left,
        efficiency: efficiency
      };
    });
  }

  setActiveTab(tab: 'overview' | 'teams' | 'assignments' | 'reports' | 'team' | 'costs' | 'accounts' | 'feedbacks' | 'engines') {
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

    const leader = this.leaderCandidates.find(user => user.id === this.teamForm.leaderEngineerId);
    const selectedTechUsers = this.technicianCandidates.filter(user => this.selectedTechnicianIds.includes(user.id));
    
    const payload = {
      ...this.teamForm,
      leaderEngineerName: this.userLabel(leader),
      technicianIds: this.selectedTechnicianIds,
      technicianNames: selectedTechUsers.map(user => this.userLabel(user))
    };

    this.dataService.createTeam(payload).subscribe({
      next: () => {
        this.teamForm = { nom: '', specialite: 'Engine Maintenance', leaderEngineerId: '' };
        this.selectedTechnicianIds = [];
        this.loadOperationsData();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create team. Please try again.';
      }
    });
  }

  openEditTeam(team: any) {
    this.editingTeam = team;
    this.editTeamForm = {
      nom: team.nom,
      specialite: team.specialite || 'Engine Maintenance',
      leaderEngineerId: team.leaderEngineerId || '',
      technicianIds: team.technicianIds || []
    };
  }

  closeEditTeam() {
    this.editingTeam = null;
  }

  saveTeam() {
    if (!this.editingTeam || !this.editTeamForm.leaderEngineerId || this.editTeamForm.technicianIds.length === 0) return;

    const leader = this.leaderCandidates.find(user => user.id === this.editTeamForm.leaderEngineerId);
    const selectedTechUsers = this.technicianCandidates.filter(user => this.editTeamForm.technicianIds.includes(user.id));

    const payload = {
      nom: this.editTeamForm.nom,
      specialite: this.editTeamForm.specialite,
      leaderEngineerId: this.editTeamForm.leaderEngineerId,
      leaderEngineerName: this.userLabel(leader),
      technicianIds: this.editTeamForm.technicianIds,
      technicianNames: selectedTechUsers.map(user => this.userLabel(user))
    };

    this.dataService.updateTeam(this.editingTeam.id, payload).subscribe({
      next: () => {
        this.closeEditTeam();
        this.loadOperationsData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update team.');
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
      const v = value?.toLowerCase() || '';
      return v === 'critical' ? '#ff6b6b' : v === 'high' ? '#F28C28' : v === 'medium' ? '#00A8E8' : '#8A8A93';
    } else if (type === 'status') {
      const v = value?.toLowerCase() || '';
      return v === 'completed' ? '#00A8E8' : v === 'in_progress' ? '#F28C28' : v === 'pending' ? '#8A8A93' : '#ff6b6b';
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
