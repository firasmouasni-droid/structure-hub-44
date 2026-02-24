import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  gradient?: "opal" | "pink" | "green" | "purple" | "blue" | "none";
  onClick?: () => void;
}

const gradientOverlays: Record<string, string> = {
  opal: "before:bg-gradient-to-br before:from-opal-pink/10 before:via-opal-orange/8 before:to-opal-green/6",
  pink: "before:bg-gradient-to-br before:from-opal-pink/12 before:to-opal-purple/8",
  green: "before:bg-gradient-to-br before:from-opal-green/12 before:to-accent/8",
  purple: "before:bg-gradient-to-br before:from-opal-purple/12 before:to-primary/8",
  blue: "before:bg-gradient-to-br before:from-accent/12 before:to-opal-green/6",
  none: "",
};

export const GradientCard = ({ children, className, gradient = "opal", onClick }: GradientCardProps) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    onClick={onClick}
    className={cn(
      "relative bg-card rounded-3xl shadow-opal overflow-hidden",
      gradient !== "none" && `before:absolute before:inset-0 before:rounded-3xl before:pointer-events-none ${gradientOverlays[gradient]}`,
      onClick && "cursor-pointer",
      className
    )}
  >
    <div className="relative z-10">{children}</div>
  </motion.div>
);
