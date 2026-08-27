# HTTP API Contract: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Feature Branch**: `006-daily-challenges-class-leaderboard`
**Base Path**: `/api/v1`

---

## 1. Daily Challenge Endpoints

### 1.1 Get Today's Daily Challenge
- **Endpoint**: `GET /api/v1/daily-challenges/today`
- **Auth**: JWT required (Role: `SISWA`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "dc_12345678-aaaa-bbbb-cccc-ddddeeeeffff",
    "educationStage": "SD",
    "challengeDate": "2026-08-27",
    "title": "Selesaikan 10 soal cerita dalam 5 menit",
    "description": "Jawab 10 soal cerita Kurikulum Merdeka berstatus Published secara akurat.",
    "targetType": "QUESTION_COUNT",
    "targetValue": 10,
    "currentProgress": 6,
    "rewardXp": 50,
    "rewardPowerupType": "HINT_TOKEN",
    "rewardPowerupQty": 1,
    "status": "IN_PROGRESS",
    "completedAt": null,
    "claimedAt": null
  }
}
```

---

### 1.2 Claim Daily Challenge Reward
- **Endpoint**: `POST /api/v1/daily-challenges/:challengeId/claim`
- **Auth**: JWT required (Role: `SISWA`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "challengeId": "dc_12345678-aaaa-bbbb-cccc-ddddeeeeffff",
    "status": "CLAIMED",
    "xpAwarded": 50,
    "powerupAwarded": {
      "type": "HINT_TOKEN",
      "quantity": 1
    },
    "claimedAt": "2026-08-27T13:30:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request` (`REWARD_ALREADY_CLAIMED`): Hadiah tantangan ini sudah pernah diklaim sebelumnya.
  - `400 Bad Request` (`CHALLENGE_NOT_COMPLETED`): Target tantangan belum tercapai (progres belum 100%).
  - `404 Not Found` (`CHALLENGE_NOT_FOUND`): ID tantangan tidak ditemukan.

---

## 2. Class Leaderboard Endpoints

### 2.1 Get Class Weekly Leaderboard
- **Endpoint**: `GET /api/v1/classes/:classId/leaderboard`
- **Auth**: JWT required (Role: `SISWA`, `GURU`, `ORANG_TUA`)
- **Query Params**:
  - `limit`: Optional number (default: 10)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "classId": "class_99887766-1122-3344-5566-77889900aabb",
    "className": "Kelas 4A SD Cendekia",
    "weekStartDate": "2026-08-24",
    "topStudents": [
      {
        "rank": 1,
        "displayName": "Bintang Cerdas",
        "avatarToken": "avatar_fox_01",
        "weeklyXp": 450
      },
      {
        "rank": 2,
        "displayName": "Kancil Pintar",
        "avatarToken": "avatar_bear_02",
        "weeklyXp": 380
      }
    ],
    "myRank": {
      "rank": 14,
      "displayName": "Garuda Muda",
      "avatarToken": "avatar_eagle_03",
      "weeklyXp": 120,
      "isHidden": false
    }
  }
}
```
- **Strict Privacy Rule Enforcement**:
  - TIDAK MENGEMBALIKAN `full_name`, `email`, `school_name`, `age`, atau `avatar_url` (foto asli).
  - Siswa yang mengaktifkan `is_hidden_from_leaderboard = true` TIDAK MUNCUL dalam array `topStudents` untuk siswa lain.
- **Error Responses**:
  - `403 Forbidden` (`FORBIDDEN_CLASS_ACCESS`): User bukan anggota atau pengajar kelas tersebut.

---

## 3. Student Privacy Setting Endpoints

### 3.1 Get Student Privacy Settings
- **Endpoint**: `GET /api/v1/students/me/privacy`
- **Auth**: JWT required (Role: `SISWA`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "studentUserId": "user_11112222-3333-4444-5555-666677778888",
    "isHiddenFromLeaderboard": false,
    "isPrivacyLocked": true,
    "updatedAt": "2026-08-27T10:00:00.000Z"
  }
}
```

---

### 3.2 Update Student Privacy Preference
- **Endpoint**: `PATCH /api/v1/students/me/privacy`
- **Auth**: JWT required (Role: `SISWA`)
- **Request Body**:
```json
{
  "isHiddenFromLeaderboard": true
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "studentUserId": "user_11112222-3333-4444-5555-666677778888",
    "isHiddenFromLeaderboard": true,
    "isPrivacyLocked": false,
    "updatedAt": "2026-08-27T13:35:00.000Z"
  }
}
```
- **Error Responses**:
  - `403 Forbidden` (`PRIVACY_SETTINGS_LOCKED_BY_PARENT`): Pengaturan privasi telah dikunci oleh orang tua. Siswa tidak diperkenankan mengubah pengaturan visibilitas.

---

### 3.3 Parent Toggle Privacy Lock
- **Endpoint**: `PATCH /api/v1/parents/students/:studentId/privacy-lock`
- **Auth**: JWT required (Role: `ORANG_TUA`)
- **Request Body**:
```json
{
  "isPrivacyLocked": true,
  "overrideIsHiddenFromLeaderboard": true
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "studentUserId": "user_11112222-3333-4444-5555-666677778888",
    "isHiddenFromLeaderboard": true,
    "isPrivacyLocked": true,
    "updatedAt": "2026-08-27T13:36:00.000Z"
  }
}
```
