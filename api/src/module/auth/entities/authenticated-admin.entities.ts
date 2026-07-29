import { Admin } from '../../admin/entities/admin.entity';

export type AuthenticatedAdmin = Omit<Admin, 'password'>;
