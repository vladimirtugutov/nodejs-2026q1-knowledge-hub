export interface User {
  id: string;
  login: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: number;
  updatedAt: number;
}

export interface UserResponse extends Omit<User, 'password'> {}
