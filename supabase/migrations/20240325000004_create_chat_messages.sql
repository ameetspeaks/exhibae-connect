-- Create chat messages table
BEGIN;

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL,
    sender_id uuid,
    content text NOT NULL,
    attachments jsonb,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_chat_messages_ticket
        FOREIGN KEY (ticket_id) 
        REFERENCES public.support_tickets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_sender
        FOREIGN KEY (sender_id) 
        REFERENCES auth.users(id)
        ON DELETE SET NULL
);

-- Create index for ticket lookup
CREATE INDEX idx_chat_messages_ticket_id ON public.chat_messages(ticket_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);

COMMIT; 