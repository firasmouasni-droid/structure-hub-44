import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Rocket, Palette, ChevronRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCreateStructure } from "@/hooks/useStructures";
import { toast } from "sonner";

const COLORS = [
  { label: "Lavande", value: "bg-primary", hsl: "hsl(263, 75%, 68%)" },
  { label: "Rose", value: "bg-secondary", hsl: "hsl(330, 60%, 65%)" },
  { label: "Bleu", value: "bg-accent", hsl: "hsl(214, 80%, 58%)" },
  { label: "Vert", value: "bg-success", hsl: "hsl(160, 55%, 45%)" },
  { label: "Orange", value: "bg-warning", hsl: "hsl(48, 80%, 50%)" },
];

const TEMPLATES = [
  { name: "Travail", emoji: "💼", description: "Projets pro, réunions, deadlines", color: "bg-primary" },
  { name: "Perso", emoji: "🏡", description: "Vie quotidienne, admin, santé", color: "bg-success" },
  { name: "Side Project", emoji: "🚀", description: "Projet passion, freelance, app", color: "bg-accent" },
  { name: "Études", emoji: "📚", description: "Cours, révisions, examens", color: "bg-secondary" },
];

interface WelcomeOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function WelcomeOnboarding({ open, onOpenChange, onComplete }: WelcomeOnboardingProps) {
  const [step, setStep] = useState(0);
  const [structureName, setStructureName] = useState("");
  const [structureColor, setStructureColor] = useState("bg-primary");
  const [structureDescription, setStructureDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const createStructure = useCreateStructure();

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setStructureName(template.name);
    setStructureColor(template.color);
    setStructureDescription(template.description);
    setStep(2);
  };

  const handleCreate = async () => {
    if (!structureName.trim()) {
      toast.error("Donne un nom à ton espace");
      return;
    }
    setSaving(true);
    try {
      await createStructure.mutateAsync({
        name: structureName,
        color: structureColor,
        description: structureDescription || undefined,
      });
      toast.success(`Espace "${structureName}" créé ! 🎉`);
      onOpenChange(false);
      onComplete?.();
    } catch {
      toast.error("Erreur lors de la création");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/50 bg-card">
        {/* Progress */}
        <div className="h-1 bg-muted">
          <motion.div className="h-full gradient-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-5"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                  className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto shadow-soft"
                >
                  <Brain className="w-10 h-10 text-primary-foreground" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">Bienvenue dans Second Cerveau</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Ton assistant de productivité intelligent. Commence par créer ton premier <strong className="text-foreground">espace de travail</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border/30 text-left">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Un espace regroupe tes tâches, objectifs et planning autour d'un même domaine de vie (travail, perso, projet…).
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft flex items-center justify-center gap-2"
                >
                  C'est parti <Rocket className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* Step 1: Choose template or custom */}
            {step === 1 && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Étape 1/2</p>
                  <h2 className="text-lg font-bold text-foreground">Choisis un modèle</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ou crée un espace personnalisé</p>
                </div>

                <div className="space-y-2">
                  {TEMPLATES.map((t) => (
                    <motion.button
                      key={t.name}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleTemplateSelect(t)}
                      className="w-full text-left p-3.5 rounded-2xl border border-border/30 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center gap-3"
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setStructureName("");
                    setStructureColor("bg-primary");
                    setStructureDescription("");
                    setStep(2);
                  }}
                  className="w-full py-3 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <Palette className="w-4 h-4" /> Créer un espace personnalisé
                </button>
              </motion.div>
            )}

            {/* Step 2: Customize & create */}
            {step === 2 && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Étape 2/2</p>
                  <h2 className="text-lg font-bold text-foreground">Personnalise ton espace</h2>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Nom de l'espace"
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                    autoFocus
                  />

                  <textarea
                    placeholder="Description (optionnel)"
                    value={structureDescription}
                    onChange={(e) => setStructureDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none"
                  />

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Couleur</p>
                    <div className="flex gap-2">
                      {COLORS.map((c) => (
                        <motion.button
                          key={c.value}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setStructureColor(c.value)}
                          className={`w-10 h-10 rounded-2xl ${c.value} ${
                            structureColor === c.value
                              ? "ring-3 ring-foreground/30 ring-offset-2 ring-offset-background"
                              : ""
                          } transition-all`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-2xl border border-border/30 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${structureColor} flex items-center justify-center shadow-soft`}>
                      <span className="text-white text-lg font-bold">{structureName?.charAt(0) || "?"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{structureName || "Mon espace"}</p>
                      <p className="text-[11px] text-muted-foreground">{structureDescription || "Pas de description"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                  >
                    Retour
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={saving || !structureName.trim()}
                    className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-50"
                  >
                    {saving ? "Création..." : "Créer mon espace ✨"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
