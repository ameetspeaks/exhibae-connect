export interface State {
  id: string;
  name: string;
  state_code: string;
  latitude: string | number;
  longitude: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface City {
  id: string;
  name: string;
  state_code: string;
  latitude: string | number;
  longitude: string | number;
  is_major?: boolean;
  population?: number;
  created_at?: string;
  updated_at?: string;
} 