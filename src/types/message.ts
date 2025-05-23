import { Profile } from './profile';

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_id: string;
  organiser_id: string;
  created_at: string;
  is_read: boolean;
  read_by?: string;
  sender?: Profile;
  organiser?: Profile;
  exhibition_id?: string;
  exhibition_name?: string;
} 