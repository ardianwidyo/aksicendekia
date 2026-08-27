# Implementation Tasks: Dasbor Orang Tua dan Guru AksiCendekia

**Feature Branch**: `007-parent-teacher-dashboards`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/spec.md)
**Plan**: [plan.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/plan.md)

---

## Phase 1: Database Schema & Migrations

- [x] **Task 1.1**: Update `apps/api/prisma/schema.prisma` with new Enums (`AssignmentStatus`, `RiskLevel`, `RiskReason`, `AccessType`).
- [x] **Task 1.2**: Add models `ParentalControlSetting`, `LessonAssignment`, `StudentAssignmentProgress`, `WeeklyReportSummary`, and `StudentDataAccessLog`.
- [x] **Task 1.3**: Execute Prisma migration / schema sync for new models.
- [x] **Task 1.4**: Run `pnpm --filter api exec prisma generate` to refresh Prisma Client types.

---

## Phase 2: Relational Authorization Guards & Access Audit Logging

- [x] **Task 2.1**: Implement `ParentChildLinkGuard` in Fastify to strictly verify active parent-child link before allowing access to student data.
- [x] **Task 2.2**: Implement `TeacherClassGuard` to strictly verify teacher ownership (`class.teacher_id = current_user.id`) before allowing access to class data.
- [x] **Task 2.3**: Implement `logStudentAccess` audit helper in `apps/api/src/common/audit/audit-access-logger.ts` to log all parent/teacher reads and writes to `StudentDataAccessLog`.
- [x] **Task 2.4**: Add unit tests and type checks for authorization guards and audit log insertion.

---

## Phase 3: Parent Dashboard & Parental Controls API

- [x] **Task 3.1**: Implement `GET /api/v1/parent/children` to list linked children for an active parent.
- [x] **Task 3.2**: Implement `GET /api/v1/parent/children/:studentId/summary` calculating total learning time, lessons completed, accuracy, streak, strongest & weakest subjects.
- [x] **Task 3.3**: Implement `GET /api/v1/parent/children/:studentId/activities` to list recent learning sessions chronologically.
- [x] **Task 3.4**: Implement `PUT /api/v1/parent/children/:studentId/controls` to configure daily time limit minutes and privacy lock.
- [x] **Task 3.5**: Integrate daily learning time limit check into `POST /api/v1/learning/sessions` in `SessionService.createSession`, resetting at 00:00 student local timezone (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`).

---

## Phase 4: Teacher Dashboard, Assignments, Item Analysis & CSV Export API

- [x] **Task 4.1**: Implement `GET /api/v1/teacher/classes` to list teacher's classes.
- [x] **Task 4.2**: Implement `GET /api/v1/teacher/classes/:classId/students` with behind student detection algorithm (`LOW_ACCURACY`, `LOW_ACTIVITY`, `OVERDUE_ASSIGNMENT`).
- [x] **Task 4.3**: Implement `GET /api/v1/teacher/classes/:classId/item-analysis` returning accuracy per question item sorted by error rate descending.
- [x] **Task 4.4**: Implement `POST /api/v1/teacher/assignments` to assign lessons to a class with a due date and create initial student assignment progress records.
- [x] **Task 4.5**: Implement late enrollment handler in `assignments.service.ts` to skip past expired overdue assignments when enrolling new students.
- [x] **Task 4.6**: Implement `GET /api/v1/teacher/assignments/:assignmentId` to monitor assignment completion status per student.
- [x] **Task 4.7**: Integrate auto-update of assignment status (`COMPLETED`/`SUBMITTED`) upon learning session completion.
- [x] **Task 4.8**: Implement `GET /api/v1/teacher/classes/:classId/export-csv` with CSV formula injection sanitization (`'` prefixing).

---

## Phase 5: Weekly Report Aggregation Engine & Cleanup Jobs

- [x] **Task 5.1**: Implement `WeeklyReportService.generateWeeklySummaries()` aggregating 7-day performance metrics for parents and teachers.
- [x] **Task 5.2**: Store report JSON payloads in `WeeklyReportSummary` table.
- [x] **Task 5.3**: Implement `GET /api/v1/parent/children/:studentId/weekly-reports` to read historical weekly report payloads (up to 12 months).
- [x] **Task 5.4**: Implement automated cleanup function purging `StudentDataAccessLog` records older than 365 days (UU PDP 1-year audit retention) and `WeeklyReportSummary` records older than 12 months.

---

## Phase 6: Frontend UI Components & Pages (`apps/web`)

- [x] **Task 6.1**: Build Parent Dashboard page (`/parent-dashboard`) displaying child list cards, learning metrics summary, strongest/weakest subject widgets, and recent activities.
- [x] **Task 6.2**: Build Parental Controls modal allowing parents to adjust daily time limit dropdown (15m, 30m, 45m, 60m, 90m, 120m, Unlimited) and toggle privacy lock.
- [x] **Task 6.3**: Build Teacher Dashboard page (`/teacher-dashboard`) with class overview tabs: Student List, Item Accuracy Analysis, and Assignments.
- [x] **Task 6.4**: Build "Behind Student" badge component ("Perlu Pendampingan") with tooltip detailing risk reasons.
- [x] **Task 6.5**: Build Create Assignment modal and Assignment Monitoring View.
- [x] **Task 6.6**: Build Item Accuracy Analysis table with progress bars for error rates.
- [x] **Task 6.7**: Add CSV Export button triggering download.

---

## Phase 7: Verification & Testing

- [x] **Task 7.1**: Write end-to-end integration tests verifying parent-child access isolation and audit logging.
- [x] **Task 7.2**: Write end-to-end integration tests verifying teacher-class access isolation and CSV sanitization.
- [x] **Task 7.3**: Write unit tests for late enrollment assignment filtering and timezone-aware daily limit enforcement.
- [x] **Task 7.4**: Run `next build` and type checks across workspace to ensure zero regression.
