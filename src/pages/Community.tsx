import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccountabilityPartner } from "@/hooks/useAccountabilityPartner";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Users, UserPlus, Search, Flame, BookOpen, Moon as MoonIcon,
  Clock, UtensilsCrossed, Loader2, Copy, Send, CheckCircle2, UserMinus,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FOCUS_OPTIONS = [
  { key: "quran", label: "Qur'an", icon: BookOpen },
  { key: "salah", label: "Salah", icon: MoonIcon },
  { key: "fasting", label: "Fasting", icon: UtensilsCrossed },
  { key: "time", label: "Deen Time", icon: Clock },
];

interface DiscoverableProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  focus_areas: string[];
  current_streak: number;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isActive, partnerName, inviteCode, isPending, createInvite, acceptInvite, dissolve } = useAccountabilityPartner();

  // My profile state
  const [myProfile, setMyProfile] = useState<{
    display_name: string;
    bio: string;
    focus_areas: string[];
    is_discoverable: boolean;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Discovery state
  const [profiles, setProfiles] = useState<DiscoverableProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [browsing, setBrowsing] = useState(false);

  // Invite code input
  const [codeInput, setCodeInput] = useState("");
  const [joining, setJoining] = useState(false);

  // Load my partner profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setMyProfile({
          display_name: data.display_name,
          bio: data.bio || "",
          focus_areas: data.focus_areas || [],
          is_discoverable: data.is_discoverable,
        });
      } else {
        // Load display name from profiles table as default
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        setMyProfile({
          display_name: profile?.display_name || "",
          bio: "",
          focus_areas: [],
          is_discoverable: false,
        });
      }
      setProfileLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user || !myProfile) return;
    setSaving(true);
    const { error } = await supabase.from("partner_profiles").upsert(
      {
        user_id: user.id,
        display_name: myProfile.display_name,
        bio: myProfile.bio || null,
        focus_areas: myProfile.focus_areas,
        is_discoverable: myProfile.is_discoverable,
      },
      { onConflict: "user_id" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
    setSaving(false);
  };

  const toggleFocus = (key: string) => {
    if (!myProfile) return;
    setMyProfile(prev => {
      if (!prev) return prev;
      const areas = prev.focus_areas.includes(key)
        ? prev.focus_areas.filter(a => a !== key)
        : [...prev.focus_areas, key];
      return { ...prev, focus_areas: areas };
    });
  };

  // Browse discoverable profiles
  const browseProfiles = useCallback(async () => {
    if (!user) return;
    setBrowsing(true);
    let query = supabase
      .from("partner_profiles")
      .select("id, user_id, display_name, bio, focus_areas, current_streak")
      .eq("is_discoverable", true)
      .neq("user_id", user.id)
      .order("current_streak", { ascending: false })
      .limit(20);

    const { data } = await query;
    let results = (data || []) as DiscoverableProfile[];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        p =>
          p.display_name.toLowerCase().includes(q) ||
          p.focus_areas.some(a => a.toLowerCase().includes(q))
      );
    }

    setProfiles(results);
    setBrowsing(false);
  }, [user, searchQuery]);

  useEffect(() => {
    browseProfiles();
  }, [browseProfiles]);

  const sendPartnerRequest = async (targetUserId: string) => {
    if (!user) return;
    // Create an invite and immediately link
    const code = await createInvite();
    if (code) {
      toast({ title: "Invite sent!", description: "Share your code with them or wait for them to find you." });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Community
        </h1>
        <p className="text-muted-foreground">Find an accountability partner and grow together</p>
      </div>

      {/* Current Partnership Status */}
      {isActive && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Active Partnership
            </CardTitle>
            <CardDescription>You're partnered with <strong>{partnerName}</strong></CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            {inviteCode && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Code:</span>
                <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{inviteCode}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  toast({ title: "Copied!" });
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <UserMinus className="h-3.5 w-3.5 mr-1" /> Dissolve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Dissolve partnership?</AlertDialogTitle>
                  <AlertDialogDescription>Both partners will need to re-link.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={dissolve}>Dissolve</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Join with Code */}
      {!isActive && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Join with Invite Code</CardTitle>
            <CardDescription>Enter a 6-character code from your friend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                placeholder="ABC123"
                maxLength={6}
                className="font-mono tracking-widest uppercase max-w-[160px]"
              />
              <Button
                disabled={codeInput.length < 6 || joining}
                onClick={async () => {
                  setJoining(true);
                  await acceptInvite(codeInput);
                  setJoining(false);
                  setCodeInput("");
                }}
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </Button>
              {!isPending && (
                <Button variant="outline" onClick={createInvite}>
                  <UserPlus className="h-4 w-4 mr-1" /> Create Invite
                </Button>
              )}
            </div>
            {isPending && inviteCode && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Your invite code:</span>
                <code className="bg-muted px-2 py-1 rounded font-mono tracking-widest">{inviteCode}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  toast({ title: "Copied!" });
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* My Discovery Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Discovery Profile</CardTitle>
          <CardDescription>
            Make yourself discoverable so other users can find and partner with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : myProfile && (
            <>
              <div className="flex items-center justify-between">
                <Label>Discoverable</Label>
                <Switch
                  checked={myProfile.is_discoverable}
                  onCheckedChange={v => setMyProfile(prev => prev ? { ...prev, is_discoverable: v } : prev)}
                />
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={myProfile.display_name}
                  onChange={e => setMyProfile(prev => prev ? { ...prev, display_name: e.target.value } : prev)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Bio <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  value={myProfile.bio}
                  onChange={e => setMyProfile(prev => prev ? { ...prev, bio: e.target.value } : prev)}
                  placeholder="A few words about your goals…"
                  maxLength={200}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Focus Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map(f => {
                    const active = myProfile.focus_areas.includes(f.key);
                    return (
                      <Button
                        key={f.key}
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className="h-8 text-xs gap-1.5"
                        onClick={() => toggleFocus(f.key)}
                      >
                        <f.icon className="h-3 w-3" /> {f.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Browse Partners */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Find a Partner</h2>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or focus area…"
              className="pl-9"
            />
          </div>
        </div>

        {browsing ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No discoverable partners found yet.</p>
            <p className="text-xs mt-1">Be the first — enable your discovery profile above!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profiles.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{p.display_name}</h3>
                    {p.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.bio}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.focus_areas.map(a => (
                        <Badge key={a} variant="secondary" className="text-[10px] py-0">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="h-3 w-3 text-warning" />
                      {p.current_streak}d
                    </div>
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => sendPartnerRequest(p.user_id)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Invite
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
