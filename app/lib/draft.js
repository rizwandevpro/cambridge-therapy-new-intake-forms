// ─────────────────────────────────────────────────────────────────────────────
// app/lib/draft.js — auto-saved draft on the patient's own device.
//
// • Stored in localStorage so it survives a closed tab, with an expiry
//   (DRAFT.ttlHours) so it doesn't sit on a shared computer indefinitely.
// • Signatures and anything in DRAFT.excludeForms are never written. When a
//   returning patient had already passed one of those, resumePosition() sends
//   them back to it so the final packet can't go out with that part blank.
// • Cleared on successful submit and by "Clear my answers".
// ─────────────────────────────────────────────────────────────────────────────
import { ALL_FIELDS, FORMS } from "../forms/index.js";
import { DRAFT } from "./config.js";

const notStored = ({ field, form }) =>
  DRAFT.excludeForms.includes(form.id) || field.type === "signature" || field.signatureStyle;

const SKIP_IDS = new Set(ALL_FIELDS.filter(notStored).map(({ field }) => field.id));

const before = (a, b) => a.f < b.f || (a.f === b.f && a.s < b.s);

export function resumePosition(saved) {
  let pos = saved;
  for (const item of ALL_FIELDS.filter(notStored)) {
    const p = { f: item.formIndex, s: DRAFT.excludeForms.includes(item.form.id) ? 0 : item.stepIndex };
    if (before(p, pos)) pos = p;
  }
  return pos;
}

export function saveDraft({ answers, pos }) {
  try {
    const kept = Object.fromEntries(Object.entries(answers).filter(([id]) => !SKIP_IDS.has(id)));
    localStorage.setItem(DRAFT.key, JSON.stringify({ savedAt: Date.now(), pos, answers: kept }));
    return true;
  } catch {
    return false; // private mode / storage full — the form still works, just without a draft
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT.key);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const fresh = d && typeof d.savedAt === "number" && Date.now() - d.savedAt < DRAFT.ttlHours * 3600_000;
    const f = Number(d?.pos?.f), s = Number(d?.pos?.s);
    if (!fresh || !d.answers || !FORMS[f] || !FORMS[f].steps[s]) { clearDraft(); return null; }
    return { answers: d.answers, pos: resumePosition({ f, s }), savedAt: d.savedAt };
  } catch {
    clearDraft();
    return null;
  }
}

export function clearDraft() {
  try { localStorage.removeItem(DRAFT.key); } catch { /* nothing to clear */ }
}
