import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  // Tache Endpoints
  getTasks(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8888/api/equipement-service/taches');
  }

  updateTaskStatus(id: string, status: string): Observable<any> {
    return this.http.put(`http://localhost:8888/api/equipement-service/taches/${id}/status/${status}`, {});
  }

  // Equipement Endpoints
  getEquipements(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8888/api/equipement-service/equipements');
  }

  createTask(taskData: any): Observable<any> {
    return this.http.post('http://localhost:8888/api/equipement-service/taches', taskData);
  }

  // Analytics Endpoints (If available in identity-service admin)
  // For now, we will use mock analytics if real ones don't exist yet
}
