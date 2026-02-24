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

export const GradientCard = ({ children, className, gradient = "opal", onClick, glow = false }: GradientCardProps) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.03)" }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    onClick={onClick}
    className={cn(
      "relative rounded-[28px] overflow-hidden",
      "bg-card border border-border/20",
      "shadow-[0_8px_32px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)]",
      glow && "ring-2 ring-primary/20",
      onClick && "cursor-pointer",
      className
    )}
    style={
      gradient !== "none"
        ? {
            backgroundImage: {
              opal: "linear-gradient(135deg, hsla(340,100%,73%,0.08) 0%, hsla(30,100%,73%,0.06) 50%, hsla(160,65%,63%,0.08) 100%)",
              pink: "linear-gradient(135deg, hsla(340,100%,73%,0.12) 0%, hsla(250,100%,74%,0.08) 100%)",
              green: "linear-gradient(135deg, hsla(160,65%,63%,0.12) 0%, hsla(214,90%,62%,0.08) 100%)",
              purple: "linear-gradient(135deg, hsla(250,100%,74%,0.12) 0%, hsla(263,70%,58%,0.08) 100%)",
              blue: "linear-gradient(135deg, hsla(214,90%,62%,0.12) 0%, hsla(160,65%,63%,0.06) 100%)",
            }[gradient]
          }
        : undefined
    }
  >
    <div className="relative z-10">{children}</div>
  </motion.div>
);
