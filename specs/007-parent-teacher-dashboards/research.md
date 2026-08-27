# Architectural Research & Design Decisions: Dasbor Orang Tua dan Guru AksiCendekia

**Feature Branch**: `007-parent-teacher-dashboards`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/spec.md)

---

## 1. Relational Security Guards & Audit Trail Architecture

### Context
Prinsip VII Konstitusi AksiCendekia dan UU No. 27 Tahun 2022 (Pelindungan Data Pribadi) menuntut penanganan data anak secara ekstra ketat. Data akademis dan aktivitas anak tidak boleh dapat diakses oleh sembarang pihak dewasa, dan setiap akses oleh orang tua/guru wajib meninggalkan jejak audit (*audit trail*).

### Options Evaluated
1. **Option A: Query Filtering Saja (Implicit Authorization)**
   - Query DB menyertakan `WHERE parent_id = user.id`.
   - *Pros*: Mudah diimplementasikan.
   - *Cons*: Rentan kebocoran data jika developer lupa menambahkan filter `WHERE` pada endpoint baru, dan tidak memiliki mekanisme pencatatan audit log terpusat.
2. **Option B: Middleware Relational Guard & Dedicated Access Audit Interceptor (Chosen)**
   - Setiap route dibungkus oleh Fastify Pre-handler Guard (`ParentChildLinkGuard` dan `TeacherClassGuard`) yang secara eksplisit memverifikasi hubungan sebelum meloloskan request.
   - Setiap pembacaan/pengubahan data siswa memicu pembuatan record `StudentDataAccessLog`.
   - *Pros*: Otorisasi terpusat, fail-safe (default deny), dan menjamin 100% kepatuhan audit log UU PDP.
   - *Cons*: Sedikit overhead latency (~2-5ms) untuk penulisan log DB async.

### Decision
Memilih **Option B** untuk memberikan jaminan keamanan tanpa kompromi dan kepatuhan penuh pada Konstitusi AksiCendekia.

---

## 2. Risk Assessment Algorithm for At-Risk/Behind Students

### Context
Guru membutuhkan indikator proaktif untuk mengetahui siswa mana yang mengalami kesulitan sebelum ujian atau evaluasi akhir.

### Metrics Selected
- **Akurasi Rendah (< 60%)**: Rata-rata akurasi dari 5 sesi belajar terakhir.
- **Keaktifan Rendah (< 30% rerata kelas)**: Total durasi belajar 14 hari terakhir dibandingkan dengan rerata durasi belajar seluruh siswa dalam kelas yang sama.
- **Penugasan Terlambat (> 0 Overdue Assignment)**: Adanya tugas aktif yang sudah melewati `due_date` tanpa penyerahan.

---

## 3. CSV Injection Prevention

### Context
Fitur ekspor CSV memungkinkan guru mengunduh data kelas ke Microsoft Excel / Google Sheets. Jika data siswa (seperti `display_name` atau bidang teks penugasan) mengandung formula jahat (contoh: `=CMD|' /C calc'!A0` atau `=HYPERLINK(...)`), program spreadsheet pengolah dapat mengeksekusi perintah berbahaya (*Remote Code Execution*).

### Mitigation Strategy
Semua nilai string yang diekspor ke CSV wajib melewati pembersih sanitasi:
```typescript
function sanitizeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`; // Awali dengan petik tunggal untuk mematikan mode formula spreadsheet
  }
  return str;
}
```

---

## 4. Daily Learning Time Limit Enforcement Logic

### Context
Orang Tua dapat mengatur durasi batas waktu belajar harian anak (misal: 30 menit). Sistem harus menghentikan atau mencegah pembentukan sesi belajar baru ketika kuota tercapai.

### Enforcement Point
- **Session Initiation (`POST /api/v1/learning/sessions`)**: Sebelum sesi belajar baru dibuat, backend menghitung akumulasi durasi sesi belajar anak pada hari kalender yang sama (`today_learning_seconds`). Jika `today_learning_seconds >= daily_time_limit_minutes * 60`, backend menolak pembuatan sesi dengan HTTP 403 `DAILY_TIME_LIMIT_EXCEEDED`.
- **Active Session Grace Period**: Sesi yang sedang berjalan saat batas tercapai diperbolehkan diselesaikan hingga maksimal 5 menit tambahan sebelum otomatis disimpan.

---

## 5. Data Retention & Late Enrollment Policies

### Data Retention Policy (UU PDP No. 27/2022 Compliance)
- **StudentDataAccessLog**: Disimpan selama **365 hari (1 tahun)** untuk memenuhi kewajiban audit UU PDP No. 27/2022. Cron job pembersihan bulanan menghapus record audit log yang berumur lebih dari 365 hari.
- **WeeklyReportSummary**: Disimpan selama **12 bulan terakhir** untuk memberi ruang rekapitulasi tahunan bagi orang tua dan guru, setelah itu diarsipkan.

### Late Assignment Enrollment Policy
- Ketika seorang siswa baru didaftarkan ke suatu kelas (`StudentClassEnrollment`), sistem **TIDAK** membuatkan record `StudentAssignmentProgress` untuk penugasan kelas yang `due_date`-nya telah berlalu (`due_date < NOW()`).
- Siswa baru hanya secara otomatis dikaitkan ke penugasan yang berstatus aktif atau mendatang (`due_date >= NOW()`).

