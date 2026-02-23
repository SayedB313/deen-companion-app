import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, BookOpen, GraduationCap, FileText, Trash2, StickyNote, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { value: "aqeedah", label: "Aqeedah" },
  { value: "usul_al_fiqh", label: "Usul al-Fiqh" },
  { value: "fiqh", label: "Fiqh" },
  { value: "seerah", label: "Seerah" },
  { value: "hadith_sciences", label: "Hadith Sciences" },
  { value: "tafsir", label: "Tafsir" },
  { value: "arabic", label: "Arabic" },
  { value: "general", label: "General" },
];

const bookStatuses = [
  { value: "want_to_read", label: "Want to Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
];

const Knowledge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [noteContent, setNoteContent] = useState("");

  // Form states
  const [topicForm, setTopicForm] = useState({ name: "", category: "general" });
  const [courseForm, setCourseForm] = useState({ name: "", instructor: "", topic_id: "", status: "not_started" });
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "", total_pages: 0, status: "want_to_read" });

  const load = async () => {
    if (!user) return;
    const [t, c, b, n] = await Promise.all([
      supabase.from("topics").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("courses").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("books").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (t.data) setTopics(t.data);
    if (c.data) setCourses(c.data);
    if (b.data) setBooks(b.data);
    if (n.data) setNotes(n.data);
  };

  useEffect(() => { load(); }, [user]);

  const addTopic = async () => {
    if (!user || !topicForm.name) return;
    await supabase.from("topics").insert({ user_id: user.id, ...topicForm });
    setTopicForm({ name: "", category: "general" });
    setShowAddTopic(false);
    load();
  };

  const addCourse = async () => {
    if (!user || !courseForm.name) return;
    await supabase.from("courses").insert({
      user_id: user.id,
      name: courseForm.name,
      instructor: courseForm.instructor || null,
      topic_id: courseForm.topic_id || null,
      status: courseForm.status,
    });
    setCourseForm({ name: "", instructor: "", topic_id: "", status: "not_started" });
    setShowAddCourse(false);
    load();
  };

  const addBook = async () => {
    if (!user || !bookForm.title) return;
    await supabase.from("books").insert({ user_id: user.id, ...bookForm });
    setBookForm({ title: "", author: "", category: "", total_pages: 0, status: "want_to_read" });
    setShowAddBook(false);
    load();
  };

  const updateBookPages = async (bookId: string, pages: number) => {
    const book = books.find(b => b.id === bookId);
    const newStatus = book && book.total_pages > 0 && pages >= book.total_pages ? "completed" : undefined;
    await supabase.from("books").update({
      pages_read: pages,
      updated_at: new Date().toISOString(),
      ...(newStatus ? { status: newStatus } : {}),
    }).eq("id", bookId);
    load();
  };

  const deleteBook = async (id: string) => {
    await supabase.from("books").delete().eq("id", id);
    load();
  };

  const addNote = async () => {
    if (!user || !selectedBook || !noteContent.trim()) return;
    await supabase.from("notes").insert({
      user_id: user.id,
      title: `Note - ${selectedBook.title}`,
      content: noteContent.trim(),
      course_id: null,
      topic_id: null,
    });
    setNoteContent("");
    toast({ title: "Note saved ✍️" });
    load();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    load();
  };

  // Currently reading/learning
  const activeBooks = books.filter(b => b.status === "reading");
  const activeCourses = courses.filter(c => c.status === "in_progress");

  // Category stats
  const categoryStats = categories.map(cat => ({
    ...cat,
    count: books.filter(b => b.category === cat.value).length,
    completed: books.filter(b => b.category === cat.value && b.status === "completed").length,
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Knowledge</h1>

      {/* Currently Learning Spotlight */}
      {(activeBooks.length > 0 || activeCourses.length > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" /> Currently Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeBooks.map(b => (
                <Badge key={b.id} variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" /> {b.title}
                  {b.total_pages > 0 && <span className="text-muted-foreground">· p.{b.pages_read}/{b.total_pages}</span>}
                </Badge>
              ))}
              {activeCourses.map(c => (
                <Badge key={c.id} variant="secondary" className="gap-1">
                  <GraduationCap className="h-3 w-3" /> {c.name} · {c.progress_percent}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category stats */}
      {categoryStats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categoryStats.map(c => (
            <Badge key={c.value} variant="outline" className="text-xs">
              {c.label}: {c.completed}/{c.count} books
            </Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books"><BookOpen className="h-4 w-4 mr-1" /> Books</TabsTrigger>
          <TabsTrigger value="topics"><GraduationCap className="h-4 w-4 mr-1" /> Topics</TabsTrigger>
          <TabsTrigger value="courses"><FileText className="h-4 w-4 mr-1" /> Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4">
          <Button size="sm" onClick={() => setShowAddBook(true)}><Plus className="h-4 w-4 mr-1" /> Add Book</Button>
          {showAddBook && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Input placeholder="Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
                <Input placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
                <Select value={bookForm.category || "general"} onValueChange={(v) => setBookForm({ ...bookForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Total pages" value={bookForm.total_pages || ""} onChange={(e) => setBookForm({ ...bookForm, total_pages: parseInt(e.target.value) || 0 })} />
                <Select value={bookForm.status} onValueChange={(v) => setBookForm({ ...bookForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{bookStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addBook}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddBook(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <Card key={b.id} className="group">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{b.title}</CardTitle>
                    {b.author && <p className="text-sm text-muted-foreground">{b.author}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedBook(b)}>
                      <StickyNote className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteBook(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={b.status === "completed" ? "default" : "secondary"}>
                      {bookStatuses.find((s) => s.value === b.status)?.label}
                    </Badge>
                    {b.category && (
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === b.category)?.label || b.category}
                      </Badge>
                    )}
                  </div>
                  {b.total_pages > 0 && (
                    <>
                      <Progress value={(b.pages_read / b.total_pages) * 100} className="h-2" />
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          className="h-8 w-20"
                          value={b.pages_read}
                          onChange={(e) => updateBookPages(b.id, parseInt(e.target.value) || 0)}
                          max={b.total_pages}
                        />
                        <span className="text-xs text-muted-foreground">/ {b.total_pages} pages ({Math.round((b.pages_read / b.total_pages) * 100)}%)</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Button size="sm" onClick={() => setShowAddTopic(true)}><Plus className="h-4 w-4 mr-1" /> Add Topic</Button>
          {showAddTopic && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Input placeholder="Topic name" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} />
                <Select value={topicForm.category} onValueChange={(v) => setTopicForm({ ...topicForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addTopic}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddTopic(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{categories.find((c) => c.value === t.category)?.label}</Badge>
                  <Progress value={t.progress_percent} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{t.progress_percent}% complete</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Button size="sm" onClick={() => setShowAddCourse(true)}><Plus className="h-4 w-4 mr-1" /> Add Course</Button>
          {showAddCourse && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Input placeholder="Course name" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} />
                <Input placeholder="Instructor" value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCourse}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddCourse(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {c.instructor && <p className="text-sm text-muted-foreground">{c.instructor}</p>}
                  <Badge variant={c.status === "completed" ? "default" : "secondary"} className="mt-1">{c.status.replace("_", " ")}</Badge>
                  <Progress value={c.progress_percent} className="mt-2 h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Book Notes Dialog */}
      <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-primary" />
                  Notes: {selectedBook.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note, highlight, or key takeaway..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <Button size="sm" onClick={addNote} disabled={!noteContent.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Save Note
                </Button>
                <div className="space-y-2">
                  {notes
                    .filter(n => n.title === `Note - ${selectedBook.title}`)
                    .map(n => (
                      <div key={n.id} className="p-3 rounded-lg bg-muted/50 border border-border/50 group">
                        <div className="flex justify-between items-start">
                          <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteNote(n.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Knowledge;
