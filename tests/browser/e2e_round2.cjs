// Browser checks for the second review round.
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => problems.push('page error: ' + e.message));
  const go = async (page, h) => { await page.goto(BASE + h); await page.waitForLoadState('networkidle'); };
  const fb = (i) => p.locator('.part').nth(i).locator('.feedback');

  console.log('Two signed-in student tabs stay quiet (no storage-event loop)');
  await go(p, '#/student');
  await p.getByLabel('Username').fill('twotabs'); await p.getByRole('button', { name: 'Sign in' }).click();
  await p.locator('.assignment-card').first().click(); await p.waitForSelector('.question');
  const p2 = await ctx.newPage();
  await go(p2, '#/student'); await p2.locator('.assignment-card').first().click(); await p2.waitForSelector('.question');
  for (const pg of [p, p2]) await pg.evaluate(() => { window.__events = 0; window.addEventListener('storage', () => window.__events++); });
  await p.waitForTimeout(2000);
  const ev1 = await p.evaluate(() => window.__events);
  const ev2 = await p2.evaluate(() => window.__events);
  expect(ev1 + ev2 === 0, `storage events in 2 s with two idle tabs: ${ev1} + ${ev2} (was hundreds)`);
  // Typing in one tab updates the other without a loop.
  await p.locator('.num-input').first().fill('1.5');
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => window.__events) + await p2.evaluate(() => window.__events);
  expect(after < 10, `a few events after typing, not a loop (${after})`);
  expect((await p2.locator('.num-input').first().inputValue()) === '1.5', 'the other tab shows the typed answer');
  await p2.close();

  console.log('Train: no credit for an answer between the two methods');
  await go(p, '#/q/ibp-a1-train-acceleration');
  await p.getByRole('button', { name: 'Reset answers' }).click();
  const inp = p.locator('.num-input');
  await inp.nth(0).fill('0.10'); await inp.nth(0).press('Enter');
  await inp.nth(1).fill('100'); await inp.nth(1).press('Enter');
  expect((await fb(1).innerText()).includes('Not quite'), '(b) 100 with (a) = 0.10 is marked wrong (was 2/2)');
  await inp.nth(1).fill('160'); await inp.nth(1).press('Enter');
  expect((await fb(1).innerText()).includes('error carried forward'), '(b) 160 still gets follow-through credit');

  console.log('Parser in the page');
  await inp.nth(0).fill('0.48 m·s⁻²'); await inp.nth(0).press('Enter');
  expect((await fb(0).innerText()).includes('Correct'), '"0.48 m·s⁻²" accepted');
  await inp.nth(0).fill('0.48x10^(0}'); await inp.nth(0).press('Enter');
  expect(!(await fb(0).innerText()).includes('Correct'), '"0.48x10^(0}" refused');

  console.log('Lift: Reset points clears the drawing and the marks that depended on it');
  await go(p, '#/q/ibp-a1-lift-vt-draw');
  await p.getByRole('button', { name: 'Reset answers' }).click();
  // Nudge a point away and back: the graph is back to its starting layout, so it is not an answer.
  const h = p.locator('.g-handle');
  await h.nth(0).focus(); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowRight');
  await p.locator('.num-input').first().fill('32'); await p.locator('.num-input').first().press('Enter');
  const before = await fb(1).innerText();
  expect(!before.includes('Correct'), `points back at the start earn no follow-through ("${before.replace(/\n/g, ' ')}")`);
  await h.nth(0).focus(); await p.keyboard.press('ArrowDown'); // now a real (if odd) drawing
  await p.locator('.num-input').first().press('Enter');
  await p.getByRole('button', { name: 'Reset points' }).click();
  const afterReset = await fb(1).innerText();
  expect(!afterReset.includes('Correct') && (await p.locator('.q-score-num').innerText()).startsWith('0'), `after Reset points, (b) 32 earns nothing (before: "${before.split('\n')[1] ?? before}", after: "${afterReset.replace(/\n/g, ' ')}")`);

  console.log('Builder: a removed question is not re-added after Preview → Back');
  await go(p, '#/bank');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  await p.locator('.q-card').nth(2).getByRole('link', { name: 'Add to assignment' }).click();
  await p.waitForSelector('.pick-list');
  expect(!(await p.evaluate(() => location.hash)).includes('add='), 'the ?add= link is consumed');
  const picked = p.locator('.pick-list li.is-picked');
  const title = await picked.first().locator('.pick-title').innerText();
  await picked.first().locator('input[type=checkbox]').uncheck();
  await p.locator('.pick-preview').first().click(); await p.waitForSelector('.question');
  await p.goBack(); await p.waitForSelector('.pick-list');
  const titles = await p.locator('.pick-list li.is-picked .pick-title').allInnerTexts();
  expect(!titles.includes(title), `"${title}" stays removed`);

  console.log('Demo work from older builds is not shown with stale marks');
  await p.evaluate(() => {
    localStorage.setItem('rice-hw:v1:session', JSON.stringify({ classCode: 'DEMO', username: 'alex' }));
    localStorage.setItem('rice-hw:v1:work:DEMO:alex::sample-a1::ibp-a1-free-fall-mcq', JSON.stringify({ main: { response: { kind: 'mcq', choice: 'o2' }, result: { status: 'correct', score: 1, max: 1 }, attempts: 1 } }));
  });
  await go(p, '#/student');
  await p.getByRole('button', { name: 'Sign out' }).click().catch(() => {});
  await p.getByLabel('Username').fill('alex'); await p.getByRole('button', { name: 'Sign in' }).click();
  await p.locator('.assignment-card').first().click(); await p.waitForSelector('.question');
  const checked = await p.locator('.mcq').first().locator('input[type=radio]:checked').count();
  expect(checked === 0, 'old v1 choice is not carried into the revised question');

  console.log('PDF (A4, base, no key): each multiple-choice question stays on one page');
  await go(p, '#/print?ids=ibp-a1-train-acceleration,ibp-a1-stopping-distance,ibp-a1-vt-graph-cyclist,ibp-a1-lift-vt-draw,ibp-a1-free-fall-mcq,ibp-a1-projectile-top-mcq,ibp-a1-projectile-kick&title=All%20A.1');
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: 'round2-base-a4.pdf', format: 'A4', printBackground: false });

  await b.close();
  console.log('\nProblems:', problems.length ? problems : 'none');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
