import { useConnectors, useCreateConnector, useUpdateConnector } from "@/hooks/useConnectors";
import { useParams } from "react-router-dom";
import { Mail, Calendar, Briefcase, Webhook, ToggleLeft, ToggleRight, Wifi, WifiOff, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

interface SourceOption {
  provider: string;
  label: string;
  type: string;
  description: string;
}

const EMAIL_SOURCES: SourceOption[] = [
  { provider: "gmail", label: "Gmail", type: "email", description: "Connecter votre boîte Gmail" },
  { provider: "outlook", label: "Outlook", type: "email", description: "Connecter votre boîte Outlook" },
];

const CALENDAR_SOURCES: SourceOption[] = [
  { provider: "google_calendar", label: "Google Calendar", type: "calendar", description: "Importer vos réunions et événements" },
  { provider: "outlook_calendar", label: "Outlook Calendar", type: "calendar", description: "Synchroniser votre agenda Outlook" },
];

const TOOL_SOURCES: SourceOption[] = [
  { provider: "monday", label: "Monday", type: "crm", description: "Créer des tâches quand on vous tag" },
  { provider: "notion", label: "Notion", type: "crm", description: "Synchroniser vos pages Notion" },
  { provider: "slack", label: "Slack", type: "crm", description: "Recevoir des tâches depuis Slack" },
];

const StructureSources = () => {
  const { id } = useParams<{ id: string }>();
  const { data: connectors = [] } = useConnectors(id);
  const createConnector = useCreateConnector();
  const updateConnector = useUpdateConnector();

  const isConnected = (provider: string) => connectors.some(c => c.provider === provider);
  const getConnector = (provider: string) => connectors.find(c => c.provider === provider);

  const handleConnect = async (source: SourceOption) => {
    if (isConnected(source.provider)) {
      toast.info("Déjà connecté !");
      return;
    }
    await createConnector.mutateAsync({
      structure_id: id!,
      type: source.type,
      provider: source.provider,
      config: {},
      active: true,
    });
    toast.success(`${source.label} connecté !`);
  };

  const handleToggle = async (connectorId: string, currentActive: boolean) => {
    await updateConnector.mutateAsync({ id: connectorId, active: !currentActive });
    toast.success(currentActive ? "Source désactivée" : "Source activée");
  };

  const renderCategory = (title: string, icon: React.ReactNode, sources: SourceOption[]) => (
    <FadeInSection>
      <div className="card-soft p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">{icon}</div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
        </div>
        <div className="space-y-3">
          {sources.map(source => {
            const connector = getConnector(source.provider);
            const connected = !!connector;
            return (
              <HoverCard key={source.provider} className="flex items-center gap-4 p-4 rounded-2xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{source.label}</p>
                  <p className="text-xs text-muted-foreground">{source.description}</p>
                </div>
                {connected ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {connector!.active ? <><Wifi className="w-3 h-3 text-success" /><span className="text-success-foreground font-medium">Actif</span></> : <><WifiOff className="w-3 h-3 text-destructive" /><span className="text-muted-foreground">Inactif</span></>}
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleToggle(connector!.id, connector!.active)} className="p-2 rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all">
                      {connector!.active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5" />}
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleConnect(source)}
                    disabled={createConnector.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-xs font-bold shadow-soft"
                  >
                    <Plus className="w-3.5 h-3.5" /> Connecter
                  </motion.button>
                )}
              </HoverCard>
            );
          })}
        </div>
      </div>
    </FadeInSection>
  );

  return (
    <PageTransition>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl bg-accent/15 flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <Webhook className="w-6 h-6 text-accent" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sources connectées</h1>
              <p className="text-sm text-muted-foreground">{connectors.length} source{connectors.length > 1 ? 's' : ''} configurée{connectors.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <StaggerContainer className="space-y-6">
            <StaggerItem>{renderCategory("Email", <Mail className="w-5 h-5 text-primary" />, EMAIL_SOURCES)}</StaggerItem>
            <StaggerItem>{renderCategory("Agenda", <Calendar className="w-5 h-5 text-primary" />, CALENDAR_SOURCES)}</StaggerItem>
            <StaggerItem>{renderCategory("Outils de travail", <Briefcase className="w-5 h-5 text-primary" />, TOOL_SOURCES)}</StaggerItem>
          </StaggerContainer>
        </div>
    </PageTransition>
  );
};

export default StructureSources;
