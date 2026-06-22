import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.html',
  styleUrls: ['./stock.scss']
})
export class Stock implements OnInit {
  pieces: any[] = [];
  newPiece: any = { reference: '', nom: '', quantite: 0, prix: 0, seuilMin: 0 };
  isEditing = false;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadPieces();
  }

  loadPieces() {
    this.dataService.getPieces().subscribe(res => {
      this.pieces = res;
    });
  }

  savePiece() {
    if (this.isEditing) {
      this.dataService.updatePiece(this.newPiece.id, this.newPiece).subscribe(() => {
        this.loadPieces();
        this.resetForm();
      });
    } else {
      this.dataService.createPiece(this.newPiece).subscribe(() => {
        this.loadPieces();
        this.resetForm();
      });
    }
  }

  editPiece(piece: any) {
    this.newPiece = { ...piece };
    this.isEditing = true;
  }

  deletePiece(id: string) {
    if (confirm('Are you sure you want to delete this piece?')) {
      this.dataService.deletePiece(id).subscribe(() => {
        this.loadPieces();
      });
    }
  }

  resetForm() {
    this.newPiece = { reference: '', nom: '', quantite: 0, prix: 0, seuilMin: 0 };
    this.isEditing = false;
  }
}
