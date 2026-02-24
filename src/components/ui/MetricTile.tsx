import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricTileProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  progress?: number;
  iconBg?: string;
  className?: string;
}

export const MetricTile = ({ icon, label, value, sub, progress, iconBg = "bg-primary/10 text-primary", className }: MetricTileProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={cn("bg-card rounded-3xl shadow-opal p-5", className)}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", iconBg)}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    {progress !== undefined && (
      <div className="h-1.5 bg-muted rounded-pill overflow-hidden mt-3">
        <motion.div
          className="h-full rounded-pill bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(progress, 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    )}
  </motion.div>
);
