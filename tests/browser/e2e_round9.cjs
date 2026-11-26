// Browser checks for round 9: Theme D (D.1–D.4) in the bank and on the home page, every new
// IB and IB++ question rendering cleanly, the velocity selector, the IB++ Theme D problems in
// the two-subject filter, the 2% minimum allowance when answers are checked, maths that keeps
// its backslash commands (× not "imes"), and maths that stays inside its box.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_round9.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

const THEME_D = {
  'ibp-d1': ['field-at-altitude', 'satellite-orbits', 'binary-neutral-point', 'comet-kepler', 'orbit-energy', 'potential-graph'],
  'ibp-d2': ['coulomb-line', 'millikan-drop', 'field-two-charges', 'charging-and-fields', 'van-de-graaff', 'potential-profile'],
  'ibp-d3': ['electron-deflection', 'proton-circle', 'velocity-selector', 'fine-beam-tube', 'wire-force', 'parallel-wires'],
  'ibp-d4': ['flux-coil', 'faraday-graph', 'moving-rod', 'lenz-magnet', 'generator'],
  'ibpp-d4': ['millikan-statistics', 'selector-normal', 'phone-magnetometer', 'isotope-peaks', 'hydrogen-pdf'],
  'ibpp-d5': ['kepler-linear', 'tidal-gradient', 'deflection-tangent', 'debye-field', 'poisson-sphere', 'rod-ode', 'rc-plates'],
};
const IDS = Object.entries(THEME_D).flatMap(([prefix, names]) => names.map((n) => `${prefix}-${n}`));

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
  const cards = async (course, topic) => {
    await go(`#/bank?course=${course}&topic=${topic}`);
    await p.waitForSelector('.topic-head');
    const all = p.getByRole('button', { name: 'Select all', exact: true });
    if (await all.count()) await all.click();
    return p.locator('.q-card').count();
  };
  const titles = () => p.locator('.q-list .q-card-title').allInnerTexts();
  // The question's visible text: KaTeX's hidden MathML copy keeps the TeX source (\times), so leave it out.
  const visibleText = () =>
    p.evaluate(() => {
      const q = document.querySelector('.question').cloneNode(true);
      q.querySelectorAll('.katex-mathml').forEach((e) => e.remove());
      return q.textContent;
    });
  // What is left of a command that lost its backslash: "4imes0.5" (\t became a tab), "rac{", "qrt".
  const LOST = /(?<![A-Za-z])imes|(?<![A-Za-z])rac\{|\bfrac\{|\bsqrt\{|(?<![A-Za-z])ightarrow/;
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Home page');
  await go('#/');
  const status = await p.locator('.status-card').innerText();
  expect(status.includes('IB Physics · Theme D Fields: D.1 Gravitational fields: 6 questions (2 HL only)'), 'status lists Theme D, starting with D.1');
  expect(status.includes('D.4 Induction: 5 questions (HL only)'), 'status lists D.4 as HL only');
  expect(status.includes('IB++ Physics/Math (trial): 32 IB Physics problems') && status.includes('for Themes A, D and E'), 'status lists the 32 IB++ problems for Themes A, D and E');
  expect((await p.locator('.feature-grid').innerText()).includes('within 2% of the exact answer'), 'the marking feature mentions the 2% allowance');

  console.log('Theme D in the bank: SL without D.4 and HL-only questions, HL with them');
  for (const [topic, n] of [['ibp.D.1', 4], ['ibp.D.2', 4], ['ibp.D.3', 6]]) {
    const got = await cards('ib-physics-sl', topic);
    expect(got === n, `SL ${topic}: ${n} questions (${got})`);
  }
  await go('#/bank?course=ib-physics-sl');
  await p.waitForSelector('.topic-head');
  const slSide = await p.locator('.side-topic').allInnerTexts();
  expect(!slSide.some((t) => t.includes('Induction')), 'SL has no D.4 Induction topic');
  for (const [topic, n] of [['ibp.D.1', 6], ['ibp.D.2', 6], ['ibp.D.3', 6], ['ibp.D.4', 5]]) {
    const got = await cards('ib-physics-hl', topic);
    expect(got === n, `HL ${topic}: ${n} questions (${got})`);
  }

  console.log('Every new question renders with its solution and markscheme');
  const bad = [];
  for (const id of IDS) {
    await go(`#/q/${id}?sol=1&ms=1`);
    await p.waitForSelector('.question');
    const errs = await p.locator('.katex-error').count();
    const parts = await p.locator('.part').count();
    const lost = LOST.test(await visibleText());
    if (errs > 0 || parts < 4 || lost) bad.push(`${id} (maths errors ${errs}, parts ${parts}${lost ? ', a lost backslash' : ''})`);
  }
  expect(bad.length === 0, `${IDS.length} questions render with no maths errors or lost commands${bad.length ? ': ' + bad.join(', ') : ''}`);
  await go('#/q/ibp-d4-generator');
  expect((await p.locator('.question').innerText()).includes('IB Physics HL'), 'a D.4 question is labelled IB Physics HL');

  console.log('The velocity selector (base version: 400 V across 8 mm, 0.10 T)');
  await go('#/q/ibp-d3-velocity-selector');
  expect((await answer(0, '5.0e4')).includes('Correct'), '(a) E = 5.0 × 10⁴ V m⁻¹ is correct');
  expect((await answer(1, '5.0e5')).includes('Correct'), '(b) v = E/B = 5.0 × 10⁵ m s⁻¹ is correct');
  await go('#/q/ibp-d3-velocity-selector');
  await answer(0, '4.0e4');
  expect((await answer(1, '4.0e5')).includes('error carried forward'), '(b) follows through from a wrong (a)');

  console.log('The 2% minimum allowance');
  await go('#/q/ibp-d3-velocity-selector');
  expect((await answer(0, '4.92e4')).includes('Correct'), 'E: 4.92 × 10⁴ (1.6% low) is accepted');
  await go('#/q/ibp-d3-velocity-selector');
  expect(!(await answer(0, '4.85e4')).includes('Correct'), 'E: 4.85 × 10⁴ (3% low) is not');
  await go('#/q/ibp-a1-train-acceleration');
  expect((await answer(0, '0.472')).includes('Correct'), 'train (a): 0.472 for 0.480 (1.7% low) is accepted');
  await go('#/q/ibp-a1-train-acceleration');
  expect(!(await answer(0, '0.465')).includes('Correct'), 'train (a): 0.465 (3% low) is not');
  await go('#/q/ibp-a1-train-acceleration?ms=1');
  const note = await part(0).innerText();
  expect(/accepts any value from\s+0\.470/.test(note), `the markscheme panel shows the wider range (${(note.match(/accepts any value from\s+\S+/) || [''])[0].replace(/\s+/g, ' ')})`);

  console.log('IB++ Theme D in the two-subject filter');
  await go('#/bank?course=ibpp-physics-math&pt=ibp.D.2&ps=ibp.D.2.8');
  const fieldQs = await titles();
  expect(fieldQs.some((t) => t.startsWith('A screened charge in a plasma')) && fieldQs.some((t) => t.startsWith('Poisson’s equation')), `D.2.8 finds the E = −dV/dr and Poisson problems (${fieldQs.length})`);
  await go('#/bank?course=ibpp-physics-math&mt=ibm.5&ms=ibm.5.18');
  expect((await titles()).some((t) => t.startsWith('A rod braked by induction')), 'Math 5.18 finds the circuit differential equation');
  await go('#/bank?course=ibpp-physics-math&mt=ibm.4&ms=ibm.4.4');
  expect(!(await titles()).some((t) => /Millikan|magnetometer|selector|Isotope|electron\?/i.test(t)), 'no Theme D statistics problem uses a regression line');
  await go('#/q/ibpp-d5-poisson-sphere?sol=1&ms=1');
  const poisson = await p.locator('.question').innerText();
  expect(poisson.includes('Math SL') && poisson.includes('Physics HL'), 'the Poisson problem is labelled Physics HL, Math SL');

  console.log('Lost backslashes (\\times printed as "imes") are fixed');
  await go('#/q/ibpp-a4-wind-turbine-expected-power?sol=1&ms=1');
  const wind = await visibleText();
  expect(!LOST.test(wind) && wind.includes('×'), 'the wind turbine solution shows × signs');

  console.log('Maths stays inside its box');
  let wide = [];
  for (const id of [...IDS, 'ump-t2-compton-recoil', 'ibpp-a4-wind-turbine-expected-power', 'ibp-a2-collision-2d']) {
    await go(`#/q/${id}?sol=1&ms=1`);
    const n = await p.evaluate(() => [...document.querySelectorAll('.eq-flow')].filter((e) => e.scrollWidth > e.clientWidth + 1).length);
    if (n) wide.push(`${id} (${n})`);
  }
  expect(wide.length === 0, `no wrapped maths overflows at 1280 px${wide.length ? ': ' + wide.join(', ') : ''}`);
  const phone = await b.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 1 });
  phone.on('pageerror', (e) => problems.push('phone page error: ' + e.message));
  wide = [];
  for (const id of IDS) {
    await phone.goto(`${BASE}#/q/${id}?sol=1&ms=1`);
    await phone.waitForLoadState('networkidle');
    const w = await phone.evaluate(() => document.documentElement.scrollWidth);
    if (w > 375) wide.push(`${id} (${w}px)`);
  }
  expect(wide.length === 0, `no sideways scrolling at 375 px${wide.length ? ': ' + wide.join(', ') : ''}`);
  await phone.goto(`${BASE}#/q/ibpp-d5-poisson-sphere?sol=1`);
  await phone.waitForLoadState('networkidle');
  await phone.screenshot({ path: 'tests/browser/shots/round9-poisson-phone.png', fullPage: false });

  console.log('Review 9: follow-through by either method, from a wrong selected speed, and the comet labelled an extension');
  for (const v of ['2909', '6310']) {
    await go('#/q/ibp-d1-satellite-orbits');
    await answer(0, '1.0e7');
    expect((await answer(2, v)).includes('error carried forward'), `orbital speed ${v} m/s follows on from a radius of 1.0 × 10⁷ m (2πr/T and √(GM/r))`);
  }
  await go('#/q/ibpp-d4-selector-normal');
  await answer(0, '2.0e5');
  expect((await answer(1, '0.0334')).includes('error carried forward'), 'selector (b) follows on from a wrong selected speed in (a)');
  await go('#/q/ibp-d1-comet-kepler');
  expect((await p.locator('.question').innerText()).includes('goes beyond the IB guide'), 'the comet question says it is an extension');
  await go('#/q/ibpp-d5-rc-plates?sol=1&ms=1');
  expect((await p.locator('.question').innerText()).includes('Capacitors are not in the IB Physics guide'), 'the RC problem says capacitors are not in the IB guide');

  console.log('Printing');
  await go('#/print?ids=ibp-d3-velocity-selector,ibp-d4-faraday-graph,ibpp-d5-poisson-sphere&title=Fields&sol=1&ms=1');
  await p.waitForSelector('.paper');
  const paper = await p.locator('.paper').innerText();
  expect((await p.locator('.paper .katex-error').count()) === 0, 'no maths errors on the paper');
  expect((await p.locator('.paper svg').count()) >= 1, 'the B–t graph is printed');
  expect(paper.includes('IB Physics HL') || paper.includes('IB++'), 'the paper names its course');
  await go('#/q/ibp-d4-faraday-graph?sol=1');
  await p.screenshot({ path: 'tests/browser/shots/round9-faraday.png', fullPage: false });

  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s):\n- ${problems.join('\n- ')}` : '\nAll round 9 checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
