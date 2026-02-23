import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StructureDashboard from "./pages/StructureDashboard";
import Tasks from "./pages/Tasks";
import InboxIA from "./pages/InboxIA";
import Planning from "./pages/Planning";
import CoachIA from "./pages/CoachIA";
import ConnectorsPage from "./pages/ConnectorsPage";
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/structure/:id" element={<StructureDashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/inbox" element={<InboxIA />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/coach" element={<CoachIA />} />
          <Route path="/connectors" element={<ConnectorsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
