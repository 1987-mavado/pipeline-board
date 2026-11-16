const pad = (n: number) => String(n).padStart(2, '0');

/** Heutiges Datum als YYYY-MM-DD in lokaler Zeit */
export function todayISODate(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Ganze Kalendertage zwischen einem ISO-Zeitstempel und jetzt */
export function daysSince(iso: string, now = new Date()): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function formatDays(n: number): string {
  if (n === 0) return 'heute';
  if (n === 1) return '1 tag';
  return `${n} tage`;
}

/** YYYY-MM-DD oder ISO-Zeitstempel → TT.MM.JJJJ */
export function formatDate(value: string): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function daysAgo(n: number, now = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}
