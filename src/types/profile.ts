export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  company_name?: string;
  updated_at?: string;
  role?: 'brand' | 'organiser' | 'admin';
  bio?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
} 