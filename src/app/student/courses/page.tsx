"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/UI/button";
import { Search, Flame, Lock, ChevronRight, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";
import { fetchStudentStats } from "@/lib/auth-client";

export default function StudentCoursesPage() {
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchStudentStats().then(setStats).catch(console.error);
  }, []);

  const allCourses = stats?.courses ?? [];
  const courses = allCourses.filter((c: any) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header + Daily Mission */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold">Jelajah Kursus</h1>
        <p className="text-muted-foreground mt-1">Pilih petualangan belajarmu selanjutnya.</p>
        <div className="mt-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-purple-600 p-6 text-primary-foreground shadow-lg">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">Misi Harian</p>
              <h3 className="font-heading text-lg font-bold">
                Selesaikan 1 pelajaran hari ini untuk menjaga streak harian mu!
              </h3>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari kursus atau topik..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Grid with loading / empty / results states */}
      {!stats ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-card ring-1 ring-border" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
          <p className="text-4xl">🎒</p>
          <p className="mt-3 font-heading text-lg font-bold">
            {allCourses.length === 0 ? "Belum ada kursus untuk kelasmu" : `Tidak ditemukan kursus "${query}"`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {allCourses.length === 0
              ? "Gurumu akan segera menambahkan materi — pantau terus!"
              : "Coba kata kunci lain."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {courses.map((course: any, i: number) => {
            const progress = course.total ? Math.round((course.done / course.total) * 100) : 0;
            const targetId = course.nextLessonId || course.firstLessonId;
            const finished = course.total > 0 && course.done === course.total;
            const fresh = course.done === 0;
            return (
              <div
                key={course.id}
                style={{ animationDelay: `${i * 80}ms` }}
                className={`group relative animate-rise rounded-3xl bg-card p-6 ring-1 ring-border transition-all hover:shadow-lg hover:-translate-y-1 ${
                  course.isLocked ? "opacity-70" : ""
                }`}
              >
                {/* Status chip */}
                <div className="absolute right-4 top-4">
                  {course.isLocked ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Terkunci
                    </span>
                  ) : finished ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Selesai
                    </span>
                  ) : fresh ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">✨ Baru</span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">⏳ Berjalan</span>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110 ${course.color}`}>
                    {course.emoji}
                  </div>
                  <div className="flex-1 min-w-0 pr-20">
                    <h3 className="font-heading text-xl font-bold truncate">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                  </div>
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.total} pelajaran • {course.done} selesai
                </p>

                <div className="mt-3">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-primary">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-5">
                  {course.isLocked ? (
                    <Button disabled className="w-full" variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Terkunci
                    </Button>
                  ) : !targetId ? (
                    <Button disabled className="w-full" variant="outline">
                      Segera hadir
                    </Button>
                  ) : finished ? (
                    <Button asChild className="w-full font-heading" variant="secondary">
                      <Link href={`/student/lesson?id=${course.firstLessonId}`}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ulangi Kursus
                      </Link>
                    </Button>
                  ) : fresh ? (
                    <Button asChild className="w-full font-heading">
                      <Link href={`/student/lesson?id=${course.firstLessonId}`}>
                        Mulai Belajar
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full font-heading">
                      <Link href={`/student/lesson?id=${course.nextLessonId}`}>
                        Lanjutkan
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}