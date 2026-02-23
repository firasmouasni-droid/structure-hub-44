import { ReactNode, useState } from "react";
import { StructureSidebar } from "./StructureSidebar";
import { StructureBottomNav } from "./StructureBottomNav";
import { Menu, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { useStructure } from "@/hooks/useStructures";

interface StructureLayoutProps {
  children: ReactNode;
}

const StructureLayout = ({ children }: StructureLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { data: structure } = useStructure(id || "");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <StructureSidebar structureId={id || ""} onNavigate={() => {}} />
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
              <StructureSidebar structureId={id || ""} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto bg-background">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-border/50 lg:hidden transition-colors duration-300">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <Link to="/" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl ${structure?.color || 'bg-primary'} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-bold">{structure?.name?.charAt(0) || '?'}</span>
            </div>
            <span className="text-sm font-bold text-foreground truncate">{structure?.name || 'Chargement...'}</span>
          </div>
        </div>
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      <StructureBottomNav structureId={id || ""} />
    </div>
  );
};

export default StructureLayout;
