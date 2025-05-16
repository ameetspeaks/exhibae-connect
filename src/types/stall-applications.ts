import { Stall, StallInstance } from './exhibition-management';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface StallApplication {
  id: string;
  stall_id: string;
  stall_instance_id?: string;
  brand_id: string;
  exhibition_id: string;
  status: ApplicationStatus;
  message?: string;
  created_at: string;
  updated_at: string;
  exhibition_expiry: boolean;
  stall?: {
    id: string;
    name: string;
    length: number;
    width: number;
    price: number;
    status: string;
    unit?: {
      id: string;
      name: string;
      symbol: string;
    };
  };
  stall_instance?: {
    id: string;
    instance_number: number;
    position_x: number;
    position_y: number;
    rotation_angle: number;
    status: string;
  };
  brand?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    company_name: string;
    avatar_url?: string;
  };
  exhibition?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

export interface StallApplicationFilters {
  exhibitionId?: string;
  status?: ApplicationStatus | 'all';
  searchTerm?: string;
} 