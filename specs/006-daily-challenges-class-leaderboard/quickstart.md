# Quickstart & Verification Guide: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Feature Branch**: `006-daily-challenges-class-leaderboard`
**Date**: 2026-08-27

---

## 1. Local Development Setup

### Prisma Schema Update & Migration
```bash
# Generate Prisma Client
pnpm --filter api exec prisma generate

# Execute DB migration
pnpm --filter api exec prisma migrate dev --name add_daily_challenges_and_privacy_settings
```

---

## 2. Automated Test Execution

### Running Backend Unit & Integration Tests
```bash
# Run feature unit tests in Vitest
pnpm --filter api test modules/daily-challenges

# Run with coverage runner
pnpm --filter api test --coverage modules/daily-challenges
```

---

## 3. Test Cases & Verification Checklist

| Test Suite | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| `daily-challenge.test.ts` | Generate 1 challenge per stage daily | Challenge created for TK, SD, SMP, SMA with `PUBLISHED` questions |
| `daily-challenge.test.ts` | Atomic claim reward | First claim awards XP/Power-up; second claim returns 400 `REWARD_ALREADY_CLAIMED` |
| `class-leaderboard.test.ts` | Fetch weekly class leaderboard | Returns Top 10 + Pinned Current Student rank; NO full_name or real photo URL |
| `class-leaderboard.test.ts` | Student enables opt-out | Hidden student completely omitted from other students' leaderboard responses |
| `privacy-setting.test.ts` | Parent locks privacy settings | Student patch request returns 403 `PRIVACY_SETTINGS_LOCKED_BY_PARENT` |
