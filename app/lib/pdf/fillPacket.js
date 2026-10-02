// ─────────────────────────────────────────────────────────────────────────────
// app/lib/pdf/fillPacket.js — server-side PDF generation.
//
// The template (templates/therapy-intake.pdf) is an AcroForm: every blank is a
// NAMED field that already knows its own rectangle. So there is no coordinate
// table to maintain — we look a field up by name, read its rectangle from the
// PDF, and draw the answer inside it. If the clinic re-exports the template
// with fields moved around, nothing here changes as long as the names survive.
//
// Why draw the text ourselves instead of calling field.setText()?
//   • Every text field in the template has MaxLen = 100, including the big
//     multi-line boxes. setText() would throw on a normal paragraph.
//   • We control wrapping and font size, so a long answer shrinks to fit, and
//     anything that still doesn't fit continues on an addendum page instead of
//     being clipped or squeezed.
//
// Output: two PDFs from one fill.
//   clinicBytes  — patient answers are drawn into the page (not editable);
//                  the "Clinician use" fields are left LIVE so the clinician
//                  can type into them in any PDF reader.
//   patientBytes — fully flattened copy for the patient.
// ─────────────────────────────────────────────────────────────────────────────
import * as pdfLibNS from "pdf-lib";
import { ALL_FIELDS } from "../../forms/index.js";
import { CLINIC, CLINICIAN_FIELDS } from "../config.js";
import { withDerived } from "../derive.js";
import { isVisible } from "../validate.js";
import { toUSDate } from "../formatDate.js";

// pdf-lib ships CJS + ESM; this works under both Next's bundler and plain Node.
const L = pdfLibNS.PDFDocument ? pdfLibNS : pdfLibNS.default;
const { PDFDocument, StandardFonts, rgb, LineCapStyle } = L;

const INK   = rgb(0.141, 0.2, 0.247);   // the template's own field text colour
const NAVY  = rgb(0.118, 0.227, 0.373); // #1e3a5f
const MUTED = rgb(0.38, 0.43, 0.5);
const PAD   = 3;                         // inner padding of a field box, in points
const MAX_SIZE = 9, MIN_MULTI = 7, MIN_SINGLE = 6.5;
const LEADING = 1.25;

// ── Text helpers ─────────────────────────────────────────────────────────────
// Standard Helvetica can only encode WinAnsi. Anything else (emoji, non-Latin
// scripts) would make pdf-lib throw, so unencodable characters are reduced to
// their closest Latin form or "?".
function makeSanitizer(font) {
  const ok = new Set(font.getCharacterSet());
  return (input) => {
    let out = "";
    for (const ch of String(input ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, " ")) {
      if (ch === "\n") { out += ch; continue; }
      const cp = ch.codePointAt(0);
      if (cp < 32) continue;
      if (ok.has(cp)) { out += ch; continue; }
      const base = [...ch.normalize("NFKD")].filter((c) => ok.has(c.codePointAt(0))).join("");
      out += base || "?";
    }
    return out;
  };
}

function wrapText(font, text, size, maxW) {
  const width = (s) => font.widthOfTextAtSize(s, size);
  const lines = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (let word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (width(test) <= maxW) { line = test; continue; }
      if (line) lines.push(line);
      while (width(word) > maxW) { // a single "word" wider than the box
        let i = word.length;
        while (i > 1 && width(word.slice(0, i)) > maxW) i--;
        lines.push(word.slice(0, i));
        word = word.slice(i);
      }
      line = word;
    }
    lines.push(line);
  }
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function fitSingle(font, text, w) {
  for (let size = MAX_SIZE; size >= MIN_SINGLE; size -= 0.5) {
    if (font.widthOfTextAtSize(text, size) <= w) return { size, text, overflow: false };
  }
  const size = 7.5;
  let t = text;
  while (t.length && font.widthOfTextAtSize(`${t}...`, size) > w) t = t.slice(0, -1);
  return { size, text: `${t.trimEnd()}...`, overflow: true };
}

function fitMulti(font, text, w, h, note) {
  for (let size = MAX_SIZE; size >= MIN_MULTI; size -= 0.5) {
    const lines = wrapText(font, text, size, w);
    if (lines.length * size * LEADING <= h) return { size, lines, overflow: false };
  }
  const size = 8;
  const max = Math.max(1, Math.floor(h / (size * LEADING)));
  const lines = wrapText(font, text, size, w).slice(0, Math.max(0, max - 1));
  lines.push(note);
  return { size, lines, overflow: true };
}

