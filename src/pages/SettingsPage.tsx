import { User, Bell, Palette, Clock, Brain, History, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { useAuditSettings, useUpdateAuditSettings, useAuditHistory } from "@/hooks/useDailyAudit";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const SettingsPage = () => {
  const { theme } = useTheme();
  return (
    <PageTransition>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>

          <StaggerContainer className="space-y-5">
            <StaggerItem>
              <SettingSection icon={<User className="w-5 h-5 text-primary" />} title="Profil" description="Gérer votre nom, email et avatar">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center shadow-soft">
                      <span className="text-primary-foreground text-xl font-bold">AM</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Alexandre Martin</p>
                      <p className="text-xs text-muted-foreground">alexandre@company.com</p>
                    </div>
                  </div>
                  <InputField label="Nom" value="Alexandre Martin" />
                  <InputField label="Email" value="alexandre@company.com" />
                </div>
              </SettingSection>
            </StaggerItem>

            <StaggerItem>
              <SettingSection icon={<Bell className="w-5 h-5 text-warning" />} title="Notifications" description="Configurer vos alertes et rappels">
                <div className="space-y-4">
                  <ToggleField label="Notifications push" defaultChecked />
                  <ToggleField label="Rappels de tâches" defaultChecked />
                  <ToggleField label="Résumé quotidien IA" defaultChecked />
                  <ToggleField label="Alertes de surcharge" />
                </div>
              </SettingSection>
            </StaggerItem>

            <StaggerItem>
              <SettingSection icon={<Palette className="w-5 h-5 text-secondary" />} title="Apparence" description="Personnaliser l'interface">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">Mode {theme === 'dark' ? 'sombre' : 'clair'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pastel Soft UI ✨</p>
                  </div>
                  <ThemeToggle />
                </div>
              </SettingSection>
            </StaggerItem>

            <StaggerItem>
              <SettingSection icon={<Clock className="w-5 h-5 text-warning" />} title="Routines & Organisation" description="Gérer votre routine de travail et mode d'organisation">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">Catalogue de routines</p>
                    <p className="text-xs text-muted-foreground mt-0.5">7 routines basées sur la science de la productivité</p>
                  </div>
                  <Link to="/global/routines" className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                    Configurer →
                  </Link>
                </div>
              </SettingSection>
            </StaggerItem>

            <StaggerItem>
              <AuditSettingsSection />
            </StaggerItem>
          </StaggerContainer>
        </div>
    </PageTransition>
  );
};

const ENERGY_LABELS = ["", "😩 Épuisé", "😔 Fatigué", "😐 Normal", "😊 En forme", "🔥 Au top"];
const CLARITY_LABELS: Record<string, string> = { fog: "🌫️ Brume", normal: "😐 Normal", clear: "✨ Très clair" };
const MOOD_LABELS: Record<string, string> = { stressed: "😰 Stressé", anxious: "😟 Anxieux", neutral: "😐 Neutre", calm: "😌 Calme", motivated: "🔥 Motivé" };
const DISTRACTION_LABELS: Record<string, string> = { scattered: "🤯 Dispersé", distracted: "😵 Distrait", normal: "😐 Normal", focus: "🎯 Concentré" };
const OBJECTIVE_LABELS: Record<string, string> = { productivity: "🚀 Productivité", balance: "⚖️ Équilibre", recovery: "🌿 Récupération", slow: "🐢 Tranquille" };
const COGNITIVE_LABELS: Record<string, string> = { "<2h": "⏱️ <2h", "2-4h": "⏱️ 2-4h", ">4h": "⏱️ >4h" };

const AuditSettingsSection = () => {
  const { data: settings, isLoading: loadingSettings } = useAuditSettings();
  const { data: history = [], isLoading: loadingHistory } = useAuditHistory(14);
  const updateSettings = useUpdateAuditSettings();
  const [showHistory, setShowHistory] = useState(false);

  const enabled = settings?.enabled ?? true;
  const auditHour = settings?.audit_hour ?? 7;

  const handleToggle = async () => {
    try {
      await updateSettings.mutateAsync({ enabled: !enabled, audit_hour: auditHour });
      toast.success(!enabled ? "Audit matinal activé" : "Audit matinal désactivé");
    } catch { toast.error("Erreur de mise à jour"); }
  };

  const handleHourChange = async (hour: number) => {
    try {
      await updateSettings.mutateAsync({ enabled, audit_hour: hour });
      toast.success(`Heure d'audit réglée à ${hour}h`);
    } catch { toast.error("Erreur de mise à jour"); }
  };

  return (
    <SettingSection icon={<Brain className="w-5 h-5 text-accent" />} title="Audit matinal" description="Évaluation quotidienne pour adapter votre planning">
      <div className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground font-medium">Activer l'audit matinal</p>
            <p className="text-xs text-muted-foreground mt-0.5">La modale apparaît à l'ouverture du planning</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enabled} onChange={handleToggle} disabled={loadingSettings || updateSettings.isPending} />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-pill peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-soft peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Hour selector */}
        {enabled && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Heure d'affichage</label>
            <div className="flex flex-wrap gap-2">
              {[6, 7, 8, 9, 10].map(h => (
                <button
                  key={h}
                  onClick={() => handleHourChange(h)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${auditHour === h ? "gradient-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}
                >
                  {h}:00
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History toggle */}
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
          <History className="w-4 h-4" />
          Historique des audits ({history.length})
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loadingHistory && <p className="text-xs text-muted-foreground">Chargement...</p>}
            {history.length === 0 && !loadingHistory && <p className="text-xs text-muted-foreground">Aucun audit enregistré</p>}
            {history.map(audit => (
              <div key={audit.id} className="p-3 rounded-2xl border border-border/30 bg-card/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground capitalize">
                    {format(new Date(audit.audit_date), "EEEE d MMM", { locale: fr })}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {ENERGY_LABELS[audit.energy_level] || `${audit.energy_level}/5`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="pill text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">{CLARITY_LABELS[audit.mental_clarity] || audit.mental_clarity}</span>
                  <span className="pill text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">{MOOD_LABELS[audit.mood] || audit.mood}</span>
                  <span className="pill text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">{DISTRACTION_LABELS[audit.distraction_level] || audit.distraction_level}</span>
                  <span className="pill text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">{OBJECTIVE_LABELS[audit.day_objective] || audit.day_objective}</span>
                  <span className="pill text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">{COGNITIVE_LABELS[audit.cognitive_availability] || audit.cognitive_availability}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingSection>
  );
};

const SettingSection = ({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) => (
  <div className="card-soft p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const InputField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type="text"
      defaultValue={value}
      className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm text-foreground shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
    />
  </div>
);

const ToggleField = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-pill peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-soft peer-checked:after:translate-x-full" />
    </label>
  </div>
);

export default SettingsPage;
