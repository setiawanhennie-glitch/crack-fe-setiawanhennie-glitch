"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  BookOpen,
  X,
  Pencil,
  Trash2,
  FileUp,
  Camera,
  Gamepad2,
  Heart,
  Timer,
  Users,
} from "lucide-react";
import {
  fetchTeacherMaterials,
  createCourse,
  createLesson,
  extractDocument,
  fetchLesson,
  updateLesson,
  deleteLesson,
  uploadImage,
  createQuiz,
  fetchQuizzes,
  deleteQuiz,
  fetchTeacherClasses,
  updateCourseAssignments,
  deleteCourse,
  fetchQuizForEdit,
  updateQuiz,
} from "@/lib/auth-client";
import { useToast } from "@/components/UI/toast";

const EMOJIS = ["🔢", "🔬", "📚", "🌍", "💻", "🏛️", "⚽"];
const COLORS = [
  "bg-blue-500/10",
  "bg-emerald-500/10",
  "bg-orange-500/10",
  "bg-purple-500/10",
  "bg-rose-500/10",
  "bg-amber-500/10",
];

export default function TeacherMaterialsPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Create modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"course" | "lesson">("course");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    emoji: "📚",
    color: COLORS[0],
    classes: [] as string[],
  });
  const [schoolClasses, setSchoolClasses] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState<null | { courseId: string; classes: string[] }>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [lessonForm, setLessonForm] = useState({ courseId: "", title: "", content: "" });

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({ id: "", title: "", content: "" });

  // Quiz builder state
  const [quizEditId, setQuizEditId] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizError, setQuizError] = useState("");
  const emptyQuestion = {
    type: "MULTIPLE_CHOICE",
    prompt: "",
    options: ["", "", "", ""],
    answer: "",
    pairs: [{ left: "", right: "" }],
  };
  const [quizForm, setQuizForm] = useState({
    title: "",
    lessonId: "",
    timeLimit: "",
    lives: "3",
    xpReward: "50",
    questions: [{ ...emptyQuestion }],
  });

  const load = () => fetchTeacherMaterials().then(setCourses).catch(console.error);
  const loadQuizzes = () => fetchQuizzes().then(setQuizzes).catch(console.error);

  useEffect(() => {
    load();
    loadQuizzes();
    fetchTeacherClasses()
      .then((list) => setSchoolClasses(list.map((c: any) => c.className)))
      .catch(console.error);
  }, []);

  /* ---------- Quiz builder helpers ---------- */
  const updateQuestion = (i: number, patch: any) =>
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q: any, idx: number) => (idx === i ? { ...q, ...patch } : q)),
    }));

  const addQuestion = () =>
    setQuizForm((prev) => ({ ...prev, questions: [...prev.questions, { ...emptyQuestion }] }));

  const removeQuestion = (i: number) =>
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_: any, idx: number) => idx !== i),
    }));

  const addOption = (qi: number) =>
    updateQuestion(qi, { options: [...quizForm.questions[qi].options, ""] });

  const removeOption = (qi: number, oi: number) =>
    updateQuestion(qi, {
      options: quizForm.questions[qi].options.filter((_: string, i2: number) => i2 !== oi),
    });

  const updatePair = (qi: number, pi: number, side: "left" | "right", value: string) =>
    updateQuestion(qi, {
      pairs: quizForm.questions[qi].pairs.map((p: any, i2: number) =>
        i2 === pi ? { ...p, [side]: value } : p
      ),
    });

  const addPair = (qi: number) =>
    updateQuestion(qi, { pairs: [...quizForm.questions[qi].pairs, { left: "", right: "" }] });

  const removePair = (qi: number, pi: number) =>
    updateQuestion(qi, {
      pairs: quizForm.questions[qi].pairs.filter((_: any, i2: number) => i2 !== pi),
    });

  const closeQuiz = () => {
    setQuizOpen(false);
    setQuizEditId(null);
  };

  const openQuizCreate = () => {
    setQuizEditId(null);
    setQuizError("");
    setQuizForm({ title: "", lessonId: "", timeLimit: "", lives: "3", xpReward: "50", questions: [{ ...emptyQuestion }] });
    setQuizOpen(true);
  };

  const openQuizEdit = async (id: string) => {
    setQuizOpen(true);
    setQuizLoading(true);
    setQuizError("");
    try {
      const quiz = await fetchQuizForEdit(id);
      setQuizEditId(id);
      setQuizForm({
        title: quiz.title,
        lessonId: quiz.lessonId || "",
        timeLimit: quiz.timeLimit != null ? String(quiz.timeLimit) : "",
        lives: quiz.lives != null ? String(quiz.lives) : "",
        xpReward: String(quiz.xpReward),
        questions: quiz.questions.map((q: any) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options?.length ? q.options : ["", "", "", ""],
          answer: q.answer,
          pairs: q.pairs ?? [{ left: "", right: "" }],
        })),
      });
    } catch (e: any) {
      setQuizError(e.message);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    setQuizSaving(true);
    setQuizError("");
    try {
      if (!quizForm.title.trim()) throw new Error("Judul kuis wajib diisi");
      const payload = {
        title: quizForm.title,
        lessonId: quizForm.lessonId || undefined,
        timeLimit: quizForm.timeLimit ? Number(quizForm.timeLimit) : null,
        lives: quizForm.lives ? Number(quizForm.lives) : null,
        xpReward: Number(quizForm.xpReward) || 50,
        questions: quizForm.questions.map((q: any) => ({
          type: q.type,
          prompt: q.prompt,
          options:
            q.type === "TRUE_FALSE" || q.type === "MULTIPLE_CHOICE" || q.type === "ORDERING"
              ? q.options.filter((o: string) => o.trim())
              : [],
          answer: q.type === "ORDERING" || q.type === "MATCHING" ? "" : q.answer,
          pairs: q.type === "MATCHING" ? q.pairs : undefined,
        })),
      };
      if (quizEditId) await updateQuiz(quizEditId, payload);
      else await createQuiz(payload);
      setQuizForm({ title: "", lessonId: "", timeLimit: "", lives: "3", xpReward: "50", questions: [{ ...emptyQuestion }] });
      setQuizEditId(null);
      await loadQuizzes();
      setQuizOpen(false);
    } catch (e: any) {
      setQuizError(e.message);
    } finally {
      setQuizSaving(false);
    }
  };

  const handleQuizDelete = async (id: string) => {
    if (!window.confirm("Hapus kuis ini?")) return;
    try {
      await deleteQuiz(id);
      await loadQuizzes();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

    const handleCourseDelete = async (id: string) => {
    if (!window.confirm("Hapus materi ini? Semua pelajaran di dalamnya juga akan terhapus.")) return;
    try {
      await deleteCourse(id);
      await load();
      await loadQuizzes();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const handleLessonDelete = async (id: string) => {
    if (!window.confirm("Hapus pelajaran ini?")) return;
    try {
      await deleteLesson(id);
      await load();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  // Flat list of all lessons across courses (for the Materi section)
  const allLessons = courses.flatMap((c: any) =>
    c.lessons.map((l: any) => ({ ...l, courseTitle: c.title, courseEmoji: c.emoji }))
  );

  /* ---------- Create ---------- */
  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      if (mode === "course") {
        if (!courseForm.title.trim() || !courseForm.description.trim()) {
          throw new Error("Judul dan deskripsi wajib diisi");
        }
        await createCourse(courseForm);
        setCourseForm({ title: "", description: "", emoji: "📚", color: COLORS[0], classes: [] });
      } else {
        if (!lessonForm.courseId || !lessonForm.title.trim() || !lessonForm.content.trim()) {
          throw new Error("Semua field wajib diisi");
        }
        await createLesson(lessonForm.courseId, {
          title: lessonForm.title,
          content: lessonForm.content,
        });
        setLessonForm({ courseId: "", title: "", content: "" });
      }
      await load();
      setOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Document & image upload ---------- */
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError("");
    try {
      const { text } = await extractDocument(file);
      setLessonForm((prev) => ({
        ...prev,
        content: text,
        title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { url } = await uploadImage(file);
      const markdown = `\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n`;
      if (target === "create") {
        setLessonForm((prev) => ({ ...prev, content: prev.content + markdown }));
      } else {
        setEditForm((prev) => ({ ...prev, content: prev.content + markdown }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  /* ---------- Edit / Delete lesson ---------- */
  const openLesson = async (id: string) => {
    setEditOpen(true);
    setEditLoading(true);
    setEditError("");
    try {
      const lesson = await fetchLesson(id);
      setEditForm({ id: lesson.id, title: lesson.title, content: lesson.content });
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setEditError("Judul dan isi wajib diisi");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      await updateLesson(editForm.id, { title: editForm.title, content: editForm.content });
      setEditOpen(false);
      await load();
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditDelete = async () => {
    if (!window.confirm("Hapus pelajaran ini? Tindakan tidak dapat dibatalkan.")) return;
    setEditSaving(true);
    try {
      await deleteLesson(editForm.id);
      setEditOpen(false);
      await load();
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Materi & Kuis</h1>
          <p className="text-muted-foreground mt-1">Kelola materi pelajaran dan kuis Anda</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Buat Materi
          </button>
          <button
            onClick={openQuizCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
          >
            <Gamepad2 className="h-4 w-4" />
            Buat Kuis
          </button>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${course.color}`}>
                {course.emoji}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setAssignOpen({
                      courseId: course.id,
                      classes: (course.assignments || []).map((a: any) => a.className),
                    })
                  }
                  title="Atur kelas tujuan"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCourseDelete(course.id)}
                  title="Hapus materi"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setExpanded(expanded === course.id ? null : course.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {expanded === course.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="mt-3 font-heading text-lg font-extrabold">{course.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessons.length} pelajaran
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {course.assignments?.length
                ? course.assignments.map((a: any) => `Kelas ${a.className}`).join(", ")
                : "Semua kelas"}
            </p>

            {expanded === course.id && (
              <div className="mt-4 space-y-1 border-t border-border pt-3">
                {course.lessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada pelajaran.</p>
                ) : (
                  course.lessons.map((l: any, i: number) => (
                    <button
                      key={l.id}
                      onClick={() => openLesson(l.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium">{l.title}</span>
                      <Pencil className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Materi (lessons) list */}
      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-extrabold">
          <BookOpen className="h-5 w-5 text-primary" />
          Materi ({allLessons.length})
        </h2>
        {allLessons.length === 0 ? (
          <div className="rounded-xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-sm text-muted-foreground">
              Belum ada materi. Klik "Buat Materi" untuk membuat pelajaran pertama!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {allLessons.map((l: any) => (
              <div key={l.id} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-extrabold">{l.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {l.courseEmoji} {l.courseTitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openLesson(l.id)}
                      title="Edit materi"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleLessonDelete(l.id)}
                      title="Hapus materi"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz list */}
      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-extrabold">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Kuis ({quizzes.length})
        </h2>
        {quizzes.length === 0 ? (
          <div className="rounded-xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-sm text-muted-foreground">
              Belum ada kuis. Klik "Buat Kuis" untuk membuat kuis pertama Anda!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {quizzes.map((q) => (
              <div key={q.id} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-heading text-base font-extrabold">{q.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {q.lesson ? `📖 ${q.lesson.title}` : "Tanpa pelajaran"} • {q._count.questions} pertanyaan
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button 
                      onClick={() => openQuizEdit(q.id)} 
                      title="Edit kuis" 
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                      onClick={() => handleQuizDelete(q.id)} 
                      title="Hapus kuis" 
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-purple-600">+{q.xpReward} XP</span>
                  {q.timeLimit && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-600">
                      <Timer className="h-3 w-3" /> {q.timeLimit}s/soal
                    </span>
                  )}
                  {q.lives && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-600">
                      <Heart className="h-3 w-3" /> {q.lives} nyawa
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= CREATE MODAL ================= */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold">Buat Materi</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <button
                onClick={() => setMode("course")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  mode === "course" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Materi Baru
              </button>
              <button
                onClick={() => setMode("lesson")}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  mode === "lesson" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pelajaran Baru
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-600">{error}</div>
            )}

            {mode === "course" ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Judul Materi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Matematika Dasar"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Deskripsi</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan singkat tentang Materi ini..."
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Ikon</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setCourseForm({ ...courseForm, emoji: e })}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                          courseForm.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Warna</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCourseForm({ ...courseForm, color: c })}
                        className={`h-8 w-8 rounded-full ${c} transition-all ${
                          courseForm.color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Kelas tujuan</label>
                  <div className="flex flex-wrap gap-2">
                    {schoolClasses.map((cls) => {
                      const on = courseForm.classes.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() =>
                            setCourseForm({
                              ...courseForm,
                              classes: on
                                ? courseForm.classes.filter((c) => c !== cls)
                                : [...courseForm.classes, cls],
                            })
                          }
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                            on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          Kelas {cls}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Tidak pilih apa-apa = Materi untuk seluruh sekolah.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Materi</label>
                  <select
                    value={lessonForm.courseId}
                    onChange={(e) => setLessonForm({ ...lessonForm, courseId: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">— Pilih Materi —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Judul Pelajaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengenalan Aljabar"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Isi Materi</label>
                  <textarea
                    rows={6}
                    placeholder="Tulis materi pelajaran di sini, atau unggah dokumen di bawah..."
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted ${
                        extracting ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      {extracting ? "Mengekstrak teks..." : "Unggah PDF / Word / TXT"}
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        className="hidden"
                        onChange={handleFile}
                        disabled={extracting}
                      />
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted ${
                        uploadingImage ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {uploadingImage ? "Mengunggah..." : "Sisipkan Gambar"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImage(e, "create")}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">Teks diisi otomatis & tetap bisa diedit</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || extracting}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUIZ BUILDER MODAL ================= */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeQuiz} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold">{quizEditId ? "✏️ Edit Kuis" : "🎮 Buat Kuis"}</h2>
              <button onClick={closeQuiz} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {quizError && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-600">{quizError}</div>
            )}

            {quizLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Memuat kuis...</p>
            ) : (
              <>
            {/* Quiz settings */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Judul Kuis</label>
                <input
                  type="text"
                  placeholder="Contoh: Kuis Aljabar"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Pelajaran (opsional)</label>
                <select
                  value={quizForm.lessonId}
                  onChange={(e) => setQuizForm({ ...quizForm, lessonId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">— Tidak terikat pelajaran —</option>
                  {courses.flatMap((c) =>
                    c.lessons.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {c.emoji} {c.title} • {l.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold">
                    <Timer className="h-3.5 w-3.5" /> Detik/Soal
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Kosong = santai"
                    value={quizForm.timeLimit}
                    onChange={(e) => setQuizForm({ ...quizForm, timeLimit: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold">
                    <Heart className="h-3.5 w-3.5" /> Nyawa
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Kosong = ∞"
                    value={quizForm.lives}
                    onChange={(e) => setQuizForm({ ...quizForm, lives: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">XP Reward</label>
                  <input
                    type="number"
                    min={0}
                    value={quizForm.xpReward}
                    onChange={(e) => setQuizForm({ ...quizForm, xpReward: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="mt-6 space-y-4">
              {quizForm.questions.map((q: any, i: number) => (
                <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold">Pertanyaan {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(i, {
                            type: e.target.value,
                            options: e.target.value === "TRUE_FALSE" ? ["Benar", "Salah"] : ["", "", "", ""],
                            answer: "",
                            pairs: e.target.value === "MATCHING" ? [{ left: "", right: "" }] : q.pairs,
                          })
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                        <option value="TRUE_FALSE">Benar / Salah</option>
                        <option value="FILL_BLANK">Isian Singkat</option>
                        <option value="MATCHING">Menjodohkan</option>
                        <option value="ORDERING">Urutkan</option>
                        <option value="WORD_SCRAMBLE">Tebak Kata</option>
                      </select>
                      {quizForm.questions.length > 1 && (
                        <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Tulis pertanyaan..."
                    value={q.prompt}
                    onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                    className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />

                  {q.type === "FILL_BLANK" || q.type === "WORD_SCRAMBLE" ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                        {q.type === "WORD_SCRAMBLE" ? "Kata jawaban (huruf akan diacak untuk murid)" : "Jawaban benar"}
                      </label>
                      <input
                        type="text"
                        placeholder={q.type === "WORD_SCRAMBLE" ? "Contoh: fotosintesis" : "Contoh: Jakarta"}
                        value={q.answer}
                        onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ) : q.type === "ORDERING" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Tulis item dalam URUTAN BENAR — murid melihat versi acak.</p>
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="w-5 text-xs font-bold text-muted-foreground">{oi + 1}.</span>
                          <input
                            type="text"
                            placeholder={`Item ${oi + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = q.options.map((o: string, idx: number) => (idx === oi ? e.target.value : o));
                              updateQuestion(i, { options: newOptions });
                            }}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button
                            onClick={() => removeOption(i, oi)}
                            disabled={q.options.length <= 3}
                            className="text-muted-foreground hover:text-red-500 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addOption(i)} className="text-xs font-semibold text-primary hover:underline">
                        + Tambah item
                      </button>
                    </div>
                  ) : q.type === "MATCHING" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Kiri = istilah, Kanan = pasangan (kanan akan diacak untuk murid).</p>
                      {q.pairs.map((p: any, pi: number) => (
                        <div key={pi} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Kiri (istilah)"
                            value={p.left}
                            onChange={(e) => updatePair(i, pi, "left", e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <input
                            type="text"
                            placeholder="Kanan (arti)"
                            value={p.right}
                            onChange={(e) => updatePair(i, pi, "right", e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button
                            onClick={() => removePair(i, pi)}
                            disabled={q.pairs.length <= 2}
                            className="text-muted-foreground hover:text-red-500 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addPair(i)} className="text-xs font-semibold text-primary hover:underline">
                        + Tambah pasangan
                      </button>
                    </div>
                  ) : q.type === "TRUE_FALSE" ? (
                    <div className="space-y-2">
                      {["Benar", "Salah"].map((opt) => (
                        <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={q.answer === opt}
                            onChange={() => updateQuestion(i, { answer: opt })}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                      <p className="text-xs text-muted-foreground">Tandai pilihan untuk menandakan jawaban benar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={q.answer === opt && opt !== ""}
                            onChange={() => updateQuestion(i, { answer: opt })}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="w-5 text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                          <input
                            type="text"
                            placeholder={`Pilihan ${String.fromCharCode(65 + oi)}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = q.options.map((o: string, idx: number) => (idx === oi ? e.target.value : o));
                              const newAnswer = q.answer === q.options[oi] ? e.target.value : q.answer;
                              updateQuestion(i, { options: newOptions, answer: newAnswer });
                            }}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button
                            onClick={() => removeOption(i, oi)}
                            disabled={q.options.length <= 2}
                            className="text-muted-foreground hover:text-red-500 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addOption(i)} className="text-xs font-semibold text-primary hover:underline">
                        + Tambah opsi
                      </button>
                      <p className="text-xs text-muted-foreground">Tandai pilihan untuk menandakan jawaban benar</p>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Tambah Pertanyaan
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeQuiz}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Batal
              </button>
              <button
                onClick={handleQuizSubmit}
                disabled={quizSaving}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {quizSaving ? "Menyimpan..." : quizEditId ? "Simpan Perubahan" : "Simpan Kuis"}
              </button>
            </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditOpen(false)} />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold">Edit Pelajaran</h2>
              <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-600">{editError}</div>
            )}

            {editLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Memuat pelajaran...</p>
            ) : (
              <>
                <div className="space-y-4 overflow-y-auto">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Judul Pelajaran</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Isi Materi</label>
                    <textarea
                      rows={12}
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted ${
                      uploadingImage ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {uploadingImage ? "Mengunggah..." : "Sisipkan Gambar"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImage(e, "edit")}
                      disabled={uploadingImage}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">Gambar disisipkan ke isi materi</span>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={handleEditDelete}
                    disabled={editSaving}
                    className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={editSaving}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= ASSIGN CLASSES MODAL ================= */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssignOpen(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h2 className="mb-4 font-heading text-lg font-extrabold">Atur kelas tujuan</h2>
            <div className="flex flex-wrap gap-2">
              {schoolClasses.map((cls) => {
                const on = assignOpen.classes.includes(cls);
                return (
                  <button
                    key={cls}
                    onClick={() =>
                      setAssignOpen({
                        ...assignOpen,
                        classes: on ? assignOpen.classes.filter((c) => c !== cls) : [...assignOpen.classes, cls],
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    Kelas {cls}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Kosong = seluruh sekolah bisa melihat Materi ini.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAssignOpen(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                disabled={assignSaving}
                onClick={async () => {
                  setAssignSaving(true);
                  try {
                    await updateCourseAssignments(assignOpen.courseId, assignOpen.classes);
                    setAssignOpen(null);
                    await load();
                  } catch (e: any) {
                    toast(e.message, "error");
                  } finally {
                    setAssignSaving(false);
                  }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {assignSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}