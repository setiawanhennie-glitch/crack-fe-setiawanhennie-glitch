"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/UI/button";
import { X, Heart, Zap, Check, X as XIcon, Trophy, ArrowUp, ArrowDown, Timer, Play, BookOpenCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/UI/toast";
import {
  fetchStudentLesson,
  fetchQuizForPlay,
  checkQuizAnswer,
  submitQuiz,
  completeLesson,
} from "@/lib/auth-client";

function LessonContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm md:text-base leading-relaxed">
      {content.split("\n").map((line, i) => {
        const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (m) {
          return <img key={i} src={m[2]} alt={m[1] || "gambar"} className="max-h-96 w-full rounded-xl object-contain ring-1 ring-border" />;
        }
        if (!line.trim()) return null;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudentLessonPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [mode, setMode] = useState<"read" | "quiz" | "results" | "gameover">("read");

  // Quiz state
  const [quiz, setQuiz] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<any>(null);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [correctAnswerText, setCorrectAnswerText] = useState("");
  const [hearts, setHearts] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; answer: string }[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    setLessonId(id);
    if (id) fetchStudentLesson(id).then(setLesson).catch(console.error);
  }, []);

  const q = quiz?.questions?.[step];
  const myProgress = lesson?.progress?.[0];
  const scrambled = useMemo(
    () => (q?.type === "WORD_SCRAMBLE" ? (q.scrambledLetters ?? []) : []),
    [q?.id]
  );
  const rightsPool = useMemo<string[]>(
    () => (q?.type === "MATCHING" ? shuffle(q.pairs.map((p: any) => p.right)) : []),
    [q?.id]
  );

  // Reset per-question state
  useEffect(() => {
    if (!q) return;
    setChecked(null);
    setSecondsLeft(quiz?.timeLimit ?? null);
    if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") setInput(null);
    else if (q.type === "ORDERING") setInput([...q.options]);
    else if (q.type === "MATCHING") setInput(q.pairs.map(() => ""));
    else setInput("");
  }, [step, mode]);

  // Countdown timer
  useEffect(() => {
    if (mode !== "quiz" || secondsLeft == null || checked !== null) return;
    if (secondsLeft <= 0) {
      handleCheck(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s != null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, mode, checked]);

  const currentValue = (): string => {
    if (!q) return "";
    if (q.type === "ORDERING" || q.type === "MATCHING") return JSON.stringify(input ?? []);
    return input ?? "";
  };

  const startQuiz = async () => {
    const quizMeta = lesson?.quizzes?.[0];
    if (!quizMeta) return;
    const full = await fetchQuizForPlay(quizMeta.id);
    setQuiz(full);
    setHearts(full.lives ?? null);
    setStep(0);
    setAnswers([]);
    setResult(null);
    setMode("quiz");
  };

  const handleCheck = async (auto = false) => {
    if (!q || checked !== null || busy) return;
    const value = auto && (input == null || input === "") ? "" : currentValue();
    setBusy(true);
    try {
      const res = await checkQuizAnswer(quiz.id, q.id, value);
      setChecked(res.correct);
      setCorrectAnswerText(res.displayAnswer);
      setAnswers((prev) => [
        ...prev.filter((a) => a.questionId !== q.id),
        { questionId: q.id, answer: value },
      ]);
      if (!res.correct && hearts != null) setHearts((h) => (h != null ? h - 1 : null));
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async () => {
    if (hearts != null && hearts <= 0) {
      setMode("gameover");
      return;
    }
    if (step < quiz.questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      setBusy(true);
      try {
        const res = await submitQuiz(quiz.id, answers);
        setResult(res);
        setMode("results");
      } catch (e: any) {
        toast(e.message, "error");
      } finally {
        setBusy(false);
      }
    }
  };

  const handleCompleteNoQuiz = async () => {
    if (!lessonId) return;
    await completeLesson(lessonId);
    router.push("/student/courses");
  };

  /* ---------- GAME OVER ---------- */
  if (mode === "gameover") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 text-center">
        <div className="text-6xl mb-4">💔</div>
        <h1 className="font-heading text-3xl font-extrabold">Nyawamu Habis!</h1>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
          Jangan menyerah! Ulangi kuis ini untuk memperkuat pemahamanmu.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/courses">Kembali ke Kursus</Link>
          </Button>
          <Button onClick={startQuiz}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  /* ---------- RESULTS ---------- */
  if (mode === "results" && result) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 mb-4 animate-bounce">
          <Trophy className="h-10 w-10" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold">Kuis Selesai!</h1>
        <p className="text-muted-foreground mt-2">
          Skor kamu: <b>{result.score}/100</b> ({result.correct}/{result.total} benar)
          {result.maxStreak > 1 && ` • streak terbaik 🔥${result.maxStreak}`}
        </p>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mt-3">
          <Zap className="h-5 w-5 fill-current" />
          <span className="font-bold">+{result.xpEarned} XP Didapatkan!</span>
        </div>
        {result.newBadges?.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {result.newBadges.map((b: any) => (
              <div
                key={b.slug}
                className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-600 ring-1 ring-yellow-500/30 animate-bounce"
              >
                <span className="text-lg">{b.icon}</span>
                Lencana Baru: {b.name}!
              </div>
            ))}
          </div>
        )}
        <div className="h-6" />
        <div className="w-full max-w-md space-y-2 mb-8 text-left">
          {result.results.map((r: any, i: number) => (
            <div key={r.questionId} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border text-sm">
              {r.correct ? (
                <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <XIcon className="h-5 w-5 shrink-0 text-rose-500" />
              )}
              <span className="text-muted-foreground">
                Soal {i + 1} — jawaban: <b className="text-foreground">{r.correctAnswer}</b>
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/courses">Kembali ke Kursus</Link>
          </Button>
          <Button asChild>
            <Link href="/student/dashboard">Ke Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- READING MODE ---------- */
  if (mode === "read") {
    if (!lesson) return <p className="p-8 text-muted-foreground">Memuat pelajaran...</p>;
    return (
      <main className="min-h-svh bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
            <Link href="/student/courses" className="text-muted-foreground hover:text-foreground">
              <X className="h-6 w-6" />
            </Link>
            <span className="inline-flex px-3 py-1 bg-secondary text-xs font-bold rounded-full">
              {lesson.course?.emoji} {lesson.course?.title}
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold mb-6">{lesson.title}</h1>
          <LessonContent content={lesson.content} />

          {lesson.quizzes?.[0] && (
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-secondary px-3 py-1.5 text-muted-foreground">
                ❓ {lesson.quizzes[0]._count.questions} pertanyaan
              </span>
              {lesson.quizzes[0].timeLimit && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-600">
                  ⏱ {lesson.quizzes[0].timeLimit}s/soal
                </span>
              )}
              {lesson.quizzes[0].lives && (
                <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-rose-600">
                  ❤ {lesson.quizzes[0].lives} nyawa
                </span>
              )}
              <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-purple-600">
                ⚡ +{lesson.quizzes[0].xpReward} XP
              </span>
            </div>
          )}

          {myProgress?.completed && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              Sudah selesai • nilai {myProgress.score ?? "-"}
            </div>
          )}

          <div className="mt-10">
            {lesson.quizzes?.[0] ? (
              <Button size="lg" className="w-full font-heading text-base" onClick={startQuiz}>
                <Play className="h-5 w-5 mr-2" />
                {myProgress?.completed ? "Ulangi Kuis: " : "Mulai Kuis: "}
                {lesson.quizzes[0].title}
              </Button>
            ) : (
              <Button size="lg" className="w-full font-heading text-base" onClick={handleCompleteNoQuiz}>
                <BookOpenCheck className="h-5 w-5 mr-2" />
                Selesaikan Pelajaran
              </Button>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* ---------- QUIZ MODE ---------- */
  if (!q) return <p className="p-8 text-muted-foreground">Memuat kuis...</p>;

  return (
    <main className="flex flex-col min-h-svh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <Link href="/student/courses" className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </Link>
          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${((step + (checked !== null ? 1 : 0)) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
          {secondsLeft != null && (
            <span className={cn("flex items-center gap-1 font-bold text-sm", secondsLeft <= 5 ? "text-rose-500" : "text-muted-foreground")}>
              <Timer className="h-4 w-4" />
              {secondsLeft}s
            </span>
          )}
          {hearts != null && (
            <div className="flex items-center gap-1.5 font-bold text-rose-500">
              <Heart className="h-5 w-5 fill-current" />
              <span>{hearts}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 flex flex-col">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold mb-8">{q.prompt}</h1>

        {/* MULTIPLE CHOICE / TRUE-FALSE */}
        {(q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && (
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {q.options.map((option: string) => {
              const isSelected = input === option;
              const isCorrectOption = checked && option === correctAnswerText;
              const isIncorrectOption = checked && isSelected && !checked;
              return (
                <button
                  key={option}
                  disabled={checked !== null}
                  onClick={() => setInput(option)}
                  className={cn(
                    "flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 text-left font-semibold transition-all",
                    checked === null && !isSelected && "border-border hover:border-primary/50 hover:bg-primary/5",
                    checked === null && isSelected && "border-primary bg-primary/10 text-primary",
                    isCorrectOption && "border-emerald-500 bg-emerald-500/10 text-emerald-700",
                    isIncorrectOption && "border-rose-500 bg-rose-500/10 text-rose-700",
                  )}
                >
                  <span className="text-lg">{option}</span>
                  {isCorrectOption && <Check className="h-6 w-6 text-emerald-500" />}
                  {isIncorrectOption && <XIcon className="h-6 w-6 text-rose-500" />}
                </button>
              );
            })}
          </div>
        )}

        {/* FILL BLANK */}
        {q.type === "FILL_BLANK" && (
          <input
            type="text"
            disabled={checked !== null}
            placeholder="Ketik jawabanmu..."
            value={input ?? ""}
            onChange={(e) => setInput(e.target.value)}
            className="mb-8 w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-lg font-semibold focus:outline-none focus:border-primary"
          />
        )}

        {/* WORD SCRAMBLE */}
        {q.type === "WORD_SCRAMBLE" && (
          <div className="mb-8">
            <div className="mb-4 min-h-14 rounded-2xl border-2 border-dashed border-border bg-card p-3 text-center font-heading text-2xl font-extrabold tracking-widest">
              {input || "_ _ _ _ _"}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {scrambled.map((letter: string, i: number) => {
                return (
                  <button
                    key={i}
                    disabled={checked !== null}
                    onClick={() =>
                      setInput((prev: string) =>
                        (prev ?? "").length >= scrambled.length ? prev : (prev ?? "") + String(letter)
                      )
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-card font-heading text-xl font-bold uppercase hover:border-primary hover:bg-primary/5"
                  >
                    {String(letter)}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setInput((prev: string) => (prev ?? "").slice(0, -1))}
              className="mt-4 mx-auto block text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              ⌫ Hapus huruf
            </button>
          </div>
        )}

        {/* ORDERING */}
        {q.type === "ORDERING" && (
          <div className="mb-8 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Susun urutan yang benar (gunakan tombol ↑ ↓):</p>
            {input?.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 font-semibold">
                <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}.</span>
                <span className="flex-1">{item}</span>
                <div className="flex flex-col gap-1">
                  <button
                    disabled={checked !== null || i === 0}
                    onClick={() => {
                      const arr = [...input];
                      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                      setInput(arr);
                    }}
                    className="rounded bg-secondary p-1 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    disabled={checked !== null || i === input.length - 1}
                    onClick={() => {
                      const arr = [...input];
                      [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                      setInput(arr);
                    }}
                    className="rounded bg-secondary p-1 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MATCHING */}
        {q.type === "MATCHING" && (
          <div className="mb-8 space-y-3">
            {q.pairs.map((p: any, pi: number) => (
              <div key={pi} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4">
                <span className="flex-1 font-semibold">{p.left}</span>
                <select
                  disabled={checked !== null}
                  value={input?.[pi] ?? ""}
                  onChange={(e) => {
                    const arr = [...input];
                    arr[pi] = e.target.value;
                    setInput(arr);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">— pilih —</option>
                  {rightsPool.map((r: string) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <footer
        className={cn(
          "border-t border-border transition-all duration-300",
          checked === null && "bg-background",
          checked === true && "bg-emerald-500/10 border-emerald-500/20",
          checked === false && "bg-rose-500/10 border-rose-500/20",
        )}
      >
        <div className="mx-auto max-w-3xl px-4 py-5">
          {checked !== null && (
            <div className="mb-4 flex items-center gap-3">
              {checked ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-emerald-700">Benar Sekali! 🎉</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center">
                    <XIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-rose-700">Kurang tepat...</p>
                    <p className="text-sm font-medium text-rose-600">
                      Jawaban yang benar: <b>{correctAnswerText}</b>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          {checked === null ? (
            <Button size="lg" className="w-full font-heading text-base" onClick={() => handleCheck(false)}>
              Periksa Jawaban
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(
                "w-full font-heading text-base",
                checked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
              )}
              onClick={handleContinue}
            >
              Lanjutkan
            </Button>
          )}
        </div>
      </footer>
    </main>
  );
}