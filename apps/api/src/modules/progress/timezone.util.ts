export function getLocalDateString(date: Date, timezone = 'Asia/Jakarta'): string {
  const validTimezone = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'].includes(timezone)
    ? timezone
    : 'Asia/Jakarta';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: validTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

export function isSameCalendarDay(dateStr1: string | null, dateStr2: string): boolean {
  if (!dateStr1) return false;
  return dateStr1 === dateStr2;
}

export function isNextCalendarDay(prevDateStr: string, currDateStr: string): boolean {
  const prev = new Date(prevDateStr + 'T00:00:00Z');
  const curr = new Date(currDateStr + 'T00:00:00Z');
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export function getDaysDifference(prevDateStr: string, currDateStr: string): number {
  const prev = new Date(prevDateStr + 'T00:00:00Z');
  const curr = new Date(currDateStr + 'T00:00:00Z');
  return Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
}
