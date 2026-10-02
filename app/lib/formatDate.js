// ─────────────────────────────────────────────────────────────────────────────
// app/utils/formatDate.js — one date format for every PDF: MONTH/DAY/YEAR
//
// <input type="date"> stores "YYYY-MM-DD". Mappers must never draw that raw.
//   toUSDate("2026-10-02")                      → "10/02/2026"
//   toUSDate("2026-10-02", { shortYear: true }) → "10/02/26"
// Anything that is not an ISO date (free text, already formatted) is returned
// unchanged, so it is safe to wrap any date-ish value.
// ─────────────────────────────────────────────────────────────────────────────
export function toUSDate(val, { shortYear = false } = {}) {
  if (val === undefined || val === null || val === "") return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(val).trim());
  if (!m) return val;
  const [, y, mo, d] = m;
  return `${mo}/${d}/${shortYear ? y.slice(-2) : y}`;
}
