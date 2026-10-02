// PDF page 1 — New Client Intake
// (The "Practice information" block is filled by the server from config/env.)
import { LOCATIONS } from "../../lib/config.js";

const isMinor = (a) => a._age !== null && a._age < 18;

export default {
  id: "client-information",
  label: "About you",
  pdfPage: 1,
  steps: [
    {
      title: "Let's start with your details",
      fields: [
        ...(LOCATIONS.length
          ? [{ id: "clinic_location", type: "select", label: "Which office will you be visiting?", options: LOCATIONS, required: true, requiredMessage: "Choose the office you plan to visit." }]
          : []),
        { id: "client_legal_name", type: "text", label: "Legal name", pdf: "client_legal_name", required: true, autoComplete: "name", requiredMessage: "Add your legal name so we can match your records." },
        { id: "client_preferred_name", type: "text", label: "Preferred name", pdf: "client_preferred_name", half: true },
        { id: "date_of_birth", type: "date", label: "Date of birth", pdf: "date_of_birth", required: true, half: true, autoComplete: "bday", requiredMessage: "Add your date of birth to continue." },
        { id: "pronouns", type: "text", label: "Pronouns", pdf: "pronouns", half: true },
        { id: "gender_identity", type: "text", label: "Gender identity", pdf: "gender_identity", half: true },
      ],
    },
    {
      title: "How can we reach you?",
      fields: [
        { id: "address", type: "text", label: "Street address", pdf: "address", autoComplete: "street-address" },
        { id: "city", type: "text", label: "City", pdf: "city", third: true, autoComplete: "address-level2" },
        { id: "state", type: "text", label: "State", pdf: "state", third: true, autoComplete: "address-level1" },
        { id: "zip", type: "zip", label: "ZIP code", pdf: "zip", third: true, autoComplete: "postal-code" },
        { id: "client_phone", type: "tel", label: "Phone", pdf: "client_phone", required: true, half: true, autoComplete: "tel", requiredMessage: "Add a phone number where we can reach you." },
        { id: "client_email", type: "email", label: "Email", hint: "We'll send a copy of your completed forms here.", pdf: "client_email", half: true, autoComplete: "email" },
        {
          id: "contact_methods", type: "checks", label: "Preferred contact method", inline: true,
          options: [
            { value: "phone",  label: "Phone",         pdf: "contact_phone" },
            { value: "text",   label: "Text",          pdf: "contact_text" },
            { value: "email",  label: "Email",         pdf: "contact_email" },
            { value: "portal", label: "Client portal", pdf: "contact_portal" },
          ],
        },
        { id: "voicemail", type: "yesno", label: "May the practice leave a voicemail identifying itself?", pdf: "voicemail" },
      ],
    },
    {
      title: "Who should we contact in an emergency?",
      fields: [
        { id: "emergency_name", type: "text", label: "Emergency contact name", pdf: "emergency_name" },
        { id: "emergency_relationship", type: "text", label: "Relationship to you", pdf: "emergency_relationship", half: true },
        { id: "emergency_phone", type: "tel", label: "Their phone", pdf: "emergency_phone", half: true },
        { type: "heading", text: "Parent or guardian", note: "Only needed if you are under 18 or have a legal guardian." },
        { id: "guardian_name", type: "text", label: "Parent / guardian name", pdf: "guardian_name", requiredIf: isMinor, requiredMessage: "Because you are under 18, add a parent or guardian's name." },
        { id: "guardian_relationship", type: "text", label: "Relationship to you", pdf: "guardian_relationship", half: true },
        { id: "guardian_phone", type: "tel", label: "Their phone", pdf: "guardian_phone", half: true },
      ],
    },
  ],
};
