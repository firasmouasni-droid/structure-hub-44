import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStructures } from "@/hooks/useStructures";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useRoutines } from "@/hooks/useRoutines";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserStats } from "@/hooks/useUserStats";
import { motion } from "framer-motion";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import {
  Briefcase, ArrowRight, CheckCircle2, Clock, Target,
  Calendar, Zap, ExternalLink, ListTodo, BarChart3
} from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

const WorkSpacePage = () => {
  const { data: structures = [] } = useStructures();
  const { data: lifeSpaces = [] } = useLifeSpaces();
  const { data: allTasks = [] } = useTasks();
  const { data: allGoals = [] } = useGoals();
  const { data: routines = [] } = useRoutines();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayEvents = [] } = useCalendarEvents(today);
  const { data: stats } = useUserStats();

  // Find work life space
  const workSpace = lifeSpaces.find((s) => s.key === "work");

  // Filter structures linked to work
  const workStructures = useMemo(
    () => (workSpace ? structures.filter((s) => s.life_space_id === workSpace.id) : []),
    [structures, workSpace]
  );
  const workStructureIds = useMemo(() => new Set(workStructures.map((s) => s.id)), [workStructures]);

  // Filter tasks for work structures
  const workTasks = useMemo(() => allTasks.filter((t) => workStructureIds.has(t.structure_id)), [allTasks, workStructureIds]);

  const todayTasks = workTasks.filter((t) => t.due_date && isToday(new Date(t.due_date)));
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekTasks = workTasks.filter(
    (t) => t.due_date && isWithinInterval(new Date(t.due_date), { start: weekStart, end: weekEnd })
  );
  const inProgressTasks = workTasks.filter((t) => t.status === "in_progress");
  const todoTasks = workTasks.filter((t) => t.status === "todo");

  // Goals for work
  const workGoals = useMemo(() => allGoals.filter((g) => workStructureIds.has(g.structure_id)), [allGoals, workStructureIds]);
  const activeGoals = workGoals.filter((g) => g.status === "active");

  // Work routines (linked to work structures or global routines)
  const workRoutines = useMemo(
    () => routines.filter((r) => r.is_active && (r.structure_id === null || workStructureIds.has(r.structure_id ?? ""))),
    [routines, workStructureIds]
  );

  // Work events for today
  const workEvents = useMemo(
    () => todayEvents.filter((e) => !e.structure_id || workStructureIds.has(e.structure_id)),
    [todayEvents, workStructureIds]
  );

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center shadow-soft"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              >
                <Briefcase className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Espace Travail</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(new Date(), "EEEE d MMMM", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="pill px-4 py-2 bg-card/70 backdrop-blur-sm shadow-soft flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">⭐ Niv. {level}</span>
                <span className="text-xs text-muted-foreground">{xp} XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Aujourd'hui", value: todayTasks.length, icon: CheckCircle2, color: "text-primary" },
            { label: "Cette semaine", value: weekTasks.length, icon: Calendar, color: "text-accent" },
            { label: "En cours", value: inProgressTasks.length, icon: Clock, color: "text-warning" },
            { label: "Objectifs actifs", value: activeGoals.length, icon: Target, color: "text-success" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="card-soft p-4 flex items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Structures Travail */}
        {workStructures.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Structures Travail</h2>
              <span className="text-xs text-muted-foreground">{workStructures.length} structure{workStructures.length !== 1 ? "s" : ""}</span>
            </div>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workStructures.map((s) => {
                const sTasks = workTasks.filter((t) => t.structure_id === s.id);
                const done = sTasks.filter((t) => t.status === "done").length;
                const progress = sTasks.length > 0 ? Math.round((done / sTasks.length) * 100) : 0;
                return (
                  <StaggerItem key={s.id}>
                    <Link to={`/structures/${s.id}/dashboard`}>
                      <HoverCard className="card-soft p-5 group cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-11 h-11 rounded-2xl ${s.color} flex items-center justify-center shadow-soft`}>
                            <span className="text-white text-sm font-bold">{s.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{s.name}</h3>
                            <p className="text-xs text-muted-foreground">{sTasks.length} tâches · {done} faites</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full gradient-primary rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </HoverCard>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        )}

        {/* Tâches Travail */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              Tâches Travail
            </h2>
            <Link to="/global/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir tout <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {inProgressTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-warning uppercase tracking-wider">En cours</p>
              {inProgressTasks.slice(0, 5).map((task) => (
                <TaskRow key={task.id} task={task} structures={workStructures} />
              ))}
            </div>
          )}

          {todoTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">À faire</p>
              {todoTasks.slice(0, 5).map((task) => (
                <TaskRow key={task.id} task={task} structures={workStructures} />
              ))}
            </div>
          )}

          {workTasks.length === 0 && (
            <div className="card-soft p-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune tâche travail pour le moment</p>
            </div>
          )}
        </div>

        {/* Planning Travail - Mini view */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Planning du jour
            </h2>
            <Link to="/global/planning" className="text-xs text-primary hover:underline flex items-center gap-1">
              Planning complet <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {workEvents.length > 0 ? (
            <div className="space-y-2">
              {workEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className="card-soft p-4 flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div
                    className="w-1.5 h-10 rounded-full"
                    style={{ backgroundColor: event.color ?? "hsl(var(--primary))" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_time), "HH:mm")} — {format(new Date(event.end_time), "HH:mm")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card-soft p-6 text-center">
              <p className="text-sm text-muted-foreground">Aucun événement aujourd'hui</p>
            </div>
          )}
        </div>

        {/* Routines Travail */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Routines actives
            </h2>
            <Link to="/global/routines" className="text-xs text-primary hover:underline flex items-center gap-1">
              Gérer les routines <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {workRoutines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workRoutines.map((routine) => (
                <div key={routine.id} className="card-soft p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-warning/15 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{routine.name ?? routine.routine_type}</p>
                      <p className="text-xs text-muted-foreground">{routine.blocks?.length ?? 0} blocs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-soft p-6 text-center">
              <p className="text-sm text-muted-foreground">Aucune routine active</p>
            </div>
          )}
        </div>

        {/* Objectifs Travail */}
        {activeGoals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-success" />
                Objectifs
              </h2>
              <Link to="/global/objectives" className="text-xs text-primary hover:underline flex items-center gap-1">
                Tous les objectifs <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map((goal) => {
                const progress = goal.target_value ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
                return (
                  <div key={goal.id} className="card-soft p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                      <span className="text-xs font-bold text-foreground">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

// Small task row component
function TaskRow({ task, structures }: { task: any; structures: any[] }) {
  const structure = structures.find((s: any) => s.id === task.structure_id);
  return (
    <div className="card-soft p-3 flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${task.status === "in_progress" ? "bg-warning" : "bg-muted-foreground/40"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{task.action_label}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {structure && <span>{structure.name}</span>}
          {task.due_date && <span>· {format(new Date(task.due_date), "dd/MM")}</span>}
          {task.estimated_duration && <span>· {task.estimated_duration} min</span>}
        </div>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        task.priority === "high" ? "bg-destructive/15 text-destructive" :
        task.priority === "medium" ? "bg-warning/15 text-warning" :
        "bg-muted text-muted-foreground"
      }`}>
        {task.priority}
      </span>
    </div>
  );
}

export default WorkSpacePage;
