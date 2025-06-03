import React from 'react';
import { Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MobileAccessWarningProps {
  userRole: string;
}

export function MobileAccessWarning({ userRole }: MobileAccessWarningProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-amber-100 p-3 mb-4">
            <Laptop className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Desktop Access Required</h2>
          <p className="mt-4 text-gray-600">
            The {userRole.toLowerCase()} dashboard is optimized for desktop viewing. Please use a laptop or computer for the best experience and full functionality.
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <Button
            onClick={() => navigate('/')}
            className="w-full"
            variant="outline"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
} 