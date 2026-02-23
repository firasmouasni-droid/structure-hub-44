import AppLayout from "@/components/layout/AppLayout";
import { useGoals } from "@/hooks/useGoals";
import { Target } from "lucide-react";
import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const PERIODS = [
  { key: "all", label: "Tous" },
  { key: "weekly", label: "Semaine" },
  { key: "monthly", label: "Mois" },
  { key: "quarterly", label: "Trimestre" },
];

const GlobalObjectives = () => {
  const { data: goals = [], isLoading } = useGoals();
  const [period, setPeriod] = useState("all");

  const filtered = period === "all" ? goals : goals.filter(g => g.period === period);

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl bg-secondary/15 flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <Target className="w-6 h-6 text-secondary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Objectifs globaux</h1>
              <p className="text-sm text-muted-foreground">{goals.length} objectifs au total</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft w-fit">
            {PERIODS.map(p => (
              <motion.button key={p.key} onClick={() => setPeriod(p.key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </motion.button>
            ))}
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-8 col-span-2">Chargement...</p>}
            {!isLoading && filtered.length === 0 && (
              <StaggerItem className="col-span-2">
                <div className="card-soft p-10 text-center">
                  <Target className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                  <p className="text-lg font-bold text-foreground">Aucun objectif</p>
                </div>
              </StaggerItem>
            )}
            {filtered.map(g => {
              const pct = g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0;
              return (
                <StaggerItem key={g.id}>
                  <HoverCard className="card-soft p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div><h3 className="text-sm font-bold text-foreground">{g.title}</h3>{g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}</div>
                      <span className="pill text-[10px] font-bold px-2.5 py-1 bg-primary/15 text-primary">{g.period}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                          <motion.circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: "0 100" }} whileInView={{ strokeDasharray: `${pct} ${100 - pct}` }} viewport={{ once: true }} transition={{ duration: 1 }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold text-foreground">{pct}%</span></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">Progression</span><span className="font-bold text-foreground">{g.current_value} / {g.target_value || '?'}</span></div>
                        <div className="h-2.5 bg-muted rounded-pill overflow-hidden">
                          <motion.div className="h-full gradient-primary rounded-pill" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    </div>
                  </HoverCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default GlobalObjectives;
