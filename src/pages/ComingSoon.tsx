import { useParams, Link } from "react-router-dom";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/MotionWrappers";

const ComingSoon = () => {
  const { spaceKey } = useParams<{ spaceKey: string }>();
  const { data: spaces = [] } = useLifeSpaces();
  const space = spaces.find((s) => s.key === spaceKey);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          className="max-w-md w-full text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl gradient-primary mx-auto flex items-center justify-center shadow-soft"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <span className="text-4xl">{space?.icon ?? "📦"}</span>
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              {space?.label ?? "Espace"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {space?.description ?? "Cet espace est en cours de développement."}
            </p>
          </div>

          <motion.div
            className="card-soft p-6 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-semibold">Arrive bientôt</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cet espace de vie sera bientôt disponible avec ses tâches, routines, planning et suggestions IA dédiées.
            </p>
          </motion.div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ComingSoon;
