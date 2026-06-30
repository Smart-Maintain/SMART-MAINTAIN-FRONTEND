import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approvals.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./approvals.scss'],
})
export class Approvals implements OnInit {
  pendingRequests: any[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadPendingRequests();
  }

  loadPendingRequests() {
    this.dataService.getPendingPieceRequests().subscribe((res) => {
      this.pendingRequests = res;
    });
  }

  approveRequest(id: string) {
    this.dataService.updatePieceRequestStatus(id, 'APPROVED').subscribe(() => {
      this.loadPendingRequests();
    });
  }

  rejectRequest(id: string) {
    this.dataService.updatePieceRequestStatus(id, 'REJECTED').subscribe(() => {
      this.loadPendingRequests();
    });
  }
}
