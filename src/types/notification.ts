export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'user_registered' | 'exhibition_created' | 'stall_booked' | 'stall_updated' | 'application_received' | 'general';
  isRead: boolean;
  createdAt: string;
  link?: string;
} 