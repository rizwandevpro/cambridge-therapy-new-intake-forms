// PDF page 6 — Family, Relationships, and Daily Life
const SHARE = "Share only what you are comfortable discussing today.";

export default {
  id: "family-daily-life",
  label: "Family and daily life",
  pdfPage: 6,
  steps: [
    {
      title: "Household and relationships",
      intro: SHARE,
      fields: [
        { id: "household", type: "textarea", label: "Who lives with you?", hint: "Include relationships and caregiving responsibilities.", pdf: "household" },
        { id: "relationship_support", type: "textarea", label: "Important relationships, supports, conflicts, or recent changes", pdf: "relationship_support" },
      ],
    },
    {
      title: "Education and employment",
      intro: SHARE,
      fields: [
        { id: "education", type: "textarea", rows: 3, label: "Education, current school or training, and learning needs", pdf: "education" },
        { id: "employment", type: "textarea", rows: 3, label: "Work status, occupation, workplace stress, or financial concerns", pdf: "employment" },
      ],
    },
    {
      title: "Background and identity",
      intro: SHARE,
      fields: [
        { id: "culture_identity", type: "textarea", label: "Cultural, racial, ethnic, religious, gender, sexuality, disability, or community identities important to care", pdf: "culture_identity" },
        { id: "developmental_history", type: "textarea", label: "Significant childhood, developmental, family, military, immigration, or life experiences", pdf: "developmental_history" },
      ],
    },
    {
      title: "Strengths and preferences",
      fields: [
        { id: "strengths", type: "textarea", label: "Strengths, interests, values, resources, and people you can rely on", pdf: "strengths" },
        { id: "treatment_preferences", type: "textarea", label: "Preferences, accommodations, or topics to approach carefully", pdf: "treatment_preferences" },
      ],
    },
  ],
};
