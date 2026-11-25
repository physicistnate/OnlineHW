// Marking checks on the new A.1/A.2 content in the browser (base versions).
const { chromium } = require('playwright');
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  p.on('pageerror', (e) => problems.push('page error: ' + e.message));
  const answer = async (i, v) => {
    const inp = p.locator('.part').nth(i).locator('.num-input');
    await inp.fill(v);
    await inp.press('Enter');
    return p.locator('.part').nth(i).locator('.feedback').innerText();
  };

  await p.goto('http://localhost:4173/#/q/ibp-a1-electron-acceleration');
  await p.waitForSelector('.question');
  expect((await answer(0, '1.0x10^16')).includes('Correct'), 'electron (a): "1.0x10^16" accepted');
  expect((await answer(0, '1.0×10¹⁵')).includes('power of ten'), 'electron (a): 10¹⁵ gets the power-of-ten hint');
  expect((await answer(1, '2.0e-9')).includes('Correct'), 'electron (b): "2.0e-9" accepted');

  await p.goto('http://localhost:4173/#/q/ibp-a1-walk-displacement');
  await p.waitForSelector('.question');
  expect((await answer(4, '0')).includes('Correct'), 'walk (e): average velocity 0 accepted');
  expect(!(await answer(4, '1.41')).includes('Correct'), 'walk (e): the average speed is not accepted as the velocity');

  await p.goto('http://localhost:4173/#/q/ibp-a1-cliff-launch');
  await p.waitForSelector('.question');
  // Base: h = 45 m, u = 12.0 m/s -> t = 3.03 s. A student who gets t = 3.5 s and then d = 12 x 3.5 = 42 m.
  await answer(0, '3.5');
  expect((await answer(1, '42')).includes('error carried forward'), 'cliff (b): ECF from a wrong time');
  expect((await answer(2, '32')).includes('Correct'), 'cliff (c): speed 32 accepted');

  await p.goto('http://localhost:4173/#/builder');
  await p.evaluate(() => localStorage.clear());
  await p.goto('http://localhost:4173/#/builder');
  await p.selectOption('select[aria-label="Topic"]', 'ibp.A.2');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  const sl = await p.locator('.pick-list .pick-title').allInnerTexts();
  expect(sl.length === 9 && !sl.some((t) => t.includes('glancing')), `SL A.2 lists 9 questions without the HL one (${sl.length})`);
  expect(!(await p.locator('.std-chip').allInnerTexts()).some((t) => t.includes('A.2.10')), 'SL hides the HL standard A.2.10');
  await p.locator('.segmented button', { hasText: 'IB Physics HL' }).click();
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  const hl = await p.locator('.pick-list .pick-title').allInnerTexts();
  expect(hl.length === 10 && hl.some((t) => t.includes('glancing')), `HL A.2 lists 10 questions including the HL one (${hl.length})`);

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll content checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
