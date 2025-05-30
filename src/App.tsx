import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate
} from "react-router-dom";
import { UserRole } from "@/types/auth";
import Layout from "./components/layout/Layout";
import AuthLayout from "./components/layout/AuthLayout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import ManagerLayout from "./components/layout/ManagerLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./integrations/supabase/AuthProvider";
import { NotificationProvider } from "./hooks/useNotifications";
import { SupabaseProvider } from "@/lib/supabase/supabase-provider";
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import ResetPassword from '@/pages/Auth/ResetPassword';
import React, { lazy } from 'react';

// Pages
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ManagerLogin from "./pages/Auth/ManagerLogin";
import ManagerRegister from "./pages/Auth/ManagerRegister";
import NotFound from "./pages/NotFound";
import ExhibitionList from "./pages/Exhibitions/ExhibitionList";
import ExhibitionDetail from "./pages/Exhibitions/ExhibitionDetail";

// Dashboard Pages
import OrganiserDashboard from "./pages/Dashboard/Organiser/OrganiserDashboard";
import BrandDashboard from "./pages/Dashboard/Brand/BrandDashboard";

// Manager Pages
import { default as ManagerDashboard } from "./pages/Dashboard/Manager/ManagerDashboard";
import CategoriesPage from "./pages/Dashboard/Manager/CategoriesPage";
import VenueTypesPage from "./pages/Dashboard/Manager/VenueTypesPage";
import MeasurementUnitsPage from "./pages/Dashboard/Manager/MeasurementUnitsPage";
import UsersPage from "./pages/Dashboard/Manager/UsersPage";
import CreateExhibitionPage from "./pages/Dashboard/Manager/CreateExhibitionPage";
import { default as ManagerExhibitionsPage } from "./pages/Dashboard/Manager/ExhibitionsPage";
import { default as ManagerExhibitionDetail } from "./pages/Dashboard/Manager/ExhibitionDetail";
import { default as ManagerExhibitionEdit } from "./pages/Dashboard/Manager/ExhibitionEdit";
import { default as ManagerSettings } from "./pages/Dashboard/Manager/Settings";
import NotificationSettings from "./pages/Dashboard/Settings/NotificationSettings";
import { default as ManagerCouponsPage } from "./pages/Dashboard/Manager/CouponsPage";
import { default as ManagerCreateCoupon } from "./pages/Dashboard/Manager/CreateCoupon";
import { default as ManagerEditCoupon } from "./pages/Dashboard/Manager/EditCoupon";
import ApplicationsPage from "./pages/Dashboard/Manager/ApplicationsPage";
import TestNotifications from "./pages/Dashboard/Manager/TestNotifications";
import ContactMessagesPage from "./pages/Dashboard/Manager/ContactMessagesPage";
import BrandInterestsPage from "./pages/Dashboard/Manager/BrandInterestsPage";
import ManagerEventsPage from "./pages/Dashboard/Manager/EventsPage";
import EventsPage from "@/pages/Dashboard/Manager/EventsPage";
import EventTypeViewPage from "@/pages/Dashboard/Manager/EventTypeViewPage";
import EventTypeEditPage from "@/pages/Dashboard/Manager/EventTypeEditPage";
import SliderPage from './pages/Dashboard/Manager/SliderPage';
import CreateSlider from './pages/Dashboard/Manager/CreateSlider';
import EditSlider from './pages/Dashboard/Manager/EditSlider';
import ViewSlider from './pages/Dashboard/Manager/ViewSlider';

// Email Admin
import { EmailAdmin } from "./components/email";

