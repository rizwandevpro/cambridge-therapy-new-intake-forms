# Cambridge Psychiatry — Therapy New Client Intake

Digitized version of the 9-page **Therapy New Client Intake Packet** plus the **PHQ-9**. Patients complete ten short sections in sequence; the server fills the clinic's PDFs into one combined file (packet pages 1-9, PHQ-9 as page 10, then any addendum), emails it to the clinic and the patient (Resend), and offers a download.

Sister project to the existing patient-forms app (`mdq-form-app`): same stack (Next.js 16 App Router, React 19, pdf-lib, Resend), same sequential flow, same Lora + Source Sans 3 look, recoloured to navy `#1e3a5f` / rosewood `#7d4f50`.

## Run it

```bash
npm install
cp .env.example .env.local     # add RESEND_API_KEY etc.
npm run dev                    # http://localhost:3000
npm run test:pdf               # fills a stress-test sample → ./tmp/*.pdf (no email)
```

Without `RESEND_API_KEY`, `npm run dev` runs in **dry-run** mode: the PDF is built and downloadable, no email is sent, and the final screen says so. In production a missing key is an error.

Env changes are only read at startup: restart `npm run dev` after editing `.env.local`. In dev, if Resend rejects an email, its reason is printed in the terminal (`[submit-intake] …`) and shown on screen; in production it is logged only.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CLINIC_EMAIL` | Where packets are delivered |
| `FROM_EMAIL` | Verified sender on the Resend domain |
| `PRACTICE_EMAIL` | Printed in "Practice information" on page 1 |
| `PRACTICE_PHONE` | Fallback only. Phone numbers are set per location in `LOCATIONS` (`app/lib/config.js`); the selected location's number is printed on page 1 and in the patient email |

Everything else the clinic may want to change (locations, policy links, draft lifetime, crisis notice text) is in `app/lib/config.js`.

## How it fits together

```
app/
  patient-forms/page.js        the sequential flow (welcome → 10 forms → send → done)
  forms/
    index.js                   FORMS array: the order the patient sees
    01-client-information/steps.js   … one folder per form/page
    …
    07-phq9/steps.js           PHQ-9 (asked 7th, printed as page 10)
    …
    10-acknowledgments/steps.js
  components/
    FormRenderer.js            draws any step from a steps.js definition
    SignaturePad.js            draw or type; exports a trimmed PNG
  lib/
    config.js                  clinic settings
    validate.js                rules shared by browser and server
    draft.js                   auto-save (localStorage, 24 h expiry)
    derive.js                  today's date (clinic timezone), age from DOB
    email.js                   clinic + patient email bodies
    pdf/fillPacket.js          AcroForm fill, overflow handling, addendum pages
    pdf/phq9.js                PHQ-9 marks, column sums and total (coordinate-based)
  api/submit-intake/route.js   validate → fill PDF → email → return patient copy
