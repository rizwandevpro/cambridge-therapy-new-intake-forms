// PDF page 2 — Presenting Concerns and Goals
const CONCERNS = [
  "Anxiety / worry", "Low mood", "Panic symptoms",
  "Trauma reactions", "Grief / loss", "Anger / irritability",
  "Mood changes", "Sleep problems", "Eating concerns",
  "Attention / focus", "Relationship conflict", "Family stress",
  "Work / school stress", "Substance use", "Compulsive behavior",
  "Self-esteem", "Identity concerns", "Life transition",
  "Chronic pain / illness", "Other",
]; // order = symptom_1 … symptom_20 on the PDF (row by row)

export default {
  id: "presenting-concerns",
  label: "What brings you here",
  pdfPage: 2,
  steps: [
    {
      title: "What brings you to therapy?",
      intro: "Describe what brings you to therapy and what you hope will change. A few words are fine.",
      fields: [
        { id: "presenting_concerns", type: "textarea", label: "What concerns or circumstances led you to seek therapy now?", pdf: "presenting_concerns" },
        { id: "concern_onset", type: "textarea", label: "When did these concerns begin, and how have they changed over time?", pdf: "concern_onset" },
      ],
    },
    {
      title: "Current concerns",
      intro: "Check all that apply.",
      fields: [
        {
          id: "current_concerns", type: "checks", label: "Current concerns", hideLabel: true, columns: true,
          options: CONCERNS.map((label, i) => ({ value: label === "Other" ? "other" : `c${i + 1}`, label, pdf: `symptom_${i + 1}` })),
        },
        { id: "symptoms_other", type: "textarea", rows: 2, label: "If other, please describe", pdf: "symptoms_other", showIf: (a) => (a.current_concerns || []).includes("other") },
      ],
    },
    {
      title: "Impact and goals",
      fields: [
        {
          id: "impact", type: "radio", label: "How much are these concerns affecting daily functioning?", inline: true,
          options: [
            { value: "none",     label: "Not at all", pdf: "impact_none" },
            { value: "mild",     label: "Mildly",     pdf: "impact_mild" },
            { value: "moderate", label: "Moderately", pdf: "impact_moderate" },
            { value: "severe",   label: "Severely",   pdf: "impact_severe" },
          ],
        },
        { id: "therapy_goals", type: "textarea", label: "What are your main goals for therapy?", pdf: "therapy_goals" },
        { id: "helpful_approaches", type: "textarea", label: "What has helped, even a little?", hint: "Include coping skills, supports, or prior strategies.", pdf: "helpful_approaches" },
      ],
    },
  ],
};
