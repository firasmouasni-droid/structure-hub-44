import { Link, useLocation } from "react-router-dom";
import { Home, Briefcase, CheckSquare, Calendar, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";

const navItems = [
  { label: "Accueil", icon: Home, path: "/" },
  { label: "Travail", icon: Briefcase, path: "/spaces/work", matchPrefix: ["/spaces/work", "/global/", "/structures/"] },
  { label: "Tâches", icon: CheckSquare, path: "/global/tasks" },
  { label: "Planning", icon: Calendar, path: "/global/planning" },
  { label: "Coach", icon: Bot, path: "/global/coach" },
];

export const BottomNav = () => {
  const location = useLocation();
  const { data: inboxTasks = [] } = useTasks({ isInbox: true });
  const inboxCount = inboxTasks.length;

  const isItemActive = (item: typeof navItems[0]) => {
    if (item.matchPrefix) {
      const anotherExactMatch = navItems.some(
        (n) => n !== item && location.pathname === n.path
      );
      if (anotherExactMatch) return false;
      return item.matchPrefix.some((p) => location.pathname.startsWith(p));
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/40 px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const badge = item.path === "/global/tasks" && inboxCount > 0 ? inboxCount : null;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center justify-center gap-1 w-16 h-full">
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="bottomnav-active"
                      className="absolute -inset-2.5 rounded-2xl bg-charcoal/8"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`w-[22px] h-[22px] relative z-10 transition-colors duration-200 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {badge && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-opal-pink text-[9px] font-bold text-white flex items-center justify-center z-20">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] transition-colors duration-200 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
