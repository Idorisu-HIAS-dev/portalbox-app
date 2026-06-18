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
    let sessionChecked = false;

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

    function applySession(s: Session | null) {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadExtras(s.user.id);
      } else {
        setRole(null);
        setProfile(null);
      }
    }

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("[useAuth] getSession error:", error.message);
      }
      applySession(data.session);
      sessionChecked = true;
      setLoading(false);
    }).catch((err) => {
      console.error("[useAuth] getSession catch:", err);
      if (mounted) {
        sessionChecked = true;
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;
      if (!sessionChecked) return;
      applySession(s);
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (mounted && !sessionChecked) {
        sessionChecked = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, role, profile };
}
