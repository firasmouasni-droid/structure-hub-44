import AppLayout from "@/components/layout/AppLayout";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Inbox, Check, Pencil, Archive, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

const InboxIA = () => {
  const { data: inboxTasks = [], isLoading } = useTasks({ isInbox: true });
  const { data: structures = [] } = useStructures();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();

  const handleAccept = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, is_inbox: false });
    toast.success("Tâche acceptée !");
  };

  const handleDone = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, status: "done", is_inbox: false });
    await incrementXP.mutateAsync(10);
    toast.success("Tâche terminée ! +10 XP");
  };

  const handleArchive = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, status: "done", is_inbox: false });
    toast("Tâche archivée");
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-warm flex items-center justify-center shadow-soft">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbox IA</h1>
            <p className="text-sm text-muted-foreground">{inboxTasks.length} tâches générées automatiquement</p>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
          {!isLoading && inboxTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Inbox vide 🎉</p>}
          {inboxTasks.map((task) => {
            const structure = structures.find(s => s.id === task.structure_id);
            return (
              <div key={task.id} className="card-soft p-5 hover:shadow-soft-lg transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10">
                    {task.email_id ? <Mail className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 pill bg-primary/15 text-primary">IA</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${structure?.color || 'bg-muted'}`} />
                      <span className="text-xs text-muted-foreground">{structure?.name || '-'}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{task.action_label}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Source : {task.source}</span>
                      <span>·</span>
                      <span>{task.due_date || 'Pas de date'}</span>
                      <span>·</span>
                      <span>{task.estimated_duration ? `${task.estimated_duration} min` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleAccept(task.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success/15 text-success-foreground text-xs font-semibold hover:bg-success/25 transition-all">
                      <Check className="w-3.5 h-3.5" />Accepter
                    </button>
                    <button onClick={() => handleDone(task.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-all">
                      <Pencil className="w-3.5 h-3.5" />Terminer
                    </button>
                    <button onClick={() => handleArchive(task.id)} className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all">
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default InboxIA;
