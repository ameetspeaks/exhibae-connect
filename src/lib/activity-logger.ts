import { supabase } from '@/integrations/supabase/client';

interface LogActivityParams {
  action: string;
  target: string;
  actorId: string;
}

export const logActivity = async ({ action, target, actorId }: LogActivityParams) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        action,
        target,
        actor_id: actorId,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}; 