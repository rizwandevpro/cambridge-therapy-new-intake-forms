// PDF page 4 — Medical and Medication History
export default {
  id: "medical-history",
  label: "Health and medications",
  pdfPage: 4,
  steps: [
    {
      title: "Your health care",
      intro: "Share information that may affect emotional health or treatment planning.",
      fields: [
        { id: "pcp_name", type: "text", label: "Primary care clinician", pdf: "pcp_name", half: true },
        { id: "pcp_phone", type: "tel", label: "Their phone", pdf: "pcp_phone", half: true },
        { id: "pcp_coordinate", type: "yesno", label: "May care be coordinated after a separate written authorization?", pdf: "pcp_coordinate" },
        { id: "medical_conditions", type: "textarea", label: "Medical conditions, chronic pain, pregnancy, recent illness, or major injuries", pdf: "medical_conditions" },
        { id: "allergies", type: "textarea", rows: 2, label: "Medication or other allergies and reactions", pdf: "allergies" },
      ],
    },
    {
      title: "Sleep and appetite",
      fields: [
        {
          id: "sleep_quality", type: "radio", label: "Sleep quality", inline: true,
          options: [
            { value: "good", label: "Good", pdf: "sleep_good" },
            { value: "fair", label: "Fair", pdf: "sleep_fair" },
            { value: "poor", label: "Poor", pdf: "sleep_poor" },
          ],
        },
        { id: "sleep_hours", type: "text", label: "Average hours of sleep per night", pdf: "sleep_hours", half: true, inputMode: "decimal" },
        {
          id: "appetite", type: "radio", label: "Appetite", inline: true,
          options: [
            { value: "stable",    label: "Stable",    pdf: "appetite_stable" },
            { value: "increased", label: "Increased", pdf: "appetite_increased" },
            { value: "decreased", label: "Decreased", pdf: "appetite_decreased" },
          ],
        },
      ],
    },
    {
      title: "Medications and supplements",
      intro: "List prescriptions, over-the-counter products, vitamins, and supplements. Include dose, frequency, reason, and prescriber.",
      fields: [
        // Rows 1–4 land in med_N_name / med_N_dose / med_N_reason. Extra rows go to the addendum page.
        { id: "medications", type: "medications", label: "Medications and supplements", pdfRows: 4 },
      ],
    },
    {
      title: "Daily functioning",
      fields: [
        {
          id: "functioning", type: "checks", label: "Which of these apply to you?",
          options: [
            { value: "independent", label: "Independent with daily needs",       pdf: "function_1" },
            { value: "assistance",  label: "Needs some assistance",              pdf: "function_2" },
            { value: "change",      label: "Major recent change in functioning", pdf: "function_3" },
          ],
        },
        { id: "function_details", type: "textarea", rows: 3, label: "Explain limitations, accommodations, or accessibility needs", pdf: "function_details" },
      ],
    },
  ],
};
