import AppLayout from "@/components/layout/AppLayout";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useIncrementXP } from "@/hooks/useUserStats";
import { Inbox, Check, Pencil, Archive, Mail } from "lucide-react";
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
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <Inbox className="w-5 h-5 text-muted-foreground" />
          <div>
            <h1 className="text-h1 text-foreground">Inbox IA</h1>
            <p className="text-caption text-muted-foreground">{inboxTasks.length} tâches générées automatiquement</p>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-caption text-muted-foreground text-center py-8">Chargement...</p>}
          {!isLoading && inboxTasks.length === 0 && <p className="text-caption text-muted-foreground text-center py-8">Inbox vide 🎉</p>}
          {inboxTasks.map((task) => {
            const structure = structures.find(s => s.id === task.structure_id);
            return (
              <div key={task.id} className="bg-card rounded-lg border border-border p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-accent">
                    {task.email_id ? <Mail className="w-4 h-4 text-muted-foreground" /> : <Inbox className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground font-medium">IA</span>
                      <div className={`w-2 h-2 rounded-full ${structure?.color || 'bg-muted'}`} />
                      <span className="text-[11px] text-muted-foreground">{structure?.name || '-'}</span>
                    </div>
                    <h3 className="text-sm text-foreground mb-0.5">{task.action_label}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Source : {task.source}</span>
                      <span>·</span>
                      <span>{task.due_date || 'Pas de date'}</span>
                      <span>·</span>
                      <span>{task.estimated_duration ? `${task.estimated_duration} min` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleAccept(task.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-medium text-foreground hover:bg-accent transition-colors">
                      <Check className="w-3 h-3" />Accepter
                    </button>
                    <button onClick={() => handleDone(task.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-medium text-foreground hover:bg-accent transition-colors">
                      <Pencil className="w-3 h-3" />Terminer
                    </button>
                    <button onClick={() => handleArchive(task.id)} className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Archive className="w-3 h-3" />
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
