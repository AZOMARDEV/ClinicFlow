import { addDays, differenceInYears, format, parseISO, startOfWeek } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/** All dates are shown and entered in the clinic's time zone, whatever the browser's zone is. */
export const CLINIC_TZ = import.meta.env.VITE_APP_TIMEZONE ?? 'Africa/Casablanca';

const fmt = (iso: string, pattern: string) => formatInTimeZone(iso, CLINIC_TZ, pattern);

export const formatTime = (iso: string) => fmt(iso, 'HH:mm');
export const formatDayShort = (iso: string) => fmt(iso, 'EEE d MMM');
export const formatDayLong = (iso: string) => fmt(iso, 'EEE d MMM yyyy');
export const formatDateTime = (iso: string) => fmt(iso, "EEE d MMM yyyy 'at' HH:mm");
export const formatCreated = (iso: string) => fmt(iso, 'd MMM yyyy');

/** Today as YYYY-MM-DD in the clinic time zone. */
export const todayISO = () => formatInTimeZone(new Date(), CLINIC_TZ, 'yyyy-MM-dd');

/** Adds days to a YYYY-MM-DD string. */
export const addDaysISO = (date: string, days: number) =>
  formatInTimeZone(addDays(fromZonedTime(`${date}T12:00:00`, CLINIC_TZ), days), CLINIC_TZ, 'yyyy-MM-dd');

/** Long label for a YYYY-MM-DD date, e.g. "Wednesday, 30 September 2026". */
export const formatDateLabel = (date: string) =>
  formatInTimeZone(fromZonedTime(`${date}T12:00:00`, CLINIC_TZ), CLINIC_TZ, 'EEEE, d MMMM yyyy');

/** Birth dates are plain calendar dates: format without any time zone conversion. */
export const formatBirthDate = (date: string) => {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

export const ageFrom = (birthDate: string) => differenceInYears(parseISO(todayISO()), parseISO(birthDate));

/** Converts a `datetime-local` value (wall-clock time in the clinic) to an ISO timestamp with offset. */
export const clinicLocalToISO = (value: string) => fromZonedTime(value, CLINIC_TZ).toISOString();

/** Current clinic wall-clock time in `datetime-local` format, useful as the input's min. */
export const nowClinicLocal = () => formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd'T'HH:mm");

// ---- Calendar helpers: a YYYY-MM-DD string <-> a local Date at midnight (what the date picker works with) ----

export const isoToDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const dateToIso = (date: Date) => format(date, 'yyyy-MM-dd');
export const formatIso = (iso: string, pattern: string) => format(isoToDate(iso), pattern);
/** Monday of the week containing the given day */
export const weekStartIso = (iso: string) => dateToIso(startOfWeek(isoToDate(iso), { weekStartsOn: 1 }));

/** Calendar day (YYYY-MM-DD) and wall-clock time (HH:mm) of an appointment in the clinic time zone */
export const clinicDayOf = (iso: string) => formatInTimeZone(iso, CLINIC_TZ, 'yyyy-MM-dd');
export const clinicTimeOf = (iso: string) => formatInTimeZone(iso, CLINIC_TZ, 'HH:mm');

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const greeting = () => {
  const hour = Number(formatInTimeZone(new Date(), CLINIC_TZ, 'H'));
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};
