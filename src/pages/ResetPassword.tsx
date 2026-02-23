import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("6 caractères minimum"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour !");
      navigate("/");
    }
    setSubmitting(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="card-soft p-6 text-center space-y-3 max-w-sm">
          <p className="text-foreground font-medium">Lien invalide ou expiré.</p>
          <button onClick={() => navigate("/auth")} className="text-primary text-sm hover:underline">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div className="w-full max-w-md card-soft p-6 space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold text-foreground text-center">Nouveau mot de passe</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? "..." : "Mettre à jour"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