// Organiser Pages
import ExhibitionsPage from "./pages/Dashboard/Organiser/ExhibitionsPage";
import CreateExhibition from "./pages/Dashboard/Organiser/CreateExhibition";
import { default as OrganiserExhibitionDetail } from "./pages/Dashboard/Organiser/ExhibitionDetail";
import ExhibitionEdit from "./pages/Dashboard/Organiser/ExhibitionEdit";
import { default as OrganiserApplications } from "./pages/Dashboard/Organiser/Applications";
import ApplicationsOverview from "./pages/Dashboard/Organiser/ApplicationsOverview";
import { default as OrganiserSettings } from "./pages/Dashboard/Organiser/Settings";
import OrganiserNotificationSettings from "./pages/Dashboard/Organiser/NotificationSettings";
import CouponsPage from "./pages/Dashboard/Organiser/CouponsPage";
import CreateCoupon from "./pages/Dashboard/Organiser/CreateCoupon";
import EditCoupon from "./pages/Dashboard/Organiser/EditCoupon";
import PaymentSettings from "./pages/Dashboard/Organiser/PaymentSettings";
import MyInterests from "./pages/Dashboard/Brand/MyInterests";
import InterestInquiries from "./pages/Dashboard/Organiser/InterestInquiries";
import { default as OrganiserMyFavorites } from "./pages/Dashboard/Organiser/MyFavorites";
import { default as OrganiserFindExhibitions } from "./pages/Dashboard/Organiser/FindExhibitions";

// Brand Pages
import { default as BrandApplications } from "./pages/Dashboard/Brand/Applications";
import FindExhibitions from "./pages/Dashboard/Brand/FindExhibitions";
import { default as BrandExhibitionDetail } from "./pages/Dashboard/Brand/ExhibitionDetail";
import { default as BrandSettings } from "./pages/Dashboard/Brand/Settings";
import StallSelectionPage from "./pages/Dashboard/Brand/StallSelectionPage";
import MyStalls from "./pages/Dashboard/Brand/MyStalls";
import BrandNotificationSettings from "./pages/Dashboard/Brand/NotificationSettings";
import { default as BrandMyFavorites } from "./pages/Dashboard/Brand/MyFavorites";

// Static Pages
import About from "./pages/Static/About";
import Terms from "./pages/Static/Terms";
import Privacy from "./pages/Static/Privacy";
import Contact from "./pages/Static/Contact";
import ForOrganizers from "./pages/Static/ForOrganizers";
import ForBrands from "./pages/Static/ForBrands";

// Add Chat component import
const ChatPage = lazy(() => import("./pages/Dashboard/Chat"));

// Shopper Dashboard
import ShopperDashboard from "@/pages/Dashboard/Shopper/ShopperDashboard";
import MyExhibitions from "@/pages/Dashboard/Shopper/MyExhibitions";
import RecommendedExhibitions from "@/pages/Dashboard/Shopper/RecommendedExhibitions";
import ShopperSettings from "@/pages/Dashboard/Shopper/Settings/ShopperSettings";
import { default as ShopperMyFavorites } from "@/pages/Dashboard/Shopper/MyFavorites";

import EmailTester from './components/EmailTester';

import { SearchResults } from '@/pages/SearchResults';

// Brands Pages
import BrandsList from "@/pages/Brands/BrandsList";
import BrandPortfolio from "@/pages/Brands/BrandPortfolio";

