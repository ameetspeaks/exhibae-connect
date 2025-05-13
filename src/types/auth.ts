export enum UserRole {
  MANAGER = 'manager',
  ORGANISER = 'organiser',
  BRAND = 'brand',
  SHOPPER = 'shopper'
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
}
