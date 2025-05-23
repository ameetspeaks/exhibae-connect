import { Profile } from './profile';

export type ContactMessageStatus = 'unread' | 'read' | 'replied' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: ContactMessageStatus;
  response?: string | null;
  responded_by?: string | null;
  responded_at?: string | null;
  responder?: Profile | null;
} 