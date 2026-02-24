import { useState } from "react";
import { Loader2, BookOpen, GraduationCap, FileText, Youtube, Mic, ArrowLeft } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { encodeInstructor, CATEGORIES } from "@/components/knowledge/knowledgeTypes";
import type { ResourceType } from "@/components/knowledge/knowledgeTypes";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopicRow {
  id: string;
  name: string;
  category: string;
}

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TopicRow[];
  onSuccess: () => void;
}

// ── Type option definitions ───────────────────────────────────────────────────

const TYPE_OPTIONS: Array<{
  type: ResourceType;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}> = [
  {
    type: "book",
    label: "Book",
    description: "Physical or digital Islamic book",
    icon: BookOpen,
    colorClass: "text-blue-400",
  },
  {
    type: "article",
    label: "Article / PDF",
    description: "Online article, blog post, or PDF",
    icon: FileText,
    colorClass: "text-yellow-400",
  },
  {
    type: "course",
    label: "Online Course",
    description: "Bayyinah, SeekersGuidance, Coursera…",
    icon: GraduationCap,
    colorClass: "text-primary",
  },
  {
    type: "youtube",
    label: "YouTube / Lecture",
    description: "YouTube series or lecture playlist",
    icon: Youtube,
    colorClass: "text-red-400",
  },
  {
    type: "podcast",
    label: "Podcast / Audio",
    description: "Podcast series or audio lessons",
    icon: Mic,
    colorClass: "text-green-400",
  },
];

const CREATOR_LABEL: Record<ResourceType, string> = {
  book:    "Author",
  article: "Author / Source",
  course:  "Instructor / Platform",
  youtube: "Channel / Scholar",
  podcast: "Host / Series",
};

const BOOK_STATUSES = [
  { value: "want_to_read", label: "Want to Read" },
  { value: "reading",      label: "Reading" },
  { value: "completed",    label: "Completed" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AddResourceModal({
  open,
  onOpenChange,
  topics,
  onSuccess,
}: AddResourceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ResourceType>("book");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title:          "",
    creator:        "",
    category:       "general",
    totalPages:     "",
    bookStatus:     "want_to_read",
    topicId:        "",
    courseProgress: 0,
    url:            "",
  });

  const setField = (key: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setStep(1);
    setSelectedType("book");
    setForm({
      title: "", creator: "", category: "general", totalPages: "",
      bookStatus: "want_to_read", topicId: "", courseProgress: 0, url: "",
    });
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    setLoading(true);

    try {
      if (selectedType === "book" || selectedType === "article") {
        // Insert into books table
        const { data: book, error } = await supabase
          .from("books")
          .insert({
            user_id:     user.id,
            title:       form.title.trim(),
            author:      form.creator.trim() || null,
            category:    selectedType === "article" ? "article" : (form.category || null),
            total_pages: selectedType === "article" ? 0 : (parseInt(form.totalPages) || 0),
            pages_read:  0,
            status:      selectedType === "article" ? "want_to_read" : form.bookStatus,
          })
          .select()
          .single();

        if (error) throw error;

        // For articles with a URL: save as a linked note
        if (selectedType === "article" && form.url.trim() && book) {
          await supabase.from("notes").insert({
            user_id:   user.id,
            title:     `book:${book.id}`,
            content:   `Source URL: ${form.url.trim()}`,
            course_id: null,
            topic_id:  null,
          });
        }
      } else {
        // Insert into courses table (course / youtube / podcast)
        const progress = form.courseProgress;
        const status =
          progress >= 100 ? "completed"
          : progress > 0  ? "in_progress"
          : "not_started";

        const { error } = await supabase.from("courses").insert({
          user_id:          user.id,
          name:             form.title.trim(),
          instructor:       form.creator.trim()
            ? encodeInstructor(selectedType, form.creator.trim())
            : null,
          topic_id:         form.topicId || null,
          progress_percent: progress,
          status,
        });

        if (error) throw error;
      }

      toast({ title: "Resource added ✅" });
      reset();
      onSuccess();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const currentTypeOption = TYPE_OPTIONS.find((o) => o.type === selectedType)!;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {/* ── Step 1: Choose type ─────────────────────────── */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Add a Learning Resource</DialogTitle>
              <DialogDescription>
                What type of resource are you adding to your library?
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 py-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setSelectedType(opt.type);
                      setStep(2);
                    }}
                    className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 text-left
                      transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none
                      focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Icon className={`h-5 w-5 ${opt.colorClass}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step 2: Fill in fields ──────────────────────── */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = currentTypeOption.icon; return <Icon className={`h-5 w-5 ${currentTypeOption.colorClass}`} />; })()}
                Add {currentTypeOption.label}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-1">
              {/* Title (always required) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Title *</label>
                <Input
                  placeholder={`${currentTypeOption.label} title`}
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  autoFocus
                />
              </div>

              {/* Creator */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {CREATOR_LABEL[selectedType]}
                </label>
                <Input
                  placeholder={CREATOR_LABEL[selectedType]}
                  value={form.creator}
                  onChange={(e) => setField("creator", e.target.value)}
                />
              </div>

              {/* ── Book-specific fields ── */}
              {selectedType === "book" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Category</label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => setField("category", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.filter((c) => c.value !== "article").map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Total Pages</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.totalPages}
                        onChange={(e) => setField("totalPages", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select
                      value={form.bookStatus}
                      onValueChange={(v) => setField("bookStatus", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOK_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* ── Article-specific fields ── */}
              {selectedType === "article" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">URL (optional)</label>
                  <Input
                    placeholder="https://…"
                    value={form.url}
                    onChange={(e) => setField("url", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Saved as a quick-access note.</p>
                </div>
              )}

              {/* ── Course / YouTube / Podcast fields ── */}
              {(selectedType === "course" || selectedType === "youtube" || selectedType === "podcast") && (
                <>
                  {topics.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Topic (optional)
                      </label>
                      <Select
                        value={form.topicId}
                        onValueChange={(v) => setField("topicId", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {topics.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Initial Progress: {form.courseProgress}%
                    </label>
                    <Slider
                      value={[form.courseProgress]}
                      onValueChange={([v]) => setField("courseProgress", v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.title.trim() || loading}
                className="min-w-[100px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Resource"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
