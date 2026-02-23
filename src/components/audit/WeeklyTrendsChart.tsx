import { useAuditHistory } from "@/hooks/useDailyAudit";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

const MOOD_SCORE: Record<string, number> = {
  anxious: 1,
  stressed: 2,
  neutral: 3,
  calm: 4,
  motivated: 5,
  happy: 5,
};

const MOOD_LABEL: Record<string, string> = {
  anxious: "Anxieux",
  stressed: "Stressé",
  neutral: "Neutre",
  calm: "Calme",
  motivated: "Motivé",
  happy: "Content",
};

const WeeklyTrendsChart = () => {
  const { data: audits = [] } = useAuditHistory(7);

  const chartData = [...audits]
    .sort((a, b) => a.audit_date.localeCompare(b.audit_date))
    .map((a) => ({
      date: format(parseISO(a.audit_date), "EEE d", { locale: fr }),
      energy: a.energy_level,
      mood: MOOD_SCORE[a.mood] ?? 3,
      moodLabel: MOOD_LABEL[a.mood] ?? a.mood,
    }));

  if (chartData.length < 2) {
    return (
      <div className="card-soft p-6">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Tendances de la semaine</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          Au moins 2 check-ins nécessaires pour afficher les tendances
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft p-6">
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Tendances de la semaine</h2>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">Énergie</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground">Humeur</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === "mood") return [props.payload.moodLabel, "Humeur"];
              return [`${value}/5`, "Énergie"];
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="mood" stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--warning))" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyTrendsChart;
