-- Create enum for user roles in chat
CREATE TYPE chat_user_role AS ENUM ('organiser', 'brand', 'shopper', 'manager', 'agent');

-- Create support agents table
CREATE TABLE support_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support tickets table
CREATE TABLE support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_role chat_user_role NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    assigned_agent_id UUID REFERENCES support_agents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id),
    sender_id UUID REFERENCES auth.users(id),
    sender_role chat_user_role NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TICKET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(CAST((SELECT COUNT(*) + 1 FROM support_tickets 
                        WHERE DATE(created_at) = CURRENT_DATE) AS TEXT), 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket number generation
CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number();

-- Create RLS policies
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_agents
CREATE POLICY "Agents can view their own profile"
    ON support_agents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage agents"
    ON support_agents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
    ));

-- Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
    ON support_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Agents can view assigned tickets"
    ON support_tickets FOR SELECT
    USING (assigned_agent_id IN (
        SELECT id FROM support_agents WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their tickets"
    ON chat_messages FOR SELECT
    USING (ticket_id IN (
        SELECT id FROM support_tickets WHERE user_id = auth.uid()
    ));

CREATE POLICY "Agents can view messages in assigned tickets"
    ON chat_messages FOR SELECT
    USING (ticket_id IN (
        SELECT id FROM support_tickets
        WHERE assigned_agent_id IN (
            SELECT id FROM support_agents WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can send messages in their tickets"
    ON chat_messages FOR INSERT
    WITH CHECK (
        ticket_id IN (
            SELECT id FROM support_tickets WHERE user_id = auth.uid()
        ) AND sender_id = auth.uid()
    );

CREATE POLICY "Agents can send messages in assigned tickets"
    ON chat_messages FOR INSERT
    WITH CHECK (
        ticket_id IN (
            SELECT id FROM support_tickets
            WHERE assigned_agent_id IN (
                SELECT id FROM support_agents WHERE user_id = auth.uid()
            )
        ) AND sender_id = auth.uid()
    ); 