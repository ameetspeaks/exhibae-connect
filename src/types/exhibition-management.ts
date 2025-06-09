import { Database } from './database.types';

type Tables = Database['public']['Tables'];
type ExhibitionRow = Tables['exhibitions']['Row'];
type ExhibitionInsert = Tables['exhibitions']['Insert'];
type ExhibitionUpdate = Tables['exhibitions']['Update'];
type ExhibitionCategoryRow = Tables['exhibition_categories']['Row'];
type VenueTypeRow = Tables['venue_types']['Row'];
type EventTypeRow = Tables['event_types']['Row'];
type MeasurementUnitRow = Tables['measurement_units']['Row'];

export interface MeasurementUnit extends MeasurementUnitRow {
  type: 'length' | 'area' | 'volume' | 'weight' | 'temperature' | 'other';
}

export interface ExhibitionCategory extends ExhibitionCategoryRow {}

export interface VenueType extends VenueTypeRow {}

export interface EventType extends EventTypeRow {}

export interface GalleryImage {
  id: string;
  image_url: string;
  image_type: string;
  caption?: string;
  created_at: string;
}

export type ExhibitionWithRelations = ExhibitionRow & {
  category?: ExhibitionCategoryRow | null;
  venue_type?: VenueTypeRow | null;
  event_type?: EventTypeRow | null;
  measurement_unit?: MeasurementUnitRow | null;
  gallery_images?: GalleryImage[];
};

export type Exhibition = ExhibitionWithRelations;

export type ExhibitionFormData = Omit<ExhibitionInsert, 'id' | 'created_at' | 'updated_at'>;

export interface Stall {
  id: string;
  exhibition_id: string;
  name: string;
  width: number;
  length: number;
  price: number;
  quantity: number;
  status: string;
  unit_id: string;
  unit?: MeasurementUnit;
  amenities?: Amenity[];
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StallAmenity {
  id: string;
  stall_id: string;
  amenity_id: string;
  amenity?: Amenity;
  created_at?: string;
  updated_at?: string;
}

export interface Amenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface StallFormData {
  name: string;
  length: number;
  width: number;
  unit_id: string;
  price: number;
  quantity: number;
  amenity_ids?: string[];
  status?: 'available' | 'pending' | 'booked';
  exhibition_id?: string;
}

export interface MaintenanceLog {
  id: string;
  stall_instance_id: string;
  maintenance_type: string;
  description?: string;
  performed_by: string;
  performed_at: string;
  next_maintenance_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface PaymentTransaction {
  id: string;
  application_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_date: string;
  reference_number?: string;
}

export interface StallInstance {
  id: string;
  stall_id: string;
  exhibition_id: string;
  instance_number: number;
  position_x: number;
  position_y: number;
  rotation_angle: number;
  status: string;
  price?: number;
  created_at: string;
  updated_at: string;
  stall: Stall;
  application?: {
    id: string;
    brand_id: string;
    status: string;
    created_at: string;
  };
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface StallApplication {
  id: string;
  brand_id: string;
  status: string;
  created_at: string;
  payment_status: string;
  payment_date?: string;
  booking_confirmed: boolean;
  booking_deadline?: string;
  exhibition_id: string;
  stall_id: string;
  message?: string;
  requirements?: string[];
}

export interface ApplicationFormData {
  company_description: string;
  special_requirements?: string;
}
