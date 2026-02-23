import { motion } from "framer-motion";
import { CATEGORIES, type TaskCategory, getCategoryColor } from "@/lib/categories";
import { Clock, Bot, CalendarDays, Mail, RotateCcw } from "lucide-react";

interface PlanningBlockProps {
  title: string;
  category: TaskCategory;
  priority?: string;
  durationHours: number;
  source?: string;
  startTime?: string;
  height: number;
  top: number;
  index?: number;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  eventId: string;
}

const SOURCE_ICONS: Record<string, { icon: typeof Bot; label: string }> = {
  ai: { icon: Bot, label: "IA" },
  google: { icon: CalendarDays, label: "Google" },
  email: { icon: Mail, label: "Email" },
  recurring: { icon: RotateCcw, label: "Récurrent" },
};

export default function PlanningBlock({
  title,
  category,
  priority = "medium",
  durationHours,
  source = "manual",
  startTime,
  height,
  top,
  index = 0,
  isDragging,
  onDragStart,
  onDragEnd,
  eventId,
}: PlanningBlockProps) {
  const cat = CATEGORIES[category] || CATEGORIES.admin;
  const Icon = cat.icon;
  const color = getCategoryColor(category, priority);
  const lightColor = cat.colors.light;

  const isHighPriority = priority === "high";
  const isLowPriority = priority === "low";

  // Shape based on category
  const shapeClass =
    category === "meetings"
      ? "rounded-xl"
      : category === "communication" || category === "quick"
      ? "rounded-xl"
      : "rounded-2xl";

  // Border thickness
  const borderClass =
    category === "focus" || category === "urgent"
      ? "border-l-[4px]"
      : "border-l-[3px]";

  const durationMin = Math.round(durationHours * 60);
  const sourceInfo = SOURCE_ICONS[source];

  return (
    <motion.div
      className={`absolute left-2 right-2 ${shapeClass} ${borderClass} border px-3 py-2 z-10 cursor-grab active:cursor-grabbing select-none group transition-shadow hover:shadow-lg`}
      style={{
        height: `${Math.max(height, 44)}px`,
        top: `${top}px`,
        backgroundColor: isLowPriority ? `${lightColor}30` : `${lightColor}50`,
        borderColor: `${color}${isHighPriority ? "99" : "55"}`,
        borderLeftColor: color,
      }}
      initial={{ opacity: 0, scale: 0.92, x: -8 }}
      animate={{
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 0.95 : 1,
        x: 0,
      }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ delay: 0.2 + index * 0.06, duration: 0.3 }}
      // Native drag handlers via DOM attributes
      {...({
        draggable: true,
        onDragStart: onDragStart as any,
        onDragEnd: onDragEnd as any,
      })}
    >
      {/* Top row: icon + title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon
          className="w-3.5 h-3.5 shrink-0"
          style={{ color }}
        />
        <p
          className="text-xs font-semibold truncate"
          style={{ color: "#2A2A2A" }}
        >
          {title}
        </p>
      </div>

      {/* Bottom row: metadata */}
      {height >= 50 && (
        <div className="flex items-center gap-2 mt-1.5">
          {/* Duration */}
          <span
            className="flex items-center gap-0.5 text-[10px] font-medium"
            style={{ color: `${color}CC` }}
          >
            <Clock className="w-2.5 h-2.5" />
            {durationMin} min
          </span>

          {/* Source badge */}
          {sourceInfo && (
            <span
              className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${color}18`,
                color: `${color}DD`,
              }}
            >
              <sourceInfo.icon className="w-2.5 h-2.5" />
              {sourceInfo.label}
            </span>
          )}

          {/* Priority indicator */}
          {isHighPriority && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${color}22`,
                color,
              }}
            >
              Prioritaire
            </span>
          )}

          {/* Category label on hover */}
          <span
            className="text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
            style={{ color: `${color}AA` }}
          >
            {cat.emoji} {cat.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
