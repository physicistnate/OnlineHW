// Browser checks for Theme B (B.1–B.5): the home page, the bank in SL and HL, every new
// question rendering cleanly, marking with follow-through, answers typed in °C, the graphs,
// phone widths and a printed paper.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_theme_b.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

const THEME_B = {
  'ibp-b1': ['kettle', 'method-of-mixtures', 'ice-drink', 'window-conduction', 'radiant-heater', 'liquid-nitrogen'],
  'ibp-b2': ['earth-balance', 'sea-ice-albedo', 'planet-temperatures', 'greenhouse-gases', 'warmer-earth'],
  'ibp-b3': ['tyre-pressure', 'weather-balloon', 'molecular-speeds', 'helium-cylinder', 'scuba-tank', 'absolute-zero'],
  'ibp-b4': ['piston-heating', 'pv-cycle', 'power-station-entropy', 'adiabatic-compression', 'entropy-melting'],
  'ibp-b5': ['phone-battery', 'resistivity-wire', 'filament-lamp', 'series-parallel', 'potential-divider', 'internal-resistance'],
};
const IDS = Object.entries(THEME_B).flatMap(([prefix, names]) => names.map((n) => `${prefix}-${n}`));
const LOST = /(?<![A-Za-z])imes|(?<![A-Za-z])rac\{|\bfrac\{|\bsqrt\{|(?<![A-Za-z])ightarrow/;

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
  const visibleText = () =>
    p.evaluate(() => {
      const q = document.querySelector('.question').cloneNode(true);
      q.querySelectorAll('.katex-mathml').forEach((e) => e.remove());
      return q.textContent;
    });
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Home page');
  await go('#/');
  const status = await p.locator('.status-card').innerText();
  expect(status.includes('IB Physics · Theme B The particulate nature of matter: B.1 Thermal energy transfers: 6 questions'), 'status lists Theme B, starting with B.1');
  expect(status.includes('B.4 Thermodynamics: 5 questions (HL only)'), 'status lists B.4 as HL only');

  console.log('Theme B in the bank: SL without B.4, HL with it');
  for (const [topic, n] of [['ibp.B.1', 6], ['ibp.B.2', 5], ['ibp.B.3', 6], ['ibp.B.5', 6]]) {
    const got = await cards('ib-physics-sl', topic);
    expect(got === n, `SL ${topic}: ${n} questions (${got})`);
  }
  await go('#/bank?course=ib-physics-sl');
  await p.waitForSelector('.topic-head');
  expect(!(await p.locator('.side-topic').allInnerTexts()).some((t) => t.includes('Thermodynamics')), 'SL has no B.4 Thermodynamics topic');
  const hlB4 = await cards('ib-physics-hl', 'ibp.B.4');
  expect(hlB4 === 5, `HL ibp.B.4: 5 questions (${hlB4})`);

  console.log('Every Theme B question renders with its solution and markscheme');
  const bad = [];
  for (const id of IDS) {
    await go(`#/q/${id}?sol=1&ms=1`);
    await p.waitForSelector('.question');
    const errs = await p.locator('.katex-error').count();
    const parts = await p.locator('.part').count();
    const lost = LOST.test(await visibleText());
    if (errs > 0 || parts < 3 || lost) bad.push(`${id} (maths errors ${errs}, parts ${parts}${lost ? ', a lost backslash' : ''})`);
  }
  expect(bad.length === 0, `${IDS.length} questions render with no maths errors or lost commands${bad.length ? ': ' + bad.join(', ') : ''}`);
  await go('#/q/ibp-b4-pv-cycle');
  expect((await p.locator('.question').innerText()).includes('IB Physics HL'), 'a B.4 question is labelled IB Physics HL');
  for (const id of ['ibp-b3-absolute-zero', 'ibp-b4-pv-cycle', 'ibp-b5-internal-resistance', 'ibp-b5-filament-lamp']) {
    await go(`#/q/${id}`);
    expect((await p.locator('.question svg').count()) >= 1, `${id}: its graph is drawn`);
  }

  console.log('Marking: the kettle (base version: 1.0 kg from 18 °C, 2200 W)');
  await go('#/q/ibp-b1-kettle');
  expect((await answer(0, '3.43e5')).includes('Correct'), '(a) Q = 3.43 × 10⁵ J is correct');
  expect((await answer(1, '156')).includes('Correct'), '(b) t = 156 s is correct');
  await go('#/q/ibp-b1-kettle');
  await answer(0, '3.0e5');
  expect((await answer(1, '136')).includes('error carried forward'), '(b) follows on from a wrong (a)');

  console.log('Answers in °C (ice in a drink: 13.8 °C)');
  for (const typed of ['13.8', '13.8 °C', '13.8 C']) {
    await go('#/q/ibp-b1-ice-drink');
    expect((await answer(1, typed)).includes('Correct'), `"${typed}" is accepted`);
  }

  console.log('Phone width: no sideways scrolling');
  const phone = await b.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 1 });
  phone.on('pageerror', (e) => problems.push('phone page error: ' + e.message));
  const wide = [];
  for (const id of IDS) {
    await phone.goto(`${BASE}#/q/${id}?sol=1&ms=1`);
    await phone.waitForLoadState('networkidle');
    const w = await phone.evaluate(() => document.documentElement.scrollWidth);
    if (w > 375) wide.push(`${id} (${w}px)`);
  }
  expect(wide.length === 0, `no sideways scrolling at 375 px${wide.length ? ': ' + wide.join(', ') : ''}`);
  await phone.goto(`${BASE}#/q/ibp-b3-absolute-zero?sol=1`);
  await phone.waitForLoadState('networkidle');
  await phone.screenshot({ path: 'tests/browser/shots/theme-b-absolute-zero-phone.png', fullPage: false });

  console.log('Printing');
  await go('#/print?ids=ibp-b3-absolute-zero,ibp-b4-pv-cycle,ibp-b5-internal-resistance&title=Theme%20B&sol=1&ms=1');
  await p.waitForSelector('.paper');
  expect((await p.locator('.paper .katex-error').count()) === 0, 'no maths errors on the paper');
  expect((await p.locator('.paper svg').count()) >= 3, 'the three graphs are printed');
  await go('#/q/ibp-b4-pv-cycle?sol=1');
  await p.screenshot({ path: 'tests/browser/shots/theme-b-pv-cycle.png', fullPage: false });

  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s):\n- ${problems.join('\n- ')}` : '\nAll Theme B checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
