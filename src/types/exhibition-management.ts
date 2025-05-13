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
  start_date: string;
  end_date: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  category_id: string;
  venue_type_id: string;
  organiser_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  category?: ExhibitionCategory;
  venue_type?: VenueType;
  measuring_unit_id: string;
  measuring_unit?: MeasuringUnit;
}

export interface Stall {
  id: string;
  exhibition_id: string;
  name: string;
  length: number;
  width: number;
  unit_id: string;
  unit?: MeasuringUnit;
  price: number;
  quantity: number;
  position_x?: number;
  position_y?: number;
  status?: 'available' | 'applied' | 'confirmed' | 'rejected' | 'cancelled';
  amenities?: Amenity[];
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
  created_at?: string;
  updated_at?: string;
}

// The form data interfaces can use Date objects for better UI handling
export interface ExhibitionFormData {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  category_id: string;
  venue_type_id: string;
  measuring_unit_id?: string;
}

export interface StallFormData {
  name: string;
  length: number;
  width: number;
  unit_id: string;
  price: number;
  quantity: number;
  amenity_ids?: string[];
}

export interface StallApplication {
  id: string;
  stall_id: string;
  brand_id: string;
  exhibition_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
  stall?: Stall;
  brand?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  exhibition?: {
    id: string;
    title: string;
  };
}

export interface ApplicationFormData {
  stall_id: string;
  message?: string;
}

export interface StallInstance {
  id: string;
  stall_id: string;
  exhibition_id: string;
  instance_number: number;
  position_x: number;
  position_y: number;
  rotation_angle: number;
  status: 'available' | 'applied' | 'confirmed' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  stall?: Stall;
}
