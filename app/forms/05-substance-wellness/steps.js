// PDF page 5 — Substance Use and Wellness
const SUBSTANCES = [
  "Alcohol", "Cannabis", "Nicotine / vaping", "Medication not as directed",
  "Stimulants", "Opioids", "Sedatives", "Other substances",
]; // order = substance_1_details … substance_8_details

export default {
  id: "substance-wellness",
  label: "Substance use and wellness",
  pdfPage: 5,
  steps: [
    {
      title: "Current and past use",
      intro: "Responses support safe, nonjudgmental treatment planning. For each item, note current frequency and amount, last use, and any past periods of heavier use or concern. Leave blank or write \"none\" if it doesn't apply.",
      fields: SUBSTANCES.map((label, i) => ({
        id: `substance_${i + 1}_details`, type: "text", label, pdf: `substance_${i + 1}_details`, half: true,
      })),
    },
    {
      title: "Effects and recovery",
      fields: [
        { id: "substance_concern", type: "yesno", label: "Has substance use caused concern, affected responsibilities, or led to risky situations?", pdf: "substance_concern" },
        { id: "substance_concern_details", type: "textarea", label: "Describe concerns, treatment, supports, overdose history, or withdrawal symptoms", pdf: "substance_concern_details", showIf: (a) => a.substance_concern === "yes" },
      ],
    },
    {
      title: "Wellness and routines",
      fields: [
        { id: "wellness_routines", type: "textarea", rows: 3, label: "Exercise, nutrition, spiritual practices, hobbies, and restorative routines", pdf: "wellness_routines" },
        { id: "sleep_routine", type: "textarea", rows: 3, label: "Sleep schedule and factors that affect sleep", pdf: "sleep_routine" },
        { id: "legal_history", type: "textarea", rows: 3, label: "Legal matters, violence, impulsive behavior, or other concerns relevant to treatment", pdf: "legal_history" },
      ],
    },
  ],
};
