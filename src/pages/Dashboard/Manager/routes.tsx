import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { LayoutDashboard, Users, Ruler, Building2, CalendarDays, Tag, LucideIcon, FileText, MessageSquare, Heart, SlidersHorizontal, LogOut, Calendar, Ticket, Mail } from 'lucide-react';
import { EmailAdmin } from '@/components/email';
import ManagerDashboard from './ManagerDashboard';
import SliderPage from './SliderPage';
import CreateSlider from './CreateSlider';
import ViewSlider from './ViewSlider';
import EditSlider from './EditSlider';
import ExhibitionsPage from './ExhibitionsPage';
import ExhibitionDetail from './ExhibitionDetail';
import ExhibitionEdit from './ExhibitionEdit';
import ExhibitionApplications from './ExhibitionApplications';
import ApplicationsPage from './ApplicationsPage';
import BrandInterestsPage from './BrandInterestsPage';
import UsersPage from './UsersPage';
import ContactMessagesPage from './ContactMessagesPage';
import CategoriesPage from './CategoriesPage';
import VenueTypesPage from './VenueTypesPage';
import MeasurementUnitsPage from './MeasurementUnitsPage';
import CouponsPage from './CouponsPage';
import CreateCoupon from './CreateCoupon';
import EditCoupon from './EditCoupon';
import Settings from './Settings';
import ChatPage from '../Chat';
import SubscriptionsPage from './SubscriptionsPage';

type CustomRouteObject = RouteObject & {
  icon?: LucideIcon;
  name?: string;
};

export const managerRoutes: CustomRouteObject[] = [
  {
    path: '',
    element: <ManagerDashboard />,
    icon: LayoutDashboard,
    name: 'Dashboard',
  },
  {
    path: 'sliders',
    element: <SliderPage />,
    icon: SlidersHorizontal,
    name: 'Hero Sliders',
  },
  {
    path: 'sliders/create',
    element: <CreateSlider />,
  },
  {
    path: 'sliders/:id',
    element: <ViewSlider />,
  },
  {
    path: 'sliders/:id/edit',
    element: <EditSlider />,
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
  {
    path: 'email',
    element: <EmailAdmin />,
    icon: Mail,
    name: 'Email Analytics',
  },
  {
    path: 'subscriptions',
    element: <SubscriptionsPage />,
    icon: Mail,
    name: 'Subscriptions',
  },
];

export default managerRoutes; 