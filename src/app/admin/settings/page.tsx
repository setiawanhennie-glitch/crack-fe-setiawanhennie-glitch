"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  School,
  CalendarDays,
  UserPlus,
  Bell,
  Copy,
  RefreshCw,
} from "lucide-react";
import {
  fetchMySchool,
  updateMySchool,
  regenerateSchoolCode,
} from "@/lib/auth-client";
import { useToast } from "@/components/UI/toast";

const defaultSettings = {
  schoolName: "SMA 1 Jakarta",
  npsn: "20100345",
  address: "Jl. Pendidikan No. 12, Jakarta",
  principal: "Drs. Ahmad Sudirman",
  contactEmail: "admin@sma1jakarta.sch.id",
  academicYear: "2025/2026",
  semester: "ganjil",
  classList: "10, 11, 12",
  allowStudentJoin: true,
  requireStudentApproval: false,
  autoApproveTeachers: true,
  weeklyReport: true,
  notifyTeacherJoin: true,
  notifyStudentSuspended: true,
};

type SettingsType = typeof defaultSettings;

/* ---------- Small building blocks ---------- */

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: any;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}

/* ---------- Page ---------- */

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_settings");
      if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
    } catch {}

    fetchMySchool()
      .then((s) => {
        setSchoolCode(s.code);
        setSettings((prev) => ({
          ...prev,
          schoolName: s.name,
          address: s.address || "",
          principal: s.principal || "",
          contactEmail: s.contactEmail || "",
          classList: (s.classList || []).join(", "),
        }));
      })
      .catch(() => {});
  }, []);

  const update = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };
  
  const handleSave = async () => {
    try {
        await updateMySchool({
          address: settings.address,
          principal: settings.principal,
          contactEmail: settings.contactEmail,
          classList: settings.classList.split(",").map((c) => c.trim()).filter(Boolean),
        });
      } catch {}
    localStorage.setItem("admin_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-extrabold">Pengaturan Sekolah</h1>
              <p className="text-sm text-muted-foreground">Konfigurasi sekolah Anda di platform NusaSkillz</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </button>
        </div>

        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Pengaturan sekolah berhasil disimpan!
          </div>
        )}

            <div className="mb-6 rounded-xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold">Kode Bergabung Sekolah</h3>
                  <p className="text-xs text-muted-foreground">
                    Bagikan ke murid & guru — mereka otomatis masuk sekolah dan kelas yang benar saat daftar.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-lg bg-primary/10 px-4 py-2 font-mono text-lg font-extrabold tracking-wider text-primary">
                    {schoolCode || "—"}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(schoolCode);
                      toast("Kode disalin!", "success");
                    }}
                    title="Salin kode"
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                      onClick={async () => {
                        if (!window.confirm("Buat kode baru? Kode lama akan berhenti bekerja.")) return;
                        try {
                          const s = await regenerateSchoolCode();
                          setSchoolCode(s.code);
                        } catch (e: any) {
                          toast("Gagal: " + e.message + " — pastikan data Sekolah ada dan namanya sama persis dengan akun admin.", "error");
                        }
                      }}
                    title="Buat kode baru"
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profil Sekolah */}
          <SectionCard icon={School} title="Profil Sekolah" desc="Identitas sekolah yang tampil di platform">
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold">Nama Sekolah</label>
                <input
                  type="text"
                  value={settings.schoolName}
                  disabled
                  className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">Mengikuti akun admin sekolah</p>
              </div>
            <TextField label="NPSN / ID Sekolah" value={settings.npsn} onChange={(v) => update("npsn", v)} />
            <TextField label="Alamat" value={settings.address} onChange={(v) => update("address", v)} />
            <TextField label="Kepala Sekolah" value={settings.principal} onChange={(v) => update("principal", v)} />
            <TextField label="Email Kontak Sekolah" value={settings.contactEmail} onChange={(v) => update("contactEmail", v)} />
          </SectionCard>

          {/* Tahun Ajaran */}
          <SectionCard icon={CalendarDays} title="Tahun Ajaran & Kelas" desc="Periode akademik yang sedang berjalan">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Tahun Ajaran</label>
                <select
                  value={settings.academicYear}
                  onChange={(e) => update("academicYear", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Semester Aktif</label>
                <select
                  value={settings.semester}
                  onChange={(e) => update("semester", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ganjil">Ganjil</option>
                  <option value="genap">Genap</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <TextField
                label="Daftar Kelas (pisahkan dengan koma)"
                value={settings.classList}
                onChange={(v) => update("classList", v)}
              />
              <p className="text-xs text-muted-foreground">Contoh: 10, 11, 12 atau 7, 8, 9</p>
            </div>
          </SectionCard>

          {/* Pendaftaran & Akses */}
          <SectionCard icon={UserPlus} title="Pendaftaran & Akses" desc="Aturan bergabung ke sekolah Anda">
            <div className="divide-y divide-border">
              <Toggle
                checked={settings.allowStudentJoin}
                onChange={(v) => update("allowStudentJoin", v)}
                label="Izinkan murid bergabung"
                desc="Murid baru dapat mendaftar ke sekolah ini"
              />
              <Toggle
                checked={settings.requireStudentApproval}
                onChange={(v) => update("requireStudentApproval", v)}
                label="Persetujuan manual untuk murid"
                desc="Murid baru harus disetujui admin sebelum aktif"
              />
              <Toggle
                checked={settings.autoApproveTeachers}
                onChange={(v) => update("autoApproveTeachers", v)}
                label="Otomatis setujui guru"
                desc="Guru dengan email sekolah langsung aktif"
              />
            </div>
          </SectionCard>

          {/* Notifikasi */}
          <SectionCard icon={Bell} title="Notifikasi" desc="Kabar yang dikirim ke admin sekolah">
            <div className="divide-y divide-border">
              <Toggle
                checked={settings.weeklyReport}
                onChange={(v) => update("weeklyReport", v)}
                label="Laporan progres mingguan"
                desc="Ringkasan aktivitas murid & guru setiap Senin"
              />
              <Toggle
                checked={settings.notifyTeacherJoin}
                onChange={(v) => update("notifyTeacherJoin", v)}
                label="Guru baru bergabung"
                desc="Email saat ada guru mendaftar ke sekolah"
              />
              <Toggle
                checked={settings.notifyStudentSuspended}
                onChange={(v) => update("notifyStudentSuspended", v)}
                label="Murid ditangguhkan"
                desc="Email saat ada murid yang ditangguhkan"
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}