// ── What goes where ──────────────────────────────────────────────────────────
// Turns answers into three simple maps keyed by PDF field name.
function collectValues(answers, { today, practicePhone, practiceEmail }) {
  const a = withDerived(answers, today);
  const texts = new Map();   // name → { text, label }
  const checks = new Set();  // names to tick
  const images = new Map();  // name → PNG data URL
  const extras = [];         // addendum items that have no box of their own

  const setText = (name, text, label) => { if (text !== "" && text != null) texts.set(name, { text: String(text), label }); };

  for (const { field } of ALL_FIELDS) {
    const v = a[field.id];
    if (!isVisible(field, a) || v === undefined || v === null || v === "") continue;
    switch (field.type) {
      case "yesno":  checks.add(`${field.pdf}_${v}`); break;
      case "radio":  { const o = field.options.find((x) => x.value === v); if (o) checks.add(o.pdf); break; }
      case "checks": field.options.filter((o) => v.includes(o.value)).forEach((o) => checks.add(o.pdf)); break;
      case "ack":    if (v === true) checks.add(field.pdf); break;
      case "signature": images.set(field.pdf, v); break;
      case "date":   setText(field.pdf, toUSDate(v), field.label); break;
      case "medications": {
        v.slice(0, field.pdfRows).forEach((row, i) => {
          setText(`med_${i + 1}_name`, row.name, `Medication ${i + 1}`);
          setText(`med_${i + 1}_dose`, row.dose, `Medication ${i + 1} dose / frequency`);
          setText(`med_${i + 1}_reason`, row.reason, `Medication ${i + 1} reason / prescriber`);
        });
        const rest = v.slice(field.pdfRows);
        if (rest.length) {
          extras.push({
            label: "Additional medications and supplements", page: 4,
            text: rest.map((r) => [r.name, r.dose, r.reason].filter(Boolean).join("  |  ")).join("\n"),
          });
        }
        break;
      }
      default: if (field.pdf) setText(field.pdf, v, field.label);
    }
  }

  // Derived / practice values — never typed by the patient.
  const usToday = toUSDate(today);
  setText("practice_name", a.clinic_location ? `${CLINIC.name} (${a.clinic_location})` : CLINIC.name);
  setText("practice_phone", practicePhone);
  setText("practice_email", practiceEmail);
  setText("intake_date", usToday);
  if (a._age !== null) setText("age", String(a._age));
  setText("cambridge_consent_date", usToday);
  setText("client_signature_date", usToday);
  if (texts.has("guardian_signature")) setText("guardian_signature_date", usToday);

  return { texts, checks, images, extras };
}

