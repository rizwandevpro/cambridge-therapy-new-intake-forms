// PDF page 9 — Acknowledgments and Signatures
// ("Clinician signature", "Clinician use" and "Disposition" are never shown.)
import { POLICY_LINKS } from "../../lib/config.js";

const isMinor = (a) => a._age !== null && a._age < 18;
const ACK_MSG = "Tick this box to continue, or contact the office if you have questions about it.";

export default {
  id: "acknowledgments",
  label: "Acknowledgments and signature",
  pdfPage: 9,
  steps: [
    {
      title: "Client acknowledgments",
      intro: "Tick each statement you agree with.",
      fields: [
        { id: "ack_1", type: "ack", label: "The information I provided is accurate to the best of my knowledge.", pdf: "ack_1", required: true, requiredMessage: ACK_MSG },
        { id: "ack_2", type: "ack", label: "I received and reviewed the practice's finalized informed consent and office policies.", pdf: "ack_2", link: POLICY_LINKS.officePolicies, linkText: "Read the office policies", required: !!POLICY_LINKS.officePolicies, requiredMessage: ACK_MSG },
        { id: "ack_3", type: "ack", label: "I received or was offered the practice's Notice of Privacy Practices.", pdf: "ack_3", link: POLICY_LINKS.privacyNotice, linkText: "Read the Notice of Privacy Practices", required: !!POLICY_LINKS.privacyNotice, requiredMessage: ACK_MSG },
        { id: "ack_4", type: "ack", label: "I understand confidentiality and its limits.", pdf: "ack_4", required: true, requiredMessage: ACK_MSG },
        { id: "ack_5", type: "ack", label: "I understand how to seek emergency help and that routine messages are not crisis services.", pdf: "ack_5", required: true, requiredMessage: ACK_MSG },
        { id: "ack_6", type: "ack", label: "I understand fees, billing, cancellation, and no-show policies.", pdf: "ack_6", link: POLICY_LINKS.fees, linkText: "Read the fee and cancellation policy", required: !!POLICY_LINKS.fees, requiredMessage: ACK_MSG },
        { id: "ack_7", type: "ack", label: "I consent to evaluation and psychotherapy services and may ask questions or withdraw consent.", pdf: "ack_7", required: true, requiredMessage: ACK_MSG },
      ],
    },
    {
      title: "Sign and send",
      fields: [
        { id: "client_signature", type: "text", signatureStyle: true, label: "Client signature", hint: "Type your full legal name to sign electronically.", pdf: "client_signature", required: true, requiredMessage: "Type your full legal name to sign." },
        { id: "client_relationship", type: "text", label: "Relationship to client, if not self", pdf: "client_relationship" },
        { id: "guardian_signature", type: "text", signatureStyle: true, label: "Parent / guardian signature", hint: "A parent or guardian types their full legal name here.", pdf: "guardian_signature", showIf: (a) => isMinor(a) || !!a.guardian_name, requiredIf: isMinor, requiredMessage: "A parent or guardian needs to sign because the client is under 18." },
        { type: "today", label: "Date" }, // client_signature_date / guardian_signature_date are stamped by the server
      ],
    },
  ],
};
