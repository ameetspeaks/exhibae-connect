import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { LayoutDashboard, Users, Ruler, Building2, CalendarDays, Tag, LucideIcon, FileText, MessageSquare, Heart } from 'lucide-react';

type CustomRouteObject = RouteObject & {
  icon?: LucideIcon;
  name?: string;
};

const ManagerDashboard = lazy(() => import('./ManagerDashboard'));
const ExhibitionsPage = lazy(() => import('./ExhibitionsPage'));
const ExhibitionDetail = lazy(() => import('./ExhibitionDetail'));
const ExhibitionEdit = lazy(() => import('./ExhibitionEdit'));
const ExhibitionApplications = lazy(() => import('./ExhibitionApplications'));
const ApplicationsPage = lazy(() => import('./ApplicationsPage'));
const UsersPage = lazy(() => import('./UsersPage'));
const CategoriesPage = lazy(() => import('./CategoriesPage'));
const VenueTypesPage = lazy(() => import('./VenueTypesPage'));
const MeasurementUnitsPage = lazy(() => import('./MeasurementUnitsPage'));
const Settings = lazy(() => import('./Settings'));
const ChatPage = lazy(() => import('../Chat'));
const CouponsPage = lazy(() => import('./CouponsPage'));
const CreateCoupon = lazy(() => import('./CreateCoupon'));
const EditCoupon = lazy(() => import('./EditCoupon'));
const ContactMessagesPage = lazy(() => import('./ContactMessagesPage'));
const BrandInterestsPage = lazy(() => import('./BrandInterestsPage'));

export const managerRoutes: CustomRouteObject[] = [
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
    path: 'exhibitions/:exhibitionId/applications',
    element: <ExhibitionApplications />,
  },
  {
    path: 'applications',
    element: <ApplicationsPage />,
    icon: FileText,
    name: 'Applications',
  },
  {
    path: 'brand-interests',
    element: <BrandInterestsPage />,
    icon: Heart,
    name: 'Brand Interests',
  },
  {
    path: 'users',
    element: <UsersPage />,
    icon: Users,
    name: 'Users',
  },
  {
    path: 'contact-messages',
    element: <ContactMessagesPage />,
    icon: MessageSquare,
    name: 'Contact Messages',
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