templates/therapy-intake.pdf   the blank AcroForm (never served publicly)
templates/phq9.pdf             the blank PHQ-9 (flat image, no form fields)
scripts/test-fill.mjs          PDF smoke test
```

### Where this differs from the reference app, and why

| Reference app | This project | Reason |
| --- | --- | --- |
| `*ImageMapper.js` per form with hand-measured X/Y pixels on a JPG | No coordinates at all. `fillPacket.js` looks fields up **by name** in the PDF and reads each rectangle from the file | The new PDF is an AcroForm with 173 named fields |
| PDF built in the browser (canvas → JPEG → jsPDF), uploaded as base64 | Browser sends answers as JSON; the **server** builds the PDF | Small request, vector/searchable output, server never trusts a client-made PDF |
| One PDF per form, merged at the end | One template filled once | The packet is already a single 9-page document |
| Each form is a hand-written component (`*Form.js`) | Each form is a data file (`steps.js`) rendered by one `FormRenderer` | Every screen behaves identically; a field is declared once and drives UI, validation and PDF |
| No draft saving | Auto-saved draft with expiry | Requested |
| Patient name/email written to server logs | Nothing about the patient is logged | PHI |

## Changing things

**Add or edit a question:** edit the form's `steps.js`. A field's `pdf` value is the AcroForm field name in the template. Types: `text`, `tel`, `zip`, `email`, `date`, `textarea`, `select`, `yesno` (→ `<pdf>_yes` / `<pdf>_no`), `radio` and `checks` (each option has its own `pdf`), `ack`, `signature`, `medications`, plus display-only `info`, `heading`, `today`. Use `showIf` / `requiredIf` for conditional fields.

**Replace the PDF template:** field *names* must stay the same; positions can move freely. The clinic's export has a quirk (an incremental update with a generation-1 catalog) that pdf-lib re-saves incorrectly, so normalize any new export once:

```bash
qpdf --object-streams=disable new-export.pdf templates/therapy-intake.pdf
npm run test:pdf     # fails loudly if a field name the app expects is missing
```

**Long answers:** text shrinks from 9 pt to 7 pt to fit its box; anything longer is cut with "[Continued in addendum, item N]" and printed in full on an addendum page. Medications beyond the 4 printed rows also go to the addendum.

**Characters:** the PDF uses standard Helvetica (Latin only). Accents and curly quotes print; emoji and non-Latin scripts are replaced with "?". Embedding a Unicode font is the fix if the clinic needs other scripts.

## Locations

The first question is "How will you be seen?" with the entries in `LOCATIONS` (`config.js`) that have `enabled: true`: currently **Westland (in person)** and **Virtual visit**. Hamtramck and Roseville are still defined, with `enabled: false`; flip that to bring one back. Virtual visits print the Westland phone number (`phoneFrom: "Westland"`).

## PHQ-9

`templates/phq9.pdf` has no form fields (it is an image), so `app/lib/pdf/phq9.js` places the ticks by coordinates measured from that file. If the clinic replaces the PHQ-9 PDF with a different layout, those coordinates must be re-measured; `npm run test:pdf` shows the result on page 10. The column sums and TOTAL are calculated on the server and printed only when all nine items are answered (the UI requires all nine). The score is never shown to the patient.

Item 9 (thoughts of death or self-harm) shows the same static crisis notice as the safety screening and is never saved in the device draft.

## The two PDFs

- **Clinic copy** — patient answers are drawn into the page and cannot be edited. The "Clinician use" boxes, disposition checkboxes and clinician signature (`CLINICIAN_FIELDS` in `config.js`) remain live form fields, so the clinician can type into them in any PDF reader.
- **Patient copy** — fully flattened.

## Draft saving

Answers are saved to `localStorage` on the patient's device as they type, expire after `DRAFT.ttlHours` (24), and are erased on submit or via "Clear my answers". Signatures, the safety-screening section (`DRAFT.excludeForms`) and PHQ-9 item 9 (`noDraft`) are never written to the device; a returning patient who had already passed them is taken back to re-enter them. To persist the safety section too, set `excludeForms: []`.

## Open decisions for the clinic

1. **Safety screening (page 7) and PHQ-9 item 9.** Built as on the PDFs. The only addition is a static notice (`CRISIS_NOTICE` in `config.js`) saying answers are not read immediately and pointing to 988 / 911. Still to decide: what the UI does on a *current-risk* "Yes", who monitors the inbox, and how fast. See the TODO in `app/forms/08-safety-screening/steps.js`. The same decision applies to a non-zero answer on PHQ-9 item 9.
2. **Policy documents.** Page 9 asks patients to confirm they *received* the office policies, Notice of Privacy Practices and fee policy. Those three ticks are optional until their URLs are set in `POLICY_LINKS`; once set, the link is shown and the tick becomes required.
3. **Template wording.** Page 8 still contains template language ("this template does not replace…", "The practice must provide its crisis and after-hours procedure"). The on-screen consent text mirrors the PDF word for word; change both together.
4. **Westland phone number** (`LOCATIONS` in `config.js`) and the practice email (`PRACTICE_EMAIL`) for page 1.
5. **Email and PHI.** Completed packets are emailed as attachments, as in the reference app. Confirm the clinic's agreement with Resend covers this.
