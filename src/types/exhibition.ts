import { Profile } from './profile';

export interface Exhibition {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  organiser_id: string;
  organiser: Profile;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  banner_url?: string;
  venue_details?: string;
  category?: string;
  max_brands?: number;
  price?: number;
  currency?: string;
}

export interface Stall {
  id: string;
  exhibitionId: string;
  brandId: string;
  name: string;
  description: string;
  size: "small" | "medium" | "large";
  price: number;
  status: "available" | "applied" | "confirmed" | "rejected" | "cancelled";
  location?: {
    row: string;
    number: number;
  };
}

export interface StallApplication {
  id: string;
  stallId: string;
  brandId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  notes?: string;
}
