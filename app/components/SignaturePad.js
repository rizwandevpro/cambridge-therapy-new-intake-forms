"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SignaturePad — draw with finger / mouse / stylus, or type a name instead
// (keyboard and screen-reader users can't draw). Either way the result is a
// transparent PNG, trimmed to the ink, which the server places on the PDF.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";

const W = 1120, H = 340; // internal resolution (2× the displayed size)
const INK = "#1f2a37";

function exportTrimmed(canvas) {
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, W, H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0 || (x1 - x0 < 12 && y1 - y0 < 12)) return ""; // empty, or just a dot
  const m = 8;
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W, x1 + m); y1 = Math.min(H, y1 + m);
  const out = document.createElement("canvas");
  out.width = x1 - x0; out.height = y1 - y0;
  out.getContext("2d").drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

export default function SignaturePad({ id, value, onChange, invalid, describedBy }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [mode, setMode] = useState("draw");
  const [typed, setTyped] = useState("");
  const [editing, setEditing] = useState(!value);

  const ctx = () => canvasRef.current.getContext("2d");
  const wipe = () => canvasRef.current && ctx().clearRect(0, 0, W, H);

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };
  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const p = point(e), c = ctx();
    c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(last.current.x, last.current.y); c.lineTo(p.x, p.y); c.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(exportTrimmed(canvasRef.current));
  };

  // Typed mode: render the name in the italic serif and export it the same way.
  useEffect(() => {
    if (mode !== "type" || !editing || !canvasRef.current) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !canvasRef.current) return;
      wipe();
      const c = ctx(), text = typed.trim();
      if (text) {
        let size = 150;
        do { c.font = `italic 500 ${size}px Lora, Georgia, serif`; size -= 6; } while (c.measureText(text).width > W - 80 && size > 40);
        c.fillStyle = INK; c.textBaseline = "middle"; c.textAlign = "center";
        c.fillText(text, W / 2, H / 2);
      }
      onChange(text ? exportTrimmed(canvasRef.current) : "");
    };
    (document.fonts?.load ? document.fonts.load("italic 500 100px Lora").then(render, render) : Promise.resolve().then(render));
    return () => { cancelled = true; };
  }, [typed, mode, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => { wipe(); setTyped(""); setEditing(true); onChange(""); };
  const switchMode = (m) => { if (m !== mode) { wipe(); setTyped(""); onChange(""); setMode(m); } };

  if (!editing && value) {
    return (
      <div>
        <div className="sig__pad">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Your signature" />
        </div>
        <button type="button" className="text-button" id={id} onClick={clear}>Clear and sign again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="sig__tabs">
        <button type="button" className="sig__tab" aria-pressed={mode === "draw"} onClick={() => switchMode("draw")}>Draw</button>
        <button type="button" className="sig__tab" aria-pressed={mode === "type"} onClick={() => switchMode("type")}>Type instead</button>
      </div>
      {mode === "type" && (
        <input
          id={id} className="input" style={{ marginBottom: 10 }} value={typed} maxLength={80}
          onChange={(e) => setTyped(e.target.value)} placeholder="Type your full name"
          aria-invalid={invalid || undefined} aria-describedby={describedBy} autoComplete="off"
        />
      )}
      <div className="sig__pad" data-invalid={invalid || undefined}>
        <canvas
          ref={canvasRef} width={W} height={H}
          id={mode === "draw" ? id : undefined} tabIndex={mode === "draw" ? 0 : -1}
          role="img" aria-label={mode === "draw" ? "Signature area. Draw your signature here, or choose Type instead." : "Signature preview"}
          aria-describedby={describedBy}
          onPointerDown={mode === "draw" ? down : undefined} onPointerMove={mode === "draw" ? move : undefined}
          onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
          style={mode === "type" ? { cursor: "default" } : undefined}
        />
        <span className="sig__line" />
        {!value && mode === "draw" && <span className="sig__placeholder">Sign here</span>}
      </div>
      {value && <button type="button" className="text-button" onClick={clear}>Clear</button>}
    </div>
  );
}
