import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventReminders } from "@/hooks/useEventReminders";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEventReminders();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden transition-colors duration-300" style={{ background: "hsla(0,0%,100%,0.92)", backdropFilter: "blur(24px) saturate(1.8)", WebkitBackdropFilter: "blur(24px) saturate(1.8)", borderBottom: "1px solid hsla(0,0%,0%,0.04)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #ff7aa8, #8b7cff, #63dfb4)" }}>
              <span className="text-white text-[10px] font-extrabold">SC</span>
            </div>
            <span className="text-sm font-bold text-foreground">Second Cerveau</span>
          </div>
        </div>
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
