import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { playNotificationSound } from '@/services/notificationSoundService';
import { AppNotification } from '@/types/notification';

const notificationTypes: Array<{
  id: AppNotification['type'];
  name: string;
  description: string;
}> = [
  {
    id: 'user_registered',
    name: 'New User Registration',
    description: 'When a new user signs up on the platform',
  },
  {
    id: 'exhibition_created',
    name: 'Exhibition Created',
    description: 'When a new exhibition is created',
  },
  {
    id: 'stall_booked',
    name: 'Stall Booking',
    description: 'When a brand books a stall',
  },
  {
    id: 'stall_updated',
    name: 'Stall Updated',
    description: 'When a stall is updated',
  },
  {
    id: 'application_received',
    name: 'Application Received',
    description: 'When a new application is submitted',
  },
  {
    id: 'general',
    name: 'General Notification',
    description: 'For general system notifications',
  },
];

const NotificationSoundSettings = () => {
  const { settings, updateSettings } = useNotificationSettings();
  const [volume, setVolume] = useState(0.5);

  const handleVolumeChange = (newValue: number[]) => {
    setVolume(newValue[0]);
  };

  const toggleSoundEnabled = () => {
    updateSettings({ sound_enabled: !settings?.sound_enabled });
  };

  const playSound = (type: AppNotification['type']) => {
    playNotificationSound(type, volume);
  };

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Notification Sounds</CardTitle>
        <CardDescription>
          Customize how you receive notification sounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {settings.sound_enabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="sound-enabled">Enable notification sounds</Label>
          </div>
          <Switch
            id="sound-enabled"
            checked={settings.sound_enabled}
            onCheckedChange={toggleSoundEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Volume</Label>
          <div className="flex items-center space-x-4">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              disabled={!settings.sound_enabled}
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Test notification sounds</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-start space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => playSound(type.id)}
                  disabled={!settings.sound_enabled}
                >
                  <PlayCircle className="h-4 w-4 mr-1" /> {type.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSoundSettings; 