// ─────────────────────────────────────────────────────────────────────────────
// app/lib/config.js — everything the clinic may want to change, in one place.
// Imported by both the browser and the API route, so keep secrets out of here
// (those live in .env — see .env.example).
// ─────────────────────────────────────────────────────────────────────────────

export const CLINIC = {
  name:      "Cambridge Psychiatry and Behavioral Institute",
  shortName: "Cambridge Psychiatry",
  timezone:  "America/Detroit", // "today" on the PDF is the clinic's date, not the server's
};

// How / where the patient will be seen — the first question in the packet.
// Only entries with enabled:true are offered. Hamtramck and Roseville are kept
// here, switched off, so they can be turned back on later by changing one word.
//   printAs   → printed next to the practice name on page 1 and in the clinic email
//   phone     → printed in "Practice information" on page 1 and in the patient email
//   phoneFrom → borrow another entry's phone (virtual visits use Westland's)
// If the resulting phone is blank, the PRACTICE_PHONE env variable is used.
export const LOCATIONS = [
  { value: "Westland",  label: "In person at our Westland office",  printAs: "Westland",      inPerson: true,  phone: "(734) 742-5700", enabled: true },
  { value: "Virtual",   label: "Virtual visit (online)",            printAs: "Virtual visit", inPerson: false, phoneFrom: "Westland", enabled: true },
  { value: "Hamtramck", label: "In person at our Hamtramck office", printAs: "Hamtramck",     inPerson: true,  phone: "(313) 826-0680", enabled: false },
  { value: "Roseville", label: "In person at our Roseville office", printAs: "Roseville",     inPerson: true,  phone: "(586) 929-1044", enabled: false },
];

export const activeLocations = () => LOCATIONS.filter((l) => l.enabled);

export function locationInfo(value) {
  const loc = LOCATIONS.find((l) => l.value === value);
  if (!loc) return null;
  const phone = loc.phone || LOCATIONS.find((l) => l.value === loc.phoneFrom)?.phone || "";
  return { ...loc, phone };
}

// Page 9 asks the patient to confirm they RECEIVED these documents. Each
// acknowledgment is only mandatory when its link is set, because a patient
// should never be forced to tick a statement that isn't true.
export const POLICY_LINKS = {
  officePolicies: "", // informed consent + office policies (ack 2)
  privacyNotice:  "", // Notice of Privacy Practices (ack 3)
  fees:           "", // fees, billing, cancellation and no-show policy (ack 6)
};

// Draft auto-save (localStorage on the patient's own device).
export const DRAFT = {
  key:      "cp-therapy-intake-draft-v1",
  ttlHours: 24,
  // Sections listed here are never written to the device. A patient who
  // returns after closing the tab is taken back to redo them. (Single fields
  // can opt out with noDraft:true — PHQ-9 item 9 does.)
  excludeForms: ["safety-screening"],
};

// Static notice on the safety-screening section and on PHQ-9 item 9. This is a placeholder until
// the clinic's own crisis / after-hours procedure is agreed — edit the text or
// set enabled:false.
export const CRISIS_NOTICE = {
  enabled: true,
  text:
    "These answers are read by your clinician before your first visit, not right away. " +
    "If you are in immediate danger or thinking about ending your life, call or text 988 " +
    "(Suicide & Crisis Lifeline) or call 911.",
};

// Never shown to patients and never filled by the server. They stay as live,
// typeable fields in the clinic's copy of the PDF.
export const CLINICIAN_FIELDS = [
  "clinician_risk_action",
  "clinician_signature",
  "clinician_signature_date",
  "clinician_impression",
  "initial_plan",
  "disposition_outpatient",
  "disposition_more_assessment",
  "disposition_referral",
];

export const LIMITS = { text: 200, textarea: 4000, medications: 10 };
