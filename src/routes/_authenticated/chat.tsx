import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Search, Paperclip, Image as ImageIcon, Film, Music, FileText, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  ssr: false,
  head: () => ({ meta: [{ title: "Chat — Inventaris" }] }),
  component: ChatPage,
});

type Profile = { id: string; full_name: string | null; updated_at?: string };
type Msg = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string; read: boolean };

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileType(file: File): "image" | "video" | "audio" | "file" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

function parseContent(content: string) {
  const imageMatch = content.match(/^\[image:(.+)\]$/);
  const videoMatch = content.match(/^\[video:(.+)\]$/);
  const audioMatch = content.match(/^\[audio:(.+)\]$/);
  const fileMatch = content.match(/^\[file:(.+?)\|(.+)\]$/);
  if (imageMatch) return { type: "image" as const, url: imageMatch[1] };
  if (videoMatch) return { type: "video" as const, url: videoMatch[1] };
  if (audioMatch) return { type: "audio" as const, url: audioMatch[1] };
  if (fileMatch) return { type: "file" as const, url: fileMatch[1], name: fileMatch[2] };
  return { type: "text" as const, text: content };
}

function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: people = [] } = useQuery({
    queryKey: ["chat-people", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, updated_at").neq("id", user!.id);
      return (data ?? []) as Profile[];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", user?.id, activeId],
    enabled: !!user && !!activeId,
    queryFn: async () => {
      const { data } = await supabase.from("chat_messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${user!.id})`)
        .order("created_at", { ascending: true });
      await supabase.from("chat_messages").update({ read: true })
        .eq("sender_id", activeId!).eq("recipient_id", user!.id).eq("read", false);
      return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    if (!user || !activeId) return;
    const ch = supabase.channel(`chat-${user.id}-${activeId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${user.id}))`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages", user.id, activeId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, activeId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const filteredPeople = useMemo(
    () => people.filter((p) => (p.full_name ?? "").toLowerCase().includes(search.toLowerCase())),
    [people, search]
  );

  const activePerson = people.find((p) => p.id === activeId) ?? null;

  function isOnline(profile: Profile) {
    if (!profile.updated_at) return false;
    const lastSeen = new Date(profile.updated_at).getTime();
    return Date.now() - lastSeen < 5 * 60 * 1000; // 5 minutes
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 50MB");
      return;
    }
    setPendingFile(file);
    e.target.value = "";
  }

  async function uploadFile(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "bin";
    const fileName = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-files").upload(fileName, file, { upsert: false });
    if (error) {
      toast.error("Gagal upload: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("chat-files").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function send() {
    if (!activeId || !user) return;

    if (pendingFile) {
      setUploading(true);
      const url = await uploadFile(pendingFile);
      setUploading(false);
      if (!url) return;

      const fileType = getFileType(pendingFile);
      let content = "";
      if (fileType === "image") content = `[image:${url}]`;
      else if (fileType === "video") content = `[video:${url}]`;
      else if (fileType === "audio") content = `[audio:${url}]`;
      else content = `[file:${url}|${pendingFile.name}]`;

      setPendingFile(null);
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: user.id, recipient_id: activeId, content,
      });
      if (error) toast.error("Gagal mengirim: " + error.message);
      return;
    }

    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id, recipient_id: activeId, content,
    });
    if (error) {
      setDraft(content);
      toast.error("Gagal mengirim pesan: " + error.message);
    }
  }

  return (
    <Card className="overflow-hidden p-0 h-[calc(100vh-12rem)] md:h-[calc(100vh-9rem)]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Sidebar list */}
        <div className={cn(
          "border-r border-border/60 flex flex-col bg-card",
          activeId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengguna…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full bg-muted/50 border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredPeople.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">Tidak ada pengguna.</p>
            )}
            {filteredPeople.map((p) => {
              const online = isOnline(p);
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30",
                    activeId === p.id && "bg-primary/10"
                  )}
                >
                  <PersonAvatar name={p.full_name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.full_name ?? "Pengguna"}</p>
                    <p className={cn("text-xs flex items-center gap-1.5", online ? "text-success" : "text-muted-foreground")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success" : "bg-muted-foreground/50")} />
                      {online ? "Aktif" : "Tidak aktif"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className={cn("flex flex-col bg-muted/20", !activeId && "hidden md:flex")}>
          {!activePerson ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Pilih pengguna untuk memulai percakapan.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-border/60 bg-card">
                <button onClick={() => setActiveId(null)} className="md:hidden text-xs text-primary">← Kembali</button>
                <PersonAvatar name={activePerson.full_name ?? "?"} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{activePerson.full_name ?? "Pengguna"}</p>
                  <p className={cn("text-[11px] flex items-center gap-1.5", isOnline(activePerson) ? "text-success" : "text-muted-foreground")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", isOnline(activePerson) ? "bg-success" : "bg-muted-foreground/50")} />
                    {isOnline(activePerson) ? "Aktif" : "Tidak aktif"}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  const parsed = parseContent(m.content);
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border/60 rounded-bl-md"
                      )}>
                        {parsed.type === "text" && <p className="whitespace-pre-wrap break-words">{parsed.text}</p>}
                        {parsed.type === "image" && (
                          <a href={parsed.url} target="_blank" rel="noopener noreferrer">
                            <img src={parsed.url} alt="Photo" className="rounded-lg max-h-60 object-cover" />
                          </a>
                        )}
                        {parsed.type === "video" && (
                          <video src={parsed.url} controls className="rounded-lg max-h-60" />
                        )}
                        {parsed.type === "audio" && (
                          <audio src={parsed.url} controls className="w-full" />
                        )}
                        {parsed.type === "file" && (
                          <a href={parsed.url} target="_blank" rel="noopener noreferrer"
                            className={cn("flex items-center gap-2 underline",
                              mine ? "text-primary-foreground" : "text-primary"
                            )}>
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{parsed.name}</span>
                          </a>
                        )}
                        <p className={cn(
                          "text-[10px] mt-1",
                          mine ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Belum ada pesan. Sapa duluan!</p>
                )}
              </div>

              {/* Pending file preview */}
              {pendingFile && (
                <div className="px-3 py-2 border-t border-border/60 bg-card flex items-center gap-2">
                  {getFileType(pendingFile) === "image" && <ImageIcon className="h-4 w-4 text-primary" />}
                  {getFileType(pendingFile) === "video" && <Film className="h-4 w-4 text-primary" />}
                  {getFileType(pendingFile) === "audio" && <Music className="h-4 w-4 text-primary" />}
                  {getFileType(pendingFile) === "file" && <FileText className="h-4 w-4 text-primary" />}
                  <span className="text-xs truncate flex-1">{pendingFile.name}</span>
                  <span className="text-[10px] text-muted-foreground">{(pendingFile.size / 1024 / 1024).toFixed(1)}MB</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPendingFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="p-3 border-t border-border/60 bg-card flex gap-2"
              >
                <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={handleFileSelect} />
                <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Tulis pesan…"
                  className="rounded-full"
                  disabled={uploading}
                />
                <Button type="submit" size="icon" className="rounded-full" disabled={uploading || (!draft.trim() && !pendingFile)}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function PersonAvatar({ name }: { name: string }) {
  const initials = (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
      {initials}
    </div>
  );
}
