import AppLayout from "@/components/layout/AppLayout";
import { CalendarDays, Sparkles, GripVertical } from "lucide-react";

const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7h to 18h

const events = [
  { start: 8, duration: 1, title: "Deep Work — Contrat fournisseur", type: "deep" as const, structure: "Pro" },
  { start: 10, duration: 1.5, title: "Réunion équipe marketing", type: "meeting" as const, structure: "Pro" },
  { start: 12, duration: 1, title: "Pause déjeuner", type: "break" as const, structure: "Perso" },
  { start: 14, duration: 0.5, title: "Call client Dupont", type: "call" as const, structure: "Pro" },
  { start: 15, duration: 2, title: "Deep Work — Side Project v2", type: "deep" as const, structure: "Side Project" },
  { start: 17, duration: 1, title: "Emails & Admin", type: "email" as const, structure: "Pro" },
];

const typeStyles: Record<string, string> = {
  deep: "bg-primary/10 border-primary/30 text-primary",
  meeting: "bg-secondary/10 border-secondary/30 text-secondary",
  break: "bg-muted border-border text-muted-foreground",
  call: "bg-warning/10 border-warning/30 text-warning",
  email: "bg-success/10 border-success/30 text-success",
};

const unplanned = [
  { title: "Valider facture fournisseur", duration: "10 min", priority: "medium" },
  { title: "Répondre email partenaire", duration: "15 min", priority: "high" },
  { title: "Préparer brief design", duration: "30 min", priority: "low" },
];

const Planning = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Planning</h1>
            <span className="text-sm text-muted-foreground">Lundi 24 février</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-ai text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Sparkles className="w-4 h-4" />
            Planifier avec l'IA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="flex border-b border-border/50 last:border-0">
                  <div className="w-16 py-4 text-right pr-3 text-xs text-muted-foreground shrink-0">
                    {hour}:00
                  </div>
                  <div className="flex-1 relative min-h-[60px] border-l border-border/50">
                    {events
                      .filter((e) => e.start === hour)
                      .map((event, i) => (
                        <div
                          key={i}
                          className={`absolute left-1 right-1 rounded-lg border px-3 py-2 cursor-grab ${typeStyles[event.type]}`}
                          style={{ height: `${event.duration * 60}px`, top: 0 }}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 opacity-40" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{event.title}</p>
                              <p className="text-[11px] opacity-70">{event.structure} · {event.duration}h</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unplanned Tasks */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 card-shadow">
              <h2 className="text-sm font-semibold text-foreground mb-3">À planifier</h2>
              <div className="space-y-2">
                {unplanned.map((task, i) => (
                  <div key={i} className="p-3 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-grab">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{task.duration}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        task.priority === "high" ? "bg-destructive/10 text-destructive" :
                        task.priority === "medium" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 card-shadow">
              <h2 className="text-sm font-semibold text-foreground mb-2">Résumé</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deep Work</span>
                  <span className="font-medium text-foreground">3h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Réunions</span>
                  <span className="font-medium text-foreground">1h30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin & Emails</span>
                  <span className="font-medium text-foreground">1h30</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span className="text-foreground">Total planifié</span>
                  <span className="text-primary">7h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Planning;
