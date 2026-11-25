# Rice Education · Online HW System

Online homework for IB, AP and general high-school physics and precalculus/calculus, for Mr. Rice's classes.

- **Every student gets their own numbers.** Given data are randomized per student and per assignment, and pinned the first time a student opens a question, so numbers never change. Worked solutions and printed versions use the same numbers.
- **Answers are checked the way a teacher would.** Each calculation is re-run with every intermediate value kept exact, rounded to 3 s.f. or rounded to 2 s.f. (and with g = 9.8 or 9.81). Any answer in that range is accepted, and significant figures are never penalized. Error carried forward works part by part, the way an IB markscheme does.
- **Worked solutions and markschemes.** Each step puts the explanation beside the maths. Markschemes use IB conventions (✓ per marking point, error carried forward); AP and university questions are written in their own style. A correct final answer earns full marks; on paper, correct working earns marks when the final answer is wrong.
- **Assignments with rules.** Pick questions by course (IB Physics SL or HL, AP Physics C: Mechanics, University Physics I), topic and one or more standards; questions that need later topics are left out unless you ask for them, and "Combine topics" finds questions that bring several topics together. Set tries per part (multiple choice: half the choices), a due date and time (students get warnings 5 and 1 minutes before it closes), when students see their own answer key, and how the class grade is worked out. Students see a class grade and their IB marks.
- **PDFs.** Print the base version or any student's version, with or without the answer key.

**Status: Phase 1.** The question engine, the site, assignments and 59 questions are done: IB Physics A.1 Kinematics (12), A.2 Forces and momentum (15, two HL only) and A.3 Work, energy and power (12), plus trial units for AP Physics C: Mechanics (Unit 3 Work, Energy, and Power, 10 questions) and University Physics I (Topic 3 Work, energy and power, calculus-based, 10 questions). Student work is saved in the browser for now; accounts, server-side marking and the gradebook come with a free Supabase database in Phase 3.

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

This checks every question (every allowed set of numbers, and 150 random students) and the grading rules.

```bash
npm run build
```

This builds the static site into `dist/`.

## Making changes

`main` is the base of the site. New questions and features go on their own branch with a pull request; the tests run on it automatically, and it is merged into `main` once it has been checked. See section 2 of the project guide.

## Where to read more

See **[PROJECT_GUIDE.txt](PROJECT_GUIDE.txt)** for:
- what every file does;
- everything that works now;
- exactly how answer tolerance is calculated, with worked examples;
- how tries, due dates, answer keys and grades work;
- how to add or revise a question;
- the next steps.

Features planned for later are listed in **[FUTURE_FEATURES.md](FUTURE_FEATURES.md)**.
