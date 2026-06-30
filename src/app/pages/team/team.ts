import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './team.scss',
})
export class TeamPage implements OnInit {
  myTeam: any = null;
  isLoading = true;

  constructor(
    private dataService: DataService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.dataService.getTeams().subscribe({
      next: (teams) => {
        const user = this.auth.user();
        if (user) {
          const normalize = (s: string) => (s ? s.replace(/\s+/g, '').toLowerCase() : '');
          const userNameNormal = normalize(user.name);

          this.myTeam = teams.find(
            (t) =>
              (t.leaderEngineerName && normalize(t.leaderEngineerName).includes(userNameNormal)) ||
              (t.technicianNames &&
                t.technicianNames.some((n: string) => n && normalize(n).includes(userNameNormal))),
          );

          if (this.myTeam) {
            // Load tasks assigned to the team via the user's role and username filter
            this.dataService.getTasks(user.role, user.name).subscribe({
              next: (tasks) => {
                this.myTeam.tasks = tasks;
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Error fetching tasks', err);
                this.myTeam.tasks = [];
                this.isLoading = false;
              }
            });
            return;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching teams', err);
        this.isLoading = false;
      },
    });
  }
}
