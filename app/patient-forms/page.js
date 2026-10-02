"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/page.js — the sequential flow.
//
//   welcome → form 1 → form 2 → … → form 9 → sending → done
//
// The order comes from the FORMS array (app/forms/index.js). Finishing the
// last step of one form opens the first step of the next automatically; the
// patient never picks a form. The last form's final button submits everything
// to /api/submit-intake, which builds the PDF and sends the emails.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FormRenderer from "../components/FormRenderer";
import { FORMS, TOTAL_FORMS, ALL_FIELDS } from "../forms/index.js";
import { CLINIC, CRISIS_NOTICE, DRAFT } from "../lib/config.js";
import { withDerived } from "../lib/derive.js";
import { validateStep, isVisible } from "../lib/validate.js";
import { saveDraft, loadDraft, clearDraft } from "../lib/draft.js";

const START = { f: 0, s: 0 };

const SUBMIT_ERRORS = {
  send_failed: "We couldn't deliver your forms just now. Your answers are still here. Please try again in a moment.",
  network: "The connection dropped before your forms were sent. Your answers are still here. Check your internet and try again.",
  default: "Something went wrong on our side and your forms were not sent. Your answers are still here. Please try again, or call the office if it keeps happening.",
};

export default function PatientForms() {
  const [phase, setPhase] = useState("loading"); // loading | welcome | resume | form | sending | done
  const [pos, setPos] = useState(START);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [finished, setFinished] = useState("");   // label of the section just completed
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);
  const [honeypot, setHoneypot] = useState("");
  const titleRef = useRef(null);

  const form = FORMS[pos.f];
  const step = form.steps[pos.s];
  const a = useMemo(() => withDerived(answers), [answers]);
  const isLast = pos.f === TOTAL_FORMS - 1 && pos.s === form.steps.length - 1;

  // ── Draft: restore on arrival, auto-save while filling ────────────────────
  useEffect(() => {
    const d = loadDraft();
    setDraft(d);
    setPhase(d ? "resume" : "welcome");
  }, []);

  useEffect(() => {
    if (phase !== "form") return;
    const t = setTimeout(() => { if (saveDraft({ answers, pos })) setSavedAt(Date.now()); }, 400);
    return () => clearTimeout(t);
  }, [answers, pos, phase]);

  // Move focus to the new screen's heading so keyboard and screen-reader users
  // land in the right place, and everyone starts at the top.
  useEffect(() => {
    if (phase === "loading") return;
    window.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [phase, pos]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((next, current = answers) => {
    // Pre-fill fields that default from an earlier answer (e.g. printed name).
    const patch = {};
    for (const f of FORMS[next.f].steps[next.s].fields) {
      if (f.defaultFrom && !current[f.id] && current[f.defaultFrom]) patch[f.id] = current[f.defaultFrom];
    }
    if (Object.keys(patch).length) setAnswers((prev) => ({ ...prev, ...patch }));
    setErrors({});
    setSubmitError("");
    setConfirmClear(false);
    setPos(next);
  }, [answers]);

  const change = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(({ [id]: _, ...rest }) => rest);
  };

  const focusFirstError = (errs) => {
    const first = step.fields.find((f) => f.id && errs[f.id]);
    requestAnimationFrame(() => {
      const el = first && document.getElementById(`f-${first.id}`);
      el?.scrollIntoView({ block: "center" });
      el?.focus({ preventScroll: true });
    });
  };

  const next = () => {
    const errs = validateStep(step, answers);
    if (Object.keys(errs).length) { setErrors(errs); focusFirstError(errs); return; }
    if (isLast) return submit();
    if (pos.s < form.steps.length - 1) { setFinished(""); goTo({ f: pos.f, s: pos.s + 1 }); }
    else { setFinished(form.label); goTo({ f: pos.f + 1, s: 0 }); } // next form starts automatically
  };

  const back = () => {
    setFinished("");
    if (pos.s > 0) goTo({ f: pos.f, s: pos.s - 1 });
    else if (pos.f > 0) goTo({ f: pos.f - 1, s: FORMS[pos.f - 1].steps.length - 1 });
    else setPhase("welcome");
  };

  const startOver = () => {
    clearDraft();
    setAnswers({}); setErrors({}); setPos(START); setDraft(null); setSavedAt(null);
    setFinished(""); setConfirmClear(false); setSubmitError("");
    setPhase("welcome");
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setPhase("sending");
    setSubmitError("");
    // Don't send answers sitting in boxes the patient can no longer see.
    const visible = Object.fromEntries(ALL_FIELDS.filter(({ field }) => isVisible(field, a)).map(({ field }) => [field.id, answers[field.id]]));
    try {
      const res = await fetch("/api/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: visible, company: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors?.length) {
        const first = data.errors[0];
        const target = { f: first.formIndex, s: first.stepIndex };
        setPos(target);
        setErrors(Object.fromEntries(data.errors.filter((e) => e.formIndex === target.f && e.stepIndex === target.s).map((e) => [e.id, e.message])));
        setSubmitError("One or two answers need another look before we can send your forms.");
        setPhase("form");
        return;
      }
      if (!res.ok || !data.ok) { const e = new Error(data.error || "default"); e.detail = data.detail; throw e; }
      clearDraft();
      let url = null;
      if (data.pdfBase64) {
        const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
        url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      }
      setResult({ url, fileName: data.fileName, patientEmailSent: data.patientEmailSent, dryRun: data.dryRun, detail: data.detail, email: answers.client_email, name: answers.client_preferred_name || answers.client_legal_name });
      setAnswers({});
      setPhase("done");
    } catch (err) {
      const msg = SUBMIT_ERRORS[err?.message] || (err instanceof TypeError ? SUBMIT_ERRORS.network : SUBMIT_ERRORS.default);
      setSubmitError(err?.detail ? `${msg} [Developer detail: ${err.detail}]` : msg); // detail is only sent in dev
      setPhase("form");
    }
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const inForm = phase === "form" || phase === "sending";
  const where =
    phase === "done" ? "All sections complete"
    : inForm ? `Section ${pos.f + 1} of ${TOTAL_FORMS}: ${form.label}`
    : "Therapy new client intake";

  const errorCount = Object.keys(errors).length;

  return (
    <>
      <header className="site-header">
        <div className="site-header__row">
          <div className="site-header__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="" />
          </div>
          <div>
            <div className="site-header__name">{CLINIC.shortName}</div>
            <div className="site-header__where" aria-live="polite">{where}</div>
          </div>
        </div>
        {(inForm || phase === "done") && (
          <ol className="progress" aria-hidden="true">
            {FORMS.map((f, i) => (
              <li key={f.id} title={f.label} data-state={phase === "done" || i < pos.f ? "done" : i === pos.f ? "current" : "todo"} />
            ))}
          </ol>
        )}
      </header>

      <main className="page">
        {phase === "loading" && <div className="card" aria-busy="true" style={{ minHeight: 320 }} />}

        {/* ── Welcome ── */}
        {phase === "welcome" && (
          <div className="card">
            <h1 className="step-title" tabIndex={-1} ref={titleRef}>Therapy new client intake</h1>
            <p className="step-intro">
              These forms help your clinician get to know you before your first visit. There are {TOTAL_FORMS} short sections, and most people finish in about 20 minutes.
            </p>
            <ul className="plain-list">
              <li>Go at your own pace. Most questions are optional, and you can skip anything you are not ready to share.</li>
              <li>Your progress is saved on this device for {DRAFT.ttlHours} hours, so you can take a break and come back. For your privacy, the safety questions and your signature are not saved and may need to be entered again.</li>
              <li>When you finish, your forms go to {CLINIC.shortName} and a copy is emailed to you.</li>
              <li>On a shared or public computer? Use "Clear my answers" at the bottom of the page before you leave.</li>
            </ul>
            <div className="actions">
              <span />
              <button type="button" className="btn btn--primary" onClick={() => { setPhase("form"); }}>
                {Object.keys(answers).length ? "Continue" : "Begin"}
              </button>
            </div>
          </div>
        )}

        {/* ── Returning with a saved draft ── */}
        {phase === "resume" && draft && (
          <div className="card">
            <h1 className="step-title" tabIndex={-1} ref={titleRef}>Welcome back</h1>
            <p className="step-intro">
              We saved your answers on this device. You were on section {draft.pos.f + 1} of {TOTAL_FORMS}, {FORMS[draft.pos.f].label.toLowerCase()}.
              For your privacy, the safety questions and signatures are not saved, so you may be asked for those again.
            </p>
            <div className="actions">
              <button type="button" className="btn btn--quiet" onClick={startOver}>Start over</button>
              <button type="button" className="btn btn--primary" onClick={() => { setAnswers(draft.answers); setPos(draft.pos); setSavedAt(draft.savedAt); setPhase("form"); }}>
                Continue where I left off
              </button>
            </div>
          </div>
        )}

        {/* ── A step of the current form ── */}
        {phase === "form" && (
          <form className="card" noValidate onSubmit={(e) => { e.preventDefault(); next(); }}>
            {finished && pos.s === 0 && <p className="done-note">{finished}: done</p>}
            <p className="part">Part {pos.s + 1} of {form.steps.length}</p>
            <h1 className="step-title" tabIndex={-1} ref={titleRef}>{step.title}</h1>
            {step.intro && <p className="step-intro">{step.intro}</p>}
            {(form.crisisNotice || step.crisisNotice) && CRISIS_NOTICE.enabled && <p className="crisis">{CRISIS_NOTICE.text}</p>}

            {(submitError || errorCount > 0) && (
              <p className="error-summary" role="alert">
                {submitError || (errorCount === 1 ? "One answer needs another look before you continue." : `${errorCount} answers need another look before you continue.`)}
              </p>
            )}

            <FormRenderer step={step} a={a} errors={errors} onChange={change} />

            <div className="hp" aria-hidden="true">
              <label>Company<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
            </div>

            <div className="actions">
              <button type="button" className="btn btn--quiet" onClick={back}>Back</button>
              <button type="submit" className="btn btn--primary">{isLast ? "Send my forms" : "Continue"}</button>
            </div>

            <div className="footer">
              <span aria-live="polite">{savedAt ? "Progress saved on this device" : ""}</span>
              {confirmClear ? (
                <span>
                  Erase everything you have entered?{" "}
                  <button type="button" className="text-button" onClick={startOver}>Yes, erase</button>{" "}
                  <button type="button" className="text-button" onClick={() => setConfirmClear(false)}>Keep my answers</button>
                </span>
              ) : (
                <button type="button" className="text-button" onClick={() => setConfirmClear(true)}>Clear my answers</button>
              )}
            </div>
          </form>
        )}

        {/* ── Sending ── */}
        {phase === "sending" && (
          <div className="card" role="status">
            <div className="spinner" aria-hidden="true" />
            <h1 className="step-title" tabIndex={-1} ref={titleRef}>Sending your forms</h1>
            <p className="step-intro">This usually takes a few seconds. Please keep this page open.</p>
          </div>
        )}

        {/* ── Done ── */}
        {phase === "done" && result && (
          <div className="card">
            <h1 className="step-title" tabIndex={-1} ref={titleRef}>Thank you{result.name ? `, ${result.name.split(" ")[0]}` : ""}</h1>
            {result.dryRun ? (
              <p className="crisis">
                Developer note: this was a dry run. The server did not find RESEND_API_KEY, so no email was sent to the clinic or the patient.
                Put the key in a file named .env.local in the project root and restart the dev server.
              </p>
            ) : (
              <>
                <p className="step-intro">Your forms were sent to {CLINIC.shortName}. There is nothing else you need to do before your visit.</p>
                <p className="step-intro">
                  {result.email && result.patientEmailSent
                    ? `A copy is on its way to ${result.email}. If you don't see it, check your spam or junk folder.`
                    : result.email
                      ? "We couldn't email your copy, so please download it below if you would like one."
                      : "You can download a copy for your records below."}
                </p>
                {result.detail && <p className="crisis">Developer detail (shown in dev only): {result.detail}</p>}
              </>
            )}
            <p className="step-intro">
              For your privacy, the draft that was saved in this browser while you were filling in the forms has been cleared. This does not affect the forms you just sent.
            </p>
            {result.url && (
              <div className="actions">
                <span />
                <a className="btn btn--primary" href={result.url} download={result.fileName} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                  Download my copy (PDF)
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
