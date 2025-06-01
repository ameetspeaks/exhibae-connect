export interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  website: string | null;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  threads_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandLookBook {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface BrandGalleryItem {
  id: string;
  brand_id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
} 