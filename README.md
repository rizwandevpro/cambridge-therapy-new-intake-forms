# Cambridge Psychiatry — Therapy New Client Intake

Digitized version of the 9-page **Therapy New Client Intake Packet**. Patients complete nine short sections in sequence; the server fills the clinic's PDF, emails it to the clinic and the patient (Resend), and offers a download.

Sister project to the existing patient-forms app (`mdq-form-app`): same stack (Next.js 16 App Router, React 19, pdf-lib, Resend), same sequential flow, same Lora + Source Sans 3 look, recoloured to navy `#1e3a5f` / rosewood `#7d4f50`.

## Run it

```bash
npm install
cp .env.example .env.local     # add RESEND_API_KEY etc.
npm run dev                    # http://localhost:3000
npm run test:pdf               # fills a stress-test sample → ./tmp/*.pdf (no email)
```

Without `RESEND_API_KEY`, `npm run dev` runs in **dry-run** mode: the PDF is built and downloadable, no email is sent. In production a missing key is an error.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CLINIC_EMAIL` | Where packets are delivered |
| `FROM_EMAIL` | Verified sender on the Resend domain |
| `PRACTICE_EMAIL` | Printed in "Practice information" on page 1 |
| `PRACTICE_PHONE` | Fallback only. Each office's number is set in `LOCATION_PHONES` (`app/lib/config.js`); the selected office's number is printed on page 1 and in the patient email |

Everything else the clinic may want to change (locations, policy links, draft lifetime, crisis notice text) is in `app/lib/config.js`.

## How it fits together

```
app/
  patient-forms/page.js        the sequential flow (welcome → 9 forms → send → done)
  forms/
    index.js                   FORMS array: order of forms = order of PDF pages
    01-client-information/steps.js   … one folder per form/page
    …
    09-acknowledgments/steps.js
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
  api/submit-intake/route.js   validate → fill PDF → email → return patient copy
templates/therapy-intake.pdf   the blank AcroForm (never served publicly)
scripts/test-fill.mjs          PDF smoke test
```

### Where this differs from the reference app, and why

| Reference app | This project | Reason |
| --- | --- | --- |
| `*ImageMapper.js` per form with hand-measured X/Y pixels on a JPG | No coordinates at all. `fillPacket.js` looks fields up **by name** in the PDF and reads each rectangle from the file | The new PDF is an AcroForm with 173 named fields |
| PDF built in the browser (canvas → JPEG → jsPDF), uploaded as base64 | Browser sends answers as JSON; the **server** builds the PDF | Small request, vector/searchable output, server never trusts a client-made PDF |
| One PDF per form, merged at the end | One template filled once | The packet is already a single 9-page document |
| Each form is a hand-written component (`*Form.js`) | Each form is a data file (`steps.js`) rendered by one `FormRenderer` | 27 screens behave identically; a field is declared once and drives UI, validation and PDF |
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

## The two PDFs

- **Clinic copy** — patient answers are drawn into the page and cannot be edited. The "Clinician use" boxes, disposition checkboxes and clinician signature (`CLINICIAN_FIELDS` in `config.js`) remain live form fields, so the clinician can type into them in any PDF reader.
- **Patient copy** — fully flattened.

## Draft saving

Answers are saved to `localStorage` on the patient's device as they type, expire after `DRAFT.ttlHours` (24), and are erased on submit or via "Clear my answers". Signatures and the safety-screening section (`DRAFT.excludeForms`) are never written to the device; a returning patient who had already passed them is taken back to re-enter them. To persist the safety section too, set `excludeForms: []`.

## Open decisions for the clinic

1. **Safety screening (page 7).** Built as on the PDF. The only addition is a static notice (`CRISIS_NOTICE` in `config.js`) saying answers are not read immediately and pointing to 988 / 911. Still to decide: what the UI does on a *current-risk* "Yes", who monitors the inbox, and how fast. See the TODO in `app/forms/07-safety-screening/steps.js`.
2. **Policy documents.** Page 9 asks patients to confirm they *received* the office policies, Notice of Privacy Practices and fee policy. Those three ticks are optional until their URLs are set in `POLICY_LINKS`; once set, the link is shown and the tick becomes required.
3. **Template wording.** Page 8 still contains template language ("this template does not replace…", "The practice must provide its crisis and after-hours procedure"). The on-screen consent text mirrors the PDF word for word; change both together.
4. **Office phone numbers** (`LOCATION_PHONES` in `config.js`) and the practice email (`PRACTICE_EMAIL`) for page 1.
5. **Email and PHI.** Completed packets are emailed as attachments, as in the reference app. Confirm the clinic's agreement with Resend covers this.
