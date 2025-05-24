export interface NotificationAction {
  action: string;
  title: string;
}

export interface NotificationOptions {
  icon?: string;
  badge?: string;
  silent?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  body?: string;
  tag?: string;
  data?: {
    url?: string;
    timestamp?: number;
    notificationId?: string;
    type?: string;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'user_registered' | 'exhibition_created' | 'stall_booked' | 'stall_updated' | 'application_received' | 'general';
  isRead: boolean;
  createdAt: string;
  link?: string;
} 