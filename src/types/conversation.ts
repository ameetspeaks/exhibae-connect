import { Profile } from './profile';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ReactionType = '👍' | '❤️' | '😂' | '😮' | '😢' | '😡';

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  thumbnail_url?: string;
}

export interface MessageReaction {
  type: ReactionType;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  conversation_id: string;
  exhibition_id?: string;
  exhibition_name?: string;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  reply_to?: string; // ID of the message being replied to
  thread_count?: number; // Number of replies in the thread
  edited_at?: string;
  deleted_at?: string;
}

export interface ConversationMessage extends Message {
  sender?: Profile;
  organiser?: Profile;
  reply_to_message?: ConversationMessage; // The message being replied to
}

export interface ConversationFilter {
  search?: string;
  unread_only?: boolean;
  has_attachments?: boolean;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export interface Conversation {
  id: string;
  brand_id: string;
  organiser_id: string;
  exhibition_id?: string;
  exhibition_name?: string;
  last_message: ConversationMessage | null;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  // Populated fields
  brand?: Profile;
  organiser?: Profile;
  // UI state
  unread_count?: number;
  pagination?: {
    page: number;
    hasMore: boolean;
    loading: boolean;
    messagesPerPage: number;
  };
  // Search and filter state
  filter?: ConversationFilter;
  // Thread state
  active_thread_id?: string;
  // Typing state
  typing_users?: string[];
}

export interface ConversationPagination {
  page: number;
  hasMore: boolean;
  loading: boolean;
  messagesPerPage: number;
} 