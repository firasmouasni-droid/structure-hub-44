import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Settings, Target, Clock, Plug2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStructures } from "@/hooks/useStructures";
import { useUserStats } from "@/hooks/useUserStats";
import { useTasks } from "@/hooks/useTasks";

const globalNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/global/dashboard" },
  { label: "Tâches", icon: CheckSquare, path: "/global/tasks" },
  { label: "Inbox IA", icon: Inbox, path: "/global/inbox" },
  { label: "Planning", icon: Calendar, path: "/global/planning" },
  { label: "Objectifs", icon: Target, path: "/global/objectives" },
  { label: "Sources", icon: Plug2, path: "/global/sources" },
  { label: "Routines", icon: Clock, path: "/global/routines" },
  { label: "Coach IA", icon: Bot, path: "/global/coach" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { data: structures = [] } = useStructures();
  const { data: stats } = useUserStats();
  const { data: inboxTasks = [] } = useTasks({ isInbox: true });

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);
  const inboxCount = inboxTasks.length;

  return (
    <aside className="w-64 h-screen bg-card/90 backdrop-blur-sm border-r border-border/50 flex flex-col transition-colors duration-300">
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
        <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">QG Général</p>
        {globalNav.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.path === "/global/inbox" && inboxCount > 0 ? inboxCount : null;
          return (
            <Link key={item.path} to={item.path} onClick={onNavigate} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {badge && (
                <span className={`ml-auto text-[10px] font-bold pill w-5 h-5 flex items-center justify-center ${isActive ? "bg-white/25 text-primary-foreground" : "bg-primary/15 text-primary"}`}>{badge}</span>
              )}
            </Link>
          );
        })}

        <p className="px-3 pt-5 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Espaces</p>
        {structures.map((item) => {
          const isActive = location.pathname.startsWith(`/structures/${item.id}`);
          return (
            <Link key={item.id} to={`/structures/${item.id}/dashboard`} onClick={onNavigate} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between px-4 py-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">Thème</span>
          <ThemeToggle />
        </div>
        <Link to="/settings" onClick={onNavigate} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <Settings className="w-[18px] h-[18px]" /><span>Paramètres</span>
        </Link>
        <div className="mt-4 px-2">
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
