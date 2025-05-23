import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellRing, PlusCircle, ShoppingBag, Calendar, Users, FileText, AlertCircle, Volume, VolumeX } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { playNotificationSound, areSoundsEnabled } from '@/services/notificationSoundService';
import { AppNotification } from '@/types/notification';
import { managerNotificationService } from '@/services/managerNotificationService';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

const notificationTypes: Array<{
  id: AppNotification['type'];
  icon: React.ReactNode;
  name: string;
  description: string;
}> = [
  {
    id: 'user_registered',
    icon: <Users className="h-5 w-5" />,
    name: 'New User Registration',
    description: 'When a new user signs up on the platform',
  },
  {
    id: 'exhibition_created',
    icon: <Calendar className="h-5 w-5" />,
    name: 'Exhibition Created',
    description: 'When a new exhibition is created',
  },
  {
    id: 'stall_booked',
    icon: <ShoppingBag className="h-5 w-5" />,
    name: 'Stall Booking',
    description: 'When a brand books a stall',
  },
  {
    id: 'stall_updated',
    icon: <FileText className="h-5 w-5" />,
    name: 'Stall Updated',
    description: 'When a stall is updated',
  },
  {
    id: 'application_received',
    icon: <PlusCircle className="h-5 w-5" />,
    name: 'Application Received',
    description: 'When a new application is submitted',
  },
  {
    id: 'general',
    icon: <Bell className="h-5 w-5" />,
    name: 'General Notification',
    description: 'For general system notifications',
  },
];

const TestNotifications = () => {
  const { addNotification } = useNotifications();
  const { settings, isEnabled } = useNotificationSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const soundsEnabled = areSoundsEnabled();

  const simulateNotification = async (type: AppNotification['type']) => {
    try {
      setIsLoading(prev => ({ ...prev, [type]: true }));
      
      // Only proceed if the notification type is enabled
      if (!isEnabled(`${type}_enabled` as any)) {
        toast({
          title: "Notification disabled",
          description: `${type} notifications are currently disabled in your settings.`,
          variant: "default"
        });
        return;
      }

      const notificationInfo = notificationTypes.find(n => n.id === type);
      if (!notificationInfo) return;

      // Create notification content
      const notification = {
        title: notificationInfo.name,
        message: `This is a test ${notificationInfo.name.toLowerCase()} notification`,
        type: type,
        link: `/dashboard/manager/settings/notifications`,
      };

      // Add notification to the current user's notifications
      await addNotification(notification);

      // If sound is enabled, play the notification sound
      if (isEnabled('sound_enabled')) {
        if (soundsEnabled) {
          playNotificationSound(type);
        } else {
          toast({
            title: "Sound files missing",
            description: "Notification sound files are missing. Please add sound files to the /public/sounds directory.",
            variant: "destructive"
          });
        }
      }

      // Show browser notification if enabled
      if (isEnabled('desktop_notifications') && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        } catch (notificationError) {
          console.error('Error showing browser notification:', notificationError);
          toast({
            title: "Notification Error",
            description: "Failed to show browser notification. Check console for details.",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Test Successful",
        description: `${notificationInfo.name} notification test was successful.`,
        variant: "default"
      });
    } catch (error) {
      console.error(`Error testing ${type} notification:`, error);
      toast({
        title: "Test Failed",
        description: `Failed to test ${type} notification. See console for details.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        new Notification('Notifications Enabled', {
          body: 'You will now receive desktop notifications',
          icon: '/favicon.ico',
        });
        toast({
          title: "Permissions Granted",
          description: "You have successfully enabled browser notifications.",
          variant: "default"
        });
      } else if (result === 'denied') {
        toast({
          title: "Permissions Denied",
          description: "You've denied notification permissions. You'll need to update your browser settings to enable them.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Permission Default",
          description: "Notification permission request was dismissed. Try again.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Permission Request Failed",
        description: "Failed to request notification permissions. See console for details.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Loading user information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.app_metadata?.role !== 'MANAGER') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Only managers can access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Loading notification settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Notification Testing</CardTitle>
          <CardDescription>
            Test different notification types to ensure they're working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button variant="outline" onClick={requestPermission}>
              <BellRing className="mr-2 h-4 w-4" />
              Request Notification Permission
            </Button>
            
            {isEnabled('sound_enabled') && (
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-sm">
                {soundsEnabled ? (
                  <>
                    <Volume className="h-4 w-4 text-green-600" />
                    <span>Sound files loaded</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 text-amber-600" />
                    <span>Sound files missing</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTypes.map((type) => (
              <Card key={type.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      {type.icon}
                      <h3 className="font-medium">{type.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    <Button
                      size="sm"
                      onClick={() => simulateNotification(type.id)}
                      disabled={isLoading[type.id]}
                    >
                      {isLoading[type.id] ? 'Testing...' : 'Test Notification'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNotifications; 