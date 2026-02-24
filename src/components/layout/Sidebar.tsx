import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard, Inbox, CheckSquare, Calendar, Bot, Settings, Target, Clock,
  ChevronDown, ChevronRight, BarChart3, Trophy, Lock, Brain, Home, Plus, Compass,
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
  const { id: activeStructureId } = useParams<{ id: string }>();
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
      "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <aside className="w-[270px] h-screen flex flex-col transition-colors duration-300" style={{ background: "linear-gradient(180deg, hsla(280,40%,97%,1) 0%, hsl(0,0%,100%) 30%)", borderRight: "1px solid hsla(0,0%,0%,0.04)" }}>
      {/* Logo */}
      <div className="px-5 py-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #ff7aa8, #8b7cff, #63dfb4)" }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-foreground tracking-tight">Second Cerveau</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Life OS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {/* Home link */}
        <Link to="/" onClick={onNavigate} className={navLinkClass(location.pathname === "/")}>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", location.pathname === "/" ? "bg-primary/15" : "bg-muted/50")}>
            <Home className="w-4 h-4" />
          </div>
          <span>Accueil</span>
        </Link>

        {/* QG Général link */}
        <Link to="/life-hq" onClick={onNavigate} className={navLinkClass(location.pathname === "/life-hq")}>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", location.pathname === "/life-hq" ? "bg-primary/15" : "bg-muted/50")}>
            <Compass className="w-4 h-4" />
          </div>
          <span>QG Général</span>
        </Link>

        {/* ── ESPACES DE VIE ── */}
        <p className="px-3 pt-5 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Espaces de vie
        </p>

        {/* ── TRAVAIL (bloc déroulant) ── */}
        <div>
          <button
            onClick={() => setWorkOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
              isOnWorkRoute
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs", isOnWorkRoute ? "bg-primary/15" : "bg-muted/50")}>
              {workSpace?.icon ?? "💼"}
            </div>
            <span className="flex-1 text-left">{workSpace?.label ?? "Travail"}</span>
            {workOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {workOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border/40 pl-3">
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
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-[15px] h-[15px]" />
                    <span>{item.label}</span>
                    {badge && (
                      <span className="ml-auto text-[10px] font-bold bg-opal-pink/15 text-opal-pink w-5 h-5 flex items-center justify-center rounded-full">
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
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                          isStructureActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <div className={cn("w-3.5 h-3.5 rounded-md flex-shrink-0", structure.color)} style={{ minWidth: 14 }} />
                        <span className="truncate">{structure.name}</span>
                        {(taskCountByStructure[structure.id] ?? 0) > 0 && (
                          <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
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

        {/* ── AUTRES ESPACES ── */}
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
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs", isActive ? "bg-primary/15" : "bg-muted/50")}>
                {space.icon}
              </div>
              <span className="flex-1 truncate">{space.label}</span>
              {!space.enabled && !isActive && <Lock className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/30">
        <div className="flex items-center justify-between px-4 py-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">Thème</span>
          <ThemeToggle />
        </div>
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span>Paramètres</span>
        </Link>
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="font-extrabold text-foreground">Niveau {level} ⭐</span>
            <span className="text-muted-foreground font-semibold">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%`, background: "linear-gradient(90deg, #ff7aa8, #8b7cff, #63dfb4)" }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
