import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import {
  BarChart3, TrendingUp, Clock, AlertTriangle, Target, Brain, RefreshCw,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AnalyticsData {
  planning_adherence: number | null;
  total_tasks: number;
  completed_tasks: number;
  today_tasks: number;
  today_done: number;
  estimation_by_type: { action_type: string; avg_ratio: number; sample_count: number }[];
  poorly_estimated: { action_type: string; avg_ratio: number; sample_count: number }[];
  load_by_structure: { id: string; name: string; color: string; total: number; done: number; in_progress: number; todo: number; total_minutes: number }[];
  overloaded_days: { date: string; minutes: number; hours: number }[];
  insights: string[];
}

function useAnalytics() {
  return useQuery({
    queryKey: ["analytics-insights"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("analytics-insights");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AnalyticsData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function StatCard({ icon, label, value, sub, trend }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <HoverCard className="card-soft p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={`flex items-center text-xs font-bold ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
            {trend === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend === "neutral" && <Minus className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </HoverCard>
  );
}

const GlobalAnalytics = () => {
  const { data: analytics, isLoading, refetch, isFetching } = useAnalytics();
  const { data: tasks = [] } = useTasks();
  const { data: structures = [] } = useStructures();

  const handleRefresh = () => {
    refetch();
    toast.success("Analyse en cours...");
  };

  // Local stats from tasks for immediate display
  const doneTasks = tasks.filter(t => t.status === "done");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  // Estimated vs actual for completed tasks with both values
  const withDurations = doneTasks.filter(t => t.estimated_duration && t.actual_duration);
  const totalEstimated = withDurations.reduce((s, t) => s + (t.estimated_duration || 0), 0);
  const totalActual = withDurations.reduce((s, t) => s + (t.actual_duration || 0), 0);
  const overallRatio = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : null;

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl bg-primary/15 flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <BarChart3 className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics & Feedback</h1>
              <p className="text-sm text-muted-foreground">Basé sur Planning Fallacy, Attention Residue & Kanban Science</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleRefresh} disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/15 text-primary text-sm font-bold hover:bg-primary/25 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Analyse..." : "Actualiser"}
          </motion.button>
        </div>

        {/* Key metrics */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Taux de complétion"
              value={`${completionRate}%`}
              sub={`${doneTasks.length}/${tasks.length} tâches`}
              trend={completionRate > 60 ? "up" : completionRate > 30 ? "neutral" : "down"}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Planning aujourd'hui"
              value={analytics?.planning_adherence !== null && analytics?.planning_adherence !== undefined ? `${analytics.planning_adherence}%` : "—"}
              sub={`${analytics?.today_done || 0}/${analytics?.today_tasks || 0} tâches du jour`}
              trend={analytics?.planning_adherence ? (analytics.planning_adherence > 70 ? "up" : "down") : "neutral"}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Précision estimation"
              value={overallRatio ? `${overallRatio}%` : "—"}
              sub={`${withDurations.length} tâches analysées`}
              trend={overallRatio ? (overallRatio > 80 && overallRatio < 120 ? "up" : "down") : "neutral"}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="En cours (WIP)"
              value={String(inProgressTasks.length)}
              sub={inProgressTasks.length > 5 ? "⚠️ Au-dessus du seuil" : "Dans les limites"}
              trend={inProgressTasks.length <= 5 ? "up" : "down"}
            />
          </StaggerItem>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estimation accuracy by type */}
          <FadeInSection className="lg:col-span-2">
            <div className="card-soft p-6">
              <h2 className="text-base font-bold text-foreground mb-1">Temps réel vs prévu</h2>
              <p className="text-xs text-muted-foreground mb-5">Planning Fallacy — Les humains sous-estiment systématiquement</p>
              {analytics?.estimation_by_type && analytics.estimation_by_type.length > 0 ? (
                <div className="space-y-3">
                  {analytics.estimation_by_type.map(item => {
                    const pct = Math.round(item.avg_ratio * 100);
                    const isOver = item.avg_ratio > 1.2;
                    const isUnder = item.avg_ratio < 0.8;
                    const barWidth = Math.min(pct, 200);
                    return (
                      <div key={item.action_type}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-foreground">{item.action_type}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isOver ? "text-red-500" : isUnder ? "text-blue-500" : "text-green-500"}`}>
                              {pct}%
                            </span>
                            <span className="text-muted-foreground">({item.sample_count} tâches)</span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-muted rounded-pill overflow-hidden">
                          {/* 100% marker */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/20 z-10" />
                          <motion.div
                            className={`h-full rounded-pill ${isOver ? "bg-red-500/70" : isUnder ? "bg-blue-500/70" : "bg-green-500/70"}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(barWidth / 2, 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        {isOver && <p className="text-[10px] text-red-500 mt-0.5">⚠️ Tu sous-estimes les tâches {item.action_type} de {pct - 100}%</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Pas assez de données (complète des tâches avec durée réelle)</p>
                </div>
              )}
            </div>
          </FadeInSection>

          {/* Poorly estimated */}
          <FadeInSection delay={0.1}>
            <div className="card-soft p-6">
              <h2 className="text-base font-bold text-foreground mb-1">Tâches mal estimées</h2>
              <p className="text-xs text-muted-foreground mb-4">Types récurrents à corriger</p>
              {analytics?.poorly_estimated && analytics.poorly_estimated.length > 0 ? (
                <div className="space-y-3">
                  {analytics.poorly_estimated.map(item => (
                    <div key={item.action_type} className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{item.action_type}</span>
                        <span className="text-xs font-bold text-destructive">×{item.avg_ratio}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {item.avg_ratio > 1 ? "Durée réelle plus longue que prévue" : "Durée réelle plus courte que prévue"} sur {item.sample_count} tâches
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-6 h-6 text-green-500/30 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Aucune anomalie détectée</p>
                </div>
              )}
            </div>
          </FadeInSection>
        </div>

        {/* Charge par structure */}
        <FadeInSection delay={0.1}>
          <div className="card-soft p-6">
            <h2 className="text-base font-bold text-foreground mb-1">Charge par structure</h2>
            <p className="text-xs text-muted-foreground mb-5">Attention Residue — Trop de contextes différents réduit l'efficacité</p>
            {analytics?.load_by_structure && analytics.load_by_structure.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.load_by_structure.map(s => {
                  const totalH = Math.round(s.total_minutes / 60 * 10) / 10;
                  const donePct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  return (
                    <HoverCard key={s.id} className="p-4 rounded-2xl bg-muted/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-lg ${s.color}`} />
                        <span className="text-sm font-bold text-foreground">{s.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div><p className="text-lg font-bold text-foreground">{s.todo}</p><p className="text-[10px] text-muted-foreground">À faire</p></div>
                        <div><p className="text-lg font-bold text-primary">{s.in_progress}</p><p className="text-[10px] text-muted-foreground">En cours</p></div>
                        <div><p className="text-lg font-bold text-green-500">{s.done}</p><p className="text-[10px] text-muted-foreground">Faites</p></div>
                      </div>
                      <div className="h-2 bg-muted rounded-pill overflow-hidden">
                        <motion.div className="h-full bg-green-500 rounded-pill" initial={{ width: 0 }} whileInView={{ width: `${donePct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{totalH}h de charge estimée · {donePct}% complété</p>
                    </HoverCard>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune structure</p>
            )}
          </div>
        </FadeInSection>

        {/* Overloaded days */}
        {analytics?.overloaded_days && analytics.overloaded_days.length > 0 && (
          <FadeInSection delay={0.15}>
            <div className="card-soft p-6 border-l-4 border-warning">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h2 className="text-base font-bold text-foreground">Jours surchargés</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Planning Fallacy — Ne jamais remplir à plus de 60-70%</p>
              <div className="flex flex-wrap gap-2">
                {analytics.overloaded_days.map(d => (
                  <div key={d.date} className="px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
                    <p className="text-xs font-bold text-foreground">{d.date}</p>
                    <p className="text-[10px] text-warning">{d.hours}h planifiées (&gt; 8h)</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        )}

        {/* AI Insights */}
        <FadeInSection delay={0.2}>
          <div className="card-soft p-6 border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Insights IA personnalisés</h2>
            </div>
            {isLoading || isFetching ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : analytics?.insights && analytics.insights.length > 0 ? (
              <StaggerContainer className="space-y-3">
                {analytics.insights.map((insight, i) => (
                  <StaggerItem key={i}>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-8 h-8 text-primary/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Clique sur "Actualiser" pour générer des insights IA</p>
              </div>
            )}
          </div>
        </FadeInSection>
      </div>
    </PageTransition>
  );
};

export default GlobalAnalytics;
