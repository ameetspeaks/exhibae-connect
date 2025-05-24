import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContactMessage, ContactMessageStatus } from '@/types/contact';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import emailService from '@/services/email/emailService';

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
      // Simplified query to avoid foreign key issues
      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Contact messages fetch error:", err);
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
      // Find the message to get user details
      const message = messages.find(msg => msg.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
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
      
      // Send email response to the user
      const emailResult = await emailService.sendContactResponseEmail({
        to: message.email,
        name: message.name,
        subject: message.subject,
        originalMessage: message.message,
        response: response
      });
      
      if (!emailResult.success) {
        console.error('Failed to send email response:', emailResult.error);
        // We continue anyway as the database was updated successfully
        toast({
          title: 'Response Recorded',
          description: 'Your response was saved, but email delivery failed.',
          variant: 'destructive',
        });
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
        description: 'Your response has been recorded and sent to the user.',
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