import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, ChatMessage, NewMessageData, SupportAgent } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

export const AgentInterface: React.FC = () => {
    const { user } = useUser();
    const [agent, setAgent] = useState<SupportAgent | null>(null);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [ticketFilter, setTicketFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

    useEffect(() => {
        if (user) {
            loadAgentProfile();
            loadTickets();
        }
    }, [user]);

    useEffect(() => {
        if (selectedTicket) {
            loadMessages(selectedTicket.id);
            // Subscribe to new messages
            const subscription = supabase
                .channel(`ticket-${selectedTicket.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `ticket_id=eq.${selectedTicket.id}`,
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new as ChatMessage]);
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [selectedTicket]);

    const loadAgentProfile = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('support_agents')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error loading agent profile:', error);
            return;
        }

        setAgent(data);
    };

    const loadTickets = async () => {
        if (!agent) return;

        let query = supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (ticketFilter === 'assigned') {
            query = query.eq('assigned_agent_id', agent.id);
        } else if (ticketFilter === 'unassigned') {
            query = query.is('assigned_agent_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading tickets:', error);
            return;
        }

        setTickets(data);
    };

    const loadMessages = async (ticketId: string) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading messages:', error);
            return;
        }

        setMessages(data);
    };

    const assignTicket = async (ticketId: string) => {
        if (!agent) return;

        const { error } = await supabase
            .from('support_tickets')
            .update({ 
                assigned_agent_id: agent.id,
                status: 'in_progress'
            })
            .eq('id', ticketId);

        if (error) {
            console.error('Error assigning ticket:', error);
            return;
        }

        loadTickets();
    };

    const updateTicketStatus = async (ticketId: string, status: string) => {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status })
            .eq('id', ticketId);

        if (error) {
            console.error('Error updating ticket status:', error);
            return;
        }

        loadTickets();
        if (selectedTicket?.id === ticketId) {
            setSelectedTicket(prev => prev ? { ...prev, status } : null);
        }
    };

    const sendMessage = async () => {
        if (!selectedTicket || !user || !newMessage.trim()) return;

        const newMsg: NewMessageData = {
            ticket_id: selectedTicket.id,
            sender_id: user.id,
            sender_role: 'agent',
            message: newMessage.trim(),
        };

        const { error } = await supabase
            .from('chat_messages')
            .insert([newMsg]);

        if (error) {
            console.error('Error sending message:', error);
            return;
        }

        setNewMessage('');
    };

    return (
        <div className="flex h-full">
            {/* Tickets List */}
            <div className="w-1/3 p-4 border-r">
                <div className="mb-4">
                    <Select
                        value={ticketFilter}
                        onValueChange={(value: 'all' | 'assigned' | 'unassigned') => {
                            setTicketFilter(value);
                            loadTickets();
                        }}
                    >
                        <option value="all">All Tickets</option>
                        <option value="assigned">Assigned to Me</option>
                        <option value="unassigned">Unassigned</option>
                    </Select>
                </div>
                <div className="space-y-2">
                    {tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className={`p-3 cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-primary/10' : ''}`}
                            onClick={() => setSelectedTicket(ticket)}
                        >
                            <div className="font-medium">{ticket.ticket_number}</div>
                            <div className="text-sm text-gray-500">
                                Status: {ticket.status}
                                {ticket.assigned_agent_id ? 
                                    (ticket.assigned_agent_id === agent?.id ? ' (Assigned to you)' : ' (Assigned)') : 
                                    ' (Unassigned)'}
                            </div>
                            <div className="text-sm truncate">{ticket.problem_description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                From: {ticket.user_name} ({ticket.user_role})
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedTicket.ticket_number}</h2>
                                    <div className="text-sm text-gray-500">Status: {selectedTicket.status}</div>
                                    <div className="text-sm text-gray-500">
                                        Customer: {selectedTicket.user_name} ({selectedTicket.user_email})
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!selectedTicket.assigned_agent_id && (
                                        <Button onClick={() => assignTicket(selectedTicket.id)}>
                                            Assign to Me
                                        </Button>
                                    )}
                                    {selectedTicket.assigned_agent_id === agent?.id && (
                                        <Select
                                            value={selectedTicket.status}
                                            onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                                        >
                                            <option value="open">Open</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] p-3 rounded-lg ${
                                                message.sender_id === user?.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary'
                                            }`}
                                        >
                                            <div className="text-sm font-medium mb-1">
                                                {message.sender_role}
                                            </div>
                                            {message.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    disabled={!selectedTicket.assigned_agent_id || selectedTicket.assigned_agent_id !== agent?.id}
                                />
                                <Button 
                                    onClick={sendMessage}
                                    disabled={!selectedTicket.assigned_agent_id || selectedTicket.assigned_agent_id !== agent?.id}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a ticket to view the conversation
                    </div>
                )}
            </div>
        </div>
    );
}; 