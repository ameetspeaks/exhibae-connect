import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { LayoutDashboard, Users, Ruler, Building2, CalendarDays, Tag, LucideIcon, FileText, MessageSquare, Heart, SlidersHorizontal, LogOut, Calendar, Ticket, Mail, Newspaper } from 'lucide-react';
import { EmailAdmin } from '@/components/email';

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
const SliderPage = lazy(() => import('./SliderPage'));
const CreateSlider = lazy(() => import('./CreateSlider'));
const EditSlider = lazy(() => import('./EditSlider'));
const ViewSlider = lazy(() => import('./ViewSlider'));
const SubscriptionsPage = lazy(() => import('./SubscriptionsPage'));

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
    path: 'subscriptions',
    element: <SubscriptionsPage />,
    icon: Newspaper,
    name: 'Newsletter',
  },
  {
    path: 'email',
    element: <EmailAdmin />,
    icon: Mail,
    name: 'Email Analytics',
  },
];

export default managerRoutes; 