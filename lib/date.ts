const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Formats a date string or Date object deterministically across Server and Client.
 * Avoids React hydration mismatch caused by differences in ICU locales (e.g. "Sept" vs "Sep").
 * Output format: "12 Sep 2027"
 */
export function formatEditorialDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  const day = d.getUTCDate();
  const month = MONTH_SHORT[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  return `${day} ${month} ${year}`;
}
