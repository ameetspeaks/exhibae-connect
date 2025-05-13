
import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect from old index page to the new home page
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
