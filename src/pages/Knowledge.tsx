import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, BookOpen, GraduationCap, StickyNote, Trash2, Flame,
  Library, Tag, Users, TrendingUp, CheckCircle2, ChevronDown,
  Search, Youtube, Mic, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ResourceCard, TYPE_CONFIG, cardVariant } from "@/components/knowledge/ResourceCard";
import { AddResourceModal } from "@/components/knowledge/AddResourceModal";
import {
  CATEGORIES, normaliseBook, normaliseCourse,
  type ResourceType, type Resource, type BookRow, type CourseRow,
  type TopicRow, type NoteRow,
} from "@/components/knowledge/knowledgeTypes";

// Re-export so external imports (if any) still resolve
export type { ResourceType, Resource };

// ── Stat items ─────────────────────────────────────────────────────────────────

interface KnowledgeStats {
  total: number; active: number; completed: number;
  noteCount: number; topicCount: number; avgProgress: number;
}

function StatItem({
  value, label, icon,
}: { value: number | string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-semibold text-foreground text-sm">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function KnowledgeStatsBar({ stats }: { stats: KnowledgeStats }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 rounded-lg bg-muted/40 border border-border/50">
      <StatItem value={stats.total} label="Resources" icon={<Library className="h-3.5 w-3.5" />} />
      <StatItem value={stats.active} label="Active" icon={<Flame className="h-3.5 w-3.5 text-orange-400" />} />
      <StatItem value={stats.completed} label="Completed" icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-400" />} />
      <StatItem value={stats.noteCount} label="Notes" icon={<StickyNote className="h-3.5 w-3.5" />} />
      <StatItem value={stats.topicCount} label="Topics" icon={<Tag className="h-3.5 w-3.5" />} />
      {stats.total > 0 && (
        <StatItem value={`${stats.avgProgress}%`} label="Avg" icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />} />
      )}
    </div>
  );
}

// ── Currently Learning bar ─────────────────────────────────────────────────────

