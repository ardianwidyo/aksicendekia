# Implementation Plan: Dasbor Orang Tua dan Guru AksiCendekia

**Feature Branch**: `007-parent-teacher-dashboards`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/spec.md)
**Data Model**: [data-model.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/data-model.md)

---

## 1. Technical Architecture & Component Overview

```mermaid
flowchart TD
    subgraph Web App Frontend ("apps/web")
        ParentUI["Parent Dashboard (/parent)"]
        TeacherUI["Teacher Dashboard (/teacher)"]
        ControlModal["Parental Control Modal"]
        AssignmentModal["Assignment Creation Modal"]
    end

    subgraph Fastify API Server ("apps/api")
        AuthGuard["Relational Security Guards (Parent/Teacher)"]
        AuditInterceptor["Student Access Audit Logging Interceptor"]
        ParentService["Parent Dashboard Service"]
        TeacherService["Teacher Dashboard Service"]
        AssignmentService["Assignment & Item Analysis Engine"]
        ReportService["Weekly Report Summary & Cleanup Engine"]
        CSVExporter["Safe CSV Export Streamer"]
    end

    subgraph PostgreSQL Database
        Prisma[Prisma ORM]
        ParentalSettings[(parental_control_settings)]
        Assignments[(lesson_assignments)]
        AssignmentProg[(student_assignment_progresses)]
        AuditLogs[(student_data_access_logs)]
        WeeklyReports[(weekly_report_summaries)]
    end

    ParentUI --> AuthGuard
    TeacherUI --> AuthGuard

    AuthGuard --> AuditInterceptor
    AuditInterceptor --> ParentService
    AuditInterceptor --> TeacherService
    AuditInterceptor --> AssignmentService

    ParentService --> Prisma
    TeacherService --> Prisma
    AssignmentService --> Prisma
    ReportService --> Prisma
    TeacherService --> CSVExporter

    Prisma --> ParentalSettings
    Prisma --> Assignments
    Prisma --> AssignmentProg
    Prisma --> AuditLogs
    Prisma --> WeeklyReports
```

---

## 2. Proposed System Modules & Component Changes

### Backend API (`apps/api/src/modules/`)

1. **`parent-dashboard` Module**:
   - `parent-dashboard.routes.ts`: Routes untuk `/api/v1/parent/children`, `/api/v1/parent/children/:studentId/summary`, `/api/v1/parent/children/:studentId/activities`, `/api/v1/parent/children/:studentId/controls`, `/api/v1/parent/children/:studentId/weekly-reports`.
   - `parent-dashboard.service.ts`: Menghitung total waktu belajar, pelajaran selesai, akurasi, streak, topik terkuat/terlemah, aktivitas terbaru, dan penegakan batas waktu harian berbasis zona waktu lokal siswa (`00:00 local time reset`).

2. **`teacher-dashboard` Module**:
   - `teacher-dashboard.routes.ts`: Routes untuk `/api/v1/teacher/classes`, `/api/v1/teacher/classes/:classId/students`, `/api/v1/teacher/classes/:classId/item-analysis`, `/api/v1/teacher/classes/:classId/export-csv`.
   - `teacher-dashboard.service.ts`: Pemantauan progres siswa kelas, evaluasi algoritma `calculateStudentRiskStatus` (siswa tertinggal), agregasi akurasi per butir soal (`ItemAccuracyAnalysis`), dan pembuatan berkas CSV ter-sanitasi dari formula injection.

3. **`assignments` Module**:
   - `assignments.routes.ts`: Routes untuk `/api/v1/teacher/assignments` (POST, GET, GET by ID).
   - `assignments.service.ts`: Pembuatan penugasan kelas, pembentukan `StudentAssignmentProgress` awal, penanganan siswa pendaftar baru (*skip expired overdue assignments*), dan auto-update status penugasan saat sesi belajar diselesaikan.

