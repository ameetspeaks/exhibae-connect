import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContactMessage, ContactMessageStatus } from '@/types/contact';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';

export const useContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select(`
          *,
          responder:responded_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load contact messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: ContactMessageStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', messageId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        )
      );

      toast({
        title: 'Status Updated',
        description: `Message marked as ${status}.`,
      });

      return true;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update message status.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const respondToMessage = async (messageId: string, response: string) => {
    if (!user) return false;
    
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({
          status: 'replied',
          response,
          responded_by: user.id,
          responded_at: now
        })
        .eq('id', messageId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                status: 'replied',
                response,
                responded_by: user.id,
                responded_at: now
              }
            : msg
        )
      );

      toast({
        title: 'Response Sent',
        description: 'Your response has been recorded.',
      });

      return true;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to send response.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const archiveMessage = async (messageId: string) => {
    return await updateMessageStatus(messageId, 'archived');
  };

  const markAsRead = async (messageId: string) => {
    return await updateMessageStatus(messageId, 'read');
  };

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  return {
    messages,
    isLoading,
    error,
    refreshMessages: fetchMessages,
    updateMessageStatus,
    respondToMessage,
    archiveMessage,
    markAsRead,
  };
}; 