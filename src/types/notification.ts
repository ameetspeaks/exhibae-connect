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
  type: 'user_registered' | 'exhibition_created' | 'stall_booked' | 'stall_updated' | 
        'application_received' | 'exhibition_status_updated' | 'payment_status_updated' |
        'stall_application_received' | 'stall_approved' | 'exhibition_reminder' |
        'payment_reminder' | 'exhibition_cancelled' | 'exhibition_updated' |
        'message_received' | 'comment_received' | 'review_submitted' |
        'review_response' | 'profile_updated' | 'document_uploaded' |
        'document_approved' | 'document_rejected' | 'general';
  isRead: boolean;
  createdAt: string;
  link?: string;
} 