// Organiser Pages
import OrganiserProfile from "@/pages/Organisers/OrganiserProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create router with future flags enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/exhibitions" element={<ExhibitionList />} />
      <Route path="/exhibitions/:id" element={<ExhibitionDetail />} />
      
      {/* Static Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/for-organizers" element={<ForOrganizers />} />
      <Route path="/for-brands" element={<ForBrands />} />
      
      {/* Brands Pages */}
      <Route path="/brands" element={<BrandsList />} />
      <Route path="/brands/:brandId" element={<BrandPortfolio />} />
      
      {/* Organiser Pages */}
      <Route path="/organisers/:organiserId" element={<OrganiserProfile />} />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth">
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Signup />} />
          <Route path="manager">
            <Route path="login" element={<ManagerLogin />} />
            <Route path="register" element={<ManagerRegister />} />
          </Route>
        </Route>
        
        {/* Password Reset Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<ResetPassword />} />
      </Route>
      
      {/* Dashboard Root Redirect */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MANAGER, UserRole.ORGANISER, UserRole.BRAND, UserRole.SHOPPER]}>
            {({ user, userRole }) => {
              const role = userRole || user?.user_metadata?.role || 'brand';
              return <Navigate to={`/dashboard/${role.toLowerCase()}`} replace />;
            }}
          </ProtectedRoute>
        }
      />
      
      {/* Manager Dashboard */}
      <Route
        path="/dashboard/manager"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MANAGER]}>
            <DashboardLayout role={UserRole.MANAGER} title="Manager Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="sliders" element={<SliderPage />} />
        <Route path="sliders/create" element={<CreateSlider />} />
        <Route path="sliders/:id" element={<ViewSlider />} />
        <Route path="sliders/:id/edit" element={<EditSlider />} />
        <Route path="exhibitions" element={<ManagerExhibitionsPage />} />
        <Route path="exhibitions/create" element={<CreateExhibitionPage />} />
        <Route path="exhibitions/:id" element={<ManagerExhibitionDetail />} />
        <Route path="exhibitions/:id/edit" element={<ManagerExhibitionEdit />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="brand-interests" element={<BrandInterestsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="venue-types" element={<VenueTypesPage />} />
        <Route path="measurement-units" element={<MeasurementUnitsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="contact-messages" element={<ContactMessagesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventTypeViewPage />} />
        <Route path="events/:id/edit" element={<EventTypeEditPage />} />
        <Route path="coupons" element={<ManagerCouponsPage />} />
        <Route path="coupons/create" element={<ManagerCreateCoupon />} />
        <Route path="coupons/:id/edit" element={<ManagerEditCoupon />} />
        <Route path="settings" element={<ManagerSettings />} />
        <Route path="settings/notifications" element={<NotificationSettings />} />
        <Route path="settings/test-notifications" element={<TestNotifications />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="email" element={<EmailAdmin />} />
      </Route>
      
      {/* Organiser Dashboard */}
      <Route
        path="/dashboard/organiser"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ORGANISER]}>
            <DashboardLayout role={UserRole.ORGANISER} title="Organiser Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrganiserDashboard />} />
        <Route path="exhibitions" element={<ExhibitionsPage />} />
        <Route path="exhibitions/create" element={<CreateExhibition />} />
        <Route path="exhibitions/:id" element={<OrganiserExhibitionDetail />} />
        <Route path="exhibitions/:id/edit" element={<ExhibitionEdit />} />
        <Route path="exhibitions/:exhibitionId/applications" element={<OrganiserApplications />} />
        <Route path="applications" element={<ApplicationsOverview />} />
        <Route path="interest-inquiries" element={<InterestInquiries />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="coupons/create" element={<CreateCoupon />} />
        <Route path="coupons/:id/edit" element={<EditCoupon />} />
        <Route path="settings">
          <Route index element={<OrganiserSettings />} />
          <Route path="notifications" element={<OrganiserNotificationSettings />} />
          <Route path="payment" element={<PaymentSettings />} />
        </Route>
        <Route path="favorites" element={<OrganiserMyFavorites />} />
        <Route path="find-exhibitions" element={<OrganiserFindExhibitions />} />
      </Route>
      
      {/* Brand Dashboard */}
      <Route
        path="/dashboard/brand"
        element={
          <ProtectedRoute allowedRoles={[UserRole.BRAND]}>
            <DashboardLayout role={UserRole.BRAND} title="Brand Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<BrandDashboard />} />
        <Route path="applications" element={<BrandApplications />} />
        <Route path="interests" element={<MyInterests />} />
        <Route path="favorites" element={<BrandMyFavorites />} />
        <Route path="find" element={<FindExhibitions />} />
        <Route path="stalls" element={<MyStalls />} />
        <Route path="exhibitions/:id" element={<BrandExhibitionDetail />} />
        <Route path="exhibitions/:exhibitionId/stalls" element={<StallSelectionPage />} />
        <Route path="settings" element={<BrandSettings />} />
        <Route path="settings/notifications" element={<BrandNotificationSettings />} />
      </Route>
      
      {/* Shopper Dashboard */}
      <Route
        path="/dashboard/shopper"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SHOPPER]}>
            <DashboardLayout role={UserRole.SHOPPER} title="Shopper Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ShopperDashboard />} />
        <Route path="my-exhibitions" element={<MyExhibitions />} />
        <Route path="favorites" element={<ShopperMyFavorites />} />
        <Route path="recommended" element={<RecommendedExhibitions />} />
        <Route path="find" element={<FindExhibitions />} />
        <Route path="settings" element={<ShopperSettings />} />
      </Route>
      
      {/* Email Tester */}
      <Route path="/email-tester" element={<EmailTester />} />
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SupabaseProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <RouterProvider router={router} />
            </TooltipProvider>
          </NotificationProvider>
        </SupabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
