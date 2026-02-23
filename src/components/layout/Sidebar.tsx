import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Settings, Zap,
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
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col card-shadow">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">Second Cerveau</h1>
            <p className="text-[11px] text-muted-foreground">Productivity OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Navigation</p>
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.path === "/inbox" && inboxCount > 0 ? inboxCount : null;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-primary text-primary-foreground card-shadow" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {badge && (
                <span className={`ml-auto text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "gradient-ai text-primary-foreground"}`}>{badge}</span>
              )}
            </Link>
          );
        })}

        <p className="px-3 pt-5 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Structures</p>
        {structures.map((item) => {
          const isActive = location.pathname === `/structure/${item.id}`;
          return (
            <Link key={item.id} to={`/structure/${item.id}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
          <Settings className="w-[18px] h-[18px]" /><span>Paramètres</span>
        </Link>
        <div className="mt-3 px-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-foreground">Niveau {level}</span>
            <span className="text-muted-foreground">{xp.toLocaleString()} / {(level * 1000).toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-xp rounded-full" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
};
