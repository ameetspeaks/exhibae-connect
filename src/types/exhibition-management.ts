export interface ExhibitionCategory {
  id: string;
  name: string;
  description?: string;
}

export interface VenueType {
  id: string;
  name: string;
  description?: string;
}

export interface MeasuringUnit {
  id: string;
  name: string;
  symbol: string;
  type: 'length' | 'area' | 'volume' | 'weight' | 'temperature' | 'other';
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface Amenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Exhibition {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  organiser_id: string;
  status: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
  venue_type_id?: string;
  event_type_id?: string;
  measuring_unit_id?: string;
  stalls?: Stall[];
  category?: ExhibitionCategory;
  venue_type?: VenueType;
  event_type?: EventType;
  measuring_unit?: MeasuringUnit;
  gallery_images?: GalleryImage[];
}

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
  unit?: MeasuringUnit;
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

export interface GalleryImage {
  id: string;
  exhibition_id: string;
  image_url: string;
  image_type: 'banner' | 'layout' | 'gallery';
  type?: 'banner' | 'layout' | 'gallery';
  created_at?: string;
  updated_at?: string;
}

export interface EventType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// The form data interfaces can use Date objects for better UI handling
export interface ExhibitionFormData {
  id?: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  organiser_id: string;
  status: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  category_id?: string;
  venue_type_id?: string;
  event_type_id?: string;
  measuring_unit_id?: string;
  created_at?: string;
  updated_at?: string;
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

export interface StallApplication {
  id: string;
  stall_id: string;
  brand_id: string;
  exhibition_id: string;
  status: 'pending' | 'payment_pending' | 'payment_review' | 'booked' | 'rejected';
  message?: string;
  preferred_location?: string;
  requirements: any[];
  payment_status: 'pending' | 'partial' | 'completed';
  payment_amount?: number;
  payment_date?: string;
  booking_deadline?: string;
  booking_confirmed: boolean;
  created_at: string;
  updated_at: string;
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
    location: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

export interface ApplicationFormData {
  stall_id: string;
  message?: string;
}
