# Quickstart Guide: Dasbor Orang Tua dan Guru AksiCendekia

**Feature Branch**: `007-parent-teacher-dashboards`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/spec.md)

---

## 1. Prerequisites & Environment Setup

Ensure you are working inside the `aksicendekia` root directory with Node.js v18+ and pnpm installed.

```bash
# Checkout feature branch (if using git branch)
git checkout -b 007-parent-teacher-dashboards

# Run database migrations
pnpm --filter api exec prisma migrate dev --name add_parent_teacher_dashboards

# Generate Prisma Client
pnpm --filter api exec prisma generate
```

---

## 2. Seed Test Data

Run the database seed script to populate test accounts for parents, teachers, classes, and students:

```bash
pnpm --filter api run seed:parent-teacher
```

This populates:
- **Parent User**: `orangtua@aksicendekia.id` / `Password123!` (Linked to 2 students: Budi & Siti)
- **Teacher User**: `guru@aksicendekia.id` / `Password123!` (Owner of Class "4-A SD N 1 Jakarta")
- **Student User A**: `budi@aksicendekia.id` (Active learner, 45 mins today)
- **Student User B**: `siti@aksicendekia.id` (Low accuracy student, flagged "Perlu Pendampingan")

---

## 3. Running Dev Server

```bash
# Start backend API and web frontend concurrently
pnpm dev
```

- API Server: `http://localhost:3001`
- Web App: `http://localhost:3000`

---

## 4. Testing Endpoints & User Flows

### A. Parent Dashboard Flow
1. Login as Parent (`orangtua@aksicendekia.id`).
2. Navigate to `/parent`.
3. Select child "Budi" -> Verify summary stats (learning time, lessons, streak, strongest/weakest subjects).
4. Click "Pengaturan Kontrol Orang Tua" -> Set daily limit to 30 minutes.
5. Log in as Budi -> Try starting a new learning session -> Verify `DAILY_TIME_LIMIT_EXCEEDED` error.

### B. Teacher Dashboard Flow
1. Login as Teacher (`guru@aksicendekia.id`).
2. Navigate to `/teacher`.
3. Open Class "4-A" -> Verify student list and check that "Siti" has badge "Perlu Pendampingan" (Reason: LOW_ACCURACY).
4. Click tab "Analisis Butir Soal" -> Check questions sorted by highest error rate.
5. Click "Buat Penugasan" -> Select Lesson "Pecahan Senilai", set due date in 3 days.
6. Click "Ekspor CSV Kelas" -> Verify file download `rekap-kelas-4A.csv`.

---

## 5. Audit Log Inspection

Check PostgreSQL table `student_data_access_logs` to verify that all access attempts were recorded:

```bash
pnpm --filter api exec prisma studio
```
Inspect table `student_data_access_logs` to confirm `accessor_user_id`, `target_student_id`, `access_type`, and `timestamp`.
