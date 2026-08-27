# Data Model Specification: Dasbor Orang Tua dan Guru AksiCendekia

**Feature Branch**: `007-parent-teacher-dashboards`
**Date**: 2026-08-27
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/007-parent-teacher-dashboards/spec.md)

---

## 1. Prisma Schema Amendments

Modul ini menambah entitas baru pada `apps/api/prisma/schema.prisma` serta memperbarui relasi pada entitas `User`, `Class`, dan `Lesson`.

```prisma
// ==========================================
// Enums for Parent & Teacher Dashboards
// ==========================================

enum AssignmentStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  OVERDUE
}

enum RiskLevel {
  ON_TRACK
  BEHIND
}

enum RiskReason {
  LOW_ACCURACY
  LOW_ACTIVITY
  OVERDUE_ASSIGNMENT
}

enum AccessType {
  READ_PARENT_DASHBOARD
  READ_CHILD_SUMMARY
  READ_CHILD_ACTIVITIES
  UPDATE_PARENTAL_CONTROLS
  READ_TEACHER_DASHBOARD
  READ_CLASS_STUDENTS
  READ_ITEM_ANALYSIS
  CREATE_ASSIGNMENT
  READ_ASSIGNMENT_PROGRESS
  EXPORT_CLASS_CSV
  READ_WEEKLY_REPORT
}

// ==========================================
// Parental Control Settings Model
// ==========================================

model ParentalControlSetting {
  id                    String   @id @default(uuid())
  studentUserId         String   @unique @map("student_user_id")
  parentUserId          String   @map("parent_user_id")
  dailyTimeLimitMinutes Int?     @map("daily_time_limit_minutes") // 15, 30, 45, 60, 90, 120, or null (Unlimited)
  isPrivacyLocked       Boolean  @default(false) @map("is_privacy_locked")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  studentUser User @relation("StudentParentalSettings", fields: [studentUserId], references: [id], onDelete: Cascade)
  parentUser  User @relation("ParentConfiguredSettings", fields: [parentUserId], references: [id], onDelete: Cascade)

  @@index([parentUserId])
  @@map("parental_control_settings")
}

// ==========================================
// Class Lesson Assignments Models
// ==========================================

model LessonAssignment {
  id             String   @id @default(uuid())
  classId        String   @map("class_id")
  teacherUserId  String   @map("teacher_user_id")
  lessonId       String   @map("lesson_id")
  title          String
  description    String?  @db.Text
  dueDate        DateTime @map("due_date")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  class              Class                      @relation(fields: [classId], references: [id], onDelete: Cascade)
  teacherUser        User                       @relation(fields: [teacherUserId], references: [id], onDelete: Cascade)
  lesson             Lesson                     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  studentProgresses  StudentAssignmentProgress[]

  @@index([classId, dueDate])
  @@index([teacherUserId])
  @@map("lesson_assignments")
}

model StudentAssignmentProgress {
  id            String           @id @default(uuid())
  assignmentId  String           @map("assignment_id")
  studentUserId String           @map("student_user_id")
  status        AssignmentStatus @default(NOT_STARTED)
  score         Int?             @default(0)
  accuracy      Float?           @default(0.0) // 0.0 to 100.0 %
  completedAt   DateTime?        @map("completed_at")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  assignment  LessonAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  studentUser User             @relation(fields: [studentUserId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, studentUserId])
  @@index([studentUserId, status])
  @@map("student_assignment_progresses")
}

// ==========================================
// Weekly Summary Data Reports Model
// ==========================================

model WeeklyReportSummary {
  id             String   @id @default(uuid())
  targetUserId   String   @map("target_user_id") // Parent or Teacher user ID
  targetRole     Role     @map("target_role")    // PARENT or TEACHER
  studentUserId  String?  @map("student_user_id")// Provided if report is child-specific
  classId        String?  @map("class_id")       // Provided if report is class-specific
  weekStartDate  DateTime @db.Date @map("week_start_date")
  weekEndDate    DateTime @db.Date @map("week_end_date")
  reportDataJson Json     @map("report_data_json") // Structure containing stats, top/weak topics, metrics
  createdAt      DateTime @default(now()) @map("created_at")

  targetUser  User   @relation("UserWeeklyReports", fields: [targetUserId], references: [id], onDelete: Cascade)
  studentUser User?  @relation("StudentWeeklyReports", fields: [studentUserId], references: [id], onDelete: SetNull)

  @@index([targetUserId, weekStartDate])
  @@index([studentUserId])
  @@map("weekly_report_summaries")
}

// ==========================================
// Student Data Access Audit Log Model
// ==========================================

model StudentDataAccessLog {
  id              String     @id @default(uuid())
  accessorUserId  String     @map("accessor_user_id")
  accessorRole    Role       @map("accessor_role")
  targetStudentId String     @map("target_student_id")
  accessType      AccessType @map("access_type")
  endpoint        String
  ipAddress       String     @map("ip_address")
  userAgent       String     @map("user_agent")
  createdAt       DateTime   @default(now()) @map("created_at")

  accessorUser  User @relation("LogAccessorUser", fields: [accessorUserId], references: [id], onDelete: Cascade)
  targetStudent User @relation("LogTargetStudent", fields: [targetStudentId], references: [id], onDelete: Cascade)

  @@index([targetStudentId, createdAt])
  @@index([accessorUserId, createdAt])
  @@map("student_data_access_logs")
}
```

