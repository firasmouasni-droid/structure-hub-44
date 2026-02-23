import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useStructures } from "@/hooks/useStructures";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const views = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Tâches", value: "tasks" },
  { label: "Inbox IA", value: "inbox" },
  { label: "Planning", value: "planning" },
  { label: "Objectifs", value: "objectives" },
  { label: "Sources", value: "sources" },
  { label: "Routines", value: "routines" },
  { label: "Coach IA", value: "coach" },
];

export const StructureTopbar = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: structures = [] } = useStructures();

  // Extract current view from path
  const pathParts = location.pathname.split("/");
  const currentView = pathParts[pathParts.length - 1] || "dashboard";

  const handleStructureChange = (newId: string) => {
    navigate(`/structures/${newId}/${currentView}`);
  };

  const handleViewChange = (newView: string) => {
    navigate(`/structures/${id}/${newView}`);
  };

  const currentStructure = structures.find((s) => s.id === id);

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 bg-card/80 backdrop-blur-xl border-b border-border/50 transition-colors duration-300">
      {/* Structure selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Espace</span>
        <Select value={id} onValueChange={handleStructureChange}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl border-border/50 bg-muted/50 text-sm font-medium">
            <div className="flex items-center gap-2">
              {currentStructure && (
                <div className={cn("w-3 h-3 rounded-md flex-shrink-0", currentStructure.color)} />
              )}
              <SelectValue placeholder="Espace..." />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-popover border-border/50 z-50">
            {structures.map((s) => (
              <SelectItem key={s.id} value={s.id} className="rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-md", s.color)} />
                  <span>{s.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Vue</span>
        <Select value={currentView} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[140px] h-9 rounded-xl border-border/50 bg-muted/50 text-sm font-medium">
            <SelectValue placeholder="Vue..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-popover border-border/50 z-50">
            {views.map((v) => (
              <SelectItem key={v.value} value={v.value} className="rounded-lg">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1" />

      {/* Search + Avatar */}
      <button className="p-2 rounded-xl hover:bg-muted transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};
