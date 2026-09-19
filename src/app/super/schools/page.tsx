"use client";

import { useEffect, useState } from "react";
import {
  School as SchoolIcon,
  Copy,
  ShieldCheck,
  Plus,
  X,
  Ban,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import {
  fetchSuperSchools,
  onboardSchool,
  fetchSchoolAdmins,
  addSchoolAdmin,
  toggleAdminSuspend,
} from "@/lib/auth-client";
import { useToast } from "@/components/UI/toast";

const emptyOnboard = {
  schoolName: "",
  address: "",
  principal: "",
  classList: "10, 11, 12",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function SuperSchoolsPage() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Onboarding
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ ...emptyOnboard });
  const [onboardSaving, setOnboardSaving] = useState(false);
  const [onboardError, setOnboardError] = useState("");
  const [onboardResult, setOnboardResult] = useState<null | {
    code: string;
    adminEmail: string;
    adminPassword: string;
    schoolName: string;
  }>(null);

  // Admins management
  const [adminsSchool, setAdminsSchool] = useState<any | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({ name: "", email: "", password: "" });
  const [addAdminSaving, setAddAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");

  const load = () => {
    setLoading(true);
    fetchSuperSchools()
      .then(setSchools)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdmins = async (school: any) => {
    setAdminsSchool(school);
    setAdminsLoading(true);
    setAdminError("");
    setAddAdminOpen(false);
    setAddAdminForm({ name: "", email: "", password: "" });
    try {
      setAdmins(await fetchSchoolAdmins(school.id));
    } catch (e: any) {
      setAdminError(e.message);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleOnboard = async () => {
    setOnboardSaving(true);
    setOnboardError("");
    try {
      const res = await onboardSchool({
        schoolName: onboardForm.schoolName,
        address: onboardForm.address || undefined,
        principal: onboardForm.principal || undefined,
        classList: onboardForm.classList.split(",").map((c) => c.trim()).filter(Boolean),
        adminName: onboardForm.adminName,
        adminEmail: onboardForm.adminEmail,
        adminPassword: onboardForm.adminPassword,
      });
      setOnboardResult({
        code: res.code,
        adminEmail: res.adminEmail,
        adminPassword: onboardForm.adminPassword,
        schoolName: onboardForm.schoolName,
      });
      await load();
    } catch (e: any) {
      setOnboardError(e.message);
    } finally {
      setOnboardSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    setAddAdminSaving(true);
    setAdminError("");
    try {
      await addSchoolAdmin(adminsSchool.id, addAdminForm);
      setAddAdminForm({ name: "", email: "", password: "" });
      setAddAdminOpen(false);
      await openAdmins(adminsSchool);
      await load();
    } catch (e: any) {
      setAdminError(e.message);
    } finally {
      setAddAdminSaving(false);
    }
  };

  const handleSuspend = async (admin: any) => {
    try {
      await toggleAdminSuspend(admin.id, !admin.isSuspended);
      await openAdmins(adminsSchool);
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const closeOnboard = () => {
    setOnboardOpen(false);
    setOnboardResult(null);
    setOnboardForm({ ...emptyOnboard });
    setOnboardError("");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Sekolah & Admin</h1>
          <p className="text-muted-foreground mt-1">Onboard sekolah baru dan kelola admin mereka</p>
        </div>
        <button
          onClick={() => setOnboardOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Onboard Sekolah Baru
        </button>
      </div>

      {/* Schools table */}
      <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">Sekolah</th>
                <th className="px-6 py-3 text-left">Kode</th>
                <th className="px-6 py-3 text-left">Kelas</th>
                <th className="px-6 py-3 text-left">Murid</th>
                <th className="px-6 py-3 text-left">Guru</th>
                <th className="px-6 py-3 text-left">Admin</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Memuat...</td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada sekolah. Klik "Onboard Sekolah Baru"!
                  </td>
                </tr>
              ) : (
                schools.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <p className="font-heading font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.principal || s.address || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <code className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                          {s.code}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(s.code)}
                          title="Salin kode"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{(s.classList || []).join(", ") || "-"}</td>
                    <td className="px-6 py-4 font-semibold">{s.students}</td>
                    <td className="px-6 py-4 font-semibold">{s.teachers}</td>
                    <td className="px-6 py-4 font-semibold">{s.admins}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openAdmins(s)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold transition-colors hover:bg-muted"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ONBOARD MODAL ================= */}
      {onboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeOnboard} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            {onboardResult ? (
              /* --- Success screen --- */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="font-heading text-xl font-extrabold">Sekolah Berhasil Di-onboard! 🎉</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Serahkan informasi ini ke pihak sekolah:
                </p>

                <div className="mt-5 space-y-3 text-left">
                  <div className="rounded-xl bg-secondary/50 p-4 ring-1 ring-border">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Kode Bergabung</p>
                    <div className="mt-1 flex items-center justify-between">
                      <code className="font-mono text-lg font-extrabold text-primary">{onboardResult.code}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(onboardResult.code)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-4 ring-1 ring-border">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Akun Admin Pertama</p>
                    <p className="mt-1 text-sm font-semibold">{onboardResult.adminEmail}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Password: <b>{onboardResult.adminPassword}</b></p>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${onboardResult.adminEmail} / ${onboardResult.adminPassword}`
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={closeOnboard}
                  className="mt-6 w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Selesai
                </button>
              </div>
            ) : (
              /* --- Form --- */
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-heading text-xl font-extrabold">🏫 Onboard Sekolah Baru</h2>
                  <button onClick={closeOnboard} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {onboardError && (
                  <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-600">{onboardError}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Nama Sekolah *</label>
                    <input
                      type="text"
                      placeholder="Contoh: SMA 2 Bandung"
                      value={onboardForm.schoolName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, schoolName: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold">Kepala Sekolah</label>
                      <input
                        type="text"
                        placeholder="Dra. Rina"
                        value={onboardForm.principal}
                        onChange={(e) => setOnboardForm({ ...onboardForm, principal: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold">Daftar Kelas</label>
                      <input
                        type="text"
                        value={onboardForm.classList}
                        onChange={(e) => setOnboardForm({ ...onboardForm, classList: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Alamat</label>
                    <input
                      type="text"
                      placeholder="Jl. Merdeka No. 5, Bandung"
                      value={onboardForm.address}
                      onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="rounded-xl bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold">
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                      Akun Admin Pertama
                    </p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nama admin"
                        value={onboardForm.adminName}
                        onChange={(e) => setOnboardForm({ ...onboardForm, adminName: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input
                        type="email"
                        placeholder="Email admin"
                        value={onboardForm.adminEmail}
                        onChange={(e) => setOnboardForm({ ...onboardForm, adminEmail: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input
                        type="text"
                        placeholder="Password sementara (min. 8 karakter)"
                        value={onboardForm.adminPassword}
                        onChange={(e) => setOnboardForm({ ...onboardForm, adminPassword: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={closeOnboard}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleOnboard}
                    disabled={onboardSaving}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {onboardSaving ? "Membuat..." : "Onboard Sekolah"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= ADMINS MODAL ================= */}
      {adminsSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAdminsSchool(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-extrabold">Admin {adminsSchool.name}</h2>
                <p className="text-xs text-muted-foreground">Kelola akses admin sekolah ini</p>
              </div>
              <button onClick={() => setAdminsSchool(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {adminError && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-600">{adminError}</div>
            )}

            <div className="space-y-2">
              {adminsLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Memuat admin...</p>
              ) : admins.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Belum ada admin.</p>
              ) : (
                admins.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3 ring-1 ring-border">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">
                      {a.name.split(" ").map((w: string) => w[0].toUpperCase()).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {a.name}
                        {a.isSuspended && (
                          <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            Ditangguhkan
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                    </div>
                    <button
                      onClick={() => handleSuspend(a)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        a.isSuspended
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      }`}
                    >
                      {a.isSuspended ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      {a.isSuspended ? "Aktifkan" : "Tangguhkan"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {addAdminOpen ? (
              <div className="mt-4 space-y-3 rounded-xl bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                <input
                  type="text"
                  placeholder="Nama admin"
                  value={addAdminForm.name}
                  onChange={(e) => setAddAdminForm({ ...addAdminForm, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="email"
                  placeholder="Email admin"
                  value={addAdminForm.email}
                  onChange={(e) => setAddAdminForm({ ...addAdminForm, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Password (min. 8 karakter)"
                  value={addAdminForm.password}
                  onChange={(e) => setAddAdminForm({ ...addAdminForm, password: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAddAdminOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddAdmin}
                    disabled={addAdminSaving}
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {addAdminSaving ? "Menambah..." : "Tambah Admin"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddAdminOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <UserPlus className="h-4 w-4" />
                Tambah Admin
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}