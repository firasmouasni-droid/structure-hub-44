import { Brain, Users, Briefcase, MessageSquare, Zap, Heart, Leaf, AlertTriangle, type LucideIcon } from "lucide-react";

export type TaskCategory = 
  | "focus" 
  | "meetings" 
  | "admin" 
  | "communication" 
  | "quick" 
  | "personal" 
  | "wellness" 
  | "urgent";

export interface CategoryConfig {
  key: TaskCategory;
  label: string;
  icon: LucideIcon;
  emoji: string;
  colors: {
    normal: string;   // hex
    light: string;    // hex
    high: string;     // hex
  };
}

export const CATEGORIES: Record<TaskCategory, CategoryConfig> = {
  focus: {
    key: "focus",
    label: "Focus / Deep Work",
    icon: Brain,
    emoji: "🧠",
    colors: { normal: "#8A63F6", light: "#CBB9FF", high: "#6B45E4" },
  },
  meetings: {
    key: "meetings",
    label: "Réunions / Collaboration",
    icon: Users,
    emoji: "👥",
    colors: { normal: "#FF9A5B", light: "#FFD7C2", high: "#FF7A2E" },
  },
  admin: {
    key: "admin",
    label: "Admin / Obligations",
    icon: Briefcase,
    emoji: "📋",
    colors: { normal: "#4EA8FF", light: "#CFEAFF", high: "#1D7EDB" },
  },
  communication: {
    key: "communication",
    label: "Communication",
    icon: MessageSquare,
    emoji: "💬",
    colors: { normal: "#F9D85E", light: "#FFF1B8", high: "#F5C528" },
  },
  quick: {
    key: "quick",
    label: "Tâches rapides",
    icon: Zap,
    emoji: "⚡",
    colors: { normal: "#7ED897", light: "#D2F0D6", high: "#40B66E" },
  },
  personal: {
    key: "personal",
    label: "Personnel",
    icon: Heart,
    emoji: "💜",
    colors: { normal: "#F6A2C5", light: "#FFE0EF", high: "#E96A9C" },
  },
  wellness: {
    key: "wellness",
    label: "Santé / Bien-être",
    icon: Leaf,
    emoji: "🌿",
    colors: { normal: "#4ADBC8", light: "#C5F4EE", high: "#22BFB0" },
  },
  urgent: {
    key: "urgent",
    label: "Urgent / Imprévu",
    icon: AlertTriangle,
    emoji: "🔴",
    colors: { normal: "#FF6F7D", light: "#FFC5CA", high: "#E43C4E" },
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

/** Map action_type to a default category */
export function actionTypeToCategory(actionType: string): TaskCategory {
  switch (actionType) {
    case "WRITE":
    case "BUILD":
    case "LEARN":
      return "focus";
    case "MEETING":
      return "meetings";
    case "ADMIN":
    case "PLAN":
    case "REVIEW":
      return "admin";
    case "EMAIL":
    case "CALL":
      return "communication";
    default:
      return "admin";
  }
}

/** Get color based on category and priority */
export function getCategoryColor(category: TaskCategory, priority?: string): string {
  const cat = CATEGORIES[category] || CATEGORIES.admin;
  if (priority === "high") return cat.colors.high;
  if (priority === "low") return cat.colors.light;
  return cat.colors.normal;
}

/** Get CSS styles for a planning block */
export function getCategoryBlockStyles(category: TaskCategory, priority?: string) {
  const cat = CATEGORIES[category] || CATEGORIES.admin;
  const color = priority === "high" ? cat.colors.high : cat.colors.normal;
  const bgColor = priority === "high" ? cat.colors.normal : cat.colors.light;
  const borderColor = color;

  return {
    backgroundColor: `${bgColor}22`,
    borderColor: `${borderColor}55`,
    color: color,
    "--cat-color": color,
    "--cat-bg": bgColor,
  } as React.CSSProperties;
}

/** Shape class based on category */
export function getCategoryShape(category: TaskCategory): string {
  switch (category) {
    case "focus":
      return "rounded-2xl border-l-4"; // thick pill
    case "meetings":
      return "rounded-xl border-l-3"; // rectangle with slight round
    case "communication":
      return "rounded-xl"; // compact
    case "urgent":
      return "rounded-2xl border-l-4"; // badge
    case "personal":
      return "rounded-2xl"; // pill
    case "quick":
      return "rounded-xl"; // compact
    default:
      return "rounded-2xl"; // default pill
  }
}
