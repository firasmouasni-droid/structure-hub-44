import { useState, useRef, useEffect } from "react";
import { CATEGORY_LIST, type TaskCategory } from "@/lib/categories";
import { ChevronDown } from "lucide-react";

interface CategorySelectorProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
  compact?: boolean;
}

const CategorySelector = ({ value, onChange, compact = false }: CategorySelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = CATEGORY_LIST.find(c => c.key === value) || CATEGORY_LIST[2]; // default admin

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all hover:shadow-sm"
        style={{
          backgroundColor: `${current.colors.light}40`,
          borderColor: `${current.colors.normal}30`,
          color: current.colors.normal,
        }}
      >
        <current.icon className="w-3.5 h-3.5" />
        {!compact && <span className="text-[11px] font-bold truncate max-w-[100px]">{current.label}</span>}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-popover shadow-lg z-50 py-1 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {CATEGORY_LIST.map(cat => {
            const Icon = cat.icon;
            const isActive = cat.key === value;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => { onChange(cat.key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent/10"
                style={isActive ? { backgroundColor: `${cat.colors.light}30` } : undefined}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.colors.light}50` }}
                >
                  <Icon className="w-4 h-4" style={{ color: cat.colors.normal }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                </div>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.colors.normal }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
