// Browser checks for review round 4: later-topics option, Combine topics, follow-through
// only from checked answers, paper-only extensions, zero-padded answers, home page.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_round4.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

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
  expect(!(await p.locator('.hero-stats').innerText()).includes('s.f.'), 'no significant-figures panel on the home page');

  console.log('Builder: questions that need later topics are left out by default');
  await go('#/builder');
  await p.selectOption('select[aria-label="Topic"]', 'ibp.A.2');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  const titles = async () => p.locator('.pick-list .pick-title').allInnerTexts();
  let t = await titles();
  expect(t.length === 11 && !t.some((x) => x.includes('trolleys')), `SL A.2 without later topics: 11 questions, no trolley collision (${t.length})`);
  const toggle = p.locator('.later-toggle');
  expect((await toggle.innerText()).includes('2 more questions'), `the option says how many it adds ("${(await toggle.innerText()).split('(')[1]?.split(';')[0]}")`);
  await toggle.locator('input').check();
  t = await titles();
  expect(t.length === 13 && t.some((x) => x.includes('trolleys')), `with later topics: 13 questions (${t.length})`);
  const chip = await p.locator('.pick-list li', { hasText: 'A collision between two trolleys' }).locator('.chip-uses').innerText();
  expect(chip.includes('A.3') && chip.includes('later topic'), `the trolley question is labelled "${chip}"`);
  await toggle.locator('input').uncheck();

  console.log('Builder: Combine topics');
  await p.locator('.segmented button', { hasText: 'Combine topics' }).click();
  const help = await p.locator('.combine-help').innerText();
  expect(help.includes('Choose two or more topics') && help.includes('every'), 'clear instructions are shown');
  expect(await p.locator('.combine .std-prompt').isVisible(), 'prompt to choose at least two topics');
  await p.locator('.combine .std-chip', { hasText: 'A.2 Forces and momentum' }).click();
  await p.locator('.combine .std-chip', { hasText: 'A.3 Work, energy and power' }).click();
  t = await titles();
  expect(t.length === 2 && t.some((x) => x.includes('trolleys')) && !t.some((x) => x.includes('lift')), `A.2 + A.3 gives the 2 questions that use both (${t.join(' | ')})`);
  await p.locator('.combine .std-chip', { hasText: 'A.3 Work, energy and power' }).click();
  await p.locator('.combine .std-chip', { hasText: 'A.1 Kinematics' }).click();
  t = await titles();
  expect(t.some((x) => x.includes('skydiver')) && t.some((x) => x.includes('Mars')), `A.1 + A.2 gives the skydiver and Mars lander (${t.join(' | ')})`);
  await p.locator('.segmented button', { hasText: 'IB Physics HL' }).click();
  await p.locator('.combine .std-chip', { hasText: 'A.1 Kinematics' }).click();
  await p.locator('.combine .std-chip', { hasText: 'A.3 Work, energy and power' }).click();
  t = await titles();
  expect(t.length === 3 && t.some((x) => x.includes('glancing')), `HL A.2 + A.3 adds the HL collision (${t.length})`);
  await p.locator('.segmented button', { hasText: 'One topic' }).click();
  expect(await p.locator('select[aria-label="Topic"]').isVisible(), 'back to One topic');
  await p.locator('.segmented button', { hasText: 'IB Physics SL' }).click();

  console.log('Bank: Combine topics, kept in the address');
  await go('#/bank?course=ib-physics-sl&topic=ibp.A.2');
  await p.locator('.bank-mode .segmented button', { hasText: 'Combine topics' }).click();
  await p.locator('.combine .std-chip', { hasText: 'A.2 Forces and momentum' }).click();
  await p.locator('.combine .std-chip', { hasText: 'A.3 Work, energy and power' }).click();
  expect((await p.locator('.q-card').count()) === 2, `2 cards for A.2 + A.3 (${await p.locator('.q-card').count()})`);
  expect(p.url().includes('mode=combine') && p.url().includes('topics='), 'choice kept in the address');
  await p.reload();
  await p.waitForSelector('.combine');
  expect((await p.locator('.q-card').count()) === 2, 'still 2 after reloading');

  console.log('Follow-through only from checked answers (preview)');
  await go('#/q/ibp-a1-train-acceleration');
  const part = (i) => p.locator('.part').nth(i);
  await part(0).locator('.num-input').fill('0.5'); // wrong, and NOT checked
  await part(1).locator('.num-input').fill('32'); // (20 − 4.0)/0.5
  await part(1).getByRole('button', { name: 'Check' }).click();
  expect(!(await part(1).locator('.feedback').innerText()).includes('Correct'), '(b) earns nothing from an unchecked (a)');
  await part(0).getByRole('button', { name: 'Check' }).click();
  const fbB = await part(1).locator('.feedback').innerText();
  expect(fbB.includes('error carried forward'), `once (a) is checked, (b) is re-marked by follow-through ("${fbB.split('\n').join(' ')}")`);

  console.log('Follow-through only from checked answers (assignment, Codex scenario)');
  await go('#/student');
  await p.getByLabel('Username').fill('ecfcheck');
  await p.getByRole('button', { name: 'Sign in' }).click();
  await p.locator('.assignment-card').first().click();
  await p.waitForSelector('.question');
  const train = p.locator('#q-ibp-a1-train-acceleration');
  const pinned = await p.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes('params:DEMO:ecfcheck') && k.includes('train'));
    return JSON.parse(localStorage.getItem(key));
  });
  const wrongA = 0.5;
  const tFromWrong = (pinned.v - pinned.u) / wrongA;
  await train.locator('.part').nth(0).locator('.num-input').fill(String(wrongA));
  await train.locator('.part').nth(1).locator('.num-input').fill(String(Number(tFromWrong.toPrecision(3))));
  await train.locator('.part').nth(1).getByRole('button', { name: 'Check' }).click();
  const res = await train.locator('.part').nth(1).locator('.feedback').innerText();
  expect(!res.includes('Correct'), `(b) is not credited from an unchecked draft in (a) (${res.split('\n')[0]})`);
  expect(!(await train.locator('.part').nth(1).locator('.num-input').isDisabled()), '(b) is not locked');

  console.log('Padded zeros are accepted');
  await go('#/q/ibp-a1-train-acceleration');
  await part(0).locator('.num-input').fill('0.48000000');
  await part(0).locator('.num-input').press('Enter');
  expect((await part(0).locator('.feedback').innerText()).includes('Correct'), '"0.48000000" is accepted for 0.48');

  console.log('Paper-only written extensions');
  await go('#/q/ibp-a1-stopping-distance?ms=1');
  expect((await p.locator('.extension-teacher').count()) === 1, 'the teacher preview shows the written extension (collapsed)');
  await go('#/print?ids=ibp-a1-stopping-distance,ibp-a2-trolley-collision,ibp-a2-lift-scales&title=Ext&ext=1&ms=1');
  expect((await p.locator('.pq-extension').count()) === 2, 'printed with extensions: 2 extension questions');
  expect((await p.locator('.paper-key .key-label', { hasText: 'Extension' }).count()) === 2, 'their markschemes are in the answer key');
  await go('#/print?ids=ibp-a1-stopping-distance,ibp-a2-trolley-collision&title=NoExt&ms=1');
  expect((await p.locator('.pq-extension').count()) === 0, 'not printed unless chosen');
  await go('#/student');
  await p.locator('.assignment-card').first().click();
  await p.waitForSelector('.question');
  expect((await p.locator('.extension-teacher').count()) === 0, 'students never see the extensions online');

  console.log('Phone width: no sideways scrolling');
  await p.setViewportSize({ width: 375, height: 800 });
  for (const h of ['#/builder', '#/bank?course=ib-physics-sl&topic=ibp.A.2&mode=combine&topics=ibp.A.2,ibp.A.3']) {
    await go(h);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 0, `${h.split('?')[0]}: no sideways scrolling at 375 px (${over}px)`);
  }

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll round-4 browser checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
