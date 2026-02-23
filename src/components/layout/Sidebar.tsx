import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Settings,
} from "lucide-react";
import { useStructures } from "@/hooks/useStructures";
import { useUserStats } from "@/hooks/useUserStats";
import { useTasks } from "@/hooks/useTasks";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Inbox IA", icon: Inbox, path: "/inbox" },
  { label: "Tâches", icon: CheckSquare, path: "/tasks" },
  { label: "Planning", icon: Calendar, path: "/planning" },
  { label: "Coach IA", icon: Bot, path: "/coach" },
];

export const Sidebar = () => {
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
    <aside className="w-60 h-screen bg-card border-r border-border flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">SC</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">Second Cerveau</h1>
            <p className="text-[11px] text-muted-foreground">Productivity OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Navigation</p>
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.path === "/inbox" && inboxCount > 0 ? inboxCount : null;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {badge && (
                <span className="ml-auto text-[11px] font-medium text-muted-foreground bg-accent rounded px-1.5 py-0.5">{badge}</span>
              )}
            </Link>
          );
        })}

        <p className="px-3 pt-6 pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Structures</p>
        {structures.map((item) => {
          const isActive = location.pathname === `/structure/${item.id}`;
          return (
            <Link key={item.id} to={`/structure/${item.id}`} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Settings className="w-4 h-4" /><span>Paramètres</span>
        </Link>
        <div className="mt-3 px-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-medium text-foreground">Niveau {level}</span>
            <span className="text-muted-foreground">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-1 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
};
