import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import StructureLayout from "@/components/layout/StructureLayout";
import Home from "./pages/Home";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home — no layout */}
          <Route path="/" element={<Home />} />

          {/* Global HQ — AppLayout with sidebar */}
          <Route path="/global/dashboard" element={<AppLayout><GlobalDashboard /></AppLayout>} />
          <Route path="/global/tasks" element={<AppLayout><GlobalTasks /></AppLayout>} />
          <Route path="/global/inbox" element={<AppLayout><GlobalInbox /></AppLayout>} />
          <Route path="/global/planning" element={<AppLayout><GlobalPlanning /></AppLayout>} />
          <Route path="/global/objectives" element={<AppLayout><GlobalObjectives /></AppLayout>} />
          <Route path="/global/sources" element={<AppLayout><GlobalSources /></AppLayout>} />
          <Route path="/global/routines" element={<AppLayout><GlobalRoutines /></AppLayout>} />
          <Route path="/global/coach" element={<AppLayout><GlobalCoach /></AppLayout>} />
          <Route path="/global/analytics" element={<AppLayout><GlobalAnalytics /></AppLayout>} />
          <Route path="/global/gamification" element={<AppLayout><GlobalGamification /></AppLayout>} />

          {/* Structure spaces — StructureLayout with topbar */}
          <Route path="/structures/:id/dashboard" element={<StructureLayout><StructureDashboard /></StructureLayout>} />
          <Route path="/structures/:id/tasks" element={<StructureLayout><StructureTasks /></StructureLayout>} />
          <Route path="/structures/:id/inbox" element={<StructureLayout><StructureInbox /></StructureLayout>} />
          <Route path="/structures/:id/planning" element={<StructureLayout><StructurePlanning /></StructureLayout>} />
          <Route path="/structures/:id/objectives" element={<StructureLayout><StructureObjectives /></StructureLayout>} />
          <Route path="/structures/:id/sources" element={<StructureLayout><StructureSources /></StructureLayout>} />
          <Route path="/structures/:id/routines" element={<StructureLayout><StructureRoutines /></StructureLayout>} />
          <Route path="/structures/:id/coach" element={<StructureLayout><StructureCoach /></StructureLayout>} />

          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
