import { useRoutines, useCreateRoutine, useUpdateRoutine, ROUTINE_TEMPLATES, ORGANIZATION_MODES, type RoutineBlock } from "@/hooks/useRoutines";
import { Clock, Save, Check, ChevronRight, Sparkles, BookOpen, Edit3, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { motion, AnimatePresence } from "framer-motion";

const BLOCK_COLORS: Record<string, string> = {
  deep_work: "bg-purple-500/20 border-purple-500/30 text-purple-300",
  admin: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  meetings: "bg-amber-500/20 border-amber-500/30 text-amber-300",
  break: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  email: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
};

const BLOCK_LABELS: Record<string, string> = {
  deep_work: "Deep Work",
  admin: "Admin",
  meetings: "Réunions",
  break: "Pause",
  email: "Emails",
};

function TimelinePreview({ blocks }: { blocks: RoutineBlock[] }) {
  const startH = 8, endH = 18, totalMin = (endH - startH) * 60;
  return (
    <div className="relative h-8 rounded-xl overflow-hidden bg-muted/30 border border-border/30">
      {blocks.filter(b => b.type !== "break").map((block, i) => {
        const [sh, sm] = block.start.split(":").map(Number);
        const [eh, em] = block.end.split(":").map(Number);
        const startMin = (sh - startH) * 60 + sm;
        const durMin = (eh - startH) * 60 + em - startMin;
        const left = Math.max(0, (startMin / totalMin) * 100);
        const width = Math.min((durMin / totalMin) * 100, 100 - left);
        const color = BLOCK_COLORS[block.type]?.split(" ")[0] || "bg-muted";
        return (
          <div key={i} className={`absolute top-0 bottom-0 ${color} flex items-center justify-center`} style={{ left: `${left}%`, width: `${width}%` }}>
            <span className="text-[8px] font-bold truncate px-1 opacity-80">{block.start}</span>
          </div>
        );
      })}
    </div>
  );
}

function BlockEditor({ blocks, onChange }: { blocks: RoutineBlock[]; onChange: (b: RoutineBlock[]) => void }) {
  const updateBlock = (idx: number, field: keyof RoutineBlock, value: string) => {
    const updated = [...blocks];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };
  const removeBlock = (idx: number) => onChange(blocks.filter((_, i) => i !== idx));
  const addBlock = () => onChange([...blocks, { type: "admin", start: "16:00", end: "17:00", label: "Nouveau bloc" }]);

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => (
        <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border ${BLOCK_COLORS[block.type] || "bg-muted/20 border-border/30 text-foreground"}`}>
          <select value={block.type} onChange={e => updateBlock(idx, "type", e.target.value)} className="bg-transparent text-xs font-bold border-none outline-none cursor-pointer">
            {Object.entries(BLOCK_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-card text-foreground">{v}</option>)}
          </select>
          <input type="time" value={block.start} onChange={e => updateBlock(idx, "start", e.target.value)} className="bg-transparent text-xs border-none outline-none w-16" />
          <span className="text-xs opacity-50">→</span>
          <input type="time" value={block.end} onChange={e => updateBlock(idx, "end", e.target.value)} className="bg-transparent text-xs border-none outline-none w-16" />
          <input value={block.label} onChange={e => updateBlock(idx, "label", e.target.value)} className="bg-transparent text-xs flex-1 border-none outline-none" />
          <button onClick={() => removeBlock(idx)} className="p-1 rounded-lg hover:bg-destructive/20 transition-colors"><X className="w-3 h-3" /></button>
        </div>
      ))}
      <button onClick={addBlock} className="w-full py-2 rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-all">
        + Ajouter un bloc
      </button>
    </div>
  );
}

const GlobalRoutines = () => {
  const { data: routines = [] } = useRoutines();
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();

  const activeRoutine = routines.find(r => r.is_active && !r.structure_id) || routines.find(r => !r.structure_id);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editBlocks, setEditBlocks] = useState<RoutineBlock[]>([]);
  const [editEmailSlots, setEditEmailSlots] = useState("");

  useEffect(() => {
    if (activeRoutine?.routine_type && activeRoutine.routine_type !== "custom") {
      setSelectedTemplate(activeRoutine.routine_type);
    }
  }, [activeRoutine]);

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const t = ROUTINE_TEMPLATES[key];
    setEditBlocks([...t.blocks]);
    setEditEmailSlots(t.email_slots.join(", "));
    setEditMode(false);
  };

  const handleActivate = async () => {
    if (!selectedTemplate) return;
    const t = ROUTINE_TEMPLATES[selectedTemplate];
    const blocks = editMode ? editBlocks : t.blocks;
    const emailSlots = editMode ? editEmailSlots.split(",").map(s => s.trim()).filter(Boolean) : t.email_slots;

    // Convert blocks to legacy fields for backward compat
    const deepWorkBlock = blocks.find(b => b.type === "deep_work");
    const adminBlock = blocks.find(b => b.type === "admin" || b.type === "meetings");

    const data: any = {
      structure_id: null,
      routine_type: selectedTemplate,
      name: t.name,
      description: t.description,
      organization_mode: t.mode,
      blocks: blocks,
      is_active: true,
      morning_focus: deepWorkBlock ? { start: deepWorkBlock.start, end: deepWorkBlock.end, focus: "deep_work", priority_filter: "high" } : {},
      afternoon_tasks: adminBlock ? { start: adminBlock.start, end: adminBlock.end, focus: "meetings_admin" } : {},
      email_slots: emailSlots,
      availability_rules: { weekdays: true, weekends: false },
    };

    try {
      if (activeRoutine) {
        await updateRoutine.mutateAsync({ id: activeRoutine.id, ...data });
      } else {
        await createRoutine.mutateAsync(data);
      }
      toast.success(`Routine "${t.name}" activée ! 🎯`);
    } catch { toast.error("Erreur de sauvegarde"); }
  };

  const currentTemplate = selectedTemplate ? ROUTINE_TEMPLATES[selectedTemplate] : null;

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.div className="w-12 h-12 rounded-3xl bg-warning/15 flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
            <Clock className="w-6 h-6 text-warning" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Routines</h1>
            <p className="text-sm text-muted-foreground">
              Choisissez votre mode d'organisation basé sur la science
              {activeRoutine?.name && <span className="ml-1 text-primary font-medium">· Active : {activeRoutine.name}</span>}
            </p>
          </div>
        </div>

        {/* Routine catalog */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Catalogue de routines
          </h2>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROUTINE_TEMPLATES).map(([key, template]) => {
              const isSelected = selectedTemplate === key;
              const isActive = activeRoutine?.routine_type === key;
              return (
                <StaggerItem key={key}>
                  <motion.button
                    onClick={() => handleSelectTemplate(key)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-soft"
                        : "border-border/30 bg-card/50 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{template.icon}</span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-pill">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">{template.name}</h3>
                    <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
                    <TimelinePreview blocks={template.blocks} />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </motion.button>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {currentTemplate && selectedTemplate && (
            <motion.div
              key={selectedTemplate}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card-soft p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentTemplate.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{currentTemplate.name}</h2>
                    <p className="text-xs text-muted-foreground">{currentTemplate.description}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!editMode) {
                      setEditBlocks([...currentTemplate.blocks]);
                      setEditEmailSlots(currentTemplate.email_slots.join(", "));
                    }
                    setEditMode(!editMode);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    editMode ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  {editMode ? "Aperçu" : "Personnaliser"}
                </motion.button>
              </div>

              {/* Science insight */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{currentTemplate.science}</p>
              </div>

              {/* Blocks */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Blocs de temps</h3>
                {editMode ? (
                  <BlockEditor blocks={editBlocks} onChange={setEditBlocks} />
                ) : (
                  <div className="space-y-1.5">
                    {currentTemplate.blocks.map((block, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border ${BLOCK_COLORS[block.type] || "bg-muted/20 border-border/30 text-foreground"}`}>
                        <span className="text-xs font-mono font-bold w-24">{block.start} → {block.end}</span>
                        <span className="text-xs font-medium flex-1">{block.label}</span>
                        <span className="text-[10px] font-bold uppercase opacity-60">{BLOCK_LABELS[block.type]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email slots */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Créneaux emails</h3>
                {editMode ? (
                  <input value={editEmailSlots} onChange={e => setEditEmailSlots(e.target.value)} placeholder="09:00, 13:00, 17:00" className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm" />
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {currentTemplate.email_slots.map((slot, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">📧 {slot}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Activate button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleActivate}
                className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {activeRoutine?.routine_type === selectedTemplate ? "Mettre à jour la routine" : "Activer cette routine"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default GlobalRoutines;
