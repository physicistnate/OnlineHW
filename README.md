# Rice Education · Online HW System

Online homework for IB, AP and general high-school physics and precalculus/calculus, for Mr. Rice's classes.

- **Every student gets their own numbers.** Given data are randomized per student and per assignment from a fixed seed, so numbers never change between logins. Worked solutions and printed versions use the same numbers.
- **Answers are checked the way a teacher would.** Each calculation is re-run with every intermediate value kept exact, rounded to 3 s.f. or rounded to 2 s.f. (and with g = 9.8 or 9.81). Any answer in that range is accepted, and significant figures are never penalized.
- **IB-style worked solutions and markschemes.** Each step puts the explanation beside the maths. Markschemes use IB conventions (✓ per marking point, error carried forward). A correct final answer earns full marks; on paper, correct working earns marks when the final answer is wrong.
- **Assignments and PDFs.** Pick questions by topic or standard, then print the base version or any student's version, with or without the answer key.

**Status: Phase 1.** The question engine, the site, and 7 IB Physics SL · A.1 Kinematics questions are done. Student work is saved in the browser for now; accounts and the gradebook come with a free Supabase database in Phase 3.

## Run it locally

Requires [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. Other commands:

```bash
npm test
```

This checks every question for 150 random students.

```bash
npm run build
```

This builds the static site into `dist/`.

## Where to read more

See **[PROJECT_GUIDE.txt](PROJECT_GUIDE.txt)** for:
- what every file does;
- everything that works now;
- exactly how answer tolerance is calculated, with worked examples;
- how to add a question;
- the next steps.
