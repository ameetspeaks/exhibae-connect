import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

interface SubscriptionFormProps {
  onSuccess?: () => void;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if email already exists
      const { data: existingSubscription, error: checkError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingSubscription) {
        toast({
          title: 'Already subscribed',
          description: 'This email is already subscribed to our newsletter',
        });
        // Save email in localStorage even if already subscribed
        localStorage.setItem('subscribedEmail', email.toLowerCase().trim());
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        return;
      }

      // Add new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([
          {
            email: email.toLowerCase().trim(),
            name: name.trim(),
            user_id: user?.id,
            is_active: true,
          },
        ]);

      if (insertError) throw insertError;

      // Save email in localStorage
      localStorage.setItem('subscribedEmail', email.toLowerCase().trim());
      
      // Invalidate subscription query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['subscription'] });

      toast({
        title: 'Success',
        description: 'Thank you for subscribing to our newsletter!',
      });

      setEmail('');
      setName('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to subscribe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Mail className="h-5 w-5" />
          <h3>Subscribe to Our Newsletter</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Stay updated with the latest exhibitions and events.
        </p>
        <div className="grid gap-4">
          <div>
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/50 dark:bg-gray-900/50"
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/50 dark:bg-gray-900/50"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 