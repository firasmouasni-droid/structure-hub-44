import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Sun, Brain, Heart, Target, Clock, Zap } from "lucide-react";
import { useSubmitAudit } from "@/hooks/useDailyAudit";
import { toast } from "sonner";

interface MorningAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const ENERGY_LABELS = ["Épuisé", "Fatigué", "Normal", "En forme", "Plein d'énergie"];
const CLARITY_OPTIONS = [
  { value: "fog", label: "Brume", emoji: "🌫️" },
  { value: "normal", label: "Normal", emoji: "☁️" },
  { value: "clear", label: "Très clair", emoji: "☀️" },
];
const MOOD_OPTIONS = [
  { value: "stressed", label: "Stressé", emoji: "😰" },
  { value: "anxious", label: "Anxieux", emoji: "😟" },
  { value: "neutral", label: "Neutre", emoji: "😐" },
  { value: "calm", label: "Calme", emoji: "😌" },
  { value: "motivated", label: "Motivé", emoji: "🔥" },
];
const DISTRACTION_OPTIONS = [
  { value: "scattered", label: "Éparpillé", emoji: "🌪️" },
  { value: "distracted", label: "Distrait", emoji: "💭" },
  { value: "focus", label: "Concentré", emoji: "🎯" },
];
const OBJECTIVE_OPTIONS = [
  { value: "productivity", label: "Productivité", emoji: "🚀", desc: "Impact maximum" },
  { value: "recovery", label: "Récupération", emoji: "🌿", desc: "Planning allégé" },
  { value: "balance", label: "Équilibre", emoji: "⚖️", desc: "Mix équilibré" },
  { value: "slow", label: "Avancer tranquillement", emoji: "🐌", desc: "Pas de pression" },
];
const COGNITIVE_OPTIONS = [
  { value: "<2h", label: "< 2h", desc: "Journée courte" },
  { value: "2-4h", label: "2–4h", desc: "Normal" },
  { value: ">4h", label: "> 4h", desc: "Longue journée" },
];

const MorningAuditDialog = ({ open, onOpenChange, onComplete }: MorningAuditDialogProps) => {
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [clarity, setClarity] = useState("normal");
  const [mood, setMood] = useState("neutral");
  const [distraction, setDistraction] = useState("focus");
  const [objective, setObjective] = useState("balance");
  const [cognitive, setCognitive] = useState("2-4h");
  const submitAudit = useSubmitAudit();

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    try {
      await submitAudit.mutateAsync({
        audit_date: today,
        energy_level: energy,
        mental_clarity: clarity,
        mood,
        distraction_level: distraction,
        day_objective: objective,
        cognitive_availability: cognitive,
      });
      toast.success("Audit matinal enregistré ! Votre planning va s'adapter 🧠");
      onOpenChange(false);
      setStep(0);
      onComplete?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const steps = [
    // Step 0: Energy
    <div key="energy" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FFD7C215" }}>
          <Zap className="w-5 h-5" style={{ color: "#FF9A5B" }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Énergie physique</h3>
          <p className="text-xs text-muted-foreground">Comment vous sentez-vous physiquement ?</p>
        </div>
      </div>
      <div className="flex items-center gap-3 justify-center">
        {[1, 2, 3, 4, 5].map(level => (
          <motion.button
            key={level}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setEnergy(level)}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all border-2 ${energy === level ? "border-primary bg-primary/15 text-primary shadow-md" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}
          >
            <span className="text-lg">{level}</span>
          </motion.button>
        ))}
      </div>
      <p className="text-center text-sm font-medium text-foreground">{ENERGY_LABELS[energy - 1]}</p>
    </div>,

    // Step 1: Mental clarity
    <div key="clarity" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#CBB9FF15" }}>
          <Brain className="w-5 h-5" style={{ color: "#8A63F6" }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Clarté mentale</h3>
          <p className="text-xs text-muted-foreground">Comment est votre esprit ce matin ?</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {CLARITY_OPTIONS.map(opt => (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setClarity(opt.value)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${clarity === opt.value ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-sm font-bold text-foreground">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>,

    // Step 2: Mood
    <div key="mood" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FFE0EF15" }}>
          <Heart className="w-5 h-5" style={{ color: "#F6A2C5" }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Humeur dominante</h3>
          <p className="text-xs text-muted-foreground">Comment vous sentez-vous émotionnellement ?</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {MOOD_OPTIONS.map(opt => (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMood(opt.value)}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${mood === opt.value ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"}`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-[11px] font-bold text-foreground">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>,

    // Step 3: Distraction
    <div key="distraction" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#CFEAFF15" }}>
          <Target className="w-5 h-5" style={{ color: "#4EA8FF" }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Niveau de concentration</h3>
          <p className="text-xs text-muted-foreground">Quelle est votre charge mentale ?</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {DISTRACTION_OPTIONS.map(opt => (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDistraction(opt.value)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${distraction === opt.value ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-sm font-bold text-foreground">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>,

    // Step 4: Objective
    <div key="objective" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#D2F0D615" }}>
          <Sun className="w-5 h-5" style={{ color: "#7ED897" }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Objectif du jour</h3>
          <p className="text-xs text-muted-foreground">Quel mode pour aujourd'hui ?</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {OBJECTIVE_OPTIONS.map(opt => (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setObjective(opt.value)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${objective === opt.value ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-sm font-bold text-foreground">{opt.label}</span>
            <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
          </motion.button>
        ))}
      </div>
    </div>,

    // Step 5: Cognitive availability
    <div key="cognitive" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#C5F4EE15" }}>
          <Clock className="w-5 h-5" style={{ color: "#4ADBC8" }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Disponibilité cognitive</h3>
          <p className="text-xs text-muted-foreground">Combien de temps de travail intense aujourd'hui ?</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {COGNITIVE_OPTIONS.map(opt => (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCognitive(opt.value)}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${cognitive === opt.value ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"}`}
          >
            <span className="text-lg font-bold text-foreground">{opt.label}</span>
            <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
          </motion.button>
        ))}
      </div>
    </div>,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sun className="w-5 h-5 text-warning" />
              Audit matinal
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              6 questions rapides pour adapter votre planning
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i <= step ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>

          {/* Current step with animation */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Retour
            </button>
            <span className="text-xs text-muted-foreground">{step + 1} / 6</span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              disabled={submitAudit.isPending}
              className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-70"
            >
              {step < 5 ? "Suivant" : submitAudit.isPending ? "..." : "Valider ✓"}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MorningAuditDialog;
