import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, Brain, Zap, Clock, Moon, Sun, Battery } from "lucide-react";
import { ROUTINE_TEMPLATES, ORGANIZATION_MODES, useCreateRoutine, useUpdateRoutine, useRoutines, type RoutineBlock } from "@/hooks/useRoutines";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Question {
  id: string;
  question: string;
  icon: React.ReactNode;
  options: { value: string; label: string; emoji: string; description: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "focus_time",
    question: "Quand êtes-vous le plus concentré ?",
    icon: <Brain className="w-6 h-6 text-purple-400" />,
    options: [
      { value: "morning", label: "Le matin", emoji: "🌅", description: "Avant 12h, vous êtes au top" },
      { value: "afternoon", label: "L'après-midi", emoji: "☀️", description: "Votre pic est entre 13h et 17h" },
      { value: "evening", label: "Le soir", emoji: "🌙", description: "Vous travaillez mieux tard" },
      { value: "irregular", label: "Ça dépend des jours", emoji: "🎲", description: "Pas de pattern régulier" },
    ],
  },
  {
    id: "disorganization",
    question: "Comment évaluez-vous votre organisation actuelle ?",
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    options: [
      { value: "very_organized", label: "Très organisé", emoji: "📋", description: "Tout est planifié, rien ne m'échappe" },
      { value: "ok", label: "Correct", emoji: "👌", description: "Ça va globalement, mais perfectible" },
      { value: "messy", label: "Désorganisé", emoji: "🌀", description: "J'oublie souvent des choses" },
      { value: "chaos", label: "Chaotique", emoji: "🔥", description: "Je suis constamment débordé" },
    ],
  },
  {
    id: "interruptions",
    question: "Combien de réunions / interruptions par jour ?",
    icon: <Clock className="w-6 h-6 text-blue-400" />,
    options: [
      { value: "none", label: "Presque aucune", emoji: "🧘", description: "Je contrôle mon agenda" },
      { value: "few", label: "1 à 3", emoji: "📞", description: "Quelques réunions courtes" },
      { value: "many", label: "4 à 6", emoji: "📅", description: "Mon agenda est bien rempli" },
      { value: "constant", label: "Plus de 6", emoji: "🏃", description: "Je suis en mode manager" },
    ],
  },
  {
    id: "block_pref",
    question: "Vous préférez travailler en…",
    icon: <Sun className="w-6 h-6 text-orange-400" />,
    options: [
      { value: "long", label: "Blocs longs (2-3h)", emoji: "🧱", description: "Sessions profondes et continues" },
      { value: "medium", label: "Blocs moyens (90 min)", emoji: "⚡", description: "Focus intense puis pause" },
      { value: "short", label: "Blocs courts (25-50 min)", emoji: "🍅", description: "Pomodoro, micro-sprints" },
      { value: "varied", label: "Ça varie", emoji: "🔄", description: "Pas de préférence fixe" },
    ],
  },
  {
    id: "chronotype",
    question: "Quel est votre chronotype ?",
    icon: <Moon className="w-6 h-6 text-indigo-400" />,
    options: [
      { value: "early", label: "Lève-tôt", emoji: "🐓", description: "Debout à 6h, couché à 22h" },
      { value: "normal", label: "Standard", emoji: "🕐", description: "8h-23h, classique" },
      { value: "late", label: "Couche-tard", emoji: "🦉", description: "Actif le soir, difficile le matin" },
      { value: "irregular", label: "Irrégulier", emoji: "🌊", description: "Pas de rythme fixe" },
    ],
  },
  {
    id: "energy",
    question: "Quel est votre niveau d'énergie habituel ?",
    icon: <Battery className="w-6 h-6 text-emerald-400" />,
    options: [
      { value: "high", label: "Élevé", emoji: "🔋", description: "Je suis souvent en forme et motivé" },
      { value: "moderate", label: "Modéré", emoji: "⚖️", description: "Ça dépend, mais ça va" },
      { value: "low", label: "Faible", emoji: "🪫", description: "Souvent fatigué ou démotivé" },
      { value: "variable", label: "Très variable", emoji: "📈", description: "De très haut à très bas" },
    ],
  },
];

