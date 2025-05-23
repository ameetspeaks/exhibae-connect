import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/conversation';

interface TypingEvent {
  user_id: string;
  conversation_id: string;
}

export function useRealtimeMessages(
  userId: string | undefined,
  onNewMessage: (message: Message) => void,
  onTyping: (typing: TypingEvent) => void,
  onMessageRead: (messageId: string) => void
) {
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up real-time subscription for user:', userId);

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `brand_id=eq.${userId} OR organiser_id=eq.${userId}`
        },
        (payload) => {
          console.log('Conversation update:', payload);
          const conversation = payload.new;
          
          // If there's a new message (last_message was updated)
          if (conversation.last_message && (!payload.old.last_message || 
              conversation.last_message.id !== payload.old.last_message.id)) {
            onNewMessage(conversation.last_message);
          }
          
          // If messages were marked as read
          const oldMessages = payload.old.messages || [];
          const newMessages = conversation.messages || [];
          
          newMessages.forEach((msg: Message, index: number) => {
            const oldMsg = oldMessages[index];
            if (oldMsg && !oldMsg.is_read && msg.is_read) {
              onMessageRead(msg.id);
            }
          });
        }
      )
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          console.log('Channel subscription status:', channel.state);
          onTyping(payload.payload);
        }
      )
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      channel.unsubscribe();
    };
  }, [userId, onNewMessage, onTyping, onMessageRead]);
}