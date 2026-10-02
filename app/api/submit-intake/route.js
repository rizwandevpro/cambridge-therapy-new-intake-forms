// ─────────────────────────────────────────────────────────────────────────────
// app/api/submit-intake/route.js
//
// The browser sends ANSWERS (JSON), never a PDF. This route:
//   1. normalizes + re-validates every answer with the same rules as the UI
//   2. fills the AcroForm template (lib/pdf/fillPacket.js)
//   3. emails the clinic copy and the patient copy through Resend
//   4. returns the patient copy so the browser can offer a download
//
// Nothing is written to disk or a database, and no answers are logged.
//
// .env: RESEND_API_KEY, CLINIC_EMAIL, FROM_EMAIL, PRACTICE_EMAIL, PRACTICE_PHONE (fallback)
// Office phone numbers: LOCATION_PHONES in app/lib/config.js
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fillPacket } from "../../lib/pdf/fillPacket.js";
import { normalizeAnswers, validateAll } from "../../lib/validate.js";
import { todayISO } from "../../lib/derive.js";
import { clinicEmail, patientEmail } from "../../lib/email.js";
import { LOCATION_PHONES } from "../../lib/config.js";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_CHARS = 1_500_000;
const TEMPLATE = path.join(process.cwd(), "templates", "therapy-intake.pdf");

const fail = (status, error, extra = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

export async function POST(req) {
  let body;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) return fail(413, "too_large");
    body = JSON.parse(text);
  } catch {
    return fail(400, "bad_request");
  }

  // Honeypot: real patients never see or fill this field.
  if (body?.company) return NextResponse.json({ ok: true });

  const answers = normalizeAnswers(body?.answers);
  const errors = validateAll(answers);
  if (errors.length) return fail(422, "validation", { errors });

  const apiKey = process.env.RESEND_API_KEY;
  const dryRun = !apiKey;
  if (dryRun && process.env.NODE_ENV === "production") {
    console.error("[submit-intake] RESEND_API_KEY is not set");
    return fail(500, "email_not_configured");
  }

  try {
    const today = todayISO();
    // One email for the whole practice, one phone per office.
    const officePhone = LOCATION_PHONES[answers.clinic_location] || process.env.PRACTICE_PHONE || "";
    const { clinicBytes, patientBytes, addendumItems } = await fillPacket({
      templateBytes: await readFile(TEMPLATE),
      answers,
      today,
      practicePhone: officePhone,
      practiceEmail: process.env.PRACTICE_EMAIL || "",
    });

    const name = answers.client_legal_name;
    const safeName = name.normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "Client";
    const fileName = `Therapy-Intake-${safeName}-${today}.pdf`;

    let patientEmailSent = false;
    if (!dryRun) {
      const resend = new Resend(apiKey);
      const from = process.env.FROM_EMAIL || "Cambridge Psychiatry Forms <reports@cambridgemich.com>";
      const clinicTo = process.env.CLINIC_EMAIL || "reports@cambridgemich.com";

      // The clinic copy is the one that matters: if it fails, the patient is
      // told nothing was sent and can retry (their answers are still on screen).
      const c = clinicEmail({ name, email: answers.client_email, phone: answers.client_phone, location: answers.clinic_location, addendumItems });
      const clinicRes = await resend.emails.send({
        from, to: clinicTo, subject: c.subject, html: c.html,
        ...(answers.client_email ? { replyTo: answers.client_email } : {}),
        attachments: [{ filename: fileName, content: Buffer.from(clinicBytes) }],
      });
      if (clinicRes.error) {
        console.error("[submit-intake] clinic email failed:", clinicRes.error.name || "error");
        return fail(502, "send_failed");
      }

      if (answers.client_email) {
        const p = patientEmail({ name: answers.client_preferred_name || name, location: answers.clinic_location, officePhone });
        const patientRes = await resend.emails.send({
          from, to: answers.client_email, subject: p.subject, html: p.html,
          attachments: [{ filename: fileName, content: Buffer.from(patientBytes) }],
        });
        patientEmailSent = !patientRes.error;
        if (patientRes.error) console.error("[submit-intake] patient email failed:", patientRes.error.name || "error");
      }
    }

    return NextResponse.json({
      ok: true,
      fileName,
      pdfBase64: Buffer.from(patientBytes).toString("base64"),
      patientEmailSent,
      dryRun,
    });
  } catch (err) {
    // Log the failure, never the answers.
    console.error("[submit-intake] failed:", err?.message || err);
    return fail(500, "server_error");
  }
}
