import { Link, useLocation, useParams } from "react-router-dom";
import { LayoutDashboard, Inbox, CheckSquare, Calendar, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Board", icon: LayoutDashboard, view: "dashboard" },
  { label: "Inbox", icon: Inbox, view: "inbox" },
  { label: "Tâches", icon: CheckSquare, view: "tasks" },
  { label: "Planning", icon: Calendar, view: "planning" },
  { label: "Coach", icon: Bot, view: "coach" },
];

export const StructureBottomNav = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-card/90 backdrop-blur-xl border-t border-border/40 px-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const path = `/structures/${id}/${item.view}`;
            const isActive = location.pathname === path;
            return (
              <Link key={item.view} to={path} className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full">
                <div className="relative">
                  {isActive && (
                    <motion.div layoutId="struct-bottomnav" className="absolute -inset-2 rounded-2xl gradient-primary opacity-15" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                  )}
                  <motion.div animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                    <item.icon className={cn("w-[22px] h-[22px] transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                </div>
                <span className={cn("text-[10px] font-medium transition-colors duration-200", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
