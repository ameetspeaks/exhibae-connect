import { LayoutDashboard, Users, Ruler, Building2, CalendarDays } from 'lucide-react';
import ManagerDashboard from './ManagerDashboard';
import VenueTypesPage from './VenueTypesPage';
import MeasurementUnitsPage from './MeasurementUnitsPage';
import UsersPage from './UsersPage';

export const managerRoutes = [
  {
    path: '',
    element: <ManagerDashboard />,
    icon: LayoutDashboard,
    name: 'Dashboard',
  },
  {
    path: 'exhibitions',
    icon: CalendarDays,
    name: 'Exhibitions',
  },
  {
    path: 'users',
    element: <UsersPage />,
    icon: Users,
    name: 'Users',
  },
  {
    path: 'venue-types',
    element: <VenueTypesPage />,
    icon: Building2,
    name: 'Venue Types',
  },
  {
    path: 'measurement-units',
    element: <MeasurementUnitsPage />,
    icon: Ruler,
    name: 'Measurement Units',
  },
];

export default managerRoutes; 