function CurrentlyLearningBar({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" /> Currently Learning
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <ScrollArea orientation="horizontal" className="w-full">
          <div className="flex gap-2 pb-1">
            {resources.map((r) => {
              const Icon = TYPE_CONFIG[r.type].icon;
              return (
                <Badge key={r.id} variant="secondary" className="gap-1.5 shrink-0 py-1 px-2.5 text-xs">
                  <Icon className={`h-3 w-3 ${TYPE_CONFIG[r.type].colorClass}`} />
                  <span className="max-w-[160px] truncate">{r.title}</span>
                  <span className="text-muted-foreground">· {r.progress}%</span>
                </Badge>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ── Topic card ─────────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  resourceCount,
  noteCount,
  onProgressChange,
  onOpenNotes,
  onDelete,
}: {
  topic: TopicRow;
  resourceCount: number;
  noteCount: number;
  onProgressChange: (id: string, value: number) => void;
  onOpenNotes: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(topic.progress_percent);

  const commit = () => { onProgressChange(topic.id, local); setEditing(false); };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{topic.name}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {CATEGORIES.find((c) => c.value === topic.category)?.label ?? topic.category}
            {resourceCount > 0 && ` · ${resourceCount} resource${resourceCount !== 1 ? "s" : ""}`}
            {noteCount > 0 && ` · ${noteCount} note${noteCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onOpenNotes} title="Notes">
            <StickyNote className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={local} className="h-2" />
        {editing ? (
          <div className="flex items-center gap-2">
            <Slider
              value={[local]}
              onValueChange={([v]) => setLocal(v)}
              min={0} max={100} step={5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-7 shrink-0">{local}%</span>
            <Button size="sm" className="h-7 text-xs px-2" onClick={commit}>Save</Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={() => { setLocal(topic.progress_percent); setEditing(true); }}
          >
            <ChevronDown className="h-3 w-3" />
            {topic.progress_percent}% — click to edit
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Notes Dialog ───────────────────────────────────────────────────────────────

function NotesDialog({
  resource, topic, notes,
  noteInput, setNoteInput,
  noteTitleInput, setNoteTitleInput,
  onSave, onDelete, onClose,
}: {
  resource: Resource | null;
  topic: TopicRow | null;
  notes: NoteRow[];
  noteInput: string;
  setNoteInput: (v: string) => void;
  noteTitleInput: string;
  setNoteTitleInput: (v: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const isOpen = !!resource || !!topic;
  const displayTitle = resource?.title ?? topic?.name ?? "";

  // Filter notes relevant to this resource/topic
  const filteredNotes = useMemo(() => {
    if (resource) {
      if (resource.source === "books") {
        return notes.filter((n) => n.title === `book:${resource.id}`);
      }
      return notes.filter((n) => n.course_id === resource.id);
    }
    if (topic) {
      return notes.filter((n) => n.topic_id === topic.id);
    }
    return [];
  }, [resource, topic, notes]);

  const showTitleInput = resource?.source === "courses";

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Notes: {displayTitle}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto min-h-0">
          <div className="space-y-3 pb-4">
            {filteredNotes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No notes yet. Add your first note below.
              </p>
            )}
            {filteredNotes.map((note) => {
              // Don't show the auto-generated article URL note in editable list
              const isAutoNote = note.content?.startsWith("Source URL:");
              return (
                <div
                  key={note.id}
                  className="group p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1.5"
                >
                  {/* Title for course-linked notes */}
                  {note.course_id && note.title && !note.title.startsWith("[") && (
                    <p className="text-xs font-medium text-foreground">{note.title}</p>
                  )}
                  {/* Article URL note: render as link */}
                  {isAutoNote ? (
                    <p className="text-xs text-muted-foreground break-all">{note.content}</p>
                  ) : (
                    <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none
                      prose-p:my-0.5 prose-ul:my-1 prose-li:my-0 prose-headings:my-1">
                      <ReactMarkdown>{note.content ?? ""}</ReactMarkdown>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </span>
                    <Button
                      size="icon" variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={() => onDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* New note input */}
        <div className="border-t pt-3 space-y-2 shrink-0">
          {showTitleInput && (
            <Input
              placeholder="Note title (optional)"
              value={noteTitleInput}
              onChange={(e) => setNoteTitleInput(e.target.value)}
              className="h-8 text-sm"
            />
          )}
          <Textarea
            placeholder="Add a note, key insight, or quote… (markdown supported)"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
          />
          <Button
            size="sm"
            onClick={onSave}
            disabled={!noteInput.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" /> Save Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Notes Tab ──────────────────────────────────────────────────────────────────

function groupNotes(
  notes: NoteRow[],
  resources: Resource[],
  topics: TopicRow[]
): Array<{ key: string; label: string; icon: React.ReactNode; notes: NoteRow[] }> {
  const groups = new Map<string, { label: string; icon: React.ReactNode; notes: NoteRow[] }>();

  for (const note of notes) {
    let key: string;
    let label: string;
    let icon: React.ReactNode;

    if (note.topic_id) {
      const t = topics.find((x) => x.id === note.topic_id);
      key = `topic:${note.topic_id}`;
      label = t ? t.name : "Unknown Topic";
      icon = <Tag className="h-3.5 w-3.5 text-muted-foreground" />;
    } else if (note.course_id) {
      const r = resources.find((x) => x.id === note.course_id);
      key = `course:${note.course_id}`;
      label = r ? r.title : "Unknown Resource";
      const Icon = r ? TYPE_CONFIG[r.type].icon : GraduationCap;
      const colorClass = r ? TYPE_CONFIG[r.type].colorClass : "";
      icon = <Icon className={`h-3.5 w-3.5 ${colorClass}`} />;
    } else {
      // Book note (title = "book:${id}")
      const bookId = note.title.startsWith("book:") ? note.title.slice(5) : "";
      const r = resources.find((x) => x.id === bookId);
      key = `book:${bookId || note.id}`;
      label = r ? r.title : "Unknown Book";
      icon = <BookOpen className="h-3.5 w-3.5 text-blue-400" />;
    }

    if (!groups.has(key)) groups.set(key, { label, icon, notes: [] });
    groups.get(key)!.notes.push(note);
  }

  return Array.from(groups.entries()).map(([key, v]) => ({ key, ...v }));
}

function NotesTab({
  notes, resources, topics, searchQuery, onDelete,
}: {
  notes: NoteRow[];
  resources: Resource[];
  topics: TopicRow[];
  searchQuery: string;
  onDelete: (id: string) => void;
}) {
  const legacyNotes = notes.filter(
    (n) => n.title.startsWith("Note - ") && !n.course_id && !n.topic_id
  );
  const validNotes = notes.filter(
    (n) => !(n.title.startsWith("Note - ") && !n.course_id && !n.topic_id)
  );

  const filtered = searchQuery.trim()
    ? validNotes.filter(
        (n) =>
          (n.content ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : validNotes;

  const groups = groupNotes(filtered, resources, topics);

  return (
    <div className="space-y-4">
      {legacyNotes.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-3 text-sm text-yellow-200/80">
            {legacyNotes.length} legacy note{legacyNotes.length > 1 ? "s were" : " was"} saved before
            this update and cannot be linked automatically. Please re-add them from the resource card.
          </CardContent>
        </Card>
      )}
      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {searchQuery ? "No notes match your search." : "No notes yet. Add notes from any resource card."}
          </p>
        </div>
      )}
      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {group.icon}
            {group.label}
            <span className="text-xs opacity-60">({group.notes.length})</span>
          </h3>
          {group.notes.map((note) => (
            <div
              key={note.id}
              className="group p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1"
            >
              {note.course_id && note.title && !note.title.startsWith("[") && (
                <p className="text-xs font-medium text-foreground">{note.title}</p>
              )}
              <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5">
                <ReactMarkdown>{note.content ?? ""}</ReactMarkdown>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                </span>
                <Button
                  size="icon" variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Scholars Tab ───────────────────────────────────────────────────────────────

interface ScholarEntry {
  name: string;
  resources: Resource[];
  types: ResourceType[];
  avgProgress: number;
  totalNotes: number;
}

function aggregateScholars(resources: Resource[], notes: NoteRow[]): ScholarEntry[] {
  const map = new Map<string, Resource[]>();
  for (const r of resources) {
    const name = r.creator.trim();
    if (!name) continue;
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(r);
  }
  return Array.from(map.entries())
    .map(([name, list]) => {
      const totalNotes = list.reduce((sum, r) => {
        const n = r.source === "books"
          ? notes.filter((x) => x.title === `book:${r.id}`).length
          : notes.filter((x) => x.course_id === r.id).length;
        return sum + n;
      }, 0);
      const types = Array.from(new Set(list.map((r) => r.type))) as ResourceType[];
      return {
        name,
        resources: list,
        types,
        avgProgress: Math.round(list.reduce((s, r) => s + r.progress, 0) / list.length),
        totalNotes,
      };
    })
    .sort((a, b) => b.resources.length - a.resources.length);
}

function ScholarsTab({ resources, notes }: { resources: Resource[]; notes: NoteRow[] }) {
  const scholars = useMemo(() => aggregateScholars(resources, notes), [resources, notes]);

  if (scholars.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">
          Add resources with author / instructor names to see your scholars here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scholars.map((scholar) => (
        <Card key={scholar.name}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {scholar.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate leading-tight">{scholar.name}</p>
                <p className="text-xs text-muted-foreground">
                  {scholar.resources.length} resource{scholar.resources.length !== 1 ? "s" : ""}
                  {scholar.totalNotes > 0 && ` · ${scholar.totalNotes} note${scholar.totalNotes !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {scholar.types.map((type) => {
                const Icon = TYPE_CONFIG[type].icon;
                return (
                  <Badge key={type} variant="outline" className="text-xs gap-1">
                    <Icon className={`h-3 w-3 ${TYPE_CONFIG[type].colorClass}`} />
                    {TYPE_CONFIG[type].label}
                  </Badge>
                );
              })}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Avg. Progress</span>
                <span>{scholar.avgProgress}%</span>
              </div>
              <Progress value={scholar.avgProgress} className="h-1.5" />
            </div>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="h-3 w-3" /> Show resources
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-1">
                {scholar.resources.map((r) => {
                  const Icon = TYPE_CONFIG[r.type].icon;
                  return (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <Icon className={`h-3 w-3 shrink-0 ${TYPE_CONFIG[r.type].colorClass}`} />
                      <span className="truncate text-foreground flex-1">{r.title}</span>
                      <span className="text-muted-foreground shrink-0">{r.progress}%</span>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Add Topic inline form ──────────────────────────────────────────────────────

function AddTopicForm({
  topics,
  onAdd,
  onCancel,
}: {
  topics: TopicRow[];
  onAdd: (name: string, category: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <Input
          placeholder="Topic name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Select value={category} onValueChange={setCategory}>
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
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { if (name.trim()) { onAdd(name.trim(), category); } }}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Type filter buttons config ─────────────────────────────────────────────────

const TYPE_FILTERS: Array<{
  value: ResourceType | "all";
  label: string;
  icon: React.ElementType;
}> = [
  { value: "all",     label: "All",      icon: Library },
  { value: "book",    label: "Books",    icon: BookOpen },
  { value: "course",  label: "Courses",  icon: GraduationCap },
  { value: "youtube", label: "YouTube",  icon: Youtube },
  { value: "podcast", label: "Podcasts", icon: Mic },
  { value: "article", label: "Articles", icon: FileText },
];

// ── Main Knowledge Page ────────────────────────────────────────────────────────

const Knowledge = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // ── Data state ──
  const [books,   setBooks]   = useState<BookRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [topics,  setTopics]  = useState<TopicRow[]>([]);
  const [notes,   setNotes]   = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI state ──
  const [activeTab,   setActiveTab]   = useState("library");
  const [typeFilter,  setTypeFilter]  = useState<ResourceType | "all">("all");
  const [sortOrder,   setSortOrder]   = useState<"recent" | "progress" | "alpha">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);

  // Notes dialog state
  const [activeNoteResource, setActiveNoteResource] = useState<Resource | null>(null);
  const [activeNoteTopic,    setActiveNoteTopic]    = useState<TopicRow | null>(null);
  const [noteInput,          setNoteInput]          = useState("");
  const [noteTitleInput,     setNoteTitleInput]     = useState("");

  // ── Data loading ──
  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [bRes, cRes, tRes, nRes] = await Promise.all([
      supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("topics").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("notes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    ]);
    if (bRes.data) setBooks(bRes.data as BookRow[]);
    if (cRes.data) setCourses(cRes.data as CourseRow[]);
    if (tRes.data) setTopics(tRes.data as TopicRow[]);
    if (nRes.data) setNotes(nRes.data as NoteRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // ── Derived data ──
  const resources: Resource[] = useMemo(
    () => [...books.map(normaliseBook), ...courses.map(normaliseCourse)],
    [books, courses]
  );

  const activeResources = useMemo(
    () => resources.filter((r) => r.status === "reading" || r.status === "in_progress"),
    [resources]
  );

  const stats: KnowledgeStats = useMemo(() => {
    const validNotes = notes.filter(
      (n) => !(n.title.startsWith("Note - ") && !n.course_id && !n.topic_id)
    );
    return {
      total:       resources.length,
      active:      activeResources.length,
      completed:   resources.filter((r) => r.status === "completed").length,
      noteCount:   validNotes.length,
      topicCount:  topics.length,
      avgProgress: resources.length > 0
        ? Math.round(resources.reduce((s, r) => s + r.progress, 0) / resources.length)
        : 0,
    };
  }, [resources, activeResources, notes, topics]);

  const filteredResources = useMemo(() => {
    let list = resources;
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.creator.toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q)
      );
    }
    if (sortOrder === "recent") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sortOrder === "progress") list = [...list].sort((a, b) => b.progress - a.progress);
    else if (sortOrder === "alpha") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [resources, typeFilter, searchQuery, sortOrder]);

  const notesForResource = useCallback(
    (r: Resource) => {
      if (r.source === "books") return notes.filter((n) => n.title === `book:${r.id}`);
      return notes.filter((n) => n.course_id === r.id);
    },
    [notes]
  );

  const notesForTopic = useCallback(
    (topicId: string) => notes.filter((n) => n.topic_id === topicId),
    [notes]
  );

  // ── Mutations ──
  const updateProgress = async (resource: Resource, value: number) => {
    if (resource.source === "books") {
      const total = resource.totalPages ?? 0;
      const newPages = total > 0 ? Math.round((value / 100) * total) : 0;
      const newStatus =
        value >= 100 ? "completed"
        : resource.status === "want_to_read" && value > 0 ? "reading"
        : resource.status === "completed" && value < 100 ? "reading"
        : resource.status;
      await supabase.from("books").update({
        pages_read: newPages,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", resource.id);
    } else {
      const newStatus =
        value >= 100 ? "completed"
        : resource.status === "not_started" && value > 0 ? "in_progress"
        : resource.status === "completed" && value < 100 ? "in_progress"
        : resource.status;
      await supabase.from("courses").update({
        progress_percent: value,
        status: newStatus,
      }).eq("id", resource.id);
    }
    load();
  };

  const updateBookPages = async (bookId: string, pagesRead: number) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    const clamped = Math.min(pagesRead, book.total_pages);
    const newStatus =
      book.total_pages > 0 && clamped >= book.total_pages ? "completed"
      : book.status === "want_to_read" && clamped > 0 ? "reading"
      : book.status;
    await supabase.from("books").update({
      pages_read: clamped,
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", bookId);
    load();
  };

  const updateTopicProgress = async (topicId: string, percent: number) => {
    await supabase.from("topics").update({ progress_percent: percent }).eq("id", topicId);
    load();
  };

  const deleteResource = async (resource: Resource) => {
    if (resource.source === "books") {
      await supabase.from("notes").delete().eq("title", `book:${resource.id}`);
      await supabase.from("books").delete().eq("id", resource.id);
    } else {
      await supabase.from("notes").delete().eq("course_id", resource.id);
      await supabase.from("courses").delete().eq("id", resource.id);
    }
    load();
  };

  const deleteTopic = async (topicId: string) => {
    await supabase.from("notes").delete().eq("topic_id", topicId);
    await supabase.from("topics").delete().eq("id", topicId);
    load();
  };

  const addTopic = async (name: string, category: string) => {
    if (!user) return;
    await supabase.from("topics").insert({ user_id: user.id, name, category });
    setShowAddTopic(false);
    load();
  };

  const saveNote = async () => {
    if (!user || !noteInput.trim()) return;
    if (activeNoteResource) {
      if (activeNoteResource.source === "books") {
        await supabase.from("notes").insert({
          user_id: user.id,
          title: `book:${activeNoteResource.id}`,
          content: noteInput.trim(),
          course_id: null,
          topic_id: null,
        });
      } else {
        await supabase.from("notes").insert({
          user_id: user.id,
          title: noteTitleInput.trim() || `Note for ${activeNoteResource.title}`,
          content: noteInput.trim(),
          course_id: activeNoteResource.id,
          topic_id: null,
        });
      }
    } else if (activeNoteTopic) {
      await supabase.from("notes").insert({
        user_id: user.id,
        title: noteTitleInput.trim() || `Note on ${activeNoteTopic.name}`,
        content: noteInput.trim(),
        course_id: null,
        topic_id: activeNoteTopic.id,
      });
    }
    setNoteInput("");
    setNoteTitleInput("");
    toast({ title: "Note saved ✍️" });
    load();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    load();
  };

  // ── Render ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <h1 className="text-2xl font-bold">Knowledge</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search resources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-44 sm:w-56 text-sm"
            />
          </div>
          <Button size="sm" onClick={() => setAddModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && <KnowledgeStatsBar stats={stats} />}

      {/* Currently learning */}
      <CurrentlyLearningBar resources={activeResources} />

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="library" className="gap-1.5">
            <Library className="h-3.5 w-3.5" />
            Library
            {resources.length > 0 && (
              <span className="text-xs opacity-60 ml-0.5">({resources.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Topics
            {topics.length > 0 && (
              <span className="text-xs opacity-60 ml-0.5">({topics.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scholars" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Scholars
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="h-3.5 w-3.5" />
            Notes
            {stats.noteCount > 0 && (
              <span className="text-xs opacity-60 ml-0.5">({stats.noteCount})</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Library ── */}
        <TabsContent value="library" className="space-y-4 mt-4">
          {/* Filter + sort row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {TYPE_FILTERS.map((f) => {
                const Icon = f.icon;
                const count = f.value === "all"
                  ? resources.length
                  : resources.filter((r) => r.type === f.value).length;
                if (f.value !== "all" && count === 0) return null;
                return (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={typeFilter === f.value ? "default" : "outline"}
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setTypeFilter(f.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {f.label}
                    <span className="opacity-60">({count})</span>
                  </Button>
                );
              })}
            </div>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
                <SelectItem value="alpha">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Library className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {searchQuery
                  ? "No resources match your search."
                  : typeFilter !== "all"
                    ? `No ${TYPE_CONFIG[typeFilter as ResourceType]?.label ?? ""} resources yet.`
                    : "No resources yet. Click 'Add Resource' to get started."}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  noteCount={notesForResource(resource).length}
                  searchQuery={searchQuery}
                  onProgressChange={updateProgress}
                  onPageChange={updateBookPages}
                  onOpenNotes={() => setActiveNoteResource(resource)}
                  onDelete={() => deleteResource(resource)}
                />
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* ── Topics ── */}
        <TabsContent value="topics" className="space-y-4 mt-4">
          <Button size="sm" onClick={() => setShowAddTopic(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Topic
          </Button>
          {showAddTopic && (
            <AddTopicForm
              topics={topics}
              onAdd={addTopic}
              onCancel={() => setShowAddTopic(false)}
            />
          )}
          {topics.length === 0 && !showAddTopic && (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No topics yet. Add a topic to organise your resources.</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                resourceCount={resources.filter((r) => r.topicId === t.id).length}
                noteCount={notesForTopic(t.id).length}
                onProgressChange={updateTopicProgress}
                onOpenNotes={() => setActiveNoteTopic(t)}
                onDelete={() => deleteTopic(t.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Scholars ── */}
        <TabsContent value="scholars" className="mt-4">
          <ScholarsTab resources={resources} notes={notes} />
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes" className="mt-4">
          <NotesTab
            notes={notes}
            resources={resources}
            topics={topics}
            searchQuery={searchQuery}
            onDelete={deleteNote}
          />
        </TabsContent>
      </Tabs>

      {/* Add Resource Modal */}
      <AddResourceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        topics={topics}
        onSuccess={() => { setAddModalOpen(false); load(); }}
      />

      {/* Notes Dialog */}
      <NotesDialog
        resource={activeNoteResource}
        topic={activeNoteTopic}
        notes={notes}
        noteInput={noteInput}
        setNoteInput={setNoteInput}
        noteTitleInput={noteTitleInput}
        setNoteTitleInput={setNoteTitleInput}
        onSave={saveNote}
        onDelete={deleteNote}
        onClose={() => { setActiveNoteResource(null); setActiveNoteTopic(null); }}
      />
    </div>
  );
};

export default Knowledge;
