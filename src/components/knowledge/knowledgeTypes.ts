// Shared types, constants, and helpers for the Knowledge feature.
// Imported by Knowledge.tsx, ResourceCard.tsx, and AddResourceModal.tsx
// to avoid circular dependencies.

// ── Resource types ─────────────────────────────────────────────────────────────

export type ResourceType = "book" | "article" | "course" | "youtube" | "podcast";

export interface Resource {
  id: string;
  source: "books" | "courses";
  type: ResourceType;
  title: string;
  creator: string;
  category: string | null;
  progress: number;
  status: string;
  topicId: string | null;
  createdAt: string;
  totalPages?: number;
  pagesRead?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _raw: any;
}

// ── DB row shapes ──────────────────────────────────────────────────────────────

export interface BookRow {
  id: string; user_id: string; title: string; author: string | null;
  category: string | null; total_pages: number; pages_read: number;
  status: string; created_at: string; updated_at: string;
}

export interface CourseRow {
  id: string; user_id: string; name: string; instructor: string | null;
  status: string; progress_percent: number; topic_id: string | null; created_at: string;
}

export interface TopicRow {
  id: string; user_id: string; name: string; category: string;
  progress_percent: number; created_at: string;
}

export interface NoteRow {
  id: string; user_id: string; title: string; content: string | null;
  course_id: string | null; topic_id: string | null; created_at: string; updated_at: string;
}

// ── Category constants ─────────────────────────────────────────────────────────

export const CATEGORIES = [
  { value: "aqeedah",          label: "Aqeedah" },
  { value: "usul_al_fiqh",     label: "Usul al-Fiqh" },
  { value: "fiqh",             label: "Fiqh" },
  { value: "seerah",           label: "Seerah" },
  { value: "hadith_sciences",  label: "Hadith Sciences" },
  { value: "tafsir",           label: "Tafsir" },
  { value: "arabic",           label: "Arabic" },
  { value: "general",          label: "General" },
  { value: "article",          label: "Article" },
];

// ── Instructor encoding helpers ────────────────────────────────────────────────

/** Encode resource type into the courses.instructor field */
export function encodeInstructor(
  type: "course" | "youtube" | "podcast",
  name: string
): string {
  const prefix = type === "youtube" ? "[YT]" : type === "podcast" ? "[POD]" : "[COURSE]";
  return `${prefix}||${name}`;
}

/** Parse resource type out of courses.instructor field */
export function parseInstructor(
  raw: string | null
): { type: ResourceType; displayName: string } {
  if (!raw) return { type: "course", displayName: "" };
  const yt = raw.match(/^\[YT\]\|\|(.*)$/);
  if (yt) return { type: "youtube", displayName: yt[1] };
  const pod = raw.match(/^\[POD\]\|\|(.*)$/);
  if (pod) return { type: "podcast", displayName: pod[1] };
  const course = raw.match(/^\[COURSE\]\|\|(.*)$/);
  if (course) return { type: "course", displayName: course[1] };
  return { type: "course", displayName: raw };
}

/** Normalise a books row into a unified Resource */
export function normaliseBook(b: BookRow): Resource {
  const isArticle = b.category === "article";
  const progress = isArticle
    ? b.status === "completed" ? 100 : 0
    : b.total_pages > 0
      ? Math.round((b.pages_read / b.total_pages) * 100)
      : b.status === "completed" ? 100 : 0;
  return {
    id: b.id, source: "books",
    type: isArticle ? "article" : "book",
    title: b.title, creator: b.author ?? "",
    category: b.category, progress,
    status: b.status, topicId: null,
    totalPages: b.total_pages, pagesRead: b.pages_read,
    createdAt: b.created_at, _raw: b,
  };
}

/** Normalise a courses row into a unified Resource */
export function normaliseCourse(c: CourseRow): Resource {
  const { type, displayName } = parseInstructor(c.instructor);
  return {
    id: c.id, source: "courses",
    type, title: c.name,
    creator: displayName, category: null,
    progress: c.progress_percent, status: c.status,
    topicId: c.topic_id, createdAt: c.created_at, _raw: c,
  };
}
