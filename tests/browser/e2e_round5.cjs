// Browser checks for round 5: IB A.3 Work, energy and power, and the trial units for AP Physics C:
// Mechanics and University Physics I. Grouped course menu, every new question rendering cleanly,
// answer boxes in m/s, the F–x graph with negative forces, printing, and phone widths.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_round5.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

const IB_A3 = ['sledge-pull', 'rough-ramp', 'force-extension-area', 'spring-launcher', 'roller-coaster', 'car-power', 'motor-efficiency', 'home-energy', 'data-centre', 'hydroelectric', 'power-station', 'energy-density'].map((x) => `ibp-a3-${x}`);
const AP_U3 = ['variable-force', 'force-position-graph', 'dot-product', 'incline-friction', 'spring-friction', 'bungee-jump', 'potential-function', 'loop-the-loop', 'power-time-force', 'elevator-power'].map((x) => `apcm-u3-${x}`);
const UP_T3 = ['dot-product-3d', 'exponential-force', 'nonlinear-spring', 'pumping-tank', 'potential-well', 'spring-incline', 'ramp-variable-friction', 'constant-power-car', 'data-center-ramp', 'home-load-profile'].map((x) => `up1-t3-${x}`);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', (e) => problems.push('page error: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
  const go = async (h) => { await p.goto(BASE + h); await p.waitForLoadState('networkidle'); };
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Home page');
  await go('#/');
  const stats = await p.locator('.hero-stats').innerText();
  expect(stats.includes('6 courses') && stats.includes('AP Physics C: Mechanics') && stats.includes('University Modern Physics') && stats.includes('IB++ Physics/Math'), 'the stats name all six courses (IB++ Physics/Math added in round 8)');
  const status = await p.locator('.status-card').innerText();
  expect(status.includes('A.3 Work, energy and power: 13 questions'), 'status lists A.3 with 13 questions (12 plus the Sankey diagram from round 6)');
  expect(status.includes('Unit 3 Work, Energy, and Power (10 questions)') && status.includes('Topic 3 Work, energy and power (10 questions'), 'status lists the two trial units');

  console.log('Course menu: grouped IB, AP and University');
  await go('#/bank');
  const groups = await p.locator('select[aria-label="Course"] optgroup').evaluateAll((els) => els.map((e) => e.label));
  expect(JSON.stringify(groups) === JSON.stringify(['IB', 'AP', 'University', 'IB++']), `groups ${JSON.stringify(groups)}`);
  const selectAll = () => p.getByRole('button', { name: 'Select all', exact: true }).click();
  await p.selectOption('select[aria-label="Course"]', 'ap-physics-c-mech');
  await p.waitForSelector('.topic-head');
  await selectAll();
  expect(p.url().includes('course=ap-physics-c-mech'), 'choosing a course updates the address');
  expect((await p.locator('.topic-head').innerText()).includes('Unit 3'), 'AP opens on Unit 3, the unit with questions');
  expect((await p.locator('.q-card').count()) === 10, `AP Unit 3: 10 questions (${await p.locator('.q-card').count()})`);
  expect((await p.locator('.side-topic.is-empty').count()) === 6, 'the six AP units without questions are shown as empty');
  expect((await p.locator('.later-toggle').innerText()).includes('unit order'), 'the later-topics note explains AP unit order');
  await p.selectOption('select[aria-label="Course"]', 'university-physics-1');
  await p.waitForSelector('.topic-head');
  await selectAll();
  expect((await p.locator('.topic-head').innerText()).includes('Topic 3'), 'University opens on Topic 3');
  expect((await p.locator('.q-card').count()) === 10, `University Topic 3: 10 questions (${await p.locator('.q-card').count()})`);
  await go('#/bank?course=ib-physics-sl&topic=ibp.A.3');
  await selectAll();
  expect((await p.locator('.q-card').count()) === 13, `IB SL A.3: 13 questions (${await p.locator('.q-card').count()})`);
  expect((await p.locator('.later-toggle').innerText()).includes('IB guide'), 'the later-topics note explains IB order');
  await go('#/bank?course=ib-physics-hl&topic=ibp.A.3');
  await selectAll();
  expect((await p.locator('.q-card').count()) === 13, 'IB HL A.3: the same 13 questions');

  console.log('Every new question renders cleanly (with solutions and markschemes)');
  const bad = [];
  for (const id of [...IB_A3, ...AP_U3, ...UP_T3]) {
    await go(`#/q/${id}?sol=1&ms=1`);
    await p.waitForSelector('.question');
    const errs = await p.locator('.katex-error').count();
    const parts = await p.locator('.part').count();
    if (errs > 0 || parts < 3) bad.push(`${id} (katex errors ${errs}, parts ${parts})`);
  }
  expect(bad.length === 0, `32 new questions render with no maths errors${bad.length ? ': ' + bad.join(', ') : ''}`);
  await go('#/q/apcm-u3-variable-force');
  expect((await p.locator('.q-meta, .question').first().innerText()).includes('AP Physics C: Mechanics'), 'AP questions are labelled with their course');
  await go('#/q/up1-t3-pumping-tank');
  expect((await p.locator('.question').innerText()).includes('University Physics I'), 'University questions are labelled with their course');

  console.log('Answer boxes in m/s accept both ways of typing the unit');
  const part = (i) => p.locator('.part').nth(i);
  await go('#/q/apcm-u3-variable-force');
  expect((await part(1).innerText()).includes('m/s'), 'the unit after the box reads m/s');
  await part(1).locator('.num-input').fill('4.62 m/s');
  await part(1).locator('.num-input').press('Enter');
  expect((await part(1).locator('.feedback').innerText()).includes('Correct'), '"4.62 m/s" is correct');
  await go('#/q/apcm-u3-loop-the-loop');
  await part(0).locator('.num-input').fill('3.43 m s-1');
  await part(0).locator('.num-input').press('Enter');
  expect((await part(0).locator('.feedback').innerText()).includes('Correct'), '"3.43 m s-1" is correct where the box shows m/s');
  await go('#/q/ibp-a3-motor-efficiency');
  await part(2).locator('.num-input').fill('60.3%');
  await part(2).locator('.num-input').press('Enter');
  expect((await part(2).locator('.feedback').innerText()).includes('Correct'), 'an efficiency typed as "60.3%" is correct');

  console.log('Graphs and tables');
  await go('#/q/apcm-u3-force-position-graph');
  expect((await p.locator('.question svg').count()) >= 1, 'the F–x graph is drawn');
  const yLabels = await p.locator('.question svg text').evaluateAll((els) => els.map((e) => e.textContent ?? ''));
  expect(yLabels.some((t) => t.trim().startsWith('−') || t.trim().startsWith('-')), 'its force axis goes below zero');
  await go('#/q/ibp-a3-home-energy');
  expect((await p.locator('.q-stem .eq-flow').count()) === 1, 'the appliance table is shown'); // display maths renders as a wrapping .eq-flow
  // KaTeX writes the spaces in \text{} as no-break spaces.
  expect((await p.locator('.q-stem').innerText()).replace(/\u00a0/g, ' ').includes('EV charger'), 'the table lists the car charger');

  console.log('Builder: AP and University courses');
  await go('#/builder');
  await p.selectOption('select[aria-label="Course"]', 'ap-physics-c-mech');
  expect((await p.locator('body').innerText()).includes('Pilot course'), 'the builder explains that the AP course is a pilot');
  await p.selectOption('select[aria-label="Topic"]', 'apcm.3');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  expect((await p.locator('.pick-list .pick-title').count()) === 10, 'AP Unit 3: 10 questions to pick from');
  await p.selectOption('select[aria-label="Course"]', 'university-physics-1');
  await p.selectOption('select[aria-label="Topic"]', 'up1.3');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  expect((await p.locator('.pick-list .pick-title').count()) === 10, 'University Topic 3: 10 questions to pick from');

  console.log('Printing');
  await go('#/print?ids=apcm-u3-force-position-graph,apcm-u3-variable-force&course=ap-physics-c-mech&title=AP&ms=1');
  expect((await p.locator('.paper').innerText()).includes('AP Physics C equation sheet'), 'AP print instructions');
  expect((await p.locator('.paper .katex-error').count()) === 0 && (await p.locator('.paper svg').count()) >= 1, 'AP questions print with their graph');
  await go('#/print?ids=up1-t3-home-load-profile,up1-t3-pumping-tank&course=university-physics-1&title=Uni&ms=1');
  expect((await p.locator('.paper').innerText()).includes('integrals'), 'University print instructions mention integrals');
  await go('#/print?ids=ibp-a3-home-energy,ibp-a3-data-centre&title=IB&ms=1');
  expect((await p.locator('.paper .katex-error').count()) === 0, 'IB A.3 questions print cleanly');

  console.log('Phone width: no sideways scrolling');
  await p.setViewportSize({ width: 375, height: 800 });
  for (const h of ['#/q/ibp-a3-home-energy?sol=1&ms=1', '#/q/ibp-a3-data-centre?sol=1&ms=1', '#/q/up1-t3-home-load-profile?sol=1&ms=1', '#/q/apcm-u3-bungee-jump?sol=1&ms=1', '#/bank?course=ap-physics-c-mech', '#/builder']) {
    await go(h);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 0, `${h.split('?')[0]}${h.includes('q/') ? ' ' + h.split('/')[2].split('?')[0] : ''}: no sideways scrolling at 375 px (${over}px)`);
  }
  await go('#/q/ibp-a3-home-energy');
  const table = await p.locator('.q-stem .eq-flow').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(table <= 0, `the appliance table fits a phone without scrolling sideways (${table}px)`);

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll round-5 browser checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
