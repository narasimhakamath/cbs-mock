export const OFFSET_MINUTES = { IN: 5.5 * 60, AE: 4 * 60, BH: 3 * 60 };

export function getOffsetMinutes(countryCode) {
  return OFFSET_MINUTES[countryCode] || 0;
}

export function toLocalDate(date, countryCode) {
  return new Date(date.getTime() + getOffsetMinutes(countryCode) * 60 * 1000);
}

export function parseDDMMYYYY(str) {
  if (!str || str.length !== 8) return null;
  const day = Number(str.slice(0, 2));
  const month = Number(str.slice(2, 4));
  const year = Number(str.slice(4, 8));
  return { day, month, year };
}

export function formatDDMMYYYY(localDate) {
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const year = localDate.getUTCFullYear();
  return `${day}${month}${year}`;
}

export function localDayRangeToUtc(dateStr, countryCode, endOfDay) {
  const parts = parseDDMMYYYY(dateStr);
  if (!parts) return null;
  const offsetMs = getOffsetMinutes(countryCode) * 60 * 1000;
  const localMidnightUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day) + (endOfDay ? 24 * 60 * 60 * 1000 - 1 : 0);
  return new Date(localMidnightUtcMs - offsetMs);
}
