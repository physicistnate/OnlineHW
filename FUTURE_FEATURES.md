# Future features (the "eventually" list)

Features planned for later, so nothing gets forgotten. New ideas get added here as they come up. For the immediate next steps (more questions, accounts, server-side marking, hosting), see section 9 of [PROJECT_GUIDE.txt](PROJECT_GUIDE.txt).

## Requested by Mr. Rice

### 1. "Retake" button weighted toward missed standards
Students can press **Retake** to get a new assignment. Its questions are chosen at random from the same unit, but weighted toward the standards the student missed. This should work with IB standards now, and with AP and TEKS standards later.

Already in place:
- Every question is tagged with one or more standards, and the tests require it.
- A new assignment id gives every question new numbers, so a retake never repeats the same numbers.
- Marks are saved per part, so the percentage correct on each standard can be worked out (see item 4).

Still needed:
- At least 3 or 4 questions per standard in the bank, so a retake has something to choose from.
- A weighting rule, for example: weight for a standard = 1 + 2 × (fraction of its marks missed).
- Teacher settings: whether retakes are allowed, how many, and whether the best score or the latest score counts.
- Standards per part (not just per question) for multi-part questions, so a retake can target the exact skill.

### 2. Recommend your simulations when they would help
For example, if a student misses a question 3 times and one of your simulations covers that idea, a link appears under the question saying the simulation may help.

Already in place: tries are counted per part, so "3 wrong tries" or "out of tries" can trigger it.

Still needed:
- A list of your simulations: title, link, and the standards (or questions) each one supports.
- The trigger rule. The default is 3 wrong tries on a part, or running out of tries; the teacher could change it.
- A short "This simulation may help: …" link under the part, opening in a new tab.

### 3. Mixed courses and organizing by class type
Make assignments that mix IB, AP (each AP Physics course: 1, 2, C Mechanics, C Electricity & Magnetism), TEKS, college and university physics.
- **Organize by class type.** Choosing "IB" organizes the menus by IB standards.
- **Adding another course.** If AP C Mechanics is added too, its questions come after all the IB-style questions.
- **Co-seated classes.** The teacher can sort by IB standards but use only AP-style questions. This covers a class that mixes IB and AP students and needs the same material as an IB unit.

Already in place:
- Courses and standards live in one catalog, and a question can belong to several courses.
- Each question has an exam style (IB, AP or General), which sets the accepted values of g (AP also accepts g = 10) and the name of its marking key (markscheme, scoring guidelines, grading rubric).
- One assignment can mix courses: ticked questions from any course and topic collect in "Your assignment". Each question is labelled with its course, printed papers give instructions that suit every course on them, and each key keeps its own name. HL includes SL.

Still needed:
- The AP course frameworks (units and topics for each AP Physics course), TEKS (Physics, §112.39), and college/university topic lists in the catalog.
- A crosswalk between frameworks (which AP topics or TEKS match each IB standard), so the menus can show IB standards while listing AP-style questions.
- Builder controls: a main course (sets the menus and sorts its questions first), and a question-style filter (IB-style only, AP-style only, or both).

### 4. Per-standard results chart
Track how well each student does on each standard, shown as a bar chart (standard on the x-axis, percent correct on the y-axis). Students can then study specific areas if they choose.

Already in place: every question is tagged with standards, and marks are saved per part.

Still needed:
- Percent correct per standard = marks earned ÷ marks available on the questions (or parts) tagged with it. Decide whether to use IB marks (latest answers) or the class grade (with the penalty for extra tries).
- The chart for each student, and the class average plus individual students for the teacher (with the Phase 3 gradebook).
- A colour-blind-safe chart that is readable on phones, with the numbers shown on or under the bars.

### 5. Applications to other IB subjects
Choose an application area from another IB subject and get physics problems set in that context. Examples:
- **Biology:** forces in muscles and joints, blood flow, the terminal speed of falling seeds.
- **Chemistry:** gas laws, energy in reactions.
- **Sports, exercise and health science:** impulse in a kick or a landing, projectile angles in sport, power output.
- **Environmental systems and societies:** energy resources and efficiency.
- **Design technology:** forces in structures, materials and springs.
- **Geography:** river flow, earthquakes.
- **Mathematics:** modelling with graphs.

