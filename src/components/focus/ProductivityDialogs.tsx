import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task, useUpdateTask, useWIPStatus, WIP_LIMITS } from "@/hooks/useTasks";

interface NextActionDialogProps {
  open: boolean;
  taskId: string;
  onClose: () => void;
  onSave: (nextAction: string) => void;
}

export const NextActionDialog = ({ open, taskId, onClose, onSave }: NextActionDialogProps) => {
  const [nextAction, setNextAction] = useState("");

  const handleSave = () => {
    if (nextAction.trim()) {
      onSave(nextAction.trim());
      setNextAction("");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">📝 Planifier l'étape suivante ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Selon la Temporal Motivation Theory, définir la prochaine action concrète réduit la procrastination.
        </p>
        <input
          placeholder="Ex: Relire et corriger la section 2 (15 min)"
          value={nextAction}
          onChange={e => setNextAction(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
          autoFocus
        />
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft"
          >
            Enregistrer <ArrowRight className="w-4 h-4 inline ml-1" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-card border border-border text-foreground text-sm"
          >
            Passer
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface WIPWarningDialogProps {
  open: boolean;
  onClose: () => void;
  inProgressTasks: Task[];
  onPauseTask: (taskId: string) => void;
}

export const WIPWarningDialog = ({ open, onClose, inProgressTasks, onPauseTask }: WIPWarningDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            WIP dépassé
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tu as déjà {inProgressTasks.length} tâches en cours (max {WIP_LIMITS.global} global).
          Les études montrent que limiter le travail en cours augmente ta vitesse et réduit le stress.
        </p>
        <p className="text-sm font-medium text-foreground">
          Termine ou mets en pause une tâche avant d'en commencer une nouvelle :
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {inProgressTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.action_label}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onPauseTask(task.id); onClose(); }}
                className="px-3 py-1.5 rounded-xl bg-warning/15 text-warning-foreground text-xs font-bold"
              >
                Mettre en pause
              </motion.button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
