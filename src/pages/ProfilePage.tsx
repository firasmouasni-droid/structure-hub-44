import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Camera, ArrowLeft, Save, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const currentAvatarUrl = avatarPreview ?? profile?.avatar_url ?? null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (max 2 Mo)");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null, avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profil mis à jour !");
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nom d'affichage</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ton prénom ou pseudo"
            className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>

        {/* Save */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
