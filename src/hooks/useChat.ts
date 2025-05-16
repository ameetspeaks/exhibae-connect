import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { ChatMessage, SupportTicket, ChatState } from '@/types/chat';
import { toast } from '@/components/ui/use-toast';

export const useChat = (ticketId?: string) => {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [state, setState] = useState<ChatState>({
        selectedTicket: null,
        messages: [],
        isLoading: true,
        error: null,
    });

    const fetchTicket = useCallback(async () => {
        if (!ticketId) return;

        try {
            setState(prev => ({ ...prev, isLoading: true }));
            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    category:support_categories(*),
                    messages:chat_messages(*)
                `)
                .eq('id', ticketId)
                .single();

            if (error) throw error;

            setState(prev => ({
                ...prev,
                selectedTicket: ticket,
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error fetching ticket:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load ticket',
                isLoading: false,
            }));
        }
    }, [ticketId, supabase]);

    const fetchMessages = useCallback(async () => {
        if (!ticketId) return;

        try {
            setState(prev => ({ ...prev, isLoading: true }));
            const { data: messages, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:users(id, full_name, avatar_url)
                `)
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setState(prev => ({
                ...prev,
                messages: messages || [],
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load messages',
                isLoading: false,
            }));
        }
    }, [ticketId, supabase]);

    const sendMessage = async (content: string, attachments?: any[]) => {
        if (!ticketId || !user) return;

        try {
            const { data: message, error } = await supabase
                .from('chat_messages')
                .insert({
                    ticket_id: ticketId,
                    sender_id: user.id,
                    content,
                    attachments: attachments || null,
                })
                .select(`
                    *,
                    sender:users(id, full_name, avatar_url)
                `)
                .single();

            if (error) throw error;

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, message],
            }));

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: 'Error',
                description: 'Failed to send message',
                variant: 'destructive',
            });
        }
    };

    const createTicket = async (ticketData: Partial<SupportTicket>) => {
        if (!user) return;

        try {
            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .insert({
                    ...ticketData,
                    created_by: user.id,
                    status: 'open',
                })
                .select()
                .single();

            if (error) throw error;

            return ticket;
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast({
                title: 'Error',
                description: 'Failed to create support ticket',
                variant: 'destructive',
            });
        }
    };

    const updateTicket = async (ticketId: string, updates: Partial<SupportTicket>) => {
        try {
            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .update(updates)
                .eq('id', ticketId)
                .select()
                .single();

            if (error) throw error;

            setState(prev => ({
                ...prev,
                selectedTicket: {
                    ...prev.selectedTicket!,
                    ...ticket,
                },
            }));

            return ticket;
        } catch (error) {
            console.error('Error updating ticket:', error);
            toast({
                title: 'Error',
                description: 'Failed to update ticket',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
            fetchMessages();

            // Subscribe to new messages
            const messagesSubscription = supabase
                .channel(`ticket:${ticketId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'chat_messages',
                        filter: `ticket_id=eq.${ticketId}`,
                    },
                    async (payload) => {
                        const { data: message, error } = await supabase
                            .from('chat_messages')
                            .select(`
                                *,
                                sender:users(id, full_name, avatar_url)
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && message) {
                            setState(prev => ({
                                ...prev,
                                messages: [...prev.messages, message],
                            }));
                        }
                    }
                )
                .subscribe();

            return () => {
                messagesSubscription.unsubscribe();
            };
        }
    }, [ticketId, supabase, fetchTicket, fetchMessages]);

    return {
        ...state,
        sendMessage,
        createTicket,
        updateTicket,
        refreshMessages: fetchMessages,
        refreshTicket: fetchTicket,
    };
}; 