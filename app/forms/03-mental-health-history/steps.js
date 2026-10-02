// PDF page 3 — Mental Health History
const PAST = [
  "Prolonged depression", "Severe anxiety / panic",
  "Traumatic event", "Flashbacks / nightmares",
  "Elevated / energized mood", "Little need for sleep",
  "Hallucinations", "Paranoia",
  "Disordered eating", "Compulsive behavior",
  "Attention difficulties", "Memory concerns",
]; // order = history_symptom_1 … 12 on the PDF (row by row)

export default {
  id: "mental-health-history",
  label: "Mental health history",
  pdfPage: 3,
  steps: [
    {
      title: "Previous services",
      fields: [
        { id: "prior_services", type: "yesno", label: "Have you previously received counseling, psychotherapy, or psychiatric care?", pdf: "prior_services" },
        { id: "prior_provider", type: "textarea", rows: 2, label: "Provider / program and approximate dates", pdf: "prior_provider", showIf: (a) => a.prior_services === "yes" },
        { id: "prior_helpful", type: "textarea", rows: 3, label: "What was helpful or unhelpful about prior treatment?", pdf: "prior_helpful", showIf: (a) => a.prior_services === "yes" },
      ],
    },
    {
      title: "Diagnoses and higher levels of care",
      fields: [
        { id: "prior_diagnoses", type: "textarea", rows: 2, label: "Current or past mental health diagnoses, if any", pdf: "prior_diagnoses" },
        { id: "higher_care", type: "yesno", label: "Any psychiatric hospitalization, crisis, residential care, or intensive outpatient care?", pdf: "higher_care" },
        { id: "higher_care_details", type: "textarea", rows: 3, label: "Describe when, where, and the reason", pdf: "higher_care_details", showIf: (a) => a.higher_care === "yes" },
      ],
    },
    {
      title: "Symptoms experienced in the past",
      intro: "Check any that have occurred, even if not current.",
      fields: [
        {
          id: "history_symptoms", type: "checks", label: "Symptoms experienced in the past", hideLabel: true, columns: true,
          options: PAST.map((label, i) => ({ value: `h${i + 1}`, label, pdf: `history_symptom_${i + 1}` })),
        },
        { id: "history_notes", type: "textarea", rows: 3, label: "Additional details, approximate dates, triggers, or patterns", pdf: "history_notes" },
      ],
    },
    {
      title: "Family mental health history",
      fields: [
        { id: "family_mental_health", type: "textarea", label: "Mental health, substance use, suicide, or psychiatric treatment history in biological relatives", pdf: "family_mental_health" },
      ],
    },
  ],
};
