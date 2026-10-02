// npm run test:pdf
// Fills the template with a deliberately awkward sample (long answers, emoji,
// accents, 6 medications, a minor) and writes both PDFs to ./tmp for a visual
// check. No email is sent and nothing leaves the machine.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fillPacket } from "../app/lib/pdf/fillPacket.js";
import { normalizeAnswers, validateAll } from "../app/lib/validate.js";
import { ALL_FIELDS } from "../app/forms/index.js";

const LONG = "I've been feeling overwhelmed for most of this year. It started after a job change in January and got worse when my sleep fell apart. ".repeat(6).trim();
// 1×1 transparent PNG stands in for a drawn signature when no real one is supplied.
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const raw = {};
for (const { field } of ALL_FIELDS) {
  switch (field.type) {
    case "yesno": raw[field.id] = "yes"; break;
    case "radio": raw[field.id] = field.id.startsWith("phq9_") ? String((Number(field.id.split("_")[1]) || 2) % 4) : field.options[field.options.length - 1].value; break;
    case "select": raw[field.id] = field.options[0]; break;
    case "checks": raw[field.id] = field.options.map((o) => o.value); break;
    case "ack": raw[field.id] = true; break;
    case "signature": raw[field.id] = PNG; break;
    case "tel": raw[field.id] = "(734) 555-0142"; break;
    case "zip": raw[field.id] = "48185"; break;
    case "email": raw[field.id] = "sample.patient@example.com"; break;
    case "date": raw[field.id] = "2010-03-09"; break; // minor → guardian paths
    case "textarea": raw[field.id] = field.id === "presenting_concerns" ? LONG : `Sample answer for “${field.label}” — naïve café 😊\nSecond line.`; break;
    case "medications": raw[field.id] = Array.from({ length: 6 }, (_, i) => ({ name: `Medication ${i + 1}`, dose: `${(i + 1) * 10} mg daily`, reason: "Dr. Example / mood" })); break;
    default: raw[field.id] = field.id.startsWith("substance_") ? "2–3 drinks on weekends; last use Saturday; heavier use in 2021 for about six months" : `Sample ${field.label}`.slice(0, 60);
  }
}

const answers = normalizeAnswers(raw);
const problems = validateAll(answers);
if (problems.length) { console.error("Validation problems:", problems); process.exit(1); }

const templateBytes = await readFile(new URL("../templates/therapy-intake.pdf", import.meta.url));
const phq9Bytes = await readFile(new URL("../templates/phq9.pdf", import.meta.url));
const out = await fillPacket({ templateBytes, phq9Bytes, answers, today: "2026-10-02", practicePhone: "(734) 555-0100", practiceEmail: "office@example.com" });
await mkdir(new URL("../tmp/", import.meta.url), { recursive: true });
await writeFile(new URL("../tmp/clinic-copy.pdf", import.meta.url), out.clinicBytes);
await writeFile(new URL("../tmp/patient-copy.pdf", import.meta.url), out.patientBytes);
console.log(`OK — ${out.pageCount} pages, ${out.addendumItems} addendum item(s). See ./tmp`);
