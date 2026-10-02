"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FormRenderer — draws one step from a form's steps.js. Every form in the
// packet goes through this component, so spacing, labels, errors and
// accessibility behave identically on every screen.
// ─────────────────────────────────────────────────────────────────────────────
import SignaturePad from "./SignaturePad";
import { isRequired, isVisible } from "../lib/validate.js";
import { formatPhoneInput, formatZipInput } from "../lib/validators.js";
import { toUSDate } from "../lib/formatDate.js";
import { LIMITS } from "../lib/config.js";

const span = (f) => `field${f.half ? " field--half" : ""}${f.third ? " field--third" : ""}`;

function Label({ field, required, as: Tag = "label", htmlFor }) {
  return (
    <>
      <Tag className={field.hideLabel ? "sr-only" : "label"} htmlFor={htmlFor}>
        {field.label}
        {required && <span className="optional"> (required)</span>}
      </Tag>
      {field.hint && <p className="hint" id={`h-${field.id}`}>{field.hint}</p>}
    </>
  );
}

const Err = ({ id, msg }) => (msg ? <p className="error" id={`e-${id}`}>{msg}</p> : null);

function Medications({ field, value, onChange }) {
  const rows = Array.isArray(value) && value.length ? value : [{ name: "", dose: "", reason: "" }];
  const set = (i, key, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const cell = (i, key, label) => (
    <div>
      <label htmlFor={`f-${field.id}-${i}-${key}`}>{label}</label>
      <input id={`f-${field.id}-${i}-${key}`} className="input" value={rows[i][key] || ""} maxLength={120} autoComplete="off" onChange={(e) => set(i, key, e.target.value)} />
    </div>
  );
  return (
    <div id={`f-${field.id}`}>
      {rows.map((_, i) => (
        <div className="med" key={i}>
          <div className="med__head">
            <span>Medication {i + 1}</span>
            {rows.length > 1 && <button type="button" className="text-button" style={{ margin: 0, padding: 0 }} onClick={() => onChange(rows.filter((__, j) => j !== i))}>Remove</button>}
          </div>
          {cell(i, "name", "Medication")}
          {cell(i, "dose", "Dose / frequency")}
          {cell(i, "reason", "Reason / prescriber")}
        </div>
      ))}
      {rows.length < LIMITS.medications && (
        <button type="button" className="text-button" onClick={() => onChange([...rows, { name: "", dose: "", reason: "" }])}>Add another medication</button>
      )}
    </div>
  );
}

function Field({ field, a, error, onChange }) {
  const { id, type } = field;
  const value = a[id];
  const required = isRequired(field, a);
  const described = [field.hint && `h-${id}`, error && `e-${id}`].filter(Boolean).join(" ") || undefined;
  const common = { id: `f-${id}`, "aria-invalid": error ? true : undefined, "aria-describedby": described, "aria-required": required || undefined };

  if (type === "info") return (<div className="field info"><h3>{field.heading}</h3><p>{field.text}</p></div>);
  if (type === "heading") return (<div className="field"><h3 className="subhead">{field.text}</h3>{field.note && <p>{field.note}</p>}</div>);
  if (type === "today") return (<div className="field field--half"><span className="label">{field.label}</span><div className="readonly">{toUSDate(a._today)}</div></div>);

  if (type === "yesno" || type === "radio") {
    const options = type === "yesno" ? [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] : field.options;
    return (
      <fieldset className="field" {...common} tabIndex={-1}>
        <Label field={field} required={required} as="legend" />
        <div className={`choices${type === "yesno" || field.inline ? " choices--inline" : ""}`}>
          {options.map((o) => (
            <label className="choice" key={o.value}>
              <input type="radio" name={id} value={o.value} checked={value === o.value} onChange={() => onChange(id, o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {value && !required && <button type="button" className="text-button" onClick={() => onChange(id, "")}>Clear answer</button>}
        <Err id={id} msg={error} />
      </fieldset>
    );
  }

  if (type === "checks") {
    const list = Array.isArray(value) ? value : [];
    const toggle = (v) => onChange(id, list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    return (
      <fieldset className="field" {...common} tabIndex={-1}>
        <Label field={field} required={required} as="legend" />
        <div className={`choices${field.inline ? " choices--inline" : ""}${field.columns ? " choices--columns" : ""}`}>
          {field.options.map((o) => (
            <label className="choice" key={o.value}>
              <input type="checkbox" checked={list.includes(o.value)} onChange={() => toggle(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        <Err id={id} msg={error} />
      </fieldset>
    );
  }

  if (type === "ack") {
    return (
      <div className="field">
        <label className="choice">
          <input type="checkbox" {...common} checked={value === true} onChange={(e) => onChange(id, e.target.checked)} />
          <span>
            {field.label}
            {!required && <span className="optional"> (if this applies)</span>}
            {field.link && (<><br /><a href={field.link} target="_blank" rel="noopener noreferrer">{field.linkText}</a></>)}
          </span>
        </label>
        <Err id={id} msg={error} />
      </div>
    );
  }

  if (type === "medications") {
    return (<div className="field"><span className="sr-only">{field.label}</span><Medications field={field} value={value} onChange={(v) => onChange(id, v)} /></div>);
  }

  if (type === "signature") {
    return (
      <div className="field">
        <Label field={field} required={required} as="span" />
        <SignaturePad id={`f-${id}`} value={value || ""} onChange={(v) => onChange(id, v)} invalid={!!error} describedBy={described} />
        <Err id={id} msg={error} />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className={span(field)}>
        <Label field={field} required={required} htmlFor={`f-${id}`} />
        <select className="input" {...common} value={value || ""} onChange={(e) => onChange(id, e.target.value)}>
          <option value="">Choose one</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Err id={id} msg={error} />
      </div>
    );
  }

  if (type === "textarea") {
    const len = (value || "").length;
    return (
      <div className={span(field)}>
        <Label field={field} required={required} htmlFor={`f-${id}`} />
        <textarea className="input" {...common} rows={field.rows || 4} maxLength={LIMITS.textarea} value={value || ""} onChange={(e) => onChange(id, e.target.value)} />
        {len > LIMITS.textarea * 0.8 && <p className="counter">{LIMITS.textarea - len} characters left</p>}
        <Err id={id} msg={error} />
      </div>
    );
  }

  // text-like inputs
  const htmlType = { tel: "tel", email: "email", date: "date" }[type] || "text";
  const format = (next) => (type === "tel" ? formatPhoneInput(next, value || "") : type === "zip" ? formatZipInput(next) : next);
  return (
    <div className={span(field)}>
      <Label field={field} required={required} htmlFor={`f-${id}`} />
      <input
        className={`input${field.signatureStyle ? " input--signature" : ""}`} {...common}
        type={htmlType} value={value || ""} maxLength={LIMITS.text}
        inputMode={field.inputMode || (type === "zip" ? "numeric" : undefined)}
        autoComplete={field.autoComplete || "off"}
        placeholder={type === "tel" ? "(555) 123-4567" : undefined}
        max={type === "date" ? a._today : undefined}
        onChange={(e) => onChange(id, format(e.target.value))}
      />
      <Err id={id} msg={error} />
    </div>
  );
}

export default function FormRenderer({ step, a, errors, onChange }) {
  return (
    <div className="fields">
      {step.fields.filter((f) => isVisible(f, a)).map((f, i) => (
        <Field key={f.id || `${f.type}-${i}`} field={f} a={a} error={f.id ? errors[f.id] : undefined} onChange={onChange} />
      ))}
    </div>
  );
}
