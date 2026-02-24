import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  gradient?: "opal" | "pink" | "green" | "purple" | "blue" | "none";
  onClick?: () => void;
  glow?: boolean;
}

export const GradientCard = ({ children, className, gradient = "none", onClick, glow }: GradientCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    onClick={onClick}
    className={cn(
      "relative rounded-[20px] overflow-hidden bg-card",
      "border border-border/40",
      onClick && "cursor-pointer",
      className
    )}
  >
    <div className="relative z-10">{children}</div>
  </motion.div>
);
