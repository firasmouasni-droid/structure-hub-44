import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, SkipForward, Timer, Brain, Zap } from "lucide-react";
import { Task, useUpdateTask } from "@/hooks/useTasks";
import { useIncrementXP } from "@/hooks/useUserStats";
import { toast } from "sonner";

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
  onNextAction: (taskId: string) => void;
}

const FocusMode = ({ task, onClose, onComplete, onNextAction }: FocusModeProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();
  const duration = (task.estimated_duration || 30) * 60; // seconds

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const progress = Math.min((elapsed / duration) * 100, 100);
  const remaining = Math.max(duration - elapsed, 0);

  const handleComplete = async () => {
    await updateTask.mutateAsync({
      id: task.id,
      status: "done",
      actual_duration: Math.round(elapsed / 60),
    });
    await incrementXP.mutateAsync(25); // bonus XP for deep work
    toast.success("+25 XP pour deep work complété ! 🧠");
    onComplete();
  };

  const handlePauseAndAsk = () => {
    setIsRunning(false);
    onNextAction(task.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      >
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ top: "20%", left: "30%" }}
          />
        </div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>

        <div className="relative z-10 text-center max-w-lg mx-auto px-6 space-y-8">
          {/* Focus badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">Deep Work</span>
          </motion.div>

          {/* Task title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-foreground leading-tight"
          >
            {task.action_label}
          </motion.h1>

          {task.next_action && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-muted-foreground"
            >
              Prochaine action : <span className="text-foreground font-medium">{task.next_action}</span>
            </motion.p>
          )}

          {/* Timer ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-48 h-48 mx-auto"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <motion.circle
                cx="50" cy="50" r="44" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${progress * 2.764} ${276.4 - progress * 2.764}`}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground font-mono">{formatTime(elapsed)}</span>
              <span className="text-xs text-muted-foreground mt-1">
                <Timer className="w-3 h-3 inline mr-1" />
                {formatTime(remaining)} restant
              </span>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRunning(!isRunning)}
              className="w-14 h-14 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-soft"
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className="px-6 py-3 rounded-2xl bg-success/15 text-success font-bold text-sm border border-success/20"
            >
              <Zap className="w-4 h-4 inline mr-1.5" />
              Terminé !
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePauseAndAsk}
              className="px-6 py-3 rounded-2xl bg-card border border-border text-foreground font-medium text-sm"
            >
              <SkipForward className="w-4 h-4 inline mr-1.5" />
              Pause
            </motion.button>
          </motion.div>

          {/* Scientific tip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-muted-foreground/70 max-w-sm mx-auto"
          >
            🧠 Selon Csikszentmihalyi, le flow survient quand tu travailles sur une seule tâche claire, avec un challenge adapté à tes compétences.
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusMode;
