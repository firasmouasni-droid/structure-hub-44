import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Inbox, CheckSquare, Calendar, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";

const getNav = (id: string) => [
  { label: "Dashboard", icon: LayoutDashboard, path: `/structures/${id}/dashboard` },
  { label: "Inbox", icon: Inbox, path: `/structures/${id}/inbox` },
  { label: "Tâches", icon: CheckSquare, path: `/structures/${id}/tasks` },
  { label: "Planning", icon: Calendar, path: `/structures/${id}/planning` },
  { label: "Coach", icon: Bot, path: `/structures/${id}/coach` },
];

export const StructureBottomNav = ({ structureId }: { structureId: string }) => {
  const location = useLocation();
  const { data: inboxTasks = [] } = useTasks({ structureId, isInbox: true });
  const inboxCount = inboxTasks.length;
  const navItems = getNav(structureId);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-card/90 backdrop-blur-xl border-t border-border/40 px-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badge = item.path.includes("/inbox") && inboxCount > 0 ? inboxCount : null;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full">
                <div className="relative">
                  {isActive && (
                    <motion.div layoutId="structure-bottomnav-active" className="absolute -inset-2 rounded-2xl gradient-primary opacity-15" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                  )}
                  <motion.div animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                    <item.icon className={`w-[22px] h-[22px] transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  {badge && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{badge}</span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
