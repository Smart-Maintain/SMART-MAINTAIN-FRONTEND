import { Injectable } from '@angular/core';
import { getApiBaseUrl } from '../utils/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleUtil } from '../utils/role.util';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private equipmentApi = `${getApiBaseUrl()}/api/equipement-service`;
  private identityApi = `${getApiBaseUrl()}/api/identity-service`;

  constructor(private http: HttpClient) { }

  // Tache Endpoints
  getTasks(role?: string, username?: string): Observable<any[]> {
    if (role && (role === 'engineer' || role === 'technician')) {
      return this.http.get<any[]>(`${this.equipmentApi}/taches/my-tasks?role=${role}&username=${username}`);
    }
    return this.http.get<any[]>(`${this.equipmentApi}/taches`);
  }

  updateTaskStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${id}/status/${status}`, {});
  }

  updateSubTaskStatus(taskId: string, subTaskId: string, status: string, username: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${taskId}/subtasks/${subTaskId}/status/${status}?username=${username}`, {});
  }

  addSubTask(taskId: string, subtaskData: { description: string; assignedMemberId?: string; assignedMemberName?: string }): Observable<any> {
    return this.http.post(`${this.equipmentApi}/taches/${taskId}/subtasks`, subtaskData);
  }

  updateTask(id: string, taskData: any): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${id}`, taskData);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.equipmentApi}/taches/${id}`);
  }

  addTechnicianNote(id: string, note: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${id}/note`, { note });
  }

  checkTaskDone(id: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${id}/check`, {});
  }

  attachTaskToMaintenance(taskId: string, maintenanceId: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${taskId}/maintenance/${maintenanceId}`, {});
  }

  assignTaskToTeam(taskId: string, teamId: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${taskId}/assign-team/${teamId}`, {});
  }

  unassignTaskFromTeam(taskId: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/taches/${taskId}/unassign-team`, {});
  }

  // Equipement Endpoints
  getEquipements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/equipements`);
  }

  createTask(taskData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/taches`, taskData);
  }

  getTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/equipes`);
  }

  createTeam(teamData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/equipes`, teamData);
  }

  updateTeam(id: string, teamData: any): Observable<any> {
    return this.http.put(`${this.equipmentApi}/equipes/${id}`, teamData);
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.equipmentApi}/equipes/${id}`);
  }

  getMaintenances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/maintenances`);
  }

  createMaintenance(maintenanceData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/maintenances`, maintenanceData);
  }

  updateMaintenance(id: string, maintenanceData: any): Observable<any> {
    return this.http.put(`${this.equipmentApi}/maintenances/${id}`, maintenanceData);
  }

  assignMaintenanceTeam(id: string, teamId: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/maintenances/${id}/team/${teamId}`, {});
  }

  getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/rapports`);
  }

  getReportsForRole(role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/rapports/role/${role}`);
  }

  createReport(reportData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/rapports`, reportData);
  }

  updateReport(id: string, reportData: any): Observable<any> {
    return this.http.put(`${this.equipmentApi}/rapports/${id}`, reportData);
  }

  submitReport(id: string): Observable<any> {
    return this.http.post(`${this.equipmentApi}/rapports/${id}/submit`, {});
  }

  reviewReport(id: string, status: 'APPROVED' | 'MODIFICATION_REQUESTED', reviewerNote: string): Observable<any> {
    return this.http.post(`${this.equipmentApi}/rapports/${id}/review`, { status, reviewerNote });
  }

  askChatbot(role: string, message: string): Observable<any> {
    return this.http.post(`${this.equipmentApi}/chatbot/ask`, { role, message });
  }

  getUsersByRole(role: 'INGENIEUR' | 'OPERATEUR'): Observable<any[]> {
    return this.http.get<any[]>(`${this.identityApi}/account/users/role/${role}`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.identityApi}/account/users`);
  }

  createUser(role: string, userData: any): Observable<any> {
    let endpoint = RoleUtil.toFrenchEndpoint(role);
    return this.http.post(`${this.identityApi}/account/${endpoint}`, userData);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.identityApi}/account/users/${id}`, userData);
  }

  updateUserStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.identityApi}/account/users/${id}/status/${status}`, {});
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.identityApi}/account/users/${id}`);
  }

  // Alerts Endpoints
  getAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/alerts`);
  }

  convertAlertToTask(alertId: string | number, equipeId?: string): Observable<any> {
    let url = `${this.equipmentApi}/alerts/${alertId}/convert`;
    if (equipeId) {
      url += `?equipeId=${equipeId}`;
    }
    return this.http.post(url, {});
  }

  // Notifications Endpoints
  getNotifications(email: string, role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/notifications?email=${email}&role=${role}`);
  }

  markNotificationAsRead(id: string): Observable<any> {
    return this.http.put(`${this.equipmentApi}/notifications/${id}/read`, {});
  }

  // Bug Feedback Endpoints
  createBugFeedback(feedback: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/bug-feedbacks`, feedback);
  }

  getBugFeedbacks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/bug-feedbacks`);
  }

  // Equipement Creation Endpoints
  createEquipement(equipementData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/equipements`, equipementData);
  }

  getTaxonomies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/taxonomies`);
  }

  createTaxonomie(taxonomieData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/taxonomies`, taxonomieData);
  }

  // Analytics Endpoints (If available in identity-service admin)
  // For now, we will use mock analytics if real ones don't exist yet

  // Pieces Endpoints
  getPieces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/pieces`);
  }

  createPiece(pieceData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/pieces`, pieceData);
  }

  updatePiece(id: string, pieceData: any): Observable<any> {
    return this.http.put(`${this.equipmentApi}/pieces/${id}`, pieceData);
  }

  deletePiece(id: string): Observable<void> {
    return this.http.delete<void>(`${this.equipmentApi}/pieces/${id}`);
  }

  // Piece Requests Endpoints
  getPieceRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/piece-requests`);
  }

  getPendingPieceRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/piece-requests/pending`);
  }

  getPieceRequestsByTache(tacheId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.equipmentApi}/piece-requests/tache/${tacheId}`);
  }

  createPieceRequest(requestData: any): Observable<any> {
    return this.http.post(`${this.equipmentApi}/piece-requests`, requestData);
  }

  updatePieceRequestStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.equipmentApi}/piece-requests/${id}/status`, { status });
  }
}
