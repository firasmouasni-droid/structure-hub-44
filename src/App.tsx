import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import GlobalDashboard from "./pages/global/GlobalDashboard";
import GlobalTasks from "./pages/global/GlobalTasks";
import GlobalInbox from "./pages/global/GlobalInbox";
import GlobalPlanning from "./pages/global/GlobalPlanning";
import GlobalObjectives from "./pages/global/GlobalObjectives";
import GlobalSources from "./pages/global/GlobalSources";
import GlobalRoutines from "./pages/global/GlobalRoutines";
import GlobalCoach from "./pages/global/GlobalCoach";
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
          <Route path="/" element={<Home />} />
          {/* Global HQ */}
          <Route path="/global/dashboard" element={<GlobalDashboard />} />
          <Route path="/global/tasks" element={<GlobalTasks />} />
          <Route path="/global/inbox" element={<GlobalInbox />} />
          <Route path="/global/planning" element={<GlobalPlanning />} />
          <Route path="/global/objectives" element={<GlobalObjectives />} />
          <Route path="/global/sources" element={<GlobalSources />} />
          <Route path="/global/routines" element={<GlobalRoutines />} />
          <Route path="/global/coach" element={<GlobalCoach />} />
          {/* Structure spaces */}
          <Route path="/structures/:id/dashboard" element={<StructureDashboard />} />
          <Route path="/structures/:id/tasks" element={<StructureTasks />} />
          <Route path="/structures/:id/inbox" element={<StructureInbox />} />
          <Route path="/structures/:id/planning" element={<StructurePlanning />} />
          <Route path="/structures/:id/objectives" element={<StructureObjectives />} />
          <Route path="/structures/:id/sources" element={<StructureSources />} />
          <Route path="/structures/:id/routines" element={<StructureRoutines />} />
          <Route path="/structures/:id/coach" element={<StructureCoach />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
