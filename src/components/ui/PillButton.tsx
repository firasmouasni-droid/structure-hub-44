import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type PillVariant = "primary" | "ghost" | "tag" | "round" | "outline" | "opal";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant;
  children: ReactNode;
  active?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<PillVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
  ghost: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  tag: "bg-muted text-muted-foreground text-xs",
  round: "bg-card shadow-opal text-foreground hover:shadow-opal-hover",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted/50",
  opal: "bg-gradient-to-r from-opal-pink via-opal-orange to-opal-green text-white shadow-soft",
};

const activeStyles: Record<PillVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  ghost: "bg-muted text-foreground",
  tag: "bg-primary/15 text-primary font-semibold",
  round: "bg-primary/10 text-primary shadow-opal-hover",
  outline: "border-primary bg-primary/5 text-primary",
  opal: "",
};

export const PillButton = ({ variant = "primary", children, active, icon, className, ...props }: PillButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-all duration-200",
      variantStyles[variant],
      active && activeStyles[variant],
      className
    )}
    {...(props as any)}
  >
    {icon}
    {children}
  </motion.button>
);
