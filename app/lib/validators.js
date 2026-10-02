// ─────────────────────────────────────────────────────────────────────────────
// app/utils/validators.js — one phone / zip rule for every form
//
// PHONE (US): 10 digits, area code starting 2–9. A leading "1" / "+1"
// country code is accepted and dropped. Displayed as (555) 123-4567.
// ZIP (US):   5 digits, or ZIP+4 as 12345-6789.
//
// The *Input functions run on every keystroke: letters can't be typed at all.
// The isValid* functions run on Next/Submit: incomplete numbers are rejected.
// ─────────────────────────────────────────────────────────────────────────────

export const PHONE_ERROR = "Enter a valid 10-digit phone number, e.g. (555) 123-4567.";
export const ZIP_ERROR   = "Enter a valid 5-digit zip code (or ZIP+4, e.g. 48185-1234).";

function phoneDigits(v) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1); // drop +1 country code
  if (d.length <= 10 && d.startsWith("1")) d = d.slice(1); // US area codes never start with 1
  return d.slice(0, 10);
}

export function formatPhone(v) {
  const d = phoneDigits(v);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// prev = the field's current value. When the user is deleting, keep their
// raw text (minus letters) so backspace never gets "stuck" on ( ) or -.
export function formatPhoneInput(next, prev = "") {
  const clean = String(next || "").replace(/[^\d()\-\s.+]/g, "");
  if (clean.length < String(prev || "").length) return clean;
  return formatPhone(clean);
}

export function isValidPhone(v) {
  return /^[2-9]\d{9}$/.test(phoneDigits(v)) &&
         String(v || "").replace(/[\d()\-\s.+]/g, "") === "";
}

export function formatZipInput(next) {
  const d = String(next || "").replace(/\D/g, "").slice(0, 9);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function isValidZip(v) {
  return /^\d{5}(-\d{4})?$/.test(String(v || "").trim());
}
