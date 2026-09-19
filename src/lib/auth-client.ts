const API_URL_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = `${API_URL_BASE}/auth`;

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  school?: string;
  className?: string;
  role?: "STUDENT" | "TEACHER";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyData {
  email: string;
  otp: string;
}

export async function register(data: RegisterData) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return res.json();
}

export async function verifyEmail(data: VerifyData) {
  const res = await fetch(`${API_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Verification failed');
  }
  
  return res.json();
}

export async function login(
  credentials: { email: string; password: string },
  remember = true,
) {
  const res = await fetch(`${API_URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal masuk');
  }
  const result = await res.json();

  document.cookie = `token=${result.access_token}; path=/; ${remember ? 'max-age=604800;' : ''} SameSite=Lax`;
  localStorage.setItem('token', result.access_token);
  localStorage.setItem('user', JSON.stringify(result.user));
  return result;
}

export function logout() {
  document.cookie = 'token=; path=/; max-age=0';
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/sign-in';
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Base URL for non-auth endpoints (users, etc.)

export async function fetchUsers() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat pengguna');
  return res.json();
}

export async function updateUserRole(userId: string, role: 'STUDENT' | 'TEACHER' | 'ADMIN') {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Gagal mengubah role');
  return res.json();
}

export async function toggleUserSuspend(userId: string, suspend: boolean) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/users/${userId}/suspend`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ suspend }),
  });
  if (!res.ok) throw new Error('Gagal mengubah status');
  return res.json();
}

export async function fetchAdminStats() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/users/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat statistik');
  return res.json();
}

export async function fetchModerationStats() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/moderation/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat statistik moderasi');
  return res.json();
}

export async function fetchOpenReports() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/moderation/reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat laporan');
  return res.json();
}

export async function fetchModerationHistory() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/moderation/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat riwayat');
  return res.json();
}

export async function resolveReport(
  reportId: string,
  action: 'IGNORED' | 'CONTENT_HIDDEN' | 'USER_SUSPENDED'
) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/moderation/reports/${reportId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Gagal menyelesaikan laporan');
  return res.json();
}

export async function fetchTeacherStats() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat statistik guru');
  return res.json();
}

export async function fetchTeacherClasses() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/classes`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat kelas');
  return res.json();
}

export async function fetchTeacherMaterials() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/materials`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat materi');
  return res.json();
}

export async function fetchTeacherGrading() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/grading`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat penilaian');
  return res.json();
}

export async function fetchTeacherReports() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/reports`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat laporan');
  return res.json();
}

export async function createCourse(data: { title: string; description: string; emoji: string; color: string }) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal membuat kursus');
  return res.json();
}

export async function createLesson(courseId: string, data: { title: string; content: string }) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/courses/${courseId}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal membuat pelajaran');
  return res.json();
}

export async function extractDocument(file: File) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL_BASE}/teacher/extract`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal mengekstrak dokumen');
  }
  return res.json();
}

export async function fetchLesson(lessonId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/lessons/${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat pelajaran');
  return res.json();
}

export async function updateLesson(lessonId: string, data: { title: string; content: string }) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal memperbarui pelajaran');
  return res.json();
}

export async function deleteLesson(lessonId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal menghapus pelajaran');
  return res.json();
}

export async function uploadImage(file: File) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL_BASE}/teacher/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal mengunggah gambar');
  }
  return res.json();
}

export async function createQuiz(data: any) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal membuat kuis');
  }
  return res.json();
}

export async function fetchQuizzes(lessonId?: string) {
  const token = getToken();
  const url = lessonId
    ? `${API_URL_BASE}/teacher/quizzes?lessonId=${lessonId}`
    : `${API_URL_BASE}/teacher/quizzes`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat kuis');
  return res.json();
}

export async function deleteQuiz(quizId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/quizzes/${quizId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal menghapus kuis');
  return res.json();
}

export async function fetchQuizForPlay(quizId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat kuis');
  return res.json();
}

export async function submitQuiz(quizId: string, answers: { questionId: string; answer: string }[]) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Gagal mengirim jawaban');
  return res.json();
}

export async function fetchStudentStats() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/student/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat statistik');
  return res.json();
}

export async function fetchStudentLesson(lessonId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/lessons/${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat pelajaran');
  return res.json();
}

export async function checkQuizAnswer(quizId: string, questionId: string, answer: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/quizzes/${quizId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ questionId, answer }),
  });
  if (!res.ok) throw new Error('Gagal memeriksa jawaban');
  return res.json();
}

export async function completeLesson(lessonId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal menyelesaikan pelajaran');
  return res.json();
}

export async function updateCourseAssignments(courseId: string, classes: string[]) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/courses/${courseId}/assignments`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ classes }),
  });
  if (!res.ok) throw new Error('Gagal mengatur kelas tujuan');
  return res.json();
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_URL_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal mengirim tautan reset');
  }
  return res.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_URL_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal mengubah password');
  }
  return res.json();
}

export async function lookupSchoolByCode(code: string) {
  const res = await fetch(`${API_URL_BASE}/schools/join/${encodeURIComponent(code.trim())}`);
  if (!res.ok) throw new Error('Kode sekolah tidak ditemukan');
  return res.json();
}

export async function fetchMySchool() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/schools/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat data sekolah');
  return res.json();
}

export async function updateMySchool(data: {
  address?: string;
  principal?: string;
  contactEmail?: string;
  classList?: string[];
}) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/schools/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menyimpan pengaturan sekolah');
  return res.json();
}

export async function regenerateSchoolCode() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/schools/me/regenerate-code`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal membuat kode baru');
  return res.json();
}

export async function fetchSuperStats() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/super/stats`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat statistik platform');
  return res.json();
}

export async function fetchSuperSchools() {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/super/schools`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal memuat daftar sekolah');
  return res.json();
}

export async function onboardSchool(data: any) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/super/schools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal onboard sekolah');
  }
  return res.json();
}

export async function fetchSchoolAdmins(schoolId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/super/schools/${schoolId}/admins`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat admin sekolah');
  return res.json();
}

export async function addSchoolAdmin(schoolId: string, data: any) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/super/schools/${schoolId}/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal menambah admin');
  }
  return res.json();
}

export async function toggleAdminSuspend(adminId: string, suspend: boolean) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/super/admins/${adminId}/suspend`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ suspend }),
  });
  if (!res.ok) throw new Error('Gagal mengubah status admin');
  return res.json();
}

export async function deleteCourse(courseId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/courses/${courseId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal menghapus materi');
  return res.json();
}

export async function fetchQuizForEdit(quizId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal memuat kuis');
  return res.json();
}

export async function updateQuiz(quizId: string, data: any) {
  const token = getToken();
  const res = await fetch(`${API_URL_BASE}/teacher/quizzes/${quizId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal memperbarui kuis');
  }
  return res.json();
}