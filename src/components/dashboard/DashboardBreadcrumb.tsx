import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

interface DashboardBreadcrumbProps {
  role: UserRole;
}

const DashboardBreadcrumb = ({ role }: DashboardBreadcrumbProps) => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Get role-specific color styling
  const getColorStyle = () => {
    switch (role) {
      case UserRole.MANAGER:
        return 'text-indigo-600';
      case UserRole.ORGANISER:
        return 'text-emerald-600';
      case UserRole.BRAND:
        return 'text-amber-600';
      case UserRole.SHOPPER:
        return 'text-exhibae-navy';
      default:
        return 'text-gray-600';
    }
  };
  
  const colorStyle = getColorStyle();
  
  // Generate breadcrumb segments from pathname
  const generateBreadcrumbs = () => {
    // Remove trailing slash if present
    const path = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
      
    // Split path into segments
    const pathSegments = path.split('/').filter(segment => segment !== '');
    
    // Build breadcrumb items
    const breadcrumbs = [];
    let currentPath = '';
    
    // Always have dashboard as the root
    breadcrumbs.push({
      name: 'Dashboard',
      path: `/dashboard/${role.toLowerCase()}`,
      isActive: pathSegments.length === 2 && pathSegments[0] === 'dashboard',
    });
    
    // Skip 'dashboard' and role segment in the path as we've already added them
    for (let i = 2; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`;
      
      // Format the segment name (capitalize first letter, replace hyphens with spaces)
      const formattedName = pathSegments[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      breadcrumbs.push({
        name: formattedName,
        path: `/dashboard/${role.toLowerCase()}${currentPath}`,
        isActive: i === pathSegments.length - 1,
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on the dashboard home
  }
  
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link 
            to={`/dashboard/${role.toLowerCase()}`} 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </li>
        
        {breadcrumbs.slice(1).map((breadcrumb, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {breadcrumb.isActive ? (
                <span className={cn("ml-1 text-sm font-medium", colorStyle)}>
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="ml-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default DashboardBreadcrumb; 