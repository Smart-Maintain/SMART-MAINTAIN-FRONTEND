import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./rapport.scss'],
})
export class Rapport implements OnInit {
  taskId: string | null = null;
  task: any = null;

  reports: any[] = [];

  newReport = {
    title: '',
    content: '',
    attachments: [] as string[],
  };

  isSubmitting = false;

  editingReportId: string | null = null;
  editReportData = {
    title: '',
    content: '',
    attachments: [] as string[],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    public auth: AuthService,
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
        this.task = tasks.find((t) => t.id === this.taskId);
        if (!this.task) {
          console.error('Task not found');
        }
      },
      error: (err) => console.error('Error loading task', err),
    });

    // 2. Fetch Reports for this task
    this.dataService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports.filter((r) => r.tache && r.tache.id === this.taskId);
      },
      error: (err) => console.error('Error loading reports', err),
    });
  }

  handleFileSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newReport.attachments.push(
            JSON.stringify({
              name: file.name,
              data: e.target?.result as string,
            }),
          );
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeAttachment(index: number) {
    this.newReport.attachments.splice(index, 1);
  }

  handleEditFileSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          this.editReportData.attachments.push(
            JSON.stringify({
              name: file.name,
              data: e.target?.result as string,
            }),
          );
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeEditAttachment(index: number) {
    this.editReportData.attachments.splice(index, 1);
  }

  getAttachmentName(attachmentStr: string) {
    try {
      const parsed = JSON.parse(attachmentStr);
      return parsed.name || 'Attachment';
    } catch {
      return attachmentStr;
    }
  }

  downloadAttachment(attachmentStr: string) {
    try {
      const parsed = JSON.parse(attachmentStr);
      const a = document.createElement('a');
      a.href = parsed.data;
      a.download = parsed.name;
      a.click();
    } catch {
      // For old non-JSON mock attachments, do nothing or handle differently
      console.warn('Cannot download old mock attachment format.');
    }
  }

  canEditReport(report: any): boolean {
    const currentUser = this.auth.user();
    if (!currentUser) return false;
    if (report.authorEmail === currentUser.email) return true;
    if (currentUser.role === 'manager') return true;
    if (
      currentUser.role === 'engineer' &&
      this.task?.equipe?.leaderEngineerName === currentUser.name
    )
      return true;
    return false;
  }

  startEdit(report: any) {
    this.editingReportId = report.id;
    this.editReportData = {
      title: report.title,
      content: report.content,
      attachments: report.attachments ? [...report.attachments] : [],
    };
  }

  cancelEdit() {
    this.editingReportId = null;
  }

  saveEdit(reportId: string) {
    if (!this.editReportData.title || !this.editReportData.content) return;

    this.isSubmitting = true;
    const updatedData = {
      ...this.editReportData,
      status: 'PENDING_REVIEW',
    };

    this.dataService.updateReport(reportId, updatedData).subscribe({
      next: (updated) => {
        const index = this.reports.findIndex((r) => r.id === reportId);
        if (index !== -1) {
          this.reports[index] = updated;
        }
        this.editingReportId = null;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error updating report', err);
        this.isSubmitting = false;
      },
    });
  }

  submitReport() {
    if (!this.newReport.title || !this.newReport.content) return;

    this.isSubmitting = true;
    const reportData = {
      title: this.newReport.title,
      content: this.newReport.content,
      status: 'PENDING_REVIEW',
      type: 'TASK',
      tacheId: this.taskId,
      authorEmail: this.auth.user()?.email,
      authorRole: this.auth.user()?.role,
      attachments: this.newReport.attachments,
    };

    this.dataService.createReport(reportData).subscribe({
      next: (created) => {
        this.dataService.submitReport(created.id).subscribe({
          next: (submitted) => {
            this.reports.push(submitted);
            this.newReport = { title: '', content: '', attachments: [] };
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('Error submitting report', err);
            this.reports.push(created); // push the draft at least
            this.newReport = { title: '', content: '', attachments: [] };
            this.isSubmitting = false;
          }
        });
      },
      error: (err) => {
        console.error('Error creating report', err);
        alert('Failed to upload report. The file may be too large or there was a server error.');
        this.isSubmitting = false;
      },
    });
  }
}
