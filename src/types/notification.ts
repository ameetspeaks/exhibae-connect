import { Database } from './database.types';

type NotificationType = Database['public']['Tables']['notifications']['Row']['type'];

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
  type: NotificationType;
  link: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
}

export type NotificationHandler = (notification: AppNotification) => void;

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
} 