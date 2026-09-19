"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Ban,
  CheckCircle2,
  FileText,
  UserCircle,
} from "lucide-react";
import { fetchModerationStats, fetchOpenReports, fetchModerationHistory, resolveReport } from "@/lib/auth-client";
import { useToast } from "@/components/UI/toast";

type Report = {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: "CONTENT" | "USER";
  targetId: string;
  targetName: string;
  reason: string;
  description?: string;
  status: string;
  actionTaken?: string;
  createdAt: string;
  resolvedAt?: string;
};

const reasonLabels: Record<string, string> = {
  "Konten Tidak Pantas": "Konten Tidak Pantas",
  "Jawaban Salah": "Jawaban Salah",
  "Kecurangan": "Kecurangan",
  "Pelecehan": "Pelecehan",
  "Lainnya": "Lainnya",
};

const reasonColors: Record<string, string> = {
  "Konten Tidak Pantas": "bg-red-500/10 text-red-600",
  "Jawaban Salah": "bg-amber-500/10 text-amber-600",
  "Kecurangan": "bg-purple-500/10 text-purple-600",
  "Pelecehan": "bg-rose-500/10 text-rose-600",
  "Lainnya": "bg-slate-500/10 text-slate-600",
};

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [openReports, setOpenReports] = useState<Report[]>([]);
  const [history, setHistory] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<"open" | "history">("open");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, openData, historyData] = await Promise.all([
        fetchModerationStats(),
        fetchOpenReports(),
        fetchModerationHistory(),
      ]);
      setStats(statsData);
      setOpenReports(openData);
      setHistory(historyData);
    } catch (error) {
      console.error("Failed to load moderation data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (reportId: string, action: 'IGNORED' | 'CONTENT_HIDDEN' | 'USER_SUSPENDED') => {
    setProcessing(reportId);
    try {
      await resolveReport(reportId, action);
      await loadData();
    } catch (error: any) {
      toast(error.message, "error");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-extrabold">Laporan & Moderasi</h1>
          <p className="text-muted-foreground mt-1">Tinjau laporan dan jaga kualitas platform</p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { icon: AlertTriangle, value: stats?.open ?? "—", label: "Laporan Terbuka", color: "bg-red-500/10 text-red-600" },
            { icon: CheckCircle2, value: stats?.resolvedWeek ?? "—", label: "Diselesaikan (7 hari)", color: "bg-emerald-500/10 text-emerald-600" },
            { icon: EyeOff, value: stats?.hidden ?? "—", label: "Konten Disembunyikan", color: "bg-amber-500/10 text-amber-600" },
            { icon: Ban, value: stats?.suspended ?? "—", label: "Pengguna Ditangguhkan", color: "bg-purple-500/10 text-purple-600" },
          ].map((card) => (
            <div key={card.label} className="flex items-center justify-between rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl font-extrabold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("open")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "open"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Laporan Masuk ({openReports.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Riwayat Moderasi ({history.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Memuat...</p>
          </div>
        ) : activeTab === "open" ? (
          <div className="space-y-4">
            {openReports.length === 0 ? (
              <div className="rounded-xl bg-card p-12 text-center ring-1 ring-border">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-4 font-heading text-lg font-bold">Tidak ada laporan terbuka</p>
                <p className="mt-2 text-sm text-muted-foreground">Semua laporan telah ditangani.</p>
              </div>
            ) : (
              openReports.map((report) => (
                <div key={report.id} className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${reasonColors[report.reason] || "bg-slate-500/10 text-slate-600"}`}>
                          {reasonLabels[report.reason] || report.reason}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600">
                          {report.targetType === "CONTENT" ? (
                            <>
                              <FileText className="h-3 w-3" />
                              Kursus
                            </>
                          ) : (
                            <>
                              <UserCircle className="h-3 w-3" />
                              Pengguna
                            </>
                          )}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold">{report.targetName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Dilaporkan oleh <span className="font-semibold text-foreground">{report.reporterName}</span> • {timeAgo(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  {report.description && (
                    <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="font-semibold text-muted-foreground mb-1">Deskripsi:</p>
                      <p>{report.description}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleResolve(report.id, 'IGNORED')}
                      disabled={processing === report.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-500/10 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-500/20 disabled:opacity-50"
                    >
                      <Eye className="h-4 w-4" />
                      Abaikan
                    </button>
                    {report.targetType === "CONTENT" && (
                      <button
                        onClick={() => handleResolve(report.id, 'CONTENT_HIDDEN')}
                        disabled={processing === report.id}
                        className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        <EyeOff className="h-4 w-4" />
                        Sembunyikan Konten
                      </button>
                    )}
                    {report.targetType === "USER" && (
                      <button
                        onClick={() => handleResolve(report.id, 'USER_SUSPENDED')}
                        disabled={processing === report.id}
                        className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        Tangguhkan Pengguna
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-sm ring-1 ring-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/20 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Laporan</th>
                    <th className="px-6 py-3 text-left">Target</th>
                    <th className="px-6 py-3 text-left">Pelapor</th>
                    <th className="px-6 py-3 text-left">Aksi Diambil</th>
                    <th className="px-6 py-3 text-left">Diselesaikan</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Belum ada riwayat moderasi
                      </td>
                    </tr>
                  ) : (
                    history.map((report) => (
                      <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${reasonColors[report.reason] || "bg-slate-500/10 text-slate-600"}`}>
                            {reasonLabels[report.reason] || report.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{report.targetName}</td>
                        <td className="px-6 py-4 text-muted-foreground">{report.reporterName}</td>
                        <td className="px-6 py-4">
                          {report.actionTaken === "IGNORED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-bold text-slate-600">
                              <Eye className="h-3 w-3" />
                              Diabaikan
                            </span>
                          )}
                          {report.actionTaken === "CONTENT_HIDDEN" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                              <EyeOff className="h-3 w-3" />
                              Konten Disembunyikan
                            </span>
                          )}
                          {report.actionTaken === "USER_SUSPENDED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">
                              <Ban className="h-3 w-3" />
                              Pengguna Ditangguhkan
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {report.resolvedAt ? timeAgo(report.resolvedAt) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}