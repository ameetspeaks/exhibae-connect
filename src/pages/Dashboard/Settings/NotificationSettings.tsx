import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import UnifiedNotificationSettings from '@/components/notifications/UnifiedNotificationSettings';

const NotificationSettings = () => {
  const { settings, loading } = useNotificationSettings();
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role?.toLowerCase() || '';
  const basePath = `/dashboard/${userRole}/settings`;

  if (loading) {
    return (
      <SettingsLayout basePath={basePath}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout basePath={basePath}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-gray-600">Manage your notification preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedNotificationSettings />
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default NotificationSettings;