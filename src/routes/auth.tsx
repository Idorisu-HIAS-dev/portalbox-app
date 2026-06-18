import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Masuk — Inventaris" }] }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Minimal 6 karakter").max(72),
});
const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  // Handle OAuth callback hash fragment
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setOauthError(errorDescription || "Login Google gagal. Pastikan provider Google sudah dikonfigurasi di Supabase Dashboard.");
      toast.error(errorDescription || "Login Google gagal");
      window.location.hash = "";
      return;
    }

    if (accessToken) {
      toast.success("Berhasil masuk dengan Google!");
      window.location.hash = "";
      navigate({ to: "/", replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-soft via-background to-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Inventaris Barang</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola stok, transaksi & persetujuan dalam satu tempat.</p>
        </div>
        <Card className="p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6"><LoginForm /></TabsContent>
            <TabsContent value="signup" className="mt-6"><SignupForm /></TabsContent>
          </Tabs>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />ATAU<div className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton onError={setOauthError} />
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Selamat datang kembali!");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-pass">Password</Label>
        <Input id="login-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Masuk
      </Button>
    </form>
  );
}

function SignupForm() {
  const [busy, setBusy] = useState(false);
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ full_name, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Akun berhasil dibuat! Silakan masuk.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="su-name">Nama lengkap</Label>
        <Input id="su-name" value={full_name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-pass">Password</Label>
        <Input id="su-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Buat akun
      </Button>
      <p className="text-xs text-muted-foreground text-center">Akun pertama akan otomatis menjadi Admin.</p>
    </form>
  );
}

function GoogleButton({ onError }: { onError?: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        const msg = error.message.includes("provider is not enabled")
          ? "Google provider belum diaktifkan. Silakan aktifkan di Supabase Dashboard → Authentication → Providers → Google."
          : `Gagal masuk dengan Google: ${error.message}`;
        onError?.(msg);
        toast.error(msg);
        setBusy(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      const msg = "Gagal masuk dengan Google. Pastikan Google provider sudah dikonfigurasi.";
      onError?.(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={busy}>
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1.2-1.6 3.4-4.5 3.4-2.7 0-4.9-2.3-4.9-5s2.2-5 4.9-5c1.5 0 2.6.6 3.2 1.2L17 6.5C15.7 5.3 14 4.6 12 4.6 7.9 4.6 4.5 8 4.5 12s3.4 7.4 7.5 7.4c4.3 0 7.2-3 7.2-7.3 0-.5-.1-.9-.1-1.1H12z"/></svg>
      )}
      Masuk dengan Google
    </Button>
  );
}
