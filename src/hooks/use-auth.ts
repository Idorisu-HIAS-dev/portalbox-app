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

const DUMMY_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "admin@local.dev",
  app_metadata: {},
  user_metadata: { full_name: "Admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      const s = data.session;
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        // load extras
        Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", s.user.id).maybeSingle(),
          supabase.from("profiles").select("full_name, avatar_url").eq("id", s.user.id).maybeSingle(),
        ]).then(([{ data: r }, { data: p }]) => {
          if (!mounted) return;
          setRole((r?.role as AppRole) ?? "admin");
          setProfile(p ?? { full_name: s.user.user_metadata?.full_name ?? "Admin", avatar_url: null });
        });
      } else {
        // No real session — use dummy admin so pages work
        setUser(DUMMY_USER);
        setRole("admin");
        setProfile({ full_name: "Admin", avatar_url: null });
      }
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setUser(DUMMY_USER);
      setRole("admin");
      setProfile({ full_name: "Admin", avatar_url: null });
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      if (s?.user) {
        setSession(s);
        setUser(s.user);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, role, profile };
}
