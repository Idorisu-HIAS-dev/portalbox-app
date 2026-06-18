import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "petugas";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  profile: { full_name: string | null; avatar_url: string | null } | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await loadExtras(s.user.id);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("[useAuth] getSession error:", error.message);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadExtras(data.session.user.id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error("[useAuth] getSession catch:", err);
      if (mounted) setLoading(false);
    });

    // Safety: always stop loading after 3 seconds
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    async function loadExtras(uid: string) {
      try {
        const [{ data: r }, { data: p }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
          supabase.from("profiles").select("full_name, avatar_url").eq("id", uid).maybeSingle(),
        ]);
        if (!mounted) return;
        setRole((r?.role as AppRole) ?? null);
        setProfile(p ?? null);
      } catch (err) {
        console.error("[useAuth] loadExtras error:", err);
      }
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, role, profile };
}
