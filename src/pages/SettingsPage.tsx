import { User, Bell, Palette } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrappers";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

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
          </StaggerContainer>
        </div>
    </PageTransition>
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
