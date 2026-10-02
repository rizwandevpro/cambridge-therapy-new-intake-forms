// PDF page 8 — Informed Consent for Therapy
// The consent wording below is copied verbatim from the PDF: it must match the
// document the patient's signature is placed on. Change both together.
export default {
  id: "informed-consent",
  label: "Informed consent",
  pdfPage: 8,
  steps: [
    {
      title: "Informed consent for therapy",
      intro: "Read carefully and ask the clinician about anything that is unclear.",
      fields: [
        { type: "info", heading: "Nature of therapy", text: "Psychotherapy is a collaborative process intended to support emotional health, functioning, insight, and behavior change. Benefits cannot be guaranteed. Therapy may involve difficult experiences and can temporarily increase distress. Alternatives may include another clinician, a different approach, medication evaluation, group services, community supports, or no treatment." },
        { type: "info", heading: "Confidentiality and its limits", text: "Information shared in therapy is generally confidential. Exceptions may apply when disclosure is required or permitted by law, including suspected abuse or neglect, serious risk of harm, certain court orders, health oversight, emergencies, or other legally defined circumstances. The clinician will explain applicable limits. Insurance billing and coordination may require limited information with authorization or as otherwise permitted by law." },
        { type: "info", heading: "Emergencies and electronic communication", text: "Routine email, text, voicemail, and client portals may not be continuously monitored and may carry privacy risks. They should not be used for emergencies. The practice must provide its crisis and after-hours procedure. Telehealth can involve technology and privacy risks; safeguards, location requirements, backup plans, and emergency procedures should be reviewed before telehealth sessions." },
        { type: "info", heading: "Records, consultation, and coordination", text: "The practice maintains clinical and billing records as required by law and policy. Clinicians may consult with supervisors or other professionals while limiting identifying information when possible. Information may be shared with others only with a valid authorization or as allowed or required by law. Clients may ask how to access, amend, restrict, or obtain copies of records, subject to applicable law." },
        { type: "info", heading: "Client choice and treatment changes", text: "Participation is voluntary unless treatment is court ordered or subject to another legal condition. Clients may ask questions, request changes, decline a recommendation, seek a second opinion, or end therapy. The clinician may recommend referral, a higher level of care, or termination when needs exceed scope, safety requires more support, practice policies are not met, or treatment is no longer beneficial." },
      ],
    },
    {
      title: "Consent to treatment",
      fields: [
        { type: "info", heading: "Acknowledgment", text: "I have had the opportunity to ask questions. I understand that this template does not replace the practice's full Notice of Privacy Practices or state-specific informed consent. My signature below indicates consent to evaluation and treatment under the finalized practice policies provided to me." },
        { type: "info", heading: "Consent to Treatment at Cambridge Psychiatry", text: "I voluntarily agree to be seen, evaluated, and treated at Cambridge Psychiatry. I have reviewed the informed consent information above, had an opportunity to ask questions, and authorize Cambridge Psychiatry to provide behavioral health services to me." },
        { id: "cambridge_patient_signature", type: "signature", label: "Patient signature", pdf: "cambridge_patient_signature", required: true, requiredMessage: "Sign in the box above to give your consent." },
        { id: "cambridge_patient_printed_name", type: "text", label: "Printed patient name", pdf: "cambridge_patient_printed_name", required: true, defaultFrom: "client_legal_name", requiredMessage: "Add your printed name." },
        { type: "today", label: "Date" }, // cambridge_consent_date is stamped by the server
      ],
    },
  ],
};
