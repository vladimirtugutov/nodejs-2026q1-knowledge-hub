import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  userId: string;
  login: string;
  role: UserRole;
}
