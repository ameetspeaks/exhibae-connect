import React from 'react';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <SettingsLayout basePath="/dashboard/brand">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your brand profile and preferences</p>

        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>Update your brand profile and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Brand profile settings form will go here */}
            <p className="text-gray-600">Brand profile settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default Settings; 