4. **`weekly-reports` Module**:
   - `weekly-reports.routes.ts` & `weekly-reports.service.ts`: Cron/scheduled job untuk menyusun `WeeklyReportSummary` (payload JSON & format HTML ringkasan) untuk Orang Tua dan Guru, serta job pembersihan otomatis (retensi 1 tahun untuk audit log UU PDP & 12 bulan untuk laporan mingguan).

5. **`access-audit` Middleware**:
   - `student-access-audit.interceptor.ts`: Interceptor transparan Fastify yang mengeksekusi pencatatan log pada `StudentDataAccessLog` setiap kali data siswa diakses oleh Orang Tua atau Guru.

---

## 3. Detailed Data Retention & Late Enrollment Logic

### A. Late Enrollment Policy (`assignments.service.ts`)
```typescript
async function enrollStudentToClass(classId: string, studentUserId: string) {
  // 1. Create class enrollment
  await prisma.studentClassEnrollment.create({ data: { classId, studentUserId } });

  // 2. Fetch active/future assignments only (due_date >= NOW())
  const activeAssignments = await prisma.lessonAssignment.findMany({
    where: { classId, dueDate: { gte: new Date() } },
  });

  // 3. Create assignment progress records only for active assignments
  if (activeAssignments.length > 0) {
    await prisma.studentAssignmentProgress.createMany({
      data: activeAssignments.map((assignment) => ({
        assignmentId: assignment.id,
        studentUserId,
        status: 'NOT_STARTED',
      })),
    });
  }
}
```

### B. Audit Log Cleanup Job (`weekly-reports.service.ts`)
```typescript
async function cleanupExpiredAuditLogsAndReports() {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Delete access audit logs older than 1 year (UU PDP retention limit)
  await prisma.studentDataAccessLog.deleteMany({
    where: { createdAt: { lt: oneYearAgo } },
  });

  // Delete weekly reports older than 12 months
  await prisma.weeklyReportSummary.deleteMany({
    where: { createdAt: { lt: twelveMonthsAgo } },
  });
}
```

---

## 4. Database Migration Steps

1. Tambahkan Enum `AssignmentStatus`, `RiskLevel`, `RiskReason`, `AccessType` ke `apps/api/prisma/schema.prisma`.
2. Tambahkan Model `ParentalControlSetting`, `LessonAssignment`, `StudentAssignmentProgress`, `WeeklyReportSummary`, dan `StudentDataAccessLog`.
3. Jalankan command migration: `pnpm --filter api exec prisma migrate dev --name add_parent_teacher_dashboards`.
4. Jalankan generator Prisma client: `pnpm --filter api exec prisma generate`.

---

## 5. Verification & Testing Strategy

### Unit & Integration Tests (`apps/api/src/__tests__/`)
1. **Parent Authorization Guard Test**: Memastikan Orang Tua HANYA bisa membaca data anak berstatus `ParentChildLink.ACTIVE` dan mendapat 403 Forbidden untuk anak lain.
2. **Teacher Authorization Guard Test**: Memastikan Guru HANYA bisa mengakses kelas miliknya.
3. **Audit Log Verification Test**: Memastikan setiap panggilan endpoint dasbor menghasilkan record baru pada `StudentDataAccessLog`.
4. **Daily Time Limit Enforcement Test**: Memastikan endpoint `POST /api/v1/learning/sessions` menolak pembuatan sesi jika `today_learning_seconds >= daily_time_limit_minutes * 60` pada zona waktu lokal siswa.
5. **CSV Sanitization Test**: Memastikan string `=SUM(1+2)` diawali petik `'` pada output CSV.
6. **Late Enrollment Test**: Memastikan siswa baru tidak mendapatkan penugasan yang sudah melewati `due_date`.

### Frontend UI Verification (`apps/web`)
1. Pengujian antarmuka Dasbor Orang Tua: ringkasan progres anak, topik terkuat/terlemah, aktivitas terbaru, modal pengaturan kontrol orang tua.
2. Pengujian antarmuka Dasbor Guru: daftar siswa kelas, penanda "Perlu Pendampingan", tabel analisis butir soal, modal buat penugasan, dan pengunduhan CSV.
