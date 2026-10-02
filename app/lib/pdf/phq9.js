// ─────────────────────────────────────────────────────────────────────────────
// app/lib/pdf/phq9.js — marks the PHQ-9 page.
//
// templates/phq9.pdf is a flat image (no AcroForm fields), so this is the one
// place in the project that uses a coordinate table. The numbers below were
// measured from the PDF itself (page rendered at 216 dpi, table lines and the
// printed 0/1/2/3 digits located by image analysis), not eyeballed.
//
// Units: PDF points measured from the TOP-left corner of the visible page.
// `top()` flips to pdf-lib's bottom-left origin using the page's own MediaBox
// (this file's box does not start at 0, so a hardcoded page height is wrong). If the clinic replaces phq9.pdf with a
// different layout, these need re-measuring; `npm run test:pdf` shows the result.
// ─────────────────────────────────────────────────────────────────────────────
// Centre of the printed digit in each answer column (0, 1, 2, 3)…
const COL_X = [417.9, 482.3, 546.9, 611.6];
// …and in each question row (items 1–9).
const ROW_Y = [201.0, 239.6, 279.3, 320.1, 360.6, 408.3, 464.9, 537.4, 612.4];

// "add columns" boxes (scores 1, 2, 3) and the TOTAL box: [x0, x1, yTop, yBottom]
const SUM_BOXES = [[458.0, 506.0, 651.0, 674.7], [522.7, 570.3, 651.0, 674.7], [587.0, 635.0, 651.0, 674.7]];
const TOTAL_BOX = [458.0, 635.0, 683.3, 707.0];

// Item 10: the four blank lines (x 587–634) sit at these heights.
const Q10_LINE_X = 610.8;
const Q10_LINE_Y = [747.8, 771.8, 795.8, 819.3];

// Name / date rules at y = 94.7
const NAME = { x: 136, y: 91.5, maxW: 312 };
const DATE = { x: 513, y: 91.5 };

export function phq9Scores(answers) {
  const values = Array.from({ length: 9 }, (_, i) => answers[`phq9_${i + 1}`]);
  const answered = values.filter((v) => /^[0-3]$/.test(v ?? ""));
  const columns = [1, 2, 3].map((score) => answered.filter((v) => Number(v) === score).length * score);
  return { values, complete: answered.length === 9, columns, total: columns.reduce((a, b) => a + b, 0) };
}

export function drawPhq9(page, { answers, name, usDate, font, bold, ink, LineCapStyle }) {
  const box = page.getMediaBox();
  const top = (y) => box.y + box.height - y;

  const check = (cx, cyTop, size = 11) => {
    const x = cx - size / 2, y = top(cyTop) - size / 2;
    const p = (fx, fy) => ({ x: x + size * fx, y: y + size * fy });
    const style = { thickness: 1.7, color: ink, lineCap: LineCapStyle.Round };
    page.drawLine({ start: p(0.08, 0.5), end: p(0.38, 0.14), ...style });
    page.drawLine({ start: p(0.38, 0.14), end: p(0.95, 0.92), ...style });
  };
  const centered = (text, [x0, x1, y0, y1], size, f) => {
    page.drawText(text, { x: (x0 + x1) / 2 - f.widthOfTextAtSize(text, size) / 2, y: top((y0 + y1) / 2) - size * 0.36, size, font: f, color: ink });
  };

  // Name and date
  let size = 11;
  while (size > 7 && font.widthOfTextAtSize(name, size) > NAME.maxW) size -= 0.5;
  page.drawText(name, { x: NAME.x, y: top(NAME.y), size, font, color: ink });
  page.drawText(usDate, { x: DATE.x, y: top(DATE.y), size: 11, font, color: ink });

  // Items 1–9: a tick just to the right of the chosen number
  const { values, complete, columns, total } = phq9Scores(answers);
  values.forEach((v, row) => {
    if (/^[0-3]$/.test(v ?? "")) check(COL_X[Number(v)] + 14, ROW_Y[row]);
  });

  // Column sums and total — only when all nine items are answered, so a
  // partial questionnaire can never show a misleadingly low score.
  if (complete) {
    columns.forEach((sum, i) => centered(String(sum), SUM_BOXES[i], 11, font));
    centered(String(total), TOTAL_BOX, 13, bold);
  }

  // Item 10
  const d = answers.phq9_difficulty;
  if (/^[0-3]$/.test(d ?? "")) check(Q10_LINE_X, Q10_LINE_Y[Number(d)] - 6.5);
}
