import { Role } from '../services/auth.service';

export class RoleUtil {
  static normalizeToEnglish(role: string): Role {
    let normalized = role.toLowerCase().replace('role_', '');
    if (normalized === 'ingenieur') return 'engineer';
    if (normalized === 'operateur') return 'technician';
    return normalized as Role;
  }

  static toFrenchEndpoint(role: string): string {
    const r = role.toLowerCase();
    if (r === 'engineer' || r === 'ingenieur') return 'ingenieur';
    if (r === 'technician' || r === 'operateur') return 'operateur';
    if (r === 'admin') return 'admin';
    return 'manager';
  }
}
