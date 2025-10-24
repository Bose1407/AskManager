import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { usePageTitle } from "./hooks/use-page-title";

// Auth Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthSuccess from "./pages/AuthSuccess";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import DashboardTasks from "./pages/DashboardTasks";
import DashboardChat from "./pages/DashboardChat";
import DashboardLeaves from "./pages/DashboardLeaves";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardRoles from "./pages/DashboardRoles";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to update page title based on route
const PageTitleUpdater = () => {
  usePageTitle();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <PageTitleUpdater />
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/success" element={<AuthSuccess />} />

            {/* Dashboard Routes - Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole={["employee", "manager", "admin"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/tasks"
              element={
                <ProtectedRoute requiredRole={["employee", "manager", "admin"]}>
                  <DashboardTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/chat"
              element={
                <ProtectedRoute requiredRole={["employee", "manager", "admin"]}>
                  <DashboardChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/leaves"
              element={
                <ProtectedRoute requiredRole={["employee", "manager", "admin"]}>
                  <DashboardLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute requiredRole={["employee", "manager", "admin"]}>
                  <DashboardAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute requiredRole={["employee", "manager", "admin"]}>
                  <DashboardSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/roles"
              element={
                <ProtectedRoute requiredRole={["admin"]}>
                  <DashboardRoles />
                </ProtectedRoute>
              }
            />

            {/* Home route - redirects based on auth status */}
            <Route path="/" element={<Home />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
          </NotificationsProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
