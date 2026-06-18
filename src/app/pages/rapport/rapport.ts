import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rapport.html',
  styleUrls: ['./rapport.scss']
})
export class Rapport implements OnInit {
  taskId: string | null = null;
  task: any = null;
  
  reports: any[] = [];
  
  newReport = {
    title: '',
    content: '',
    attachments: [] as string[]
  };
  
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.taskId = this.route.snapshot.paramMap.get('taskId');
    if (this.taskId) {
      this.loadData();
    } else {
      const role = this.auth.user()?.role;
      if (role === 'technician') {
        this.router.navigate(['/technician/tasks']);
      } else if (role) {
        this.router.navigate([`/${role}/dashboard`]);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  loadData() {
    // 1. Fetch Task details
    this.dataService.getTasks().subscribe({
      next: (tasks) => {
        this.task = tasks.find(t => t.id === this.taskId);
        if (!this.task) {
          console.error('Task not found');
        }
      },
      error: (err) => console.error('Error loading task', err)
    });

    // 2. Fetch Reports for this task
    this.dataService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports.filter(r => r.taskId === this.taskId);
      },
      error: (err) => console.error('Error loading reports', err)
    });
  }

  handleFileSelect(event: any) {
    // Simulate reading file names for attachments
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.newReport.attachments.push(files[i].name);
      }
    }
  }

  removeAttachment(index: number) {
    this.newReport.attachments.splice(index, 1);
  }

  submitReport() {
    if (!this.newReport.title || !this.newReport.content) return;
    
    this.isSubmitting = true;
    const reportData = {
      title: this.newReport.title,
      content: this.newReport.content,
      status: 'PENDING_REVIEW',
      taskId: this.taskId,
      attachments: this.newReport.attachments
    };

    this.dataService.createReport(reportData).subscribe({
      next: (created) => {
        this.reports.push(created);
        this.newReport = { title: '', content: '', attachments: [] };
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error creating report', err);
        this.isSubmitting = false;
      }
    });
  }
}
