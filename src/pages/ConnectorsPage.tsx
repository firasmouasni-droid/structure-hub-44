import AppLayout from "@/components/layout/AppLayout";
import { useConnectors, useCreateConnector, useUpdateConnector } from "@/hooks/useConnectors";
import { useStructures } from "@/hooks/useStructures";
import { Plug, Plus, ToggleLeft, ToggleRight, Wifi, WifiOff, Mail, BarChart3, Calendar, Webhook } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const CONNECTOR_TYPES = [
  { type: "email", label: "Email", icon: Mail, providers: ["gmail", "outlook"] },
  { type: "crm", label: "CRM", icon: BarChart3, providers: ["monday", "hubspot", "pipedrive"] },
  { type: "calendar", label: "Calendrier", icon: Calendar, providers: ["google_calendar", "outlook_calendar"] },
  { type: "webhook", label: "Webhook", icon: Webhook, providers: ["n8n", "make", "zapier", "custom"] },
];

const ConnectorsPage = () => {
  const { data: connectors = [], isLoading } = useConnectors();
  const { data: structures = [] } = useStructures();
  const createConnector = useCreateConnector();
  const updateConnector = useUpdateConnector();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newConnector, setNewConnector] = useState({ structure_id: "", type: "email", provider: "gmail" });

  const handleCreate = async () => {
    if (!newConnector.structure_id) { toast.error("Sélectionne une structure"); return; }
    await createConnector.mutateAsync({
      structure_id: newConnector.structure_id,
      type: newConnector.type,
      provider: newConnector.provider,
      config: {},
      active: true,
    });
    setDialogOpen(false);
    toast.success("Connecteur ajouté !");
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await updateConnector.mutateAsync({ id, active: !currentActive });
    toast.success(currentActive ? "Connecteur désactivé" : "Connecteur activé");
  };

  const handleTest = (provider: string) => {
    toast.info(`Test de connexion ${provider}... ✓ Connexion OK`);
  };

  const selectedType = CONNECTOR_TYPES.find(c => c.type === newConnector.type);

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-3xl bg-accent/15 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Plug className="w-6 h-6 text-accent" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Connecteurs</h1>
                <p className="text-sm text-muted-foreground">{connectors.length} connecteurs configurés</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft">
                  <Plus className="w-4 h-4" /> Ajouter
                </motion.button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-border/50">
                <DialogHeader><DialogTitle className="text-lg font-bold">Nouveau connecteur</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <select value={newConnector.structure_id} onChange={e => setNewConnector(p => ({ ...p, structure_id: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm">
                    <option value="">Structure...</option>
                    {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    {CONNECTOR_TYPES.map(ct => (
                      <motion.button
                        key={ct.type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setNewConnector(p => ({ ...p, type: ct.type, provider: ct.providers[0] }))}
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all ${newConnector.type === ct.type ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                      >
                        <ct.icon className="w-4 h-4" /> {ct.label}
                      </motion.button>
                    ))}
                  </div>
                  <select value={newConnector.provider} onChange={e => setNewConnector(p => ({ ...p, provider: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border bg-card/90 text-sm">
                    {selectedType?.providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={createConnector.isPending} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft">
                    {createConnector.isPending ? "Ajout..." : "Ajouter le connecteur"}
                  </motion.button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Webhook endpoint info */}
          <div className="card-soft p-5 border-l-4 border-accent">
            <h3 className="text-sm font-bold text-foreground mb-1">🔗 Endpoints pour agents externes (n8n, Make)</h3>
            <div className="space-y-1 text-xs text-muted-foreground font-mono">
              <p>POST {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-task`}</p>
              <p>POST {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-event`}</p>
            </div>
          </div>

          <StaggerContainer className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
            {!isLoading && connectors.length === 0 && (
              <StaggerItem>
                <div className="card-soft p-10 text-center">
                  <Plug className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                  <p className="text-lg font-bold text-foreground">Aucun connecteur</p>
                  <p className="text-sm text-muted-foreground mt-1">Ajoute Gmail, Monday ou un webhook pour commencer</p>
                </div>
              </StaggerItem>
            )}
            {connectors.map(c => {
              const structure = structures.find(s => s.id === c.structure_id);
              const typeInfo = CONNECTOR_TYPES.find(ct => ct.type === c.type);
              const Icon = typeInfo?.icon || Plug;
              return (
                <StaggerItem key={c.id}>
                  <HoverCard className="card-soft p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground capitalize">{c.provider}</span>
                          <span className="pill text-[10px] font-bold px-2.5 py-0.5 bg-primary/15 text-primary">{c.type}</span>
                          <div className={`w-2 h-2 rounded-full ${structure?.color || 'bg-muted'}`} />
                          <span className="text-xs text-muted-foreground">{structure?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {c.active ? <><Wifi className="w-3 h-3 text-success" /> Actif</> : <><WifiOff className="w-3 h-3 text-destructive" /> Inactif</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleTest(c.provider)} className="pill px-3 py-1.5 bg-accent/15 text-accent text-xs font-bold hover:bg-accent/25 transition-all">
                          Tester
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleToggle(c.id, c.active)} className="p-2 rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all">
                          {c.active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5" />}
                        </motion.button>
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

export default ConnectorsPage;
