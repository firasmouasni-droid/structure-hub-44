export interface Task {
  id: string;
  title: string;
  action_type: "CALL" | "EMAIL" | "MEETING" | "WRITE" | "PLAN" | "BUILD" | "REVIEW" | "LEARN" | "ADMIN" | "OTHER";
  structure: string;
  structureColor: string;
  domain: string;
  source: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "done";
  due_date: string;
  estimated_duration: string;
  email_id?: string;
}

export interface Structure {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasksToday: number;
  tasksTotal: number;
  progress: number;
  charge: number;
}

export const mockTasks: Task[] = [
  { id: "1", title: "Répondre à l'email de Thomas Dubois", action_type: "EMAIL", structure: "Pro", structureColor: "bg-primary", domain: "Client", source: "Gmail", priority: "high", status: "todo", due_date: "Aujourd'hui", estimated_duration: "15 min", email_id: "e1" },
  { id: "2", title: "Préparer réunion équipe lundi", action_type: "MEETING", structure: "Pro", structureColor: "bg-primary", domain: "Admin", source: "Google Calendar", priority: "high", status: "todo", due_date: "Aujourd'hui", estimated_duration: "30 min" },
  { id: "3", title: "Réviser le contrat Fournisseur", action_type: "REVIEW", structure: "Pro", structureColor: "bg-primary", domain: "Admin", source: "Manuel", priority: "medium", status: "in_progress", due_date: "Demain", estimated_duration: "1h" },
  { id: "4", title: "Appeler le comptable", action_type: "CALL", structure: "Pro", structureColor: "bg-primary", domain: "Admin", source: "CRM", priority: "medium", status: "todo", due_date: "Demain", estimated_duration: "20 min" },
  { id: "5", title: "Cours de pilotage - préparer briefing", action_type: "LEARN", structure: "Aéroclub", structureColor: "bg-warning", domain: "Formation", source: "Manuel", priority: "medium", status: "todo", due_date: "Mercredi", estimated_duration: "45 min" },
  { id: "6", title: "Déployer v2 du side project", action_type: "BUILD", structure: "Side Project", structureColor: "bg-secondary", domain: "Dev", source: "GitHub", priority: "high", status: "in_progress", due_date: "Aujourd'hui", estimated_duration: "2h" },
  { id: "7", title: "Planifier les vacances d'été", action_type: "PLAN", structure: "Perso", structureColor: "bg-success", domain: "Perso", source: "Manuel", priority: "low", status: "todo", due_date: "Vendredi", estimated_duration: "30 min" },
  { id: "8", title: "Écrire article blog technique", action_type: "WRITE", structure: "Side Project", structureColor: "bg-secondary", domain: "Contenu", source: "Notion", priority: "low", status: "todo", due_date: "Semaine prochaine", estimated_duration: "1h30" },
];

export const mockStructures: Structure[] = [
  { id: "pro", name: "Pro - Entreprise", icon: "Building2", color: "bg-primary", tasksToday: 4, tasksTotal: 23, progress: 68, charge: 85 },
  { id: "perso", name: "Perso", icon: "User", color: "bg-success", tasksToday: 1, tasksTotal: 8, progress: 45, charge: 30 },
  { id: "project", name: "Side Project", icon: "Rocket", color: "bg-secondary", tasksToday: 2, tasksTotal: 15, progress: 72, charge: 60 },
  { id: "club", name: "Aéroclub", icon: "Plane", color: "bg-warning", tasksToday: 1, tasksTotal: 5, progress: 50, charge: 20 },
];

export const mockInboxTasks: Task[] = [
  { id: "i1", title: "Nouveau brief client reçu — créer devis", action_type: "WRITE", structure: "Pro", structureColor: "bg-primary", domain: "Client", source: "Gmail", priority: "high", status: "todo", due_date: "Demain", estimated_duration: "45 min", email_id: "e2" },
  { id: "i2", title: "Invitation réunion partenaire jeudi", action_type: "MEETING", structure: "Pro", structureColor: "bg-primary", domain: "Partenaire", source: "Outlook", priority: "medium", status: "todo", due_date: "Jeudi", estimated_duration: "1h" },
  { id: "i3", title: "Facture à valider — fournisseur X", action_type: "ADMIN", structure: "Pro", structureColor: "bg-primary", domain: "Admin", source: "Email", priority: "medium", status: "todo", due_date: "Vendredi", estimated_duration: "10 min", email_id: "e3" },
  { id: "i4", title: "Réservation créneau vol confirmée", action_type: "OTHER", structure: "Aéroclub", structureColor: "bg-warning", domain: "Vol", source: "Webhook", priority: "low", status: "todo", due_date: "Samedi", estimated_duration: "5 min" },
];
