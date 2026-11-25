// Browser checks for review 6: follow-through in Theme E questions, the HR diagram, derivations
// printed as written questions, and papers, labels and the student view naming the course an
// assignment was made for (an HL worksheet of shared SL questions is labelled HL).
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_round7.cjs
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
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Follow-through in the Theme E questions');
  await go('#/q/ibp-e2-compton-scattering');
  await answer(1, '20');
  const ok = await answer(2, '62.15');
  expect(ok.includes('Correct') && ok.includes('error carried forward'), `Compton (c): 62.15 keV follows from λf = 20 pm ("${ok.split('\n')[0]}")`);
  await go('#/q/ibp-e2-compton-scattering');
  await answer(1, '20');
  expect(!(await answer(2, '15.08')).includes('Correct'), 'Compton (c): 15.08 keV (the original shift with λf = 20 pm) is not accepted');
  await go('#/q/ibp-e3-half-life-graph');
  await answer(0, '12');
  expect((await answer(2, '48')).includes('error carried forward'), 'half-life (c): 48 h follows from a half-life of 12 h');
  await go('#/q/ibp-e2-de-broglie-electrons');
  await answer(0, '3.20e-17');
  expect((await answer(1, '7.64e-24')).includes('error carried forward'), 'de Broglie (b): the momentum follows from the energy in (a), and says so');

  console.log('The HR diagram');
  await go('#/q/ibp-e5-hr-diagram?sol=1&ms=1');
  await p.waitForSelector('figure.hr svg');
  const labels = (await p.locator('figure.hr .hr-star-label').allTextContents()).map((t) => t.trim());
  expect(['A', 'B', 'C', 'D', 'Sun'].every((l) => labels.includes(l)), `stars A–D and the Sun are marked (${labels.join(', ')})`);
  expect((await p.locator('figure.hr .hr-region-label').count()) === 4, 'the four regions are labelled');
  const options = (await part(0).locator('label').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  expect(options.join('|') === 'A Star A|B Star B|C Star C|D Star D', `star choices are in order (${options.join(' | ')})`);
  expect((await p.locator('.katex-error').count()) === 0, 'no maths errors');

  console.log('Derivations: online parts mark the value; the derivation is a written question on paper');
  await go('#/q/ump-t5-isotope-generator');
  expect((await part(0).innerText()).includes('only the activity is marked here'), 'the generator part says only the activity is marked');
  await go('#/print?ids=ump-t5-isotope-generator,ump-t7-kelvin-helmholtz&course=university-modern-physics&title=Derivations&ext=1&ms=1');
  await p.waitForSelector('.paper');
  const paper = await p.locator('.paper').innerText();
  expect((paper.match(/Show (by integration )?that/g) || []).length >= 2, 'both derivations are printed as written questions');
  expect(paper.includes('Integrating factor') && paper.includes('m(r)'), 'their rubrics are in the key');

  console.log('An HL worksheet of shared questions is labelled HL');
  await go('#/print?ids=ibp-e1-laser-photons&course=ib-physics-hl&title=HL%20sheet');
  await p.waitForSelector('.paper');
  const head = await p.locator('.paper-head').innerText();
  const meta = await p.locator('.pq-meta').first().innerText();
  expect(head.includes('IB Physics HL') && !head.includes('IB Physics SL'), `the paper header says IB Physics HL ("${head.replace(/\s+/g, ' ').slice(0, 120)}")`);
  expect(meta.includes('IB Physics HL'), `the question is labelled IB Physics HL ("${meta}")`);
  await go('#/print?ids=ibp-e1-laser-photons&course=ib-physics-sl&title=SL%20sheet');
  await p.waitForSelector('.paper');
  expect((await p.locator('.paper-head').innerText()).includes('IB Physics SL'), 'the same question on an SL sheet says IB Physics SL');

  console.log('…through the builder, the saved assignment and the student view');
  await go('#/builder');
  await p.selectOption('select[aria-label="Course"]', 'ib-physics-hl');
  await p.selectOption('select[aria-label="Topic"]', 'ibp.E.1');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  await p.locator('.pick-list li', { hasText: 'Photons from a laser pointer' }).locator('input[type=checkbox]').check();
  expect((await p.locator('.selected-list .sel-meta').first().innerText()).includes('IB Phys HL'), 'the chosen question is tagged IB Phys HL');
  await p.getByLabel('Assignment title').fill('HL photons');
  await p.getByRole('button', { name: 'Save assignment' }).click();
  await p.waitForTimeout(300);
  const row = p.locator('.assignments-table tr', { hasText: 'HL photons' }).first();
  expect((await row.innerText()).includes('IB Physics HL'), 'the saved assignment is listed as IB Physics HL');
  const printHref = await row.getByRole('link', { name: 'Print key' }).getAttribute('href');
  await go(printHref.replace(/^#?/, '#'));
  await p.waitForSelector('.paper');
  expect((await p.locator('.paper-head').innerText()).includes('IB Physics HL'), 'its printed key says IB Physics HL');
  await go('#/student');
  await p.getByLabel('Username').fill('hlstudent');
  await p.getByRole('button', { name: 'Sign in' }).click();
  await p.locator('.assignment-card', { hasText: 'HL photons' }).click();
  await p.waitForSelector('.question');
  expect((await p.locator('.q-meta').first().innerText()).includes('IB Physics HL'), 'the student sees the question labelled IB Physics HL');

  console.log('Phones');
  await p.setViewportSize({ width: 320, height: 800 });
  for (const h of ['#/q/ibp-e5-hr-diagram?sol=1&ms=1', '#/q/ump-t5-isotope-generator?sol=1&ms=1']) {
    await go(h);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 0, `${h.split('?')[0]} at 320 px (${over}px)`);
  }

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll round-7 browser checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
