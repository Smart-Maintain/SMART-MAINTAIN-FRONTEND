import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './predictions.html',
  styleUrl: './predictions.scss'
})
export class Predictions implements OnInit, OnDestroy {
  alerts: any[] = [];
  teams: any[] = [];
  isLoading = true;
  selectedTeamIds: Record<number | string, string> = {};
  private pollingSubscription?: Subscription;
  
  private _filterType: 'all' | 'critical' | 'warning' | 'normal' = 'all';
  private _searchQuery = '';
  filteredAlerts: any[] = [];

  get filterType(): 'all' | 'critical' | 'warning' | 'normal' {
    return this._filterType;
  }
  set filterType(value: 'all' | 'critical' | 'warning' | 'normal') {
    this._filterType = value;
    this.applyFilter();
  }

  get searchQuery(): string {
    return this._searchQuery;
  }
  set searchQuery(value: string) {
    this._searchQuery = value;
    this.applyFilter();
  }

  constructor(
    private dataService: DataService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadTeams();
    this.pollingSubscription = timer(0, 2000).subscribe(() => {
      this.loadAlerts();
    });
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadAlerts() {
    this.dataService.getAlerts().subscribe({
      next: (data) => {
        this.alerts = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alerts/predictions', err);
        this.isLoading = false;
      }
    });
  }

  loadTeams() {
    this.dataService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
      },
      error: (err) => console.error('Failed to load teams', err)
    });
  }

  applyFilter() {
    this.filteredAlerts = this.alerts.filter(alert => {
      // Filter by type
      if (this.filterType !== 'all') {
        const type = alert.type?.toLowerCase() || '';
        if (this.filterType === 'critical' && type !== 'critical' && type !== 'danger') {
          return false;
        }
        if (this.filterType === 'warning' && type !== 'warning') {
          return false;
        }
        if (this.filterType === 'normal' && type !== 'normal' && type !== 'info') {
          return false;
        }
      }
      
      // Filter by search query
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const msg = alert.message?.toLowerCase() || '';
        const engine = alert.engineName?.toLowerCase() || '';
        return msg.includes(query) || engine.includes(query);
      }

      return true;
    });
  }

  convertAlert(alert: any) {
    const teamId = this.selectedTeamIds[alert.id];
    if (!teamId) {
      alert.errorMessage = 'Please select an execution team first.';
      return;
    }
    
    alert.isConverting = true;
    alert.errorMessage = null;
    
    this.dataService.convertAlertToTask(alert.id, teamId).subscribe({
      next: () => {
        alert.isConverting = false;
        alert.status = 'CONVERTED';
        this.loadAlerts(); // reload
      },
      error: (err) => {
        alert.isConverting = false;
        alert.errorMessage = err.error?.message || 'Failed to convert alert to task.';
      }
    });
  }

  getAlertColor(type: string) {
    const t = type?.toLowerCase() || '';
    if (t === 'critical' || t === 'danger') return '#ff6b6b';
    if (t === 'warning') return '#F28C28';
    return '#00A8E8';
  }
}