// ── Addendum pages ───────────────────────────────────────────────────────────
function drawAddendum(doc, items, { font, bold, clientName, usToday, firstPageNo }) {
  const W = 612, H = 792, M = 42, BODY = 9.5, LH = BODY * 1.35;
  let page, y, pageNo = firstPageNo - 1;

  const newPage = () => {
    page = doc.addPage([W, H]);
    pageNo += 1;
    page.drawRectangle({ x: 0, y: H - 68, width: W, height: 68, color: NAVY });
    page.drawText("Addendum: continued responses", { x: M, y: H - 36, size: 17, font: bold, color: rgb(1, 1, 1) });
    page.drawText(`${clientName}   |   ${usToday}`, { x: M, y: H - 53, size: 8.5, font, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: M, y: 30 }, end: { x: W - 42, y: 30 }, thickness: 0.7, color: rgb(0.68, 0.73, 0.77) });
    page.drawText("Therapy New Client Intake Packet | Confidential clinical information", { x: M, y: 18, size: 7, font, color: MUTED });
    const pn = `Page ${pageNo}`;
    page.drawText(pn, { x: W - 42 - font.widthOfTextAtSize(pn, 7), y: 18, size: 7, font, color: MUTED });
    y = H - 68 - 28;
  };

  newPage();
  for (const item of items) {
    const heading = wrapText(bold, `Item ${item.n} (page ${item.page}): ${item.label}`, 10, W - 2 * M);
    if (y - heading.length * 13 - LH * 2 < 48) newPage();
    for (const line of heading) { page.drawText(line, { x: M, y, size: 10, font: bold, color: NAVY }); y -= 13; }
    y -= 3;
    for (const line of wrapText(font, item.text, BODY, W - 2 * M)) {
      if (y < 48) newPage();
      if (line) page.drawText(line, { x: M, y, size: BODY, font, color: INK });
      y -= LH;
    }
    y -= 14;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
export async function fillPacket({ templateBytes, answers, today, practicePhone = "", practiceEmail = "" }) {
  const doc  = await PDFDocument.load(templateBytes);
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = makeSanitizer(font);
  const pages = doc.getPages();

  // name → { field, page, pageNo, rect } straight from the template.
  const slots = new Map();
  for (const field of form.getFields()) {
    const widget = field.acroField.getWidgets()[0];
    const wRef = doc.context.getObjectRef(widget.dict);
    let idx = pages.findIndex((p) => p.ref === widget.P());
    if (idx < 0) idx = pages.findIndex((p) => p.node.Annots()?.asArray().includes(wRef));
    if (idx < 0) throw new Error(`Template field "${field.getName()}" is not attached to a page.`);
    slots.set(field.getName(), { field, page: pages[idx], pageNo: idx + 1, rect: widget.getRectangle() });
  }

  const { texts, checks, images, extras } = collectValues(answers, { today, practicePhone, practiceEmail });

  // A renamed or deleted field in a re-exported template should fail loudly,
  // not silently drop an answer.
  const missing = [...texts.keys(), ...checks, ...images.keys()].filter((n) => !slots.has(n));
  if (missing.length) throw new Error(`Template is missing expected field(s): ${missing.join(", ")}`);

  const addendum = [];
  const overflow = (label, pageNo, text) => { addendum.push({ n: addendum.length + 1, label, page: pageNo, text }); return addendum.length; };

  // Text
  for (const [name, { text, label }] of texts) {
    const { field, page, pageNo, rect } = slots.get(name);
    const w = rect.width - 2 * PAD, h = rect.height - 2 * PAD;
    const multiline = typeof field.isMultiline === "function" && field.isMultiline();
    if (multiline) {
      const value = clean(text);
      const n = addendum.length + 1;
      const fit = fitMulti(font, value, w, h, `[Continued in addendum, item ${n}]`);
      if (fit.overflow) overflow(label || name, pageNo, value);
      fit.lines.forEach((line, i) => {
        if (!line) return;
        page.drawText(line, { x: rect.x + PAD, y: rect.y + rect.height - PAD - fit.size * 0.8 - i * fit.size * LEADING, size: fit.size, font, color: INK });
      });
    } else {
      const value = clean(text).replace(/\s*\n\s*/g, " ");
      const fit = fitSingle(font, value, w);
      if (fit.overflow) overflow(label || name, pageNo, value);
      page.drawText(fit.text, { x: rect.x + PAD, y: rect.y + (rect.height - fit.size * 0.72) / 2, size: fit.size, font, color: INK });
    }
  }

  // Check marks
  for (const name of checks) {
    const { page, rect: r } = slots.get(name);
    const p = (fx, fy) => ({ x: r.x + r.width * fx, y: r.y + r.height * fy });
    const style = { thickness: Math.max(1.2, r.width * 0.14), color: INK, lineCap: LineCapStyle.Round };
    page.drawLine({ start: p(0.2, 0.5), end: p(0.42, 0.26), ...style });
    page.drawLine({ start: p(0.42, 0.26), end: p(0.82, 0.78), ...style });
  }

  // Drawn signature (PNG with transparent background)
  for (const [name, dataUrl] of images) {
    const { page, rect: r } = slots.get(name);
    const png = await doc.embedPng(Buffer.from(dataUrl.split(",")[1], "base64"));
    const size = png.scaleToFit(r.width - 8, r.height - 3);
    page.drawImage(png, { x: r.x + 4, y: r.y + (r.height - size.height) / 2, width: size.width, height: size.height });
  }

  // Answers with no box of their own (e.g. a 5th medication)
  for (const e of extras) overflow(e.label, e.page, clean(e.text));

  if (addendum.length) {
    drawAddendum(doc, addendum, {
      font, bold,
      clientName: clean(answers.client_legal_name || "Client"),
      usToday: toUSDate(today),
      firstPageNo: pages.length + 1,
    });
  }

  // Patient-facing fields are now ink on the page; drop the interactive
  // widgets so nothing can be edited. The printed boxes are part of the page
  // artwork, so they stay.
  for (const [name, { field }] of slots) {
    if (CLINICIAN_FIELDS.includes(name)) {
      if (typeof field.setMaxLength === "function") field.setMaxLength(undefined); // template caps every box at 100 chars
    } else {
      form.removeField(field);
    }
  }

  doc.setTitle("Therapy New Client Intake Packet");
  doc.setAuthor(CLINIC.name);
  doc.setProducer("Cambridge Psychiatry intake forms");

  // Classic cross-reference tables: larger than object streams, but readable
  // by every viewer (some mail-client previewers choke on xref streams).
  const SAVE = { useObjectStreams: false };
  const clinicBytes = await doc.save(SAVE);

  const flat = await PDFDocument.load(clinicBytes);
  flat.getForm().flatten();
  const patientBytes = await flat.save(SAVE);

  return { clinicBytes, patientBytes, addendumItems: addendum.length, pageCount: doc.getPageCount() };
}
