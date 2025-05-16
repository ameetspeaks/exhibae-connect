import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, ChatMessage, NewTicketData, NewMessageData } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Send, Paperclip, Loader2 } from 'lucide-react';

export const ChatInterface: React.FC = () => {
    const { user } = useUser();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newTicketData, setNewTicketData] = useState<{
        problem_description: string;
    }>({
        problem_description: '',
    });
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadTickets = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

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

    const createTicket = async () => {
        if (!user) return;

        const newTicket: NewTicketData = {
            user_id: user.id,
            user_role: user.role,
            user_name: user.name,
            user_email: user.email,
            problem_description: newTicketData.problem_description,
        };

        const { data, error } = await supabase
            .from('support_tickets')
            .insert([newTicket])
            .select()
            .single();

        if (error) {
            console.error('Error creating ticket:', error);
            return;
        }

        setTickets(prev => [data, ...prev]);
        setSelectedTicket(data);
        setNewTicketData({ problem_description: '' });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        try {
            setIsSending(true);
            await onSendMessage(newMessage);
            setNewMessage('');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Tickets List */}
            <div className="w-1/3 p-4 border-r">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">Create New Ticket</h2>
                    <Textarea
                        placeholder="Describe your issue..."
                        value={newTicketData.problem_description}
                        onChange={(e) => setNewTicketData({ problem_description: e.target.value })}
                        className="mb-2"
                    />
                    <Button onClick={createTicket}>Create Ticket</Button>
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-2">Your Tickets</h2>
                    <div className="space-y-2">
                        {tickets.map((ticket) => (
                            <Card
                                key={ticket.id}
                                className={`p-3 cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-primary/10' : ''}`}
                                onClick={() => setSelectedTicket(ticket)}
                            >
                                <div className="font-medium">{ticket.ticket_number}</div>
                                <div className="text-sm text-gray-500">{ticket.status}</div>
                                <div className="text-sm truncate">{ticket.problem_description}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">{selectedTicket.ticket_number}</h2>
                            <div className="text-sm text-gray-500">Status: {selectedTicket.status}</div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((message) => {
                                    const isCurrentUser = message.sender_id === user?.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                'flex items-start gap-2',
                                                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                                            )}
                                        >
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage
                                                    src={message.sender?.avatar_url || ''}
                                                    alt={message.sender?.full_name || ''}
                                                />
                                                <AvatarFallback>
                                                    {message.sender?.full_name?.[0] || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={cn(
                                                    'flex flex-col max-w-[70%]',
                                                    isCurrentUser ? 'items-end' : 'items-start'
                                                )}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {message.sender?.full_name || 'Unknown User'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(message.created_at), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'rounded-lg px-4 py-2 break-words',
                                                        isCurrentUser
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                    )}
                                                >
                                                    {message.content}
                                                </div>
                                                {message.attachments && message.attachments.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {message.attachments.map((attachment, index) => (
                                                            <div
                                                                key={index}
                                                                className="text-sm text-blue-500 hover:underline cursor-pointer"
                                                            >
                                                                {attachment.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                        <form
                            onSubmit={handleSend}
                            className="flex items-center gap-2 p-4 border-t bg-background"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                disabled={isSending}
                            >
                                <Paperclip className="w-5 h-5" />
                            </Button>
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1"
                                disabled={isSending}
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </form>
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