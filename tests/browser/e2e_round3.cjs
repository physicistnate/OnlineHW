// Browser checks for the third review round: standards picker, settings, tries,
// grades, due-date warnings and redirect (with a fake clock), answer key after due, HL.
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
  const T0 = new Date(2026, 10, 25, 10, 0, 0); // 25 Nov 2026, 10:00 local time
  await p.clock.install({ time: T0 });
  const go = async (h) => { await p.goto(BASE + h); await p.waitForLoadState('networkidle'); };
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Builder: standards are ovals that turn green; none chosen at first');
  await go('#/builder');
  expect(await p.locator('.std-prompt').isVisible(), 'prompt "Choose at least one standard" is shown');
  expect((await p.locator('.std-prompt').innerText()).includes('Choose at least one standard'), 'prompt text');
  expect((await p.locator('.pick-list li').count()) === 0, 'no questions listed before a standard is chosen');
  const chips = p.locator('.std-chip');
  expect((await chips.count()) === 7, `7 standards for A.1 (${await chips.count()})`);
  const a14 = chips.filter({ hasText: 'A.1.4' });
  const n14 = Number((await a14.locator('.std-count').innerText()).replace(/\D/g, ''));
  await a14.click();
  expect((await a14.getAttribute('aria-pressed')) === 'true', 'A.1.4 is selected after one click');
  await p.waitForTimeout(400); // let the colour transition finish
  const bg = await a14.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg === 'rgb(31, 143, 99)' || bg === 'rgb(35, 165, 113)', `selected oval is green (${bg})`);
  expect((await p.locator('.pick-list li').count()) === n14, `questions for A.1.4 are listed (${n14})`);
  await a14.click();
  expect((await a14.getAttribute('aria-pressed')) === 'false', 'a second click unselects it');
  expect(await p.locator('.std-prompt').isVisible(), 'prompt is back');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  expect((await p.locator('.std-chip[aria-pressed="true"]').count()) === 7, 'Select all turns every oval green');
  expect((await p.locator('.pick-list li').count()) === 11, 'and lists every A.1 question that avoids later topics');
  await p.getByRole('button', { name: 'Unselect all' }).click();
  expect((await p.locator('.std-chip[aria-pressed="true"]').count()) === 0, 'Unselect all clears them');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();

  console.log('Builder: HL course');
  await p.locator('.segmented button', { hasText: 'IB Physics HL' }).click();
  const options = await p.locator('select[aria-label="Topic"] option').allInnerTexts();
  expect(options.some((o) => o.includes('A.4 Rigid body mechanics (HL)')), 'HL lists the HL-only topics');
  expect((await p.locator('.pick-list li').count()) === 11, 'HL still has the SL A.1 questions');
  await p.locator('.segmented button', { hasText: 'IB Physics SL' }).click();
  const slOptions = await p.locator('select[aria-label="Topic"] option').allInnerTexts();
  expect(!slOptions.some((o) => o.includes('Rigid body')), 'SL does not list HL-only topics');

  console.log('Builder: settings and save');
  await p.screenshot({ path: 'shots3/builder-chips.png', fullPage: false });
  await p.getByRole('button', { name: 'Add all shown' }).click();
  expect((await p.locator('.selection-summary').innerText()).includes('11 questions selected'), '11 questions selected');
  await p.getByLabel('Assignment title').fill('Round3 HW');
  await p.locator('.settings-form select').first().selectOption('2');
  await p.locator('.settings-form input[type="datetime-local"]').fill('2026-11-25T10:06');
  await p.getByLabel('Open after the due date').check();
  const hint = await p.locator('.settings-form').innerText();
  expect(hint.includes('100% on the 1st try, 93% on the 2nd try'), 'grade example shows 100% then 93%');
  expect(hint.includes('warning 5 and 1 minutes before'), 'due-date hint mentions the warnings');
  await p.locator('.builder-side').screenshot({ path: 'shots3/builder-settings.png' });
  await p.getByRole('button', { name: 'Save assignment' }).click();
  expect(await p.locator('.success-msg').isVisible(), 'saved');
  const row = p.locator('.assignments-table tr', { hasText: 'Round3 HW' });
  const rowText = await row.innerText();
  expect(rowText.includes('2 tries per part') && rowText.includes('Answer key after due date'), `saved row shows the rules (${rowText.replace(/\s+/g, ' ')})`);
  const id = await p.evaluate(() => JSON.parse(localStorage.getItem('rice-hw:assignments'))[0].id);

  console.log('Builder: edit settings in a dialog');
  await row.getByRole('button', { name: 'Edit settings' }).click();
  expect(await p.getByRole('dialog').isVisible(), 'settings dialog opens');
  await p.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  expect((await p.getByRole('dialog').count()) === 0, 'dialog closes');

  console.log('Student: tries, locking and grades');
  await go('#/student');
  await p.getByLabel('Username').fill('clockkid');
  await p.getByRole('button', { name: 'Sign in' }).click();
  const card = p.locator('.assignment-card', { hasText: 'Round3 HW' });
  expect(/Closes in [56]:\d\d/.test(await card.innerText()), `card shows a live countdown (${(await card.locator('.chip-due').innerText())})`);
  await card.click();
  await p.waitForSelector('.question');
  const q = p.locator('#q-ibp-a1-stopping-distance');
  const pinned = await p.evaluate((aid) => JSON.parse(localStorage.getItem(`rice-hw:params:DEMO:clockkid::${aid}::ibp-a1-stopping-distance@v3`)), id);
  expect(pinned && typeof pinned.v === 'number', `numbers pinned on first open (${JSON.stringify(pinned)})`);
  const s1 = pinned.v * pinned.tr;
  const partA = q.locator('.part').nth(0);
  await partA.locator('.num-input').fill(String(Number((s1 * 2).toPrecision(3))));
  await partA.locator('.num-input').press('Enter');
  expect((await partA.locator('.feedback').innerText()).includes('1 of 2 tries left'), `wrong first try leaves 1 of 2 (${(await partA.locator('.feedback').innerText()).replace(/\n/g, ' ')})`);
  await partA.locator('.num-input').fill(String(Number(s1.toPrecision(3))));
  await partA.locator('.num-input').press('Enter');
  expect((await partA.locator('.feedback').innerText()).includes('Correct'), 'right on the second try');
  expect(await partA.locator('.num-input').isDisabled(), 'a correct part locks');
  const partB = q.locator('.part').nth(1);
  for (const v of ['1', '2']) {
    await partB.locator('.num-input').fill(v);
    await partB.locator('.num-input').press('Enter');
  }
  expect((await partB.locator('.feedback').innerText()).includes('No tries left'), 'out of tries after 2 wrong answers');
  expect(await partB.locator('.num-input').isDisabled(), 'and the part locks');
  await p.screenshot({ path: 'shots3/student-open.png', fullPage: false });
  await q.screenshot({ path: 'shots3/stopping-tries.png' });
  const qScore = await q.locator('.q-score').innerText();
  expect(qScore.includes('19%') && qScore.includes('IB 1/5'), `question shows class 19% (93% of 1 mark of 5) and IB 1/5 (${qScore.replace(/\n/g, ' ')})`);
  const pills = await p.locator('.grade-pills').innerText();
  expect(/IB MARKS\s*1\//i.test(pills), `assignment header shows IB marks (${pills.replace(/\n/g, ' ')})`);
  // Multiple choice with 4 choices: 2 tries.
  const mcq = q.locator('.part').nth(3);
  expect((await mcq.locator('.feedback').innerText()).includes('2 of 2 tries left'), 'MCQ with 4 choices gets 2 tries');

  console.log('Due date: warnings at 5 and 1 minutes, then back to the assignments');
  expect(/Closes in [56]:\d\d/.test(await p.locator('.due-line .chip-due').innerText()), 'header countdown');
  await p.clock.fastForward(65_000);
  await p.waitForTimeout(300);
  const modal = p.getByRole('alertdialog');
  expect(await modal.isVisible(), '5-minute warning pop-up');
  await p.screenshot({ path: 'shots3/warning.png', fullPage: false });
  const m1 = await modal.innerText();
  expect(/4:5\d/.test(m1) && m1.includes('Your time to submit is'), `shows m:ss left (${m1.split('\n')[1]})`);
  await modal.getByRole('button', { name: 'Keep working' }).click();
  expect((await modal.count()) === 0, 'pop-up closes');
  await p.clock.fastForward(4 * 60_000);
  await p.waitForTimeout(300);
  expect(await modal.isVisible(), '1-minute warning pop-up');
  expect(/0:5\d/.test(await modal.innerText()), 'shows under a minute left');
  await modal.getByRole('button', { name: 'Keep working' }).click();
  await p.clock.fastForward(60_000);
  await p.waitForTimeout(500);
  expect(p.url().includes(`#/student?closed=${id}`), `taken back to the assignments (${p.url()})`);
  expect((await p.getByRole('alertdialog').innerText()).includes('Time is up'), '"Time is up" pop-up');
  await p.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click();
  expect((await p.locator('.assignment-card', { hasText: 'Round3 HW' }).innerText()).includes('Closed'), 'card shows Closed');

  console.log('After the due date: read-only, answer key open');
  await p.locator('.assignment-card', { hasText: 'Round3 HW' }).click();
  await p.waitForSelector('.question');
  expect(await p.locator('.banner-closed').isVisible(), 'closed banner');
  expect((await p.locator('.num-input:not([disabled])').count()) === 0, 'every answer box is disabled');
  expect((await p.locator('.answer-row button').count()) === 0, 'no Check buttons');
  expect((await p.locator('.solution').count()) > 5, `answer key (worked solutions) open after due (${await p.locator('.solution').count()})`);
  expect((await p.locator('#q-ibp-a1-stopping-distance .part').first().locator('.feedback').innerText()).includes('Correct'), 'earlier marks still shown');
  await p.screenshot({ path: 'shots3/student-closed.png', fullPage: false });

  console.log('Print key of a saved assignment');
  await go(`#/print?a=${id}&sol=1&ms=1`);
  expect((await p.locator('.paper-question').count()) === 11, '11 questions printed');
  expect((await p.locator('.paper-meta').innerText()).includes('due'), 'print shows the due date');

  console.log('Question bank: same standards picker, kept when coming back from a preview');
  await go('#/bank');
  expect(await p.locator('.std-prompt').isVisible(), 'bank starts with no standards chosen');
  expect(!(await p.locator('.q-list').isVisible()), 'and no questions shown');
  await p.getByRole('button', { name: 'Select all', exact: true }).click();
  expect((await p.locator('.q-card').count()) === 11, 'Select all shows the 11 questions that avoid later topics');
  expect(p.url().includes('std='), 'choice kept in the address');
  await p.locator('.q-card').first().getByRole('link', { name: 'Preview' }).click();
  await p.waitForSelector('.question');
  await p.goBack();
  await p.waitForSelector('.std-chip');
  expect((await p.locator('.q-card:visible').count()) === 11, 'still 11 after coming back');
  await go('#/bank?course=ib-physics-hl&topic=ibp.A.4');
  expect((await p.locator('.side-topic.is-active').innerText()).includes('A.4'), 'HL bank opens an HL-only topic');

  console.log('Phone width: no horizontal overflow on the new pages');
  await p.setViewportSize({ width: 375, height: 800 });
  for (const h of ['#/builder', '#/bank', `#/student/a/${id}`, '#/student']) {
    await go(h);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 0, `${h}: no sideways scrolling at 375 px (${over}px)`);
  }

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll browser checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
