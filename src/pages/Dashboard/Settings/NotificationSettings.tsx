import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Bell } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import NotificationSoundSettings from '@/components/notifications/NotificationSoundSettings';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface SettingItemProps {
  id: string;
  label: string;
  description: string;
}

const NotificationSettings = () => {
  const { settings, loading, updateSettings } = useNotificationSettings();
  const { user } = useAuth();
  const userRole = user?.app_metadata?.role?.toLowerCase() || '';
  const basePath = `/dashboard/${userRole}/settings`;
  const isManager = userRole === 'manager';

  const handleToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const SettingItem: React.FC<SettingItemProps> = ({ id, label, description }) => (
    <div className="flex items-start justify-between space-x-4 py-4">
      <div>
        <Label htmlFor={id} className="text-base">{label}</Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch
        id={id}
        checked={Boolean(settings?.[id as keyof typeof settings])}
        onCheckedChange={(checked) => handleToggle(id, checked)}
      />
    </div>
  );

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notification Settings</h1>
            <p className="text-gray-600">Manage your notification preferences</p>
          </div>
          
          {isManager && (
            <Button variant="outline" asChild>
              <Link to="/dashboard/manager/settings/test-notifications">
                <Bell className="mr-2 h-4 w-4" />
                Test Notifications
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure your notification delivery preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              id="email_notifications"
              label="Email Notifications"
              description="Receive notifications via email"
            />
            <SettingItem
              id="desktop_notifications"
              label="Desktop Notifications"
              description="Show notifications on your desktop"
            />
            <SettingItem
              id="sound_enabled"
              label="Sound Notifications"
              description="Play a sound when notifications arrive"
            />
          </CardContent>
        </Card>

        {/* Only show sound settings for managers */}
        {isManager && settings?.sound_enabled && (
          <NotificationSoundSettings />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>Choose which types of notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingItem
              id="user_registered_enabled"
              label="New User Registrations"
              description="When new brands register on the platform"
            />
            <SettingItem
              id="exhibition_created_enabled"
              label="New Exhibitions"
              description="When new exhibitions are created"
            />
            <SettingItem
              id="stall_booked_enabled"
              label="Stall Bookings"
              description="When brands book stalls at your exhibitions"
            />
            <SettingItem
              id="stall_updated_enabled"
              label="Stall Updates"
              description="When there are changes to stall bookings"
            />
            <SettingItem
              id="application_received_enabled"
              label="Application Updates"
              description="When your applications are reviewed or updated"
            />
            <SettingItem
              id="exhibition_reminder_enabled"
              label="Exhibition Reminders"
              description="Reminders about upcoming exhibitions"
            />
            <SettingItem
              id="payment_reminder_enabled"
              label="Payment Reminders"
              description="Reminders about pending payments"
            />
            <SettingItem
              id="exhibition_cancelled_enabled"
              label="Exhibition Cancellations"
              description="When exhibitions are cancelled"
            />
            <SettingItem
              id="exhibition_updated_enabled"
              label="Exhibition Updates"
              description="When exhibition details are updated"
            />
            <SettingItem
              id="message_received_enabled"
              label="New Messages"
              description="When you receive new messages"
            />
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default NotificationSettings;