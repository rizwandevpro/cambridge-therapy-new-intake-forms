// PDF page 7 — Safety Screening
// ("Clinician use" at the bottom of the page is never shown to the patient.)
//
// TODO (clinic decision, deferred): what happens when a patient answers "Yes"
// to a CURRENT-risk item — conditional crisis resources in the UI, who monitors
// the inbox, and how fast. For now the section shows the static CRISIS_NOTICE
// from app/lib/config.js and nothing else changes based on the answers.
const SELF = ["risk_si_current", "risk_si_past", "risk_plan_current", "risk_attempt_past", "risk_nssi_current", "risk_nssi_past"];
const OTHERS = ["risk_harm_others", "risk_victimization"];
const anyYes = (ids) => (a) => ids.some((id) => a[id] === "yes");

export default {
  id: "safety-screening",
  label: "Safety screening",
  pdfPage: 7,
  crisisNotice: true,
  steps: [
    {
      title: "Suicide and self-harm",
      intro: "We ask everyone these questions. Honest answers help your clinician support you.",
      fields: [
        { id: "risk_si_current",   type: "yesno", label: "Current thoughts of suicide or not wanting to live", pdf: "risk_si_current" },
        { id: "risk_si_past",      type: "yesno", label: "Suicide thoughts at any time in the past", pdf: "risk_si_past" },
        { id: "risk_plan_current", type: "yesno", label: "Current plan, intent, preparation, or access to intended means", pdf: "risk_plan_current" },
        { id: "risk_attempt_past", type: "yesno", label: "Past suicide attempt or interrupted / aborted attempt", pdf: "risk_attempt_past" },
        { id: "risk_nssi_current", type: "yesno", label: "Current urge to injure yourself without suicidal intent", pdf: "risk_nssi_current" },
        { id: "risk_nssi_past",    type: "yesno", label: "Past nonsuicidal self-injury", pdf: "risk_nssi_past" },
        { id: "suicide_details", type: "textarea", label: "Describe timing, frequency, plan, intent, means, attempts, care received, and what stopped you", pdf: "suicide_details", showIf: anyYes(SELF) },
      ],
    },
    {
      title: "Harm to others and interpersonal safety",
      fields: [
        { id: "risk_harm_others",   type: "yesno", label: "Current thoughts, intent, plan, or preparation to harm another person?", pdf: "risk_harm_others" },
        { id: "risk_victimization", type: "yesno", label: "Are you being threatened, abused, stalked, controlled, or made to feel unsafe?", pdf: "risk_victimization" },
        { id: "harm_safety_details", type: "textarea", label: "Describe immediate concerns and anyone else who may be at risk", pdf: "harm_safety_details", showIf: anyYes(OTHERS) },
      ],
    },
    {
      title: "Protective factors and immediate plan",
      fields: [
        { id: "protective_factors", type: "textarea", rows: 3, label: "Reasons for living, supports, coping skills, responsibilities, and safe places", pdf: "protective_factors" },
        { id: "means_safety", type: "textarea", rows: 3, label: "Access to firearms, large medication quantities, or other lethal means; note safety steps", pdf: "means_safety" },
      ],
    },
  ],
};
