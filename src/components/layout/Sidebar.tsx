import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Settings, Target, Clock,
  ChevronDown, ChevronRight, BarChart3,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStructures } from "@/hooks/useStructures";
import { useUserStats } from "@/hooks/useUserStats";
import { useTasks } from "@/hooks/useTasks";
import { useState } from "react";
import { cn } from "@/lib/utils";

const globalNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/global/dashboard" },
  { label: "Tâches", icon: CheckSquare, path: "/global/tasks" },
  { label: "Inbox IA", icon: Inbox, path: "/global/inbox" },
  { label: "Planning", icon: Calendar, path: "/global/planning" },
  { label: "Objectifs", icon: Target, path: "/global/objectives" },
  { label: "Analytics", icon: BarChart3, path: "/global/analytics" },
  { label: "Coach IA", icon: Bot, path: "/global/coach" },
];

const structureSubNav = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { label: "Tâches", icon: CheckSquare, view: "tasks" },
  { label: "Inbox IA", icon: Inbox, view: "inbox" },
  { label: "Planning", icon: Calendar, view: "planning" },
  { label: "Objectifs", icon: Target, view: "objectives" },
  { label: "Sources", icon: Clock, view: "sources" },
  { label: "Routines", icon: Clock, view: "routines" },
  { label: "Coach IA", icon: Bot, view: "coach" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { id: activeStructureId } = useParams<{ id: string }>();
  const { data: structures = [] } = useStructures();
  const { data: stats } = useUserStats();
  const { data: inboxTasks = [] } = useTasks({ isInbox: true });

  // Track which accordions are open — auto-open the active structure
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);
  const inboxCount = inboxTasks.length;

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isStructureOpen = (id: string) => {
    if (openAccordions[id] !== undefined) return openAccordions[id];
    // Auto-open the active structure
    return activeStructureId === id || location.pathname.startsWith(`/structures/${id}`);
  };

  return (
    <aside className="w-64 h-screen bg-card/90 backdrop-blur-sm border-r border-border/50 flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-soft">
            <span className="text-primary-foreground text-sm font-bold">SC</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Second Cerveau</h1>
            <p className="text-[11px] text-muted-foreground">Productivity OS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {/* ── SECTION GLOBAL ── */}
        <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          QG Général
        </p>
        {globalNav.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.path === "/global/inbox" && inboxCount > 0 ? inboxCount : null;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {badge && (
                <span
                  className={cn(
                    "ml-auto text-[10px] font-bold pill w-5 h-5 flex items-center justify-center",
                    isActive ? "bg-white/25 text-primary-foreground" : "bg-primary/15 text-primary"
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* ── SECTION ESPACES ── */}
        <div className="pt-4">
          <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Espaces
          </p>
        </div>

        {structures.map((structure) => {
          const isOpen = isStructureOpen(structure.id);
          const isStructureActive = location.pathname.startsWith(`/structures/${structure.id}`);

          return (
            <div key={structure.id} className="mb-1">
              {/* Accordion trigger */}
              <button
                onClick={() => toggleAccordion(structure.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
                  isStructureActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div
                  className={cn("w-4 h-4 rounded-lg flex-shrink-0", structure.color)}
                  style={{ minWidth: 16 }}
                />
                <span className="flex-1 text-left truncate">{structure.name}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform" />
                )}
              </button>

              {/* Accordion content */}
              {isOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border/50 pl-3">
                  {structureSubNav.map((sub) => {
                    const subPath = `/structures/${structure.id}/${sub.view}`;
                    const isSubActive = location.pathname === subPath;
                    return (
                      <Link
                        key={sub.view}
                        to={subPath}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                          isSubActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <sub.icon className="w-[15px] h-[15px]" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between px-4 py-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">Thème</span>
          <ThemeToggle />
        </div>
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span>Paramètres</span>
        </Link>
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="font-semibold text-foreground">Niveau {level} ⭐</span>
            <span className="text-muted-foreground">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-pill overflow-hidden">
            <div
              className="h-full gradient-primary rounded-pill transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
