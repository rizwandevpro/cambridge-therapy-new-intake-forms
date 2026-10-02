// ─────────────────────────────────────────────────────────────────────────────
// app/forms/index.js — single source of truth for the packet.
//
// Order of this array = order the patient sees = order of pages in the PDF.
// Each form is a plain data file (steps → fields). The same definitions drive
// the UI (FormRenderer), validation (lib/validate.js) and the PDF fill
// (lib/pdf/fillPacket.js), so a field is declared exactly once.
// ─────────────────────────────────────────────────────────────────────────────
import clientInformation   from "./01-client-information/steps.js";
import presentingConcerns  from "./02-presenting-concerns/steps.js";
import mentalHealthHistory from "./03-mental-health-history/steps.js";
import medicalHistory      from "./04-medical-history/steps.js";
import substanceWellness   from "./05-substance-wellness/steps.js";
import familyDailyLife     from "./06-family-daily-life/steps.js";
import safetyScreening     from "./07-safety-screening/steps.js";
import informedConsent     from "./08-informed-consent/steps.js";
import acknowledgments     from "./09-acknowledgments/steps.js";

export const FORMS = [
  clientInformation,
  presentingConcerns,
  mentalHealthHistory,
  medicalHistory,
  substanceWellness,
  familyDailyLife,
  safetyScreening,
  informedConsent,
  acknowledgments,
];

export const TOTAL_FORMS = FORMS.length;

// Every answerable field with the form/step it lives in.
export const ALL_FIELDS = FORMS.flatMap((form, formIndex) =>
  form.steps.flatMap((step, stepIndex) =>
    step.fields.filter((f) => f.id).map((field) => ({ field, form, formIndex, stepIndex }))
  )
);
