import AppLayout from "@/components/layout/AppLayout";
import { User, Bell, Palette } from "lucide-react";

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-5 animate-fade-in">
        <h1 className="text-h1 text-foreground">Paramètres</h1>

        <div className="space-y-4">
          <SettingSection icon={<User className="w-4 h-4 text-muted-foreground" />} title="Profil" description="Gérer votre nom, email et avatar">
            <div className="space-y-3">
              <InputField label="Nom" value="Alexandre Martin" />
              <InputField label="Email" value="alexandre@company.com" />
            </div>
          </SettingSection>

          <SettingSection icon={<Bell className="w-4 h-4 text-muted-foreground" />} title="Notifications" description="Configurer vos alertes et rappels">
            <div className="space-y-3">
              <ToggleField label="Notifications push" defaultChecked />
              <ToggleField label="Rappels de tâches" defaultChecked />
              <ToggleField label="Résumé quotidien IA" defaultChecked />
              <ToggleField label="Alertes de surcharge" />
            </div>
          </SettingSection>

          <SettingSection icon={<Palette className="w-4 h-4 text-muted-foreground" />} title="Apparence" description="Personnaliser l'interface">
            <p className="text-caption text-muted-foreground">Mode clair activé par défaut.</p>
          </SettingSection>
        </div>
      </div>
    </AppLayout>
  );
};

const SettingSection = ({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-lg border border-border p-5">
    <div className="flex items-center gap-2.5 mb-4">
      {icon}
      <div>
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const InputField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
    <input
      type="text"
      defaultValue={value}
      className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  </div>
);

const ToggleField = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
      <div className="w-8 h-[18px] bg-accent peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  </div>
);

export default SettingsPage;
