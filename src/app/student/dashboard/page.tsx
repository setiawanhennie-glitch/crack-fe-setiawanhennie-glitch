"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/UI/button";
import {
  ArrowRight,
  type LucideIcon,
  Icon,
} from "lucide-react";
import Image from "next/image";
import { fetchStudentStats } from "@/lib/auth-client";

type StatTone = "primary" | "accent" | "success";
type StatIcon = string | LucideIcon;

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: StatIcon;
  label: string;
  value: string | number;
  tone: StatTone;
}) {
  const toneClasses: Record<StatTone, string> = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    accent: "bg-orange-500/10 text-orange-600 group-hover:bg-orange-500/20",
    success: "bg-yellow-500/10 text-yellow-600 group-hover:bg-yellow-500/20",
  };
  const IconCmp = typeof icon === "string" ? null : icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-4 pl-14 text-left ring-1 ring-border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default">
      <div className={`absolute -left-4 top-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full ${toneClasses[tone]} transition-transform group-hover:scale-105`}>
        {typeof icon === "string" ? (
          <Image src={icon} alt="" width={28} height={28} className="h-10 w-10 object-contain" />
        ) : IconCmp ? (
          <IconCmp className="h-7 w-7" />
        ) : null}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="font-heading text-xl font-extrabold leading-tight tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStudentStats().then(setStats).catch(console.error);
  }, []);

  if (!stats || !stats.user) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <p className="animate-pulse text-muted-foreground">Memuat petualanganmu...</p>
      </div>
    );
  }

  const user = stats.user;
  const courses = stats.courses ?? [];
  const badges = stats.badges ?? [];
  const leaderboard = stats.leaderboard ?? [];
  const completedLessons = courses.reduce((acc: number, c: any) => acc + (c.done ?? 0), 0);
  const totalLessons = courses.reduce((acc: number, c: any) => acc + (c.total ?? 0), 0);
  const continueTarget = courses.find((c: any) => c.nextLessonId);
  const levelBase = (user.level - 1) * 500;
  const levelProgress = Math.min(100, Math.max(0, ((user.xp - levelBase) / 500) * 100));
  const xpToNext = stats.xpToNext ?? user.level * 500;
  const totalBadges = stats.totalBadges ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-3xl font-extrabold">Halo, {user.name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground mt-1">Siap untuk melanjutkan petualangan belajarmu hari ini?</p>
      </div>

      {/* Level & XP Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 p-6 shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="animate-float flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white">
                <Image
                  src="/icons/lightning.png"
                  alt=""
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <h3 className="text-3xl font-bold font-heading text-white">{user.xp} XP</h3>
                <p className="text-sm text-white/80">
                  {Math.max(0, xpToNext - user.xp)} XP lagi ke Level {user.level + 1}
                </p>
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-2xl font-bold font-heading text-white">{user.level}</span>
            </div>
          </div>
          <div className="relative h-3 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${levelProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="/icons/burn.png" label="Streak Harian" value={`${user.streak} Hari`} tone="accent" />
        <StatCard icon="/icons/open_book.png" label="Pelajaran Selesai" value={`${completedLessons}/${totalLessons}`} tone="primary" />
        <StatCard icon="/icons/medal.png" label="Lencana" value={`${badges.length}/${totalBadges}`} tone="success" />
      </div>

      {/* Continue Learning */}
      {continueTarget && (
        <div className="relative overflow-hidden rounded-3xl bg-card p-5 ring-1 ring-border shadow-sm transition-all hover:shadow-md group">
          <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-primary to-transparent"></div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Lanjutkan Belajar</p>
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              </div>
              <h3 className="mt-1 font-heading text-lg font-bold truncate">{continueTarget.nextLesson}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {continueTarget.title} • {continueTarget.done} dari {continueTarget.total} pelajaran
              </p>
            </div>
            <Button asChild className="shrink-0 font-heading transition-transform group-hover:scale-105">
              <Link href={`/student/lesson?id=${continueTarget.nextLessonId}`}>
                Mulai
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                Kursusmu
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-sm">
                <Link href="/student/courses">Lihat Semua</Link>
              </Button>
            </div>
            {courses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Belum ada kursus untuk kelasmu — segera hadir! 🎒
              </p>
            ) : (
              <div className="space-y-2">
                {courses.map((course: any) => {
                  const targetId = course.nextLessonId || course.firstLessonId;
                  return (
                    <Link
                      key={course.id}
                      href={targetId ? `/student/lesson?id=${targetId}` : "/student/courses"}
                      className="group block"
                    >
                      <div className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-muted/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl transition-transform group-hover:scale-110">
                          {course.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold font-heading group-hover:text-primary transition-colors">
                              {course.title}
                            </span>
                            <span className="text-sm text-muted-foreground">{course.done}/{course.total}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                              style={{ width: `${course.total ? Math.round((course.done / course.total) * 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="font-heading text-xl font-bold flex items-center gap-2 mb-6">
              Pencapaian Terbaru
            </h2>
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada lencana. Selesaikan pelajaran dan kuis untuk mendapatkannya!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {badges.slice(0, 8).map((b: any) => (
                  <div
                    key={b.name}
                    className="group flex flex-col items-center text-center p-4 rounded-2xl bg-secondary/50 border border-border transition-all hover:scale-105 hover:bg-secondary/70 cursor-default"
                  >
                    <div className="relative h-10 w-10 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center mb-2 text-xl">
                      {b.icon}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-xs font-bold font-heading leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                Papan Peringkat
              </h2>
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Sekolahmu
              </span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pesaing di sekolahmu. Jadilah yang pertama! 🏆</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((player: any) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      player.isUser
                        ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm"
                        : "hover:bg-secondary/50 hover:translate-x-1"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                        player.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md"
                          : player.rank === 2
                          ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                          : player.rank === 3
                          ? "bg-gradient-to-br from-orange-400 to-orange-700 text-white"
                          : "bg-secondary text-muted-foreground"
                      } ${player.rank <= 3 ? "scale-110" : ""}`}
                    >
                      {player.rank}
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                      {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${player.isUser ? "text-primary" : "text-foreground"}`}>
                        {player.name} {player.isUser && "(Kamu)"}
                      </p>
                      <p className="text-xs text-muted-foreground">{player.xp} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}