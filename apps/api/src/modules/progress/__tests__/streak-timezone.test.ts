import { describe, it, expect } from 'vitest';
import { getLocalDateString, isNextCalendarDay, isSameCalendarDay, getDaysDifference } from '../timezone.util';

describe('Timezone Util & Daily Streak Calculation', () => {
  it('harus memformat tanggal kalender lokal berdasarkan zona waktu profil siswa', () => {
    // 2026-08-27 15:30 UTC -> 2026-08-27 22:30 WIB (Asia/Jakarta)
    // 2026-08-27 15:30 UTC -> 2026-08-27 23:30 WITA (Asia/Makassar)
    // 2026-08-27 15:30 UTC -> 2026-08-28 00:30 WIT (Asia/Jayapura)
    const dateUtc = new Date('2026-08-27T15:30:00Z');

    const wibStr = getLocalDateString(dateUtc, 'Asia/Jakarta');
    const witaStr = getLocalDateString(dateUtc, 'Asia/Makassar');
    const witStr = getLocalDateString(dateUtc, 'Asia/Jayapura');

    expect(wibStr).toBe('2026-08-27');
    expect(witaStr).toBe('2026-08-27');
    expect(witStr).toBe('2026-08-28');
  });

  it('harus mendeteksi hari kalender yang sama', () => {
    expect(isSameCalendarDay('2026-08-27', '2026-08-27')).toBe(true);
    expect(isSameCalendarDay('2026-08-27', '2026-08-28')).toBe(false);
  });

  it('harus mendeteksi hari kalender berurutan (Next Calendar Day)', () => {
    expect(isNextCalendarDay('2026-08-27', '2026-08-28')).toBe(true);
    expect(isNextCalendarDay('2026-08-27', '2026-08-29')).toBe(false);
  });

  it('harus menghitung selisih hari kalender untuk proteksi Pembeku Waktu', () => {
    expect(getDaysDifference('2026-08-27', '2026-08-29')).toBe(2); // Terlewat tepat 1 hari kalender
    expect(getDaysDifference('2026-08-27', '2026-08-30')).toBe(3); // Terlewat > 1 hari
  });
});
