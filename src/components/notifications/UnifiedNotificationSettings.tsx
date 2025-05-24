import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Volume2, Mail } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { requestNotificationPermission, areNotificationsAvailable } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import { playNotificationSound } from '@/services/notificationSoundService';
import { AppNotification } from '@/types/notification';
import { useAuth } from '@/integrations/supabase/AuthProvider';

interface SettingItemProps {
  id: string;
  label: string;
  description: string;
  disabled?: boolean;
}

const notificationTypes = [
  {
    id: 'user_registered',
    name: 'New User Registration',
    description: 'When a new user signs up on the platform',
    roles: ['manager']
  },
  {
    id: 'exhibition_created',
    name: 'Exhibition Created',
    description: 'When a new exhibition is created',
    roles: ['manager', 'organiser']
  },
  {
    id: 'stall_booked',
    name: 'Stall Booking',
    description: 'When a brand books a stall',
    roles: ['manager', 'organiser']
  },
  {
    id: 'stall_updated',
    name: 'Stall Updated',
    description: 'When a stall is updated',
    roles: ['manager', 'organiser']
  },
  {
    id: 'application_received',
    name: 'Application Received',
    description: 'When a new application is submitted',
    roles: ['manager', 'organiser']
  },
  {
    id: 'exhibition_reminder',
    name: 'Exhibition Reminder',
    description: 'Reminders about upcoming exhibitions',
    roles: ['manager', 'organiser', 'brand']
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    description: 'Reminders about pending payments',
    roles: ['manager', 'organiser', 'brand']
  },
  {
    id: 'exhibition_cancelled',
    name: 'Exhibition Cancelled',
    description: 'When an exhibition is cancelled',
    roles: ['manager', 'organiser', 'brand']
  },
  {
    id: 'exhibition_updated',
    name: 'Exhibition Updated',
    description: 'When an exhibition is updated',
    roles: ['manager', 'organiser', 'brand']
  },
  {
    id: 'message_received',
    name: 'New Message',
    description: 'When you receive a new message',
    roles: ['manager', 'organiser', 'brand']
  }
];

const UnifiedNotificationSettings = () => {
  const { settings, loading, updateSettings, isEnabled } = useNotificationSettings();
  const { user } = useAuth();
  const userRole = user?.app_metadata?.role?.toLowerCase() || '';
  const { toast } = useToast();
  const [volume, setVolume] = React.useState(0.5);
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        toast({
          title: "Permission Granted",
          description: "You will now receive desktop notifications",
        });
        updateSettings({ desktop_notifications: true });
      } else {
        toast({
          title: "Permission Denied",
          description: "You will not receive desktop notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleVolumeChange = (newValue: number[]) => {
    setVolume(newValue[0]);
  };

  const testNotification = (type: string) => {
    playNotificationSound(type as AppNotification['type'], volume);
    
    if (areNotificationsAvailable()) {
      new Notification(`Test ${type.replace('_', ' ')} notification`, {
        body: "This is a test notification",
        icon: "/favicon.ico",
      });
    }
  };

  const SettingItem: React.FC<SettingItemProps> = ({ id, label, description, disabled }) => {
    const value = settings?.[id as keyof typeof settings];
    const isChecked = typeof value === 'boolean' ? value : false;
    
    return (
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={id}>{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={id}
          checked={isChecked}
          onCheckedChange={(checked) => handleToggle(id, checked)}
          disabled={disabled}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-exhibae-navy" />
      </div>
    );
  }

  // Filter notification types based on user role
  const availableNotificationTypes = notificationTypes.filter(type => 
    type.roles.includes(userRole)
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="desktop">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="desktop">
            <Bell className="h-4 w-4 mr-2" /> Desktop
          </TabsTrigger>
          <TabsTrigger value="sound">
            <Volume2 className="h-4 w-4 mr-2" /> Sound
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" /> Email
          </TabsTrigger>
        </TabsList>

        {/* Desktop Notifications Tab */}
        <TabsContent value="desktop" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Desktop Notifications</CardTitle>
              <CardDescription>
                Control when you receive desktop notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="desktop-notifications">Enable desktop notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications on your desktop when you're not using the app
                  </p>
                </div>
                {notificationPermission !== 'granted' ? (
                  <Button onClick={handleRequestPermission}>
                    Request Permission
                  </Button>
                ) : (
                  <Switch
                    id="desktop-notifications"
                    checked={isEnabled('desktop_notifications')}
                    onCheckedChange={(checked) => handleToggle('desktop_notifications', checked)}
                  />
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Notification Types</h3>
                {availableNotificationTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`desktop-${type.id}`}>{type.name}</Label>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testNotification(type.id)}
                        disabled={notificationPermission !== 'granted'}
                      >
                        Test
                      </Button>
                      <Switch
                        id={`desktop-${type.id}`}
                        checked={isEnabled(`${type.id}_enabled` as any)}
                        onCheckedChange={(checked) => handleToggle(`${type.id}_enabled`, checked)}
                        disabled={!isEnabled('desktop_notifications') || notificationPermission !== 'granted'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sound Notifications Tab */}
        <TabsContent value="sound" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sound Settings</CardTitle>
              <CardDescription>
                Configure notification sound preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingItem
                id="sound_enabled"
                label="Enable Sound"
                description="Play a sound when notifications arrive"
              />
              
              <div className="space-y-2">
                <Label>Notification Volume</Label>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  disabled={!isEnabled('sound_enabled')}
                />
              </div>

              <Button
                variant="outline"
                onClick={() => testNotification('general')}
                disabled={!isEnabled('sound_enabled')}
              >
                Test Sound
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Notifications Tab */}
        <TabsContent value="email" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingItem
                id="email_notifications"
                label="Enable Email Notifications"
                description="Receive notifications via email"
              />

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Email Notification Types</h3>
                {availableNotificationTypes.map((type) => (
                  <SettingItem
                    key={type.id}
                    id={`${type.id}_email_enabled`}
                    label={type.name}
                    description={type.description}
                    disabled={!isEnabled('email_notifications')}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedNotificationSettings; 