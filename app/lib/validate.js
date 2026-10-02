// ─────────────────────────────────────────────────────────────────────────────
// app/lib/validate.js — one set of rules for the browser AND the API route.
// The browser validates a step at a time; the server re-validates everything
// (never trust the client) after normalizing the payload.
// ─────────────────────────────────────────────────────────────────────────────
import { ALL_FIELDS } from "../forms/index.js";
import { LIMITS } from "./config.js";
import { withDerived } from "./derive.js";
import { isValidPhone, isValidZip, PHONE_ERROR, ZIP_ERROR } from "./validators.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PNG_RE = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;
const MAX_SIGNATURE_CHARS = 400_000; // ~300 KB PNG

export const isVisible = (field, a) => !field.showIf || !!field.showIf(a);
export const isRequired = (field, a) => !!field.required || (!!field.requiredIf && !!field.requiredIf(a));

export function isEmpty(field, v) {
  if (field.type === "checks") return !Array.isArray(v) || v.length === 0;
  if (field.type === "ack") return v !== true;
  if (field.type === "medications") return !Array.isArray(v) || !v.some((r) => r && (r.name || r.dose || r.reason));
  return v === undefined || v === null || String(v).trim() === "";
}

// Returns a message, or null when the field is fine. `a` must include derived values.
export function validateField(field, a) {
  if (!field.id || !isVisible(field, a)) return null;
  const v = a[field.id];
  if (isEmpty(field, v)) {
    return isRequired(field, a) ? field.requiredMessage || "Please complete this before continuing." : null;
  }
  switch (field.type) {
    case "tel":   return isValidPhone(v) ? null : PHONE_ERROR;
    case "zip":   return isValidZip(v) ? null : ZIP_ERROR;
    case "email": return EMAIL_RE.test(String(v).trim()) ? null : "That email doesn't look complete. Check for a missing @ or ending such as .com.";
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) return "Enter the date as month, day, and year.";
      if (v > a._today) return "This date is in the future. Please check it.";
      if (v < "1900-01-01") return "Please check the year.";
      return null;
    }
    case "signature": return PNG_RE.test(v) && v.length <= MAX_SIGNATURE_CHARS ? null : "Please clear the box and sign again.";
    default: return null;
  }
}

export function validateStep(step, answers) {
  const a = withDerived(answers);
  const errors = {};
  for (const field of step.fields) {
    const msg = validateField(field, a);
    if (msg) errors[field.id] = msg;
  }
  return errors;
}

export function validateAll(answers) {
  const a = withDerived(answers);
  const out = [];
  for (const { field, formIndex, stepIndex } of ALL_FIELDS) {
    const message = validateField(field, a);
    if (message) out.push({ id: field.id, formIndex, stepIndex, message });
  }
  return out;
}

// ── Server-side payload hygiene ──────────────────────────────────────────────
const str = (v, max) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");

function coerce(field, v) {
  switch (field.type) {
    case "textarea": return str(v, LIMITS.textarea);
    case "yesno":    return v === "yes" || v === "no" ? v : "";
    case "radio":    return field.options.some((o) => o.value === v) ? v : "";
    case "select":   return field.options.includes(v) ? v : "";
    case "checks":   return Array.isArray(v) ? field.options.map((o) => o.value).filter((x) => v.includes(x)) : [];
    case "ack":      return v === true;
    case "signature": return typeof v === "string" && v.length <= MAX_SIGNATURE_CHARS && PNG_RE.test(v) ? v : "";
    case "medications":
      return (Array.isArray(v) ? v : [])
        .slice(0, LIMITS.medications)
        .map((r) => ({ name: str(r?.name, 120), dose: str(r?.dose, 120), reason: str(r?.reason, 120) }))
        .filter((r) => r.name || r.dose || r.reason);
    default:         return str(v, LIMITS.text);
  }
}

// Keeps only known fields, coerces types, and blanks anything the patient can
// no longer see (e.g. a "describe" box left filled after switching Yes → No).
export function normalizeAnswers(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const clean = {};
  for (const { field } of ALL_FIELDS) clean[field.id] = coerce(field, src[field.id]);
  const a = withDerived(clean);
  for (const { field } of ALL_FIELDS) {
    if (!isVisible(field, a)) clean[field.id] = coerce(field, undefined);
  }
  return clean;
}
