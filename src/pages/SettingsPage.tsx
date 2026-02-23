import AppLayout from "@/components/layout/AppLayout";
import { User, Bell, Palette } from "lucide-react";

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>

        <div className="space-y-4">
          <SettingSection icon={<User className="w-5 h-5 text-primary" />} title="Profil" description="Gérer votre nom, email et avatar">
            <div className="space-y-3">
              <InputField label="Nom" value="Alexandre Martin" />
              <InputField label="Email" value="alexandre@company.com" />
            </div>
          </SettingSection>

          <SettingSection icon={<Bell className="w-5 h-5 text-warning" />} title="Notifications" description="Configurer vos alertes et rappels">
            <div className="space-y-3">
              <ToggleField label="Notifications push" defaultChecked />
              <ToggleField label="Rappels de tâches" defaultChecked />
              <ToggleField label="Résumé quotidien IA" defaultChecked />
              <ToggleField label="Alertes de surcharge" />
            </div>
          </SettingSection>

          <SettingSection icon={<Palette className="w-5 h-5 text-secondary" />} title="Apparence" description="Personnaliser l'interface">
            <p className="text-sm text-muted-foreground">Mode Pastel Soft UI activé par défaut.</p>
          </SettingSection>
        </div>
      </div>
    </AppLayout>
  );
};

const SettingSection = ({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) => (
  <div className="card-soft p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
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
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type="text"
      defaultValue={value}
      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white/90 text-sm text-foreground shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </div>
);

const ToggleField = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
      <div className="w-10 h-[22px] bg-muted peer-focus:outline-none rounded-pill peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-soft peer-checked:after:translate-x-full" />
    </label>
  </div>
);

export default SettingsPage;