---

## 2. Data Transfer Objects (DTOs)

### Parent Dashboard DTOs
```typescript
export interface ChildSummaryResponseDto {
  studentId: string;
  displayName: string;
  avatarId: string;
  educationStage: 'TK' | 'SD' | 'SMP' | 'SMA';
  gradeLevel: number;
  totalLearningMinutes: number;
  lessonsCompleted: number;
  averageAccuracy: number; // percentage 0-100
  currentStreak: number;
  strongestSubject: {
    subjectId: string;
    subjectName: string;
    accuracyRate: number;
  } | null;
  weakestSubject: {
    subjectId: string;
    subjectName: string;
    accuracyRate: number;
  } | null;
  parentalControl: {
    dailyTimeLimitMinutes: number | null; // null = Unlimited
    todayTimeSpentMinutes: number;
    isTimeLimitExceeded: boolean;
    isPrivacyLocked: boolean;
  };
}

export interface RecentActivityDto {
  sessionId: string;
  lessonId: string;
  lessonTitle: string;
  subjectName: string;
  durationMinutes: number;
  score: number;
  accuracy: number;
  xpEarned: number;
  completedAt: string; // ISO string
}

export interface UpdateParentalControlDto {
  dailyTimeLimitMinutes?: number | null; // e.g. 15, 30, 45, 60, 90, 120, null
  isPrivacyLocked?: boolean;
}
```

### Teacher Dashboard DTOs
```typescript
export interface ClassStudentProgressDto {
  studentId: string;
  displayName: string;
  avatarId: string;
  totalLearningMinutes: number;
  lessonsCompleted: number;
  averageAccuracy: number;
  riskStatus: 'ON_TRACK' | 'BEHIND';
  riskReasons: ('LOW_ACCURACY' | 'LOW_ACTIVITY' | 'OVERDUE_ASSIGNMENT')[];
  lastActiveAt: string | null;
}

export interface ItemAccuracyAnalysisDto {
  questionId: string;
  questionTextSnippet: string;
  lessonTitle: string;
  subjectName: string;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  accuracyRate: number; // Percentage 0 - 100
  mostCommonWrongAnswer?: string;
}

export interface CreateAssignmentDto {
  classId: string;
  lessonId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO DateTime
}

export interface AssignmentProgressSummaryDto {
  assignmentId: string;
  title: string;
  lessonTitle: string;
  dueDate: string;
  totalStudents: number;
  completedCount: number;
  inProgressCount: number;
  overdueCount: number;
  averageScore: number;
  students: {
    studentId: string;
    displayName: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'OVERDUE';
    score?: number;
    accuracy?: number;
    completedAt?: string;
  }[];
}
```

---

## 3. Risk Assessment & Behind Student Algorithm

Sebuah skrip/function service backend menghitung status risiko siswa secara otomatis:

```typescript
function calculateStudentRiskStatus(
  studentRecentAccuracy: number, // 5 sessions average accuracy
  student14DaysActivityMinutes: number,
  classAverage14DaysActivityMinutes: number,
  overdueAssignmentsCount: number
): { riskStatus: 'ON_TRACK' | 'BEHIND'; riskReasons: RiskReason[] } {
  const reasons: RiskReason[] = [];

  if (studentRecentAccuracy < 60) {
    reasons.push('LOW_ACCURACY');
  }

  if (
    classAverage14DaysActivityMinutes > 0 &&
    student14DaysActivityMinutes < 0.3 * classAverage14DaysActivityMinutes
  ) {
    reasons.push('LOW_ACTIVITY');
  }

  if (overdueAssignmentsCount > 0) {
    reasons.push('OVERDUE_ASSIGNMENT');
  }

  return {
    riskStatus: reasons.length > 0 ? 'BEHIND' : 'ON_TRACK',
    riskReasons: reasons,
  };
}
```

---

## 4. Audit Log Data Access Logging Interceptor

Mekanisme middleware/interceptor Fastify secara transparan mencatat setiap akses data siswa:

```typescript
async function logStudentDataAccess(ctx: {
  accessorUserId: string;
  accessorRole: Role;
  targetStudentId: string;
  accessType: AccessType;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
}) {
  await prisma.studentDataAccessLog.create({
    data: {
      accessorUserId: ctx.accessorUserId,
      accessorRole: ctx.accessorRole,
      targetStudentId: ctx.targetStudentId,
      accessType: ctx.accessType,
      endpoint: ctx.endpoint,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent || 'Unknown',
    },
  });
}
```
