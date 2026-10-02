// Email bodies. Deliberately minimal: the clinical content lives in the
// attached PDF, not in the message text.
import { CLINIC } from "./config.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const shell = (title, body) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2a37;">
    <div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0;border-bottom:4px solid #7d4f50;">
      <h2 style="color:#ffffff;margin:0;font-size:18px;">${esc(title)}</h2>
    </div>
    <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;font-size:14px;line-height:1.55;">
      ${body}
    </div>
  </div>`;

const row = (k, v) => (v ? `<tr><td style="padding:6px 0;color:#5b6777;width:110px;">${esc(k)}</td><td style="padding:6px 0;font-weight:600;">${esc(v)}</td></tr>` : "");

export function clinicEmail({ name, email, phone, location, addendumItems }) {
  return {
    subject: `New therapy intake packet: ${name}${location ? ` (${location})` : ""}`,
    html: shell("New client: therapy intake packet", `
      <p style="margin:0 0 12px;">A new client has completed the Therapy New Client Intake Packet. The PDF is attached.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Client", name)}${row("Phone", phone)}${row("Email", email)}${row("Location", location)}
      </table>
      <p style="margin:16px 0 0;color:#5b6777;font-size:13px;">
        The "Clinician use" boxes and clinician signature in this PDF are live form fields: open it in a PDF reader to type into them.
        ${addendumItems ? ` Long answers continue on the addendum page${addendumItems > 1 ? "s" : ""} at the end.` : ""}
      </p>`),
  };
}

export function patientEmail({ name, location, officePhone }) {
  const call = officePhone
    ? `please call ${location ? `our ${esc(location)} office` : "the office"} at <strong>${esc(officePhone)}</strong>`
    : "please call the office";
  return {
    subject: `Your intake forms were received: ${CLINIC.shortName}`,
    html: shell("Your forms have been received", `
      <p style="margin:0 0 12px;">Dear <strong>${esc(name)}</strong>,</p>
      <p style="margin:0 0 12px;">Thank you for completing your therapy intake forms. A copy is attached for your records.</p>
      <p style="margin:0 0 12px;">This mailbox is not monitored for urgent messages. If you have questions before your visit, ${call}.</p>
      <p style="margin:0;font-size:12px;color:#5b6777;">The attachment contains personal health information. Keep it somewhere private.</p>`),
  };
}
