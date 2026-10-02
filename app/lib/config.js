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

// Shown as the first question. The choice is printed next to the practice name
// on page 1 and included in the clinic email. Set to [] to hide the question.
export const LOCATIONS = ["Westland", "Hamtramck", "Roseville"];

// Each office has its own phone number. The number for the office the patient
// picked is printed in "Practice information" on page 1 and quoted in the
// patient's confirmation email. Keys must match LOCATIONS exactly. If an entry
// is blank, the PRACTICE_PHONE env variable is used as a fallback.
export const LOCATION_PHONES = {
  Westland:  "(734) 742-5700", // e.g. "(734) 555-0100"
  Hamtramck: "(313) 826-0680",
  Roseville: "(586) 929-1044",
};

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
  // returns after closing the tab is taken back to redo them.
  excludeForms: ["safety-screening"],
};

// Static notice on the safety-screening section. This is a placeholder until
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
