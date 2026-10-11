/**
 * BURRA PARIKSHA CMS — User Directory Contracts
 * User creation and profile update DTOs
 */

export interface CreateUserInput {
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  avatarUrl?: string;
  isActive?: boolean;
  password_hash?: string;
  last_login_at?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
  avatarUrl?: string;
  isActive?: boolean;
  password_hash?: string;
  last_login_at?: string;
}