Still needed:
- An "application" tag on each question (one or more IB subjects), alongside its topic and standards.
- A builder filter for it, which can be combined with topics, like the combined-topics mode.
- New questions written for each context.

Started for mathematics: the IB++ Physics/Math course (round 8) tags each question with the IB Mathematics topic and standards it needs, and the bank and builder have a second standards box for them (see item 7).

### 7. IB++: problems that need two IB subjects on purpose
IB++ Physics/Math is a trial: IB Physics problems that need IB Mathematics: analysis and approaches in a non-trivial way, physics-led for now. It has 20 questions, five for each pairing of Themes A and E with Topics 4 (statistics and probability) and 5 (calculus), three SL and two HL in each pairing. Teachers choose physics and mathematics standards side by side, with SL or HL for each subject.

Next, if the review goes well:
- **Math-led questions:** a switch between physics-led and math-led questions for the same pairings, where the mathematics is in front and the physics is the context.
- **More pairings:** Themes B, C and D with Topics 1–5, and Topics 1–3 (number and algebra, functions, geometry and trigonometry) with every theme.
- **Every level combination:** enough questions that each of Physics SL/HL × Math SL/HL has several questions per pairing (an SL-only teacher currently sees three per pairing).
- **Interactive figures:** slope fields (for example, for the energy of a ball among hills of different heights) and first- and second-derivative tests on graphs students drag.
- **Other subject pairs:** for example Chemistry/Math or Physics/Chemistry, using the same two-box chooser.

### 6. Your own teaching order
The "leave out questions that need later topics" option uses the IB guide's order (A.1, A.2, A.3, …, E.5). Because the IB lets schools teach topics in any order, a teacher could set their own order for each class, and "later topics" would follow it.

## Suggested earlier in this project

- **Written (typed) answers**, such as "explain" and "describe" parts. These are left out for now: every part is marked by the computer, so explanations are asked as multiple choice and such questions are labelled "Paper 2 style, explanations as multiple choice" (real IB Paper 2 has no multiple choice). Written answers would let those parts be true Paper 2 parts. When they return, the teacher marks them, with optional **AI marking against the markscheme**. Estimated cost for 150 students: about $2–7 a month with Claude Haiku 5.5, or $33–130 with Sonnet 5.5.
- **Teacher gradebook:** by class, assignment, student and standard, with live progress, and the option to change a mark by hand (Phase 3).
- **"Reset password" button** for teachers, once students have passwords (Phase 3).
- **More courses:** the rest of AP Physics C: Mechanics and University Physics I (one trial unit each so far), special relativity for University Modern Physics, AP Physics 1, 2 and C: E&M, general physics, AP Precalculus, AP Calculus AB/BC and IB Maths. The maths courses need answers that are expressions (such as 2x + 3), so they need a symbolic answer checker.
- **AP-style point allocations** on printed scoring guidelines (the keys already use each style's name: markscheme, scoring guidelines, grading rubric).
- **Real-world data that stays current:** a yearly reminder (or a small data file) for the figures some questions quote, such as US home electricity use (EIA) and data-centre power (IEA, Epoch AI).
- **More graph tools:** plotting data with a line of best fit and its gradient, and sketching curves (for example simple harmonic motion).
- **More physical constants** beyond g (c, e, h, G, k, N_A, …), with each style's accepted values.
- **Stricter rounding as an assignment setting**, such as "keep at least 3 s.f. in working" (today this is one site-wide setting).
- **"Show that" questions** with method marks.
- **Accessibility review** (screen readers, keyboard-only use, contrast) and a **light theme**.
- **A custom domain**, which school web filters are less likely to block.
- **A "check this question" page** for authors, which runs the automatic question checks in the browser instead of the terminal.

## Other ideas (not yet discussed)

- **Extensions for individual students:** a later due date for one student (absence, accommodations).
- **Late work as an option:** accept answers after the due date with a penalty, instead of closing.
- **Hints after a wrong try:** a short nudge, such as which equation of motion to use, before the next try.
