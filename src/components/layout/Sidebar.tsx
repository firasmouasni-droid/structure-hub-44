import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Settings, Target, Clock,
  ChevronDown, ChevronRight, BarChart3, Trophy, Lock, Brain, Home, Compass,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStructures } from "@/hooks/useStructures";
import { useUserStats } from "@/hooks/useUserStats";
import { useTasks } from "@/hooks/useTasks";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { useState } from "react";
import { cn } from "@/lib/utils";

const workSubNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/global/dashboard" },
  { label: "Tâches", icon: CheckSquare, path: "/global/tasks" },
  { label: "Inbox IA", icon: Inbox, path: "/global/inbox" },
  { label: "Planning", icon: Calendar, path: "/global/planning" },
  { label: "Objectifs", icon: Target, path: "/global/objectives" },
  { label: "Routines", icon: Clock, path: "/global/routines" },
  { label: "Coach IA", icon: Bot, path: "/global/coach" },
  { label: "Analytics", icon: BarChart3, path: "/global/analytics" },
  { label: "Gamification", icon: Trophy, path: "/global/gamification" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { data: structures = [] } = useStructures();
  const { data: stats } = useUserStats();
  const { data: inboxTasks = [] } = useTasks({ isInbox: true });
  const { data: allTasks = [] } = useTasks();
  const { data: lifeSpaces = [] } = useLifeSpaces();

  const taskCountByStructure = allTasks.reduce<Record<string, number>>((acc, t) => {
    if (t.status === "todo" || t.status === "in_progress") {
      acc[t.structure_id] = (acc[t.structure_id] || 0) + 1;
    }
    return acc;
  }, {});

  const isOnWorkRoute =
    location.pathname.startsWith("/global/") ||
    location.pathname.startsWith("/structures/") ||
    location.pathname.startsWith("/spaces/work");

  const [workOpen, setWorkOpen] = useState(isOnWorkRoute);

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);
  const inboxCount = inboxTasks.length;

  const workSpace = lifeSpaces.find((s) => s.key === "work");
  const workStructures = workSpace
    ? structures.filter((s) => s.life_space_id === workSpace.id)
    : structures;
  const otherSpaces = lifeSpaces.filter((s) => s.key !== "work");

  const navLinkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
      isActive
        ? "bg-charcoal text-white"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <aside className="w-[260px] h-screen bg-background border-r border-border/40 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Second Cerveau</h1>
            <p className="text-[10px] text-muted-foreground">Life OS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        <Link to="/" onClick={onNavigate} className={navLinkClass(location.pathname === "/")}>
          <Home className="w-4 h-4" />
          <span>Accueil</span>
        </Link>

        <Link to="/life-hq" onClick={onNavigate} className={navLinkClass(location.pathname === "/life-hq")}>
          <Compass className="w-4 h-4" />
          <span>QG Général</span>
        </Link>

        <p className="px-3 pt-5 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Espaces de vie
        </p>

        {/* Work section */}
        <div>
          <button
            onClick={() => setWorkOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
              isOnWorkRoute
                ? "bg-charcoal text-white"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span className="text-sm">{workSpace?.icon ?? "💼"}</span>
            <span className="flex-1 text-left">{workSpace?.label ?? "Travail"}</span>
            {workOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
          </button>

          {workOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-3">
              <p className="px-2 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Vue globale
              </p>
              {workSubNav.map((item) => {
                const isActive = location.pathname === item.path;
                const badge = item.path === "/global/inbox" && inboxCount > 0 ? inboxCount : null;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {badge && (
                      <span className="ml-auto text-[10px] font-bold bg-opal-pink text-white w-4 h-4 flex items-center justify-center rounded-full">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {workStructures.length > 0 && (
                <>
                  <p className="px-2 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Structures
                  </p>
                  {workStructures.map((structure) => {
                    const structurePath = `/structures/${structure.id}/dashboard`;
                    const isStructureActive = location.pathname.startsWith(`/structures/${structure.id}`);
                    return (
                      <Link
                        key={structure.id}
                        to={structurePath}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                          isStructureActive
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        )}
                      >
                        <div className={cn("w-3 h-3 rounded-sm flex-shrink-0", structure.color)} />
                        <span className="truncate">{structure.name}</span>
                        {(taskCountByStructure[structure.id] ?? 0) > 0 && (
                          <span className="ml-auto text-[10px] font-bold text-muted-foreground">
                            {taskCountByStructure[structure.id]}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {otherSpaces.map((space) => {
          const spacePath = `/spaces/${space.key}`;
          const isActive = location.pathname.startsWith(spacePath);
          return (
            <Link
              key={space.id}
              to={spacePath}
              onClick={onNavigate}
              className={navLinkClass(isActive)}
            >
              <span className="text-sm">{space.icon}</span>
              <span className="flex-1 truncate">{space.label}</span>
              {!space.enabled && <Lock className="w-3 h-3 text-muted-foreground/40" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">Thème</span>
          <ThemeToggle />
        </div>
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
        </Link>
        <div className="mt-3 px-2">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-foreground">Niveau {level}</span>
            <span className="text-muted-foreground">{xp} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%`, background: "linear-gradient(90deg, hsl(var(--opal-pink)), hsl(var(--opal-purple)), hsl(var(--opal-green)))" }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
