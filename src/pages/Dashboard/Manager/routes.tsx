import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { LayoutDashboard, Users, Ruler, Building2, CalendarDays, Tag } from 'lucide-react';

const ManagerDashboard = lazy(() => import('./ManagerDashboard'));
const ExhibitionsPage = lazy(() => import('./ExhibitionsPage'));
const ExhibitionDetail = lazy(() => import('./ExhibitionDetail'));
const ExhibitionEdit = lazy(() => import('./ExhibitionEdit'));
const CreateExhibitionPage = lazy(() => import('./CreateExhibitionPage'));
const UsersPage = lazy(() => import('./UsersPage'));
const CategoriesPage = lazy(() => import('./CategoriesPage'));
const VenueTypesPage = lazy(() => import('./VenueTypesPage'));
const MeasurementUnitsPage = lazy(() => import('./MeasurementUnitsPage'));
const Settings = lazy(() => import('./Settings'));
const ChatPage = lazy(() => import('../Chat'));
const CouponsPage = lazy(() => import('./CouponsPage'));
const CreateCoupon = lazy(() => import('./CreateCoupon'));
const EditCoupon = lazy(() => import('./EditCoupon'));

export const managerRoutes: RouteObject[] = [
  {
    path: '',
    element: <ManagerDashboard />,
    icon: LayoutDashboard,
    name: 'Dashboard',
  },
  {
    path: 'exhibitions',
    element: <ExhibitionsPage />,
    icon: CalendarDays,
    name: 'Exhibitions',
  },
  {
    path: 'exhibitions/:id',
    element: <ExhibitionDetail />,
  },
  {
    path: 'exhibitions/:id/edit',
    element: <ExhibitionEdit />,
  },
  {
    path: 'exhibitions/create',
    element: <CreateExhibitionPage />,
  },
  {
    path: 'users',
    element: <UsersPage />,
    icon: Users,
    name: 'Users',
  },
  {
    path: 'categories',
    element: <CategoriesPage />,
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
  {
    path: 'coupons',
    element: <CouponsPage />,
    icon: Tag,
    name: 'Coupons',
  },
  {
    path: 'coupons/create',
    element: <CreateCoupon />,
  },
  {
    path: 'coupons/:id/edit',
    element: <EditCoupon />,
  },
  {
    path: 'settings',
    element: <Settings />,
  },
  {
    path: 'chat',
    element: <ChatPage />,
  },
];

export default managerRoutes; 