function recommendRoutine(answers: Record<string, string>): { routineKey: string; modeKey: string; reason: string } {
  const { focus_time, disorganization, interruptions, block_pref, chronotype, energy } = answers;

  // Chaotic / ADHD profiles
  if (disorganization === "chaos" || (disorganization === "messy" && block_pref === "short")) {
    return { routineKey: "pomodoro", modeKey: "chaotic", reason: "Le mode Pomodoro est idéal pour reprendre le contrôle avec des blocs courts et des pauses régulières." };
  }

  // Minimalist / burnout
  if (energy === "low" || (disorganization === "messy" && energy === "variable")) {
    return { routineKey: "minimalist", modeKey: "minimalist", reason: "La routine minimaliste vous permet de progresser sans pression : 1 tâche importante + 2 simples." };
  }

  // Manager profile
  if (interruptions === "constant" || interruptions === "many") {
    return { routineKey: "dual_blocks", modeKey: "manager", reason: "Avec beaucoup de réunions, le mode Dual Blocks protège 2 créneaux de focus par jour." };
  }

  // Night owl
  if (chronotype === "late" || focus_time === "evening") {
    return { routineKey: "deep_work_afternoon", modeKey: "nocturnal", reason: "Votre pic de concentration est l'après-midi/soir. On protège ces créneaux pour le deep work." };
  }

  // Energy-based
  if (energy === "variable" || focus_time === "irregular") {
    return { routineKey: "energy_based", modeKey: "energy", reason: "Votre énergie varie beaucoup. Le mode adaptatif ajuste le planning selon votre forme du jour." };
  }

  // Very organized → time-boxing
  if (disorganization === "very_organized" && block_pref === "long") {
    return { routineKey: "time_boxing", modeKey: "classic", reason: "Vous êtes très organisé et aimez les blocs longs. Le Time-Boxing complet structure chaque heure." };
  }

  // Dual blocks for medium pref
  if (block_pref === "medium") {
    return { routineKey: "dual_blocks", modeKey: "intensive", reason: "Deux sessions de 90 min correspondent à votre rythme naturel. Intensif mais équilibré." };
  }

  // Default: deep work morning
  return { routineKey: "deep_work_morning", modeKey: "classic", reason: "Le Deep Work Matin est le mode le plus efficace pour ceux qui sont concentrés le matin." };
}

interface RoutineOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function RoutineOnboarding({ open, onOpenChange, onComplete }: RoutineOnboardingProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof recommendRoutine> | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: routines = [] } = useRoutines();
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();

  const activeRoutine = routines.find(r => r.is_active && !r.structure_id) || routines.find(r => !r.structure_id);

  const currentQ = QUESTIONS[step];
  const isResult = step >= QUESTIONS.length;
  const progress = ((step) / (QUESTIONS.length + 1)) * 100;

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Compute recommendation
      setResult(recommendRoutine(newAnswers));
      setStep(QUESTIONS.length);
    }
  };

  const handleActivate = async () => {
    if (!result) return;
    setSaving(true);
    const t = ROUTINE_TEMPLATES[result.routineKey];
    const deepWorkBlock = t.blocks.find((b: RoutineBlock) => b.type === "deep_work");
    const adminBlock = t.blocks.find((b: RoutineBlock) => b.type === "admin" || b.type === "meetings");

    const data: any = {
      structure_id: null,
      routine_type: result.routineKey,
      name: t.name,
      description: t.description,
      organization_mode: result.modeKey,
      blocks: t.blocks,
      is_active: true,
      morning_focus: deepWorkBlock ? { start: deepWorkBlock.start, end: deepWorkBlock.end, focus: "deep_work", priority_filter: "high" } : {},
      afternoon_tasks: adminBlock ? { start: adminBlock.start, end: adminBlock.end, focus: "meetings_admin" } : {},
      email_slots: t.email_slots,
      availability_rules: { weekdays: true, weekends: false },
    };

    try {
      if (activeRoutine) {
        await updateRoutine.mutateAsync({ id: activeRoutine.id, ...data });
      } else {
        await createRoutine.mutateAsync(data);
      }
      toast.success(`Routine "${t.name}" activée ! 🎯`);
      onOpenChange(false);
      onComplete?.();
    } catch {
      toast.error("Erreur de sauvegarde");
    }
    setSaving(false);
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  const resultTemplate = result ? ROUTINE_TEMPLATES[result.routineKey] : null;
  const resultMode = result ? ORGANIZATION_MODES[result.modeKey] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/50 bg-card">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div className="h-full gradient-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {!isResult ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                {/* Question header */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center">
                    {currentQ.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Question {step + 1}/{QUESTIONS.length}
                    </p>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-5">{currentQ.question}</h2>

                {/* Options */}
                <div className="space-y-2">
                  {currentQ.options.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                        answers[currentQ.id] === opt.value
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/30 bg-card hover:border-primary/20 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.button>
                  ))}
                </div>

                {/* Back button */}
                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" /> Question précédente
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
              >
                <div className="text-center mb-5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                    className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-soft"
                  >
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground">Votre routine idéale</h2>
                  <p className="text-xs text-muted-foreground mt-1">Basée sur vos réponses et la science de la productivité</p>
                </div>

                {resultTemplate && resultMode && (
                  <div className="space-y-4">
                    {/* Recommended routine card */}
                    <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{resultTemplate.icon}</span>
                        <div>
                          <h3 className="text-base font-bold text-foreground">{resultTemplate.name}</h3>
                          <p className="text-[11px] text-muted-foreground">Mode : {resultMode.icon} {resultMode.name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{resultTemplate.description}</p>

                      {/* Blocks preview */}
                      <div className="space-y-1">
                        {resultTemplate.blocks.filter(b => b.type !== "break").map((block, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="font-mono font-bold text-muted-foreground w-20">{block.start}–{block.end}</span>
                            <span className="text-foreground font-medium">{block.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{result!.reason}</p>
                    </div>

                    {/* Science note */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{resultTemplate.science}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button onClick={handleReset} className="flex-1 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                        Refaire le quiz
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleActivate}
                        disabled={saving}
                        className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-70"
                      >
                        {saving ? "Activation..." : "Activer cette routine ✨"}
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
