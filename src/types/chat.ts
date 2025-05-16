export type ChatUserRole = 'organiser' | 'brand' | 'shopper' | 'manager' | 'agent';

export type SupportAgent = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type SupportCategory = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
};

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SupportTicket = {
    id: string;
    category_id: string;
    created_by: string;
    assigned_to: string | null;
    user_id: string;
    user_role: string;
    status: TicketStatus;
    priority: TicketPriority;
    subject: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    category?: SupportCategory;
    messages?: ChatMessage[];
};

export type ChatMessage = {
    id: string;
    ticket_id: string;
    sender_id: string;
    content: string;
    attachments: any[] | null;
    read: boolean;
    created_at: string;
    updated_at: string;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
};

export type ChatState = {
    selectedTicket: SupportTicket | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
};

export type NewTicketData = Omit<SupportTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at' | 'status' | 'assigned_agent_id'>;

export type NewMessageData = Omit<ChatMessage, 'id' | 'created_at'>; 