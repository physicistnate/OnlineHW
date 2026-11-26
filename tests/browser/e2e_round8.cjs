// Browser checks for round 8: the IB++ Physics/Math course (two standards boxes that keep
// their choices across topic switches, SL/HL for each subject, the bank's address, the
// builder), its questions (a drawn acceleration graph, follow-through, labels), printing,
// and phone widths.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_round8.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', (e) => problems.push('page error: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
  p.on('dialog', (d) => d.accept());
  const go = async (h) => { await p.goto(BASE + h); await p.waitForLoadState('networkidle'); };
  const part = (i) => p.locator('.part').nth(i);
  const answer = async (i, v) => {
    await part(i).locator('.num-input').fill(v);
    await part(i).locator('.num-input').press('Enter');
    return part(i).locator('.feedback').innerText();
  };
  const titles = () => p.locator('.q-list .q-card-title').allInnerTexts();
  const chosen = (subject) => p.locator(`.dual-chosen-col.is-${subject} .dual-chosen-chip strong`).allInnerTexts();
  const chip = (subject, code) => p.locator(`.dual-box.is-${subject} .std-chip`).filter({ hasText: new RegExp(`^${code.replace(/\./g, '\\.')}(HL)?\\d`) });
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('The course menu');
  await go('#/bank');
  const groups = await p.locator('select.course-select optgroup').evaluateAll((gs) => gs.map((g) => ({ label: g.label, options: [...g.querySelectorAll('option')].map((o) => o.textContent) })));
  const ibpp = groups.find((g) => g.label === 'IB++');
  expect(!!ibpp && ibpp.options.join('|') === 'Physics/Math', `an IB++ section lists Physics/Math (${JSON.stringify(ibpp)})`);
  const home = await (async () => { await go(''); return p.locator('main').innerText(); })();
  expect(home.includes('IB++ Physics/Math (trial): 31 IB Physics problems'), 'the home page lists the IB++ course and its 31 questions');

  console.log('Two standards boxes, chosen standards kept across topics');
  await go('#/bank?course=ibpp-physics-math');
  expect((await p.locator('.dual-box.is-physics').count()) === 1 && (await p.locator('.dual-box.is-math').count()) === 1, 'a physics box and a mathematics box');
  expect(await p.locator('.std-prompt').isVisible(), 'asks for a standard before listing questions');
  const boxColours = await p.evaluate(() => [...document.querySelectorAll('.dual-box')].map((e) => getComputedStyle(e).borderTopColor));
  expect(boxColours.length === 2 && boxColours[0] !== boxColours[1], `the two boxes are outlined in different colours (${boxColours.join(' / ')})`);
  await p.selectOption('select[aria-label="Physics topic"]', 'ibp.A.2');
  await chip('physics', 'A.2.9').click();
  expect((await chosen('physics')).join(',') === 'A.2.9', 'A.2.9 is listed as chosen');
  expect((await titles()).some((t) => t.startsWith('Cutting the string')), 'the cut-string question is listed');
  await p.selectOption('select[aria-label="Physics topic"]', 'ibp.E.3');
  expect((await chosen('physics')).join(',') === 'A.2.9', 'after switching the physics box to E.3, A.2.9 is still chosen');
  expect((await titles()).some((t) => t.startsWith('Cutting the string')), 'and its question is still listed');
  await chip('physics', 'E.3.6').click();
  expect((await chosen('physics')).join(',') === 'A.2.9,E.3.6', 'E.3.6 is added alongside A.2.9');
  const both = await titles();
  expect(both.some((t) => t.startsWith('Cutting the string')) && both.some((t) => t.startsWith('Activity as a rate of change')), 'questions for both standards are listed');
  await p.selectOption('select[aria-label="Mathematics topic"]', 'ibm.5');
  await chip('math', '5.4').click();
  const withMath = await titles();
  expect(withMath.length > 0 && withMath.length <= both.length && withMath.every((t) => !t.startsWith('Is the source still there')), `choosing Math 5.4 keeps only questions that also use 5.4 (${withMath.length})`);
  await p.click('button[aria-label="Remove Physics A.2.9"]');
  expect((await chosen('physics')).join(',') === 'E.3.6', 'clicking a chosen standard removes it');

  console.log('The address keeps the choice');
  await p.reload();
  await p.waitForLoadState('networkidle');
  expect((await chosen('physics')).join(',') === 'E.3.6' && (await chosen('math')).join(',') === '5.4', 'after a reload, E.3.6 and Math 5.4 are still chosen');

  console.log('SL and HL for each subject');
  await go('#/bank?course=ibpp-physics-math&mt=ibm.4&ms=ibm.4.4');
  const hlList = await titles();
  expect(hlList.some((t) => t.startsWith('The Planck constant')), 'with physics HL, the photoelectric regression (physics HL) is listed');
  await p.locator('.dual-box.is-physics [aria-label="Physics level"] button', { hasText: 'SL' }).click();
  const slList = await titles();
  expect(!slList.some((t) => t.startsWith('The Planck constant')) && slList.some((t) => t.startsWith('The Balmer series')), 'with physics SL it is hidden, and the SL Balmer question stays');
  const physicsTopics = await p.locator('select[aria-label="Physics topic"] option').allInnerTexts();
  expect(!physicsTopics.some((t) => t.startsWith('E.2')), 'with physics SL, the HL-only topic E.2 is not offered');
  await go('#/bank?course=ibpp-physics-math&pt=ibp.E.2&ps=ibp.E.2.1&pl=SL');
  expect((await chosen('physics')).length === 0, 'a linked choice of E.2.1 at physics SL is dropped');
  await go('#/bank?course=ibpp-physics-math&mt=ibm.5&ms=ibm.5.18&ml=SL');
  expect((await chosen('math')).length === 0, 'a linked choice of Math 5.18 (HL) at mathematics SL is dropped');
  await go('#/bank?course=ibpp-physics-math&mt=ibm.5&ms=ibm.5.18');
  const odes = await titles();
  expect(odes.some((t) => t.startsWith('Falling with air resistance')) && odes.some((t) => t.startsWith('A decay chain')), 'Math 5.18 (HL) finds both differential-equation questions');
  const cardChips = await p.locator('.q-card').filter({ hasText: 'Falling with air resistance' }).locator('.chip').allInnerTexts();
  expect(cardChips.includes('Math HL') && !cardChips.includes('Physics HL'), `the air-resistance card says Math HL only (${cardChips.join(', ')})`);

  console.log('An IB++ question: labels, a drawn graph and follow-through');
  await go('#/q/ibpp-a5-drone-height');
  const meta = await p.locator('.q-meta').innerText();
  expect(meta.includes('IB++ Physics/Math') && meta.includes('A.1 Kinematics + Math Topic 5 Calculus') && meta.includes('Physics SL, Math SL'), `the label names both subjects and levels ("${meta}")`);
  expect((await answer(0, '5')).includes('Correct'), '(a) v(1) = 5 m/s');
  expect((await answer(1, '9.48')).includes('Correct'), '(b) greatest height 9.48 m');
  const handles = part(4).locator('.g-handle');
  expect((await handles.count()) === 2, 'the acceleration graph has two points to drag');
  const press = async (i, key, n) => { await handles.nth(i).focus(); for (let k = 0; k < n; k++) await p.keyboard.press(key); };
  expect((await part(4).innerText()).includes('Each point in the right place earns marks'), 'the instructions say each point earns marks');
  await press(0, 'ArrowLeft', 3);
  await press(0, 'ArrowDown', 4);
  await part(4).locator('button', { hasText: 'Check graph' }).click();
  const half = await part(4).locator('.feedback').innerText();
  expect(half.includes('1 of 2 points are in the right place') && !half.includes('Correct'), `one correct end earns 1 of the 2 marks, as the markscheme says ("${half.replace(/\s+/g, ' ').trim()}")`);
  await press(1, 'ArrowRight', 3);
  await press(1, 'Shift+ArrowDown', 5);
  await press(1, 'ArrowDown', 3);
  const where = await handles.evaluateAll((hs) => hs.map((h) => h.getAttribute('aria-valuetext')));
  await part(4).locator('button', { hasText: 'Check graph' }).click();
  const graphFeedback = await part(4).locator('.feedback').innerText();
  expect(graphFeedback.includes('Correct'), `a = 8 − 6t drawn from (0, 8) to (4, −16) is correct (${where.join(' and ')}: "${graphFeedback.split('\n')[0]}")`);
  await go('#/q/ibpp-a5-riemann-work');
  await answer(2, '60');
  const ecf = await answer(3, '61.97');
  expect(ecf.includes('Correct') && ecf.includes('error carried forward'), `the bow (d): an arrow speed from a wrong work of 60 J earns follow-through ("${ecf.split('\n')[0]}")`);
  expect((await p.locator('.katex-error').count()) === 0, 'no maths errors');
  for (const id of ['ibpp-e4-balmer-regression', 'ibpp-e5-decay-chain-ode', 'ibpp-e4-lifetime-distribution', 'ibpp-e5-compton-angle']) {
    await go(`#/q/${id}?sol=1&ms=1`);
    expect((await p.locator('.katex-error').count()) === 0 && (await p.locator('.part').count()) === 5, `${id}: five parts, solutions and markscheme render without maths errors`);
  }

  console.log('The builder');
  await go('#/builder');
  await p.selectOption('select.course-select', 'ibpp-physics-math');
  expect((await p.locator('.builder .dual-box, .dual-box').count()) === 2, 'the builder shows the two standards boxes for IB++');
  await p.selectOption('select[aria-label="Mathematics topic"]', 'ibm.4');
  await chip('math', '4.8').click();
  const pick = p.locator('.pick-list li').filter({ hasText: 'A handful of nuclei' });
  expect((await pick.count()) === 1, 'the binomial decay question is offered for Math 4.8');
  expect((await pick.locator('.std-codes').innerText()).includes('E.3.3, E.3.6 · Math 4.8, 4.7'), 'its codes show both subjects');
  await pick.locator('input[type="checkbox"]').check();
  await p.selectOption('select[aria-label="Mathematics topic"]', 'ibm.5');
  expect((await chosen('math')).join(',') === '4.8', 'Math 4.8 stays chosen after switching to Topic 5');
  expect((await p.locator('.selection-summary strong').first().innerText()) === '1', 'the question stays in the assignment');

  console.log('Printing');
  await go('#/print?ids=ibpp-a5-drone-height,ibpp-e4-decay-binomial&course=ibpp-physics-math&title=IB%2B%2B%20trial&ms=1');
  await p.waitForSelector('.paper');
  const paper = await p.locator('.paper').innerText();
  expect(paper.includes('IB Mathematics formula booklet') && paper.includes('needs both physics and mathematics'), 'the paper has the IB++ instructions');
  expect(paper.includes('A drone takes off') && paper.includes('A tiny sample contains only'), 'both questions are printed');
  expect((await p.locator('.paper svg').count()) >= 1, 'the graph to draw on is printed');
  expect(!/drag/i.test(paper), 'the printed questions do not tell students to drag points');
  expect(paper.includes('Paper 2 style, explanations as multiple choice'), 'a question with multiple-choice parts is not labelled plain Paper 2 style');

  console.log('Work saved on build 59f80b0 (four questions changed without a new version)');
  await go('');
  await p.evaluate(() => {
    localStorage.clear();
    const S = 'PHYS1:alex';
    const done = (marks) => Object.fromEntries(marks.map(([pid, max]) => [pid, { response: { kind: 'numeric', value: '1' }, checked: { kind: 'numeric', value: '1' }, last: { status: 'correct', score: max, max, attempts: 1 }, attempts: 1 }]));
    const mcq = (choice, max) => ({ response: { kind: 'mcq', choice }, checked: { kind: 'mcq', choice }, last: { status: 'correct', score: max, max, attempts: 1 }, attempts: 1 });
    localStorage.setItem('rice-hw:migrated', '1');
    localStorage.setItem('rice-hw:session', JSON.stringify({ classCode: 'PHYS1', username: 'alex' }));
    localStorage.setItem(
      'rice-hw:assignments',
      JSON.stringify([
        { id: 'hw-hr', title: 'HR from 59f80b0', courseId: 'ib-physics-hl', items: [{ id: 'ibp-e5-hr-diagram', version: 1 }], createdAt: '2026-11-25T22:15:00.000Z', settings: {} },
        { id: 'hw-uni', title: 'Modern physics from 59f80b0', courseId: 'university-modern-physics', items: [{ id: 'ump-t5-isotope-generator', version: 1 }, { id: 'ump-t7-kelvin-helmholtz', version: 1 }], createdAt: '2026-11-25T23:40:00.000Z', settings: {} },
      ]),
    );
    localStorage.setItem(`rice-hw:params:${S}::hw-hr::ibp-e5-hr-diagram@v1`, JSON.stringify({ set: 's1', order: 'o1', pair: 'p1' }));
    localStorage.setItem(`rice-hw:work:m3:${S}::hw-hr::ibp-e5-hr-diagram@v1`, JSON.stringify({ b: mcq('o1', 1) }));
    localStorage.setItem(`rice-hw:work:m3:${S}::hw-uni::ump-t5-isotope-generator@v1`, JSON.stringify({ ...done([['a', 2], ['b', 2], ['c', 1]]), d: mcq('o0', 1) }));
    localStorage.setItem(`rice-hw:work:m3:${S}::hw-uni::ump-t7-kelvin-helmholtz@v1`, JSON.stringify({ ...done([['a', 2], ['b', 2], ['c', 2]]), d: mcq('o0', 1) }));
  });
  // Load the site afresh, as a browser that last ran build 59f80b0 would (the repair runs at start-up).
  await p.reload();
  await p.waitForLoadState('networkidle');
  await go('#/student');
  const uniCard = await p.locator('.assignment-card').filter({ hasText: 'Modern physics from 59f80b0' }).innerText();
  expect(uniCard.includes('IB 13/13'), `the completed modern physics assignment shows 13/13 again (${uniCard.replace(/\s+/g, ' ').match(/IB \d+\/\d+/)?.[0]})`);
  await go('#/student/a/hw-hr');
  const hrB = part(1);
  expect((await hrB.locator('input[type="radio"]').count()) === 4 && (await hrB.locator('.num-input').count()) === 0, 'HR (b) is the multiple-choice part the answer was given for');
  expect(await hrB.locator('input[type="radio"]').nth(1).isChecked(), 'the saved choice is shown in (b)');
  const repaired = await p.evaluate(() => JSON.parse(localStorage.getItem('rice-hw:assignments')).flatMap((a) => a.items.map((i) => i.build ?? '-')).join(','));
  expect(repaired === 'r6,r6,r6', `the assignments now name build r6 (${repaired})`);

  console.log('Phone widths');
  const phone = await b.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 1 });
  phone.on('pageerror', (e) => problems.push('phone page error: ' + e.message));
  for (const h of ['#/bank?course=ibpp-physics-math&pt=ibp.A.3&ps=ibp.A.3.2,ibp.A.3.3&mt=ibm.5&ms=ibm.5.5', '#/builder', '#/q/ibpp-e5-binding-energy-peak?sol=1']) {
    await phone.goto(BASE + h);
    await phone.waitForLoadState('networkidle');
    if (h === '#/builder') await phone.selectOption('select.course-select', 'ibpp-physics-math');
    const wide = await phone.evaluate(() => document.documentElement.scrollWidth);
    expect(wide <= 375, `${h}: no sideways scrolling on a phone (${wide}px)`);
  }
  await phone.goto(BASE + '#/bank?course=ibpp-physics-math&pt=ibp.A.3&ps=ibp.A.3.2,ibp.A.3.3&mt=ibm.5&ms=ibm.5.5');
  await phone.waitForLoadState('networkidle');
  await phone.screenshot({ path: 'tests/browser/shots/round8-ibpp-bank-phone.png', fullPage: false });
  await p.setViewportSize({ width: 1280, height: 900 });
  await go('#/bank?course=ibpp-physics-math&pt=ibp.A.3&ps=ibp.A.3.2,ibp.A.3.3&mt=ibm.5&ms=ibm.5.5');
  await p.screenshot({ path: 'tests/browser/shots/round8-ibpp-bank.png', fullPage: false });

  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s):\n- ${problems.join('\n- ')}` : '\nAll round 8 checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
