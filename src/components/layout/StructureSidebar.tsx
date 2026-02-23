import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Target, Plug2, Clock, ArrowLeft,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStructure } from "@/hooks/useStructures";
import { useUserStats } from "@/hooks/useUserStats";
import { useTasks } from "@/hooks/useTasks";

const getNav = (id: string) => [
  { label: "Dashboard", icon: LayoutDashboard, path: `/structures/${id}/dashboard` },
  { label: "Tâches", icon: CheckSquare, path: `/structures/${id}/tasks` },
  { label: "Inbox IA", icon: Inbox, path: `/structures/${id}/inbox` },
  { label: "Planning", icon: Calendar, path: `/structures/${id}/planning` },
  { label: "Objectifs", icon: Target, path: `/structures/${id}/objectives` },
  { label: "Sources connectées", icon: Plug2, path: `/structures/${id}/sources` },
  { label: "Routines", icon: Clock, path: `/structures/${id}/routines` },
  { label: "Coach IA", icon: Bot, path: `/structures/${id}/coach` },
];

interface Props {
  structureId: string;
  onNavigate?: () => void;
}

export const StructureSidebar = ({ structureId, onNavigate }: Props) => {
  const location = useLocation();
  const { data: structure } = useStructure(structureId);
  const { data: stats } = useUserStats();
  const { data: inboxTasks = [] } = useTasks({ structureId, isInbox: true });

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);
  const inboxCount = inboxTasks.length;
  const nav = getNav(structureId);

  return (
    <aside className="w-64 h-screen bg-card/90 backdrop-blur-sm border-r border-border/50 flex flex-col transition-colors duration-300">
      {/* Structure header */}
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Mes espaces</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${structure?.color || 'bg-primary'} flex items-center justify-center shadow-soft`}>
            <span className="text-white text-sm font-bold">{structure?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{structure?.name || 'Chargement...'}</h1>
            {structure?.description && <p className="text-[11px] text-muted-foreground truncate">{structure.description}</p>}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.path.includes("/inbox") && inboxCount > 0 ? inboxCount : null;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {badge && (
                <span className={`ml-auto text-[10px] font-bold pill w-5 h-5 flex items-center justify-center ${
                  isActive ? "bg-white/25 text-primary-foreground" : "bg-primary/15 text-primary"
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between px-4 py-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">Thème</span>
          <ThemeToggle />
        </div>
        <div className="mt-2 px-2">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="font-semibold text-foreground">Niveau {level} ⭐</span>
            <span className="text-muted-foreground">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-pill overflow-hidden">
            <div className="h-full gradient-primary rounded-pill transition-all duration-500" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
};
