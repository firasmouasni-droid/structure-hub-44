import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader = ({ title, subtitle, action, className }: SectionHeaderProps) => (
  <div className={cn("flex items-center justify-between mb-5", className)}>
    <div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);
