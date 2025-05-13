import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserRole } from "@/types/auth";
import Layout from "./components/layout/Layout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./integrations/supabase/AuthProvider";

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
import ManagerDashboard from "./pages/Dashboard/Manager/ManagerDashboard";
import CategoriesPage from "./pages/Dashboard/Manager/CategoriesPage";
import VenueTypesPage from "./pages/Dashboard/Manager/VenueTypesPage";
import MeasurementUnitsPage from "./pages/Dashboard/Manager/MeasurementUnitsPage";
import UsersPage from "./pages/Dashboard/Manager/UsersPage";
import CreateExhibitionPage from "./pages/Dashboard/Manager/CreateExhibitionPage";
import { default as ManagerExhibitionsPage } from "./pages/Dashboard/Manager/ExhibitionsPage";
import { default as ManagerExhibitionDetail } from "./pages/Dashboard/Manager/ExhibitionDetail";
import { default as ManagerExhibitionEdit } from "./pages/Dashboard/Manager/ExhibitionEdit";

// Organiser Pages
import ExhibitionsPage from "./pages/Dashboard/Organiser/ExhibitionsPage";
import CreateExhibition from "./pages/Dashboard/Organiser/CreateExhibition";
import { default as OrganiserExhibitionDetail } from "./pages/Dashboard/Organiser/ExhibitionDetail";
import ExhibitionEdit from "./pages/Dashboard/Organiser/ExhibitionEdit";
import Applications from "./pages/Dashboard/Organiser/Applications";
import ApplicationsOverview from "./pages/Dashboard/Organiser/ApplicationsOverview";
import Settings from "./pages/Dashboard/Organiser/Settings";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/exhibitions" element={<ExhibitionList />} />
                <Route path="/exhibitions/:id" element={<ExhibitionDetail />} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/auth">
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Signup />} />
                <Route path="manager">
                  <Route path="login" element={<ManagerLogin />} />
                  <Route path="register" element={<ManagerRegister />} />
                </Route>
              </Route>
              
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
                <Route path="exhibitions" element={<ManagerExhibitionsPage />} />
                <Route path="exhibitions/create" element={<CreateExhibitionPage />} />
                <Route path="exhibitions/:id" element={<ManagerExhibitionDetail />} />
                <Route path="exhibitions/:id/edit" element={<ManagerExhibitionEdit />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="venue-types" element={<VenueTypesPage />} />
                <Route path="measurement-units" element={<MeasurementUnitsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="settings" element={<Settings />} />
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
                <Route path="exhibitions/:exhibitionId/applications" element={<Applications />} />
                <Route path="applications" element={<ApplicationsOverview />} />
                <Route path="settings" element={<Settings />} />
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
                <Route path="applications" element={<div>Brand Applications Page</div>} />
                <Route path="find" element={<div>Find Exhibitions Page</div>} />
                <Route path="settings" element={<div>Brand Settings Page</div>} />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
