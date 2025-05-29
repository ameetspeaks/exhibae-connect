import React from 'react';
import { Outlet } from 'react-router-dom';
import WhatsAppSupport from '@/components/WhatsAppSupport';

const AuthLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
      <WhatsAppSupport />
    </div>
  );
};

export default AuthLayout; 