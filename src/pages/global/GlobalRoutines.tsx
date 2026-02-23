import AppLayout from "@/components/layout/AppLayout";
import { useRoutines, useCreateRoutine, useUpdateRoutine } from "@/hooks/useRoutines";
import { Clock, Sun, Coffee, Mail, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const GlobalRoutines = () => {
  const { data: routines = [] } = useRoutines();
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();

  const routine = routines.find(r => !r.structure_id);

  const [morningStart, setMorningStart] = useState("08:00");
  const [morningEnd, setMorningEnd] = useState("12:00");
  const [morningFocus, setMorningFocus] = useState("deep_work");
  const [afternoonStart, setAfternoonStart] = useState("14:00");
  const [afternoonEnd, setAfternoonEnd] = useState("17:00");
  const [afternoonFocus, setAfternoonFocus] = useState("meetings_admin");
  const [emailSlots, setEmailSlots] = useState("09:00, 13:00, 17:30");
  const [weekdays, setWeekdays] = useState(true);
  const [weekends, setWeekends] = useState(false);

  useEffect(() => {
    if (routine) {
      const mf = routine.morning_focus as any;
      const af = routine.afternoon_tasks as any;
      const es = routine.email_slots as any;
      const av = routine.availability_rules as any;
      if (mf) { setMorningStart(mf.start || "08:00"); setMorningEnd(mf.end || "12:00"); setMorningFocus(mf.focus || "deep_work"); }
      if (af) { setAfternoonStart(af.start || "14:00"); setAfternoonEnd(af.end || "17:00"); setAfternoonFocus(af.focus || "meetings_admin"); }
      if (Array.isArray(es)) setEmailSlots(es.join(", "));
      if (av) { setWeekdays(av.weekdays ?? true); setWeekends(av.weekends ?? false); }
    }
  }, [routine]);

  const handleSave = async () => {
    const data = {
      structure_id: null as any,
      morning_focus: { start: morningStart, end: morningEnd, focus: morningFocus, priority_filter: "high" },
      afternoon_tasks: { start: afternoonStart, end: afternoonEnd, focus: afternoonFocus },
      email_slots: emailSlots.split(",").map(s => s.trim()).filter(Boolean),
      availability_rules: { weekdays, weekends },
    };
    try {
      if (routine) { await updateRoutine.mutateAsync({ id: routine.id, ...data }); }
      else { await createRoutine.mutateAsync(data); }
      toast.success("Routines globales sauvegardées !");
    } catch { toast.error("Erreur de sauvegarde"); }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl bg-warning/15 flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <Clock className="w-6 h-6 text-warning" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Routines globales</h1>
              <p className="text-sm text-muted-foreground">Définissez votre rythme personnel</p>
            </div>
          </div>

          <StaggerContainer className="space-y-5">
            <StaggerItem>
              <div className="card-soft p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-2xl bg-warning/15 flex items-center justify-center"><Sun className="w-5 h-5 text-warning" /></div>
                  <h2 className="text-sm font-bold text-foreground">Matin — Focus intense</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Début</label><input type="time" value={morningStart} onChange={e => setMorningStart(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Fin</label><input type="time" value={morningEnd} onChange={e => setMorningEnd(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type</label><select value={morningFocus} onChange={e => setMorningFocus(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm"><option value="deep_work">Deep Work</option><option value="urgent_tasks">Tâches urgentes</option><option value="creative">Travail créatif</option></select></div>
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-soft p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-2xl bg-accent/15 flex items-center justify-center"><Coffee className="w-5 h-5 text-accent" /></div>
                  <h2 className="text-sm font-bold text-foreground">Après-midi — Meetings & Admin</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Début</label><input type="time" value={afternoonStart} onChange={e => setAfternoonStart(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Fin</label><input type="time" value={afternoonEnd} onChange={e => setAfternoonEnd(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" /></div>
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type</label><select value={afternoonFocus} onChange={e => setAfternoonFocus(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm"><option value="meetings_admin">Meetings & Admin</option><option value="deep_work">Deep Work</option><option value="collaborative">Travail collaboratif</option></select></div>
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-soft p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
                  <h2 className="text-sm font-bold text-foreground">Créneaux email</h2>
                </div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Horaires (séparés par des virgules)</label>
                <input type="text" value={emailSlots} onChange={e => setEmailSlots(e.target.value)} placeholder="09:00, 13:00, 17:30" className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" />
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-soft p-6">
                <h2 className="text-sm font-bold text-foreground mb-4">Disponibilité</h2>
                <div className="space-y-3">
                  <ToggleField label="Jours de semaine" checked={weekdays} onChange={setWeekdays} />
                  <ToggleField label="Week-ends" checked={weekends} onChange={setWeekends} />
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleSave} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Sauvegarder les routines
          </motion.button>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

const ToggleField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-pill peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-soft peer-checked:after:translate-x-full" />
    </label>
  </div>
);

export default GlobalRoutines;
