import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import StructureLayout from "@/components/layout/StructureLayout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import GlobalDashboard from "./pages/global/GlobalDashboard";
import GlobalTasks from "./pages/global/GlobalTasks";
import GlobalInbox from "./pages/global/GlobalInbox";
import GlobalPlanning from "./pages/global/GlobalPlanning";
import GlobalObjectives from "./pages/global/GlobalObjectives";
import GlobalSources from "./pages/global/GlobalSources";
import GlobalRoutines from "./pages/global/GlobalRoutines";
import GlobalCoach from "./pages/global/GlobalCoach";
import GlobalAnalytics from "./pages/global/GlobalAnalytics";
import GlobalGamification from "./pages/global/GlobalGamification";
import StructureDashboard from "./pages/StructureDashboard";
import StructureTasks from "./pages/structure/StructureTasks";
import StructureInbox from "./pages/structure/StructureInbox";
import StructurePlanning from "./pages/structure/StructurePlanning";
import StructureObjectives from "./pages/structure/StructureObjectives";
import StructureSources from "./pages/structure/StructureSources";
import StructureRoutines from "./pages/structure/StructureRoutines";
import StructureCoach from "./pages/structure/StructureCoach";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import SpaceRouter from "./pages/SpaceRouter";
import LifeHQ from "./pages/global/LifeHQ";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Home — no layout */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* QG Général — Life cockpit */}
        <Route path="/life-hq" element={<ProtectedRoute><AppLayout><LifeHQ /></AppLayout></ProtectedRoute>} />

        {/* Life Spaces */}
        <Route path="/spaces/:spaceKey" element={<ProtectedRoute><SpaceRouter /></ProtectedRoute>} />

        {/* Global HQ — AppLayout with sidebar */}
        <Route path="/global/dashboard" element={<ProtectedRoute><AppLayout><GlobalDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/global/tasks" element={<ProtectedRoute><AppLayout><GlobalTasks /></AppLayout></ProtectedRoute>} />
        <Route path="/global/inbox" element={<ProtectedRoute><AppLayout><GlobalInbox /></AppLayout></ProtectedRoute>} />
        <Route path="/global/planning" element={<ProtectedRoute><AppLayout><GlobalPlanning /></AppLayout></ProtectedRoute>} />
        <Route path="/global/objectives" element={<ProtectedRoute><AppLayout><GlobalObjectives /></AppLayout></ProtectedRoute>} />
        <Route path="/global/sources" element={<ProtectedRoute><AppLayout><GlobalSources /></AppLayout></ProtectedRoute>} />
        <Route path="/global/routines" element={<ProtectedRoute><AppLayout><GlobalRoutines /></AppLayout></ProtectedRoute>} />
        <Route path="/global/coach" element={<ProtectedRoute><AppLayout><GlobalCoach /></AppLayout></ProtectedRoute>} />
        <Route path="/global/analytics" element={<ProtectedRoute><AppLayout><GlobalAnalytics /></AppLayout></ProtectedRoute>} />
        <Route path="/global/gamification" element={<ProtectedRoute><AppLayout><GlobalGamification /></AppLayout></ProtectedRoute>} />

        {/* Structure spaces — StructureLayout with topbar */}
        <Route path="/structures/:id/dashboard" element={<ProtectedRoute><StructureLayout><StructureDashboard /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/tasks" element={<ProtectedRoute><StructureLayout><StructureTasks /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/inbox" element={<ProtectedRoute><StructureLayout><StructureInbox /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/planning" element={<ProtectedRoute><StructureLayout><StructurePlanning /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/objectives" element={<ProtectedRoute><StructureLayout><StructureObjectives /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/sources" element={<ProtectedRoute><StructureLayout><StructureSources /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/routines" element={<ProtectedRoute><StructureLayout><StructureRoutines /></StructureLayout></ProtectedRoute>} />
        <Route path="/structures/:id/coach" element={<ProtectedRoute><StructureLayout><StructureCoach /></StructureLayout></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;