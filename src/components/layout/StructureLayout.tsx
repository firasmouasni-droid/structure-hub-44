import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { StructureTopbar } from "./StructureTopbar";
import { StructureBottomNav } from "./StructureBottomNav";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StructureLayoutProps {
  children: ReactNode;
}

const StructureLayout = ({ children }: StructureLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — same global sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
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

      <main className="flex-1 overflow-y-auto bg-background flex flex-col">
        {/* Mobile hamburger row */}
        <div className="flex items-center gap-2 px-4 py-2 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Contextual topbar (Espace + Vue selectors) */}
        <StructureTopbar />

        <div className="flex-1 pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      <StructureBottomNav />
    </div>
  );
};

export default StructureLayout;
