// Values the patient never types: today's date (clinic timezone) and age.
import { CLINIC } from "./config.js";

export function todayISO(timeZone = CLINIC.timezone) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function calcAge(dobISO, today = todayISO()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dobISO || ""));
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!m || !t) return null;
  let age = Number(t[1]) - Number(m[1]);
  if (`${t[2]}${t[3]}` < `${m[2]}${m[3]}`) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

// Answers + derived values. showIf / requiredIf predicates receive this object.
export function withDerived(answers, today = todayISO()) {
  return { ...answers, _today: today, _age: calcAge(answers.date_of_birth, today) };
}
