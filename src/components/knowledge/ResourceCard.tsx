import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, GraduationCap, FileText, Youtube, Mic,
  StickyNote, Trash2, ChevronDown, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/components/knowledge/knowledgeTypes";
import type { Resource, ResourceType } from "@/components/knowledge/knowledgeTypes";

// ── Type configuration ────────────────────────────────────────────────────────

export const TYPE_CONFIG: Record<
  ResourceType,
  { icon: React.ElementType; label: string; colorClass: string }
> = {
  book:    { icon: BookOpen,      label: "Book",         colorClass: "text-blue-400" },
  article: { icon: FileText,      label: "Article",      colorClass: "text-yellow-400" },
  course:  { icon: GraduationCap, label: "Course",       colorClass: "text-primary" },
  youtube: { icon: Youtube,       label: "YouTube",      colorClass: "text-red-400" },
  podcast: { icon: Mic,           label: "Podcast",      colorClass: "text-green-400" },
};

// ── Highlighted text helper ───────────────────────────────────────────────────

export function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/25 text-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  want_to_read: "Want to Read",
  reading:      "Reading",
  completed:    "Completed",
  not_started:  "Not Started",
  in_progress:  "In Progress",
};

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "completed") return "default";
  if (status === "reading" || status === "in_progress") return "secondary";
  return "outline";
}

// ── Card animation variant ────────────────────────────────────────────────────

export const cardVariant = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

// ── ResourceCard component ────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: Resource;
  noteCount: number;
  searchQuery?: string;
  onProgressChange: (resource: Resource, value: number) => void;
  onPageChange?: (bookId: string, pages: number) => void;
  onOpenNotes: () => void;
  onDelete: () => void;
}

export function ResourceCard({
  resource,
  noteCount,
  searchQuery = "",
  onProgressChange,
  onPageChange,
  onOpenNotes,
  onDelete,
}: ResourceCardProps) {
  const [showSlider, setShowSlider] = useState(false);
  const [localProgress, setLocalProgress] = useState(resource.progress);

  const cfg = TYPE_CONFIG[resource.type];
  const Icon = cfg.icon;

  const isBook    = resource.source === "books" && resource.type === "book";
  const isArticle = resource.type === "article";
  const hasPagesUI = isBook && (resource.totalPages ?? 0) > 0;
  const isNoPagesBook = isBook && (resource.totalPages ?? 0) === 0;

  const commitProgress = () => {
    onProgressChange(resource, localProgress);
    setShowSlider(false);
  };

  // Keep localProgress in sync if resource prop changes (after parent reload)
  // We only reset if resource.progress diverges significantly from local
  // (simple approach: reset whenever card is re-rendered from outside)
  // This is acceptable because the slider only shows when explicitly opened.

  return (
    <motion.div variants={cardVariant} className="h-full">
      <Card className="group h-full flex flex-col hover:border-primary/40 transition-colors duration-200">
        {/* ── Header: type chip + title + actions ── */}
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            {/* Type badge */}
            <div className={`flex items-center gap-1 ${cfg.colorClass}`}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">{cfg.label}</span>
            </div>
            {/* Title */}
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-card-foreground">
              <HighlightedText text={resource.title} query={searchQuery} />
            </h3>
            {/* Creator */}
            {resource.creator && (
              <p className="text-xs text-muted-foreground truncate">
                by <HighlightedText text={resource.creator} query={searchQuery} />
              </p>
            )}
          </div>

          {/* Action buttons (show on hover) */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onOpenNotes}
              title={`Notes (${noteCount})`}
            >
              <StickyNote className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:text-destructive"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        {/* ── Content: badges + progress ── */}
        <CardContent className="flex-1 flex flex-col justify-between gap-3 pt-0">
          {/* Status + category + notes count */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={statusVariant(resource.status)} className="text-xs">
              {STATUS_LABEL[resource.status] ?? resource.status}
            </Badge>
            {resource.category && resource.type !== "article" && (
              <Badge variant="outline" className="text-xs">
                {CATEGORIES.find((c) => c.value === resource.category)?.label ?? resource.category}
              </Badge>
            )}
            {noteCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1 cursor-pointer" onClick={onOpenNotes}>
                <StickyNote className="h-2.5 w-2.5" />
                {noteCount}
              </Badge>
            )}
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            {/* Article: simple read toggle */}
            {isArticle && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs w-full justify-start gap-1.5"
                onClick={() => onProgressChange(resource, resource.progress === 100 ? 0 : 100)}
              >
                {resource.progress === 100 ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Read</>
                ) : (
                  "Mark as Read"
                )}
              </Button>
            )}

            {/* Book with no pages: mark complete toggle */}
            {isNoPagesBook && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs w-full justify-start gap-1.5"
                onClick={() => onProgressChange(resource, resource.progress === 100 ? 0 : 100)}
              >
                {resource.progress === 100 ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Completed</>
                ) : (
                  "Mark as Complete"
                )}
              </Button>
            )}

            {/* Book with pages: progress bar + page input */}
            {hasPagesUI && (
              <>
                <div className="flex items-center gap-2">
                  <Progress value={resource.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                    {resource.progress}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    className="h-7 w-20 text-xs"
                    value={resource.pagesRead ?? 0}
                    min={0}
                    max={resource.totalPages}
                    onChange={(e) =>
                      onPageChange?.(resource.id, parseInt(e.target.value) || 0)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    / {resource.totalPages} pages
                  </span>
                </div>
              </>
            )}

            {/* Course / YouTube / Podcast: collapsible slider */}
            {!isBook && !isArticle && (
              <>
                <div className="flex items-center gap-2">
                  <Progress value={resource.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                    {resource.progress}%
                  </span>
                </div>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setLocalProgress(resource.progress);
                    setShowSlider((v) => !v);
                  }}
                >
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showSlider ? "rotate-180" : ""}`}
                  />
                  Edit progress
                </button>
                {showSlider && (
                  <div className="flex gap-2 items-center pt-0.5">
                    <Slider
                      value={[localProgress]}
                      onValueChange={([v]) => setLocalProgress(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-7 shrink-0">
                      {localProgress}%
                    </span>
                    <Button size="sm" className="h-7 text-xs px-2 shrink-0" onClick={commitProgress}>
                      Save
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
