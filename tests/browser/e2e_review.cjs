// Browser checks for the issues raised in the Codex review.
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => problems.push('page error: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
  const go = async (h) => { await p.goto(BASE + h); await p.waitForLoadState('networkidle'); };
  const fb = (i) => p.locator('.part').nth(i).locator('.feedback');

  console.log('ECF is withdrawn when (a) is corrected (and stays withdrawn after reload)');
  await go('#/q/ibp-a1-train-acceleration');
  await p.getByRole('button', { name: 'Reset answers' }).click();
  const inp = p.locator('.num-input');
  await inp.nth(0).fill('0.5'); await inp.nth(0).press('Enter');
  await inp.nth(1).fill('32'); await inp.nth(1).press('Enter');
  expect((await fb(1).innerText()).includes('error carried forward'), '(b) 32 gets ECF from (a) = 0.5');
  await inp.nth(0).fill('0.48'); await inp.nth(0).press('Enter');
  expect((await fb(1).innerText()).includes('Not quite'), '(b) 32 is re-marked wrong once (a) is 0.48');
  expect((await p.locator('.q-score-num').innerText()).startsWith('2'), `score is 2/4, not 4/4 (got ${await p.locator('.q-score-num').innerText()})`);
  await p.reload(); await p.waitForSelector('.question');
  expect((await fb(1).innerText()).includes('Not quite'), 'still wrong after reload');

  console.log('Negative follow-through is not credited');
  await inp.nth(0).fill('-0.50'); await inp.nth(0).press('Enter');
  await inp.nth(1).fill('-32'); await inp.nth(1).press('Enter');
  expect(!(await fb(1).innerText()).includes('Correct'), '(b) −32 s is not accepted by ECF');

  console.log('Malformed numbers and wrong units are refused (not marked)');
  for (const [s, msg] of [['0.48e', 'power of ten'], ['0.48x2', 'powers of ten'], ['0.48m+999', "doesn't look like a number"], ['0.48 km', 'Enter just the number']]) {
    await inp.nth(0).fill(s); await inp.nth(0).press('Enter');
    const t = await fb(0).innerText();
    expect(t.includes(msg) && !t.includes('Correct'), `"${s}" → refused with "${msg}"`);
  }
  await inp.nth(0).fill('0.48 m/s^2'); await inp.nth(0).press('Enter');
  expect((await fb(0).innerText()).includes('Correct'), '"0.48 m/s^2" (the right unit) is accepted');

  console.log('Graph: one misplaced point keeps credit for the other segments; ECF from the graph in (b)');
  await go('#/q/ibp-a1-lift-vt-draw');
  await p.getByRole('button', { name: 'Reset answers' }).click();
  // Start points (2,4) (5,4) (7,4) (10,4). Target: (0,0) wrong → (11,4); (3,3) (8,3) (10,0).
  const moves = [[9, 0], [-2, -2], [1, -2], [0, -8]];
  const h = p.locator('.g-handle');
  for (let i = 0; i < 4; i++) {
    await h.nth(i).focus();
    const [dx, dy] = moves[i];
    for (let k = 0; k < Math.abs(dx); k++) await p.keyboard.press(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    for (let k = 0; k < Math.abs(dy); k++) await p.keyboard.press(dy > 0 ? 'ArrowUp' : 'ArrowDown');
  }
  await p.getByRole('button', { name: 'Check graph' }).click();
  const g = await fb(0).innerText();
  expect(g.includes('2/3'), `origin misplaced → 2/3 (got "${g.replace(/\n/g, ' ')}")`);
  // Now draw the plateau at 4 m/s (area 30 m) and answer 30 in (b).
  await p.getByRole('button', { name: 'Reset points' }).click();
  const moves2 = [[-2, -8], [-2, 0], [1, 0], [0, -8]]; // (0,0) (3,4) (8,4) (10,0)
  for (let i = 0; i < 4; i++) {
    await h.nth(i).focus();
    const [dx, dy] = moves2[i];
    for (let k = 0; k < Math.abs(dx); k++) await p.keyboard.press(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    for (let k = 0; k < Math.abs(dy); k++) await p.keyboard.press(dy > 0 ? 'ArrowUp' : 'ArrowDown');
  }
  // Follow-through uses the checked graph, so check the new drawing first.
  await p.getByRole('button', { name: 'Check graph' }).click();
  await p.locator('.num-input').first().fill('30'); await p.locator('.num-input').first().press('Enter');
  expect((await fb(1).innerText()).includes('your graph in (a)'), '(b) 30 m accepted by ECF from the drawn (and checked) graph');

  console.log('Two MCQs on one page keep separate selections');
  await go('#/student');
  if (await p.getByLabel('Username').count()) { await p.getByLabel('Username').fill('audit45'); await p.getByRole('button', { name: 'Sign in' }).click(); }
  else { await p.getByRole('button', { name: 'Sign out' }).click(); await p.getByLabel('Username').fill('audit45'); await p.getByRole('button', { name: 'Sign in' }).click(); }
  await p.locator('.assignment-card').first().click(); await p.waitForSelector('.question');
  const mcqs = p.locator('.mcq');
  expect((await mcqs.count()) === 8, 'sample assignment has eight multiple-choice parts');
  await mcqs.nth(0).locator('label.mcq-row').nth(1).click();
  await mcqs.nth(1).locator('label.mcq-row').nth(2).click();
  const checked0 = await mcqs.nth(0).locator('input[type=radio]').nth(1).isChecked();
  const checked1 = await mcqs.nth(1).locator('input[type=radio]').nth(2).isChecked();
  const names = await p.locator('.mcq input[type=radio]').evaluateAll((els) => [...new Set(els.map((e) => e.name))]);
  expect(checked0 && checked1, 'both radio buttons stay checked');
  expect(names.length === 8, `eight separate radio groups (got ${names.length})`);

  console.log('Builder keeps an unsaved draft when you leave and come back');
  await go('#/builder');
  await p.getByRole('button', { name: 'Select all', exact: true }).click().catch(() => {});
  await p.getByRole('button', { name: 'Clear selection' }).click().catch(() => {});
  await p.locator('.pick-list input[type=checkbox]').nth(1).check();
  await p.locator('.pick-list input[type=checkbox]').nth(3).check();
  await p.getByLabel('Assignment title').fill('Draft HW');
  await p.locator('.pick-preview').first().click(); await p.waitForSelector('.question');
  await p.goBack(); await p.waitForSelector('.pick-list');
  const kept = await p.locator('.pick-list input[type=checkbox]:checked').count();
  expect(kept === 2 && (await p.getByLabel('Assignment title').inputValue()) === 'Draft HW', `draft kept (selected ${kept}, title "${await p.getByLabel('Assignment title').inputValue()}")`);

  console.log('Builder reports a failed save instead of claiming success');
  await p.evaluate(() => { Storage.prototype._setItem = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new Error('QuotaExceeded'); }; });
  await p.getByRole('button', { name: 'Save assignment' }).click();
  expect((await p.locator('.error-msg').count()) === 1 && (await p.locator('.success-msg').count()) === 0, 'error shown, no false success');
  expect((await p.locator('.pick-list input[type=checkbox]:checked').count()) === 2, 'selection kept after the failed save');
  await p.evaluate(() => { Storage.prototype.setItem = Storage.prototype._setItem; });

  console.log('Preview resets when a link points to another version of the same question');
  await go('#/q/ibp-a1-train-acceleration?student=alex&sol=1');
  const stemAlex = await p.locator('.q-stem').innerText();
  await p.evaluate(() => { window.location.hash = '#/q/ibp-a1-train-acceleration'; });
  await p.waitForTimeout(300);
  const stemBase = await p.locator('.q-stem').innerText();
  expect(stemAlex !== stemBase && stemBase.includes('4.0'), 'base link shows the base numbers');
  expect((await p.locator('.solution').count()) === 0, 'solutions hidden again (sol not in link)');

  console.log('Phone width (390 px): MCQ table cells carry their column labels; no sideways scroll');
  const phone = await b.newContext({ viewport: { width: 390, height: 800 } });
  const mp = await phone.newPage();
  for (const hsh of ['#/bank', '#/builder', '#/q/ibp-a1-projectile-top-mcq']) {
    await mp.goto(BASE + hsh); await mp.waitForLoadState('networkidle');
    const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over <= 0, `${hsh}: no horizontal overflow (${over}px)`);
  }
  const label = await mp.locator('.mcq-cell[data-label]').first().evaluate((el) => getComputedStyle(el, '::before').content);
  expect(label.includes('Velocity'), `phone MCQ cells show the column label (${label})`);
  await mp.screenshot({ path: 'shots/review-mobile-mcq.png', fullPage: false });

  await b.close();
  console.log('\nProblems:', problems.length ? problems : 'none');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
