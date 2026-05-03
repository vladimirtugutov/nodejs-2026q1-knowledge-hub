import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  login: string;
  role: UserRole;
}
