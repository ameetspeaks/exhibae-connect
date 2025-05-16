import React from 'react';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <SettingsLayout basePath="/dashboard/manager">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your profile information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Profile settings form will go here */}
            <p className="text-gray-600">Profile settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default Settings; 