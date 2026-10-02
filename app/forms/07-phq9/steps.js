// PHQ-9 — Patient Health Questionnaire (templates/phq9.pdf, appended to the
// packet as its own page after page 9).
//
// Unlike the intake packet, the PHQ-9 PDF is a flat image with no form fields,
// so its answers are placed by coordinates: see app/lib/pdf/phq9.js.
//
// Item 9 asks about thoughts of death / self-harm, so its screen shows the same
// CRISIS_NOTICE as the safety screening, and its answer is never written to the
// device draft (noDraft). What should happen on a non-zero answer is part of
// the same open clinic decision as the safety screening section.
const OPTIONS = [
  { value: "0", label: "Not at all" },
  { value: "1", label: "Several days" },
  { value: "2", label: "More than half the days" },
  { value: "3", label: "Nearly every day" },
];

export const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite: being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself",
];

const INTRO = "Over the last 2 weeks, how often have you been bothered by any of the following problems?";
const item = (n) => ({
  id: `phq9_${n}`, type: "radio", label: PHQ9_ITEMS[n - 1], options: OPTIONS,
  required: true, requiredMessage: "Choose the answer that fits best. There are no right or wrong answers.",
  ...(n === 9 ? { noDraft: true } : {}),
});

export default {
  id: "phq9",
  label: "Mood questionnaire",
  pdfPage: 10,
  steps: [
    { title: "How you have been feeling", intro: INTRO, fields: [item(1), item(2), item(3)] },
    { title: "Energy, appetite, and self-view", intro: INTRO, fields: [item(4), item(5), item(6)] },
    { title: "Focus, pace, and difficult thoughts", intro: INTRO, crisisNotice: true, fields: [item(7), item(8), item(9)] },
    {
      title: "How these affect daily life",
      fields: [
        {
          id: "phq9_difficulty", type: "radio",
          label: "If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
          options: [
            { value: "0", label: "Not difficult at all" },
            { value: "1", label: "Somewhat difficult" },
            { value: "2", label: "Very difficult" },
            { value: "3", label: "Extremely difficult" },
          ],
        },
      ],
    },
  ],
};
