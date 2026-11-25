// End-to-end smoke test + screenshots for the Rice Education Online HW System (Phase 1).
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:4173/';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const problems = [];
const log = (...a) => console.log(...a);
function expect(cond, msg) {
  if (!cond) {
    problems.push(msg);
    log('  ✗ FAIL:', msg);
  } else log('  ✓', msg);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('page error: ' + e.message));

  const go = async (hash) => { await page.goto(BASE + hash); await page.waitForLoadState('networkidle'); };
  const feedbackOf = (partIndex) => page.locator('.part').nth(partIndex).locator('.feedback');

  log('Home');
  await go('#/');
  expect(await page.locator('h1').first().innerText() === 'Online HW System', 'home title shows product name');
  expect((await page.locator('.brand-org').innerText()) === 'Rice Education', 'header shows Rice Education');
  await page.screenshot({ path: `${OUT}/home.png`, fullPage: true });

  log('Bank');
  await go('#/bank');
  expect(await page.locator('.std-prompt').isVisible(), 'bank asks for a standard first');
  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  expect((await page.locator('.q-card').count()) === 12, 'bank lists 12 A.1 questions');
  await page.screenshot({ path: `${OUT}/bank.png`, fullPage: true });

  log('Preview: train (base), wrong (a) then ECF (b)');
  await go('#/q/ibp-a1-train-acceleration');
  const inputs = page.locator('.num-input');
  await inputs.nth(0).fill('0.5');
  await page.locator('.part').nth(0).getByRole('button', { name: 'Check' }).click();
  expect((await feedbackOf(0).innerText()).includes('Not quite'), '(a) 0.5 marked wrong');
  await inputs.nth(1).fill('32');
  await inputs.nth(1).press('Enter');
  const fbB = await feedbackOf(1).innerText();
  expect(fbB.includes('Correct') && fbB.includes('error carried forward'), `(b) 32 accepted by ECF: "${fbB.replace(/\n/g, ' ')}"`);
  await inputs.nth(0).fill('0.48');
  await inputs.nth(0).press('Enter');
  expect((await feedbackOf(0).innerText()).includes('Correct'), '(a) 0.48 accepted');
  await inputs.nth(1).fill('33');
  await inputs.nth(1).press('Enter');
  expect((await feedbackOf(1).innerText()).includes('Correct'), '(b) 33 accepted (2 s.f.)');
  await inputs.nth(1).fill('3.3e1 s');
  await inputs.nth(1).press('Enter');
  expect((await feedbackOf(1).innerText()).includes('Correct'), '(b) "3.3e1 s" accepted');
  await inputs.nth(1).fill('330');
  await inputs.nth(1).press('Enter');
  expect((await feedbackOf(1).innerText()).includes('power of ten'), '(b) 330 gets power-of-ten hint');
  await inputs.nth(1).fill('33.3');
  await inputs.nth(1).press('Enter');
  await page.getByLabel('Worked solutions').check();
  await page.getByLabel('Markscheme').check();
  expect((await page.locator('.solution').count()) === 2, 'worked solutions shown for both parts');
  expect((await page.locator('.markscheme').first().innerText()).includes('Online marking: accepts any value'), 'markscheme shows accepted range');
  await page.screenshot({ path: `${OUT}/preview-train.png`, fullPage: true });

  log('Preview: student version changes numbers deterministically');
  await page.getByRole('button', { name: 'A student’s version' }).click();
  const stemAlex = await page.locator('.q-stem').innerText();
  await page.getByLabel('Student', { exact: true }).fill('sam');
  const stemSam = await page.locator('.q-stem').innerText();
  await page.getByLabel('Student', { exact: true }).fill('alex');
  const stemAlex2 = await page.locator('.q-stem').innerText();
  expect(stemAlex !== stemSam, 'different students get different numbers');
  expect(stemAlex === stemAlex2, 'same student gets the same numbers again');

  log('Preview: MCQ (base, correct is C)');
  await go('#/q/ibp-a1-free-fall-mcq');
  await page.locator('label.mcq-row').nth(2).click();
  await page.getByRole('button', { name: 'Check' }).click();
  expect((await page.locator('.feedback').innerText()).includes('Correct'), 'MCQ correct option marked correct');

  log('Preview: table MCQ screenshot');
  await go('#/q/ibp-a1-projectile-top-mcq?sol=1&ms=1');
  await page.screenshot({ path: `${OUT}/preview-mcq-table.png`, fullPage: true });

  log('Preview: v-t graph reading');
  await go('#/q/ibp-a1-vt-graph-cyclist?sol=1&ms=1');
  await page.locator('.num-input').nth(1).fill('84');
  await page.locator('.num-input').nth(1).press('Enter');
  expect((await feedbackOf(1).innerText()).includes('Correct'), 'graph area 84 m accepted');
  await page.screenshot({ path: `${OUT}/preview-graph-reading.png`, fullPage: true });

  log('Preview: graph drawing (lift, base: (0,0) (3,3) (8,3) (10,0))');
  await go('#/q/ibp-a1-lift-vt-draw');
  // Start points are spread along the top; drag the first with the mouse, place the rest by keyboard.
  const svg = page.locator('.graph-answer svg');
  const box = await svg.boundingBox();
  const W = 560, H = 380, M = { l: 60, r: 18, t: 14, b: 52 }, PW = W - M.l - M.r, PH = H - M.t - M.b;
  const axes = { xmin: 0, xmax: 12, ymin: 0, ymax: 4 }; // base: T = 10 -> xmax 12; vmax 3 -> ymax 4
  const toScreen = (x, y) => ({
    x: box.x + ((M.l + ((x - axes.xmin) / (axes.xmax - axes.xmin)) * PW) / W) * box.width,
    y: box.y + ((M.t + PH - ((y - axes.ymin) / (axes.ymax - axes.ymin)) * PH) / H) * box.height,
  });
  const handles = page.locator('.g-handle');
  const h0 = await handles.nth(0).locator('.g-dot').boundingBox();
  await page.mouse.move(h0.x + h0.width / 2, h0.y + h0.height / 2);
  await page.mouse.down();
  const t0 = toScreen(0, 0);
  await page.mouse.move(t0.x + 3, t0.y - 3, { steps: 8 });
  await page.mouse.up();
  const aria0 = await handles.nth(0).getAttribute('aria-valuetext');
  expect(aria0 === '(0, 0)', `mouse drag snapped point 1 to (0, 0) [got ${aria0}]`);
  // Keyboard for the other three: start x positions are snapped (i+1)*12/5 -> 5, 7, 10 (round) at y = 4.
  const targets = [[3, 3], [8, 3], [10, 0]];
  for (let i = 1; i <= 3; i++) {
    const cur = (await handles.nth(i).getAttribute('aria-valuetext')).replace(/[()]/g, '').split(',').map(Number);
    const [tx, ty] = targets[i - 1];
    await handles.nth(i).focus();
    const dx = Math.round((tx - cur[0]) / 1), dy = Math.round((ty - cur[1]) / 0.5);
    for (let k = 0; k < Math.abs(dx); k++) await page.keyboard.press(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    for (let k = 0; k < Math.abs(dy); k++) await page.keyboard.press(dy > 0 ? 'ArrowUp' : 'ArrowDown');
  }
  await page.getByRole('button', { name: 'Check graph' }).click();
  const fbG = await page.locator('.part').nth(0).locator('.feedback').innerText();
  expect(fbG.includes('Correct'), `drawn v-t graph marked correct: "${fbG.replace(/\n/g, ' ')}"`);
  await page.getByLabel('Worked solutions').check();
  await page.screenshot({ path: `${OUT}/preview-graph-drawing.png`, fullPage: true });

  log('Preview: multi-part question with student numbers; (d) is now multiple choice');
  await go('#/q/ibp-a1-projectile-kick?student=alex&sol=1&ms=1');
  expect((await page.locator('textarea').count()) === 0, 'no typed (written) answers');
  const partD = page.locator('.part').nth(4);
  await partD.locator('.mcq-row', { hasText: 'smaller' }).first().click();
  await partD.getByRole('button', { name: 'Check' }).click();
  expect(/Correct|Not quite/.test(await partD.locator('.feedback').innerText()), 'multiple-choice (d) is marked by the computer');
  await page.screenshot({ path: `${OUT}/preview-projectile-student.png`, fullPage: true });

  log('Student: sign in, save, reload, sign out, sign in again');
  await go('#/student');
  await page.getByLabel('Class code').fill('phys1');
  await page.getByLabel('Username').fill('Jordan');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('.assignment-card');
  expect((await page.locator('h1').innerText()).includes('jordan'), 'signed in as jordan');
  await page.screenshot({ path: `${OUT}/student-home.png`, fullPage: true });
  await page.locator('.assignment-card').first().click();
  await page.waitForSelector('.question');
  const stemBefore = await page.locator('.q-stem').first().innerText();
  const firstInput = page.locator('.num-input').first();
  await firstInput.fill('1.23');
  await firstInput.press('Enter');
  await page.reload();
  await page.waitForSelector('.question');
  expect((await page.locator('.num-input').first().inputValue()) === '1.23', 'answer kept after reload');
  await go('#/student');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Class code').fill('PHYS1');
  await page.getByLabel('Username').fill('jordan');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.locator('.assignment-card').first().click();
  await page.waitForSelector('.question');
  expect((await page.locator('.num-input').first().inputValue()) === '1.23', 'answer kept after sign out / sign in');
  expect((await page.locator('.q-stem').first().innerText()) === stemBefore, 'numbers unchanged after sign out / sign in');
  expect((await page.locator('.part').first().locator('.feedback').innerText()).includes('Not quite'), 'previous result kept after sign in');
  await page.screenshot({ path: `${OUT}/student-assignment.png` });

  log('Builder: save assignment, release solutions, open print key');
  await go('#/builder');
  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  await page.locator('.pick-list input[type=checkbox]').nth(0).check();
  await page.locator('.pick-list input[type=checkbox]').nth(2).check();
  await page.getByLabel('Assignment title').fill('A.1 Homework 1');
  await page.getByRole('button', { name: 'Save assignment' }).click();
  expect((await page.locator('.success-msg').innerText()).includes('A.1 Homework 1'), 'assignment saved');
  expect((await page.locator('.assignments-table tbody tr').count()) === 2, 'saved list shows sample + new');
  await page.screenshot({ path: `${OUT}/builder.png`, fullPage: true });

  log('Print view + PDF');
  await go('#/print?ids=ibp-a1-train-acceleration,ibp-a1-vt-graph-cyclist,ibp-a1-lift-vt-draw,ibp-a1-projectile-top-mcq,ibp-a1-projectile-kick&title=A.1%20Kinematics%20Homework&a=worksheet&sol=1&ms=1');
  await page.screenshot({ path: `${OUT}/print-view.png`, fullPage: false });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: `${OUT}/sample-A1-homework-with-key.pdf`, format: 'Letter', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  expect(fs.statSync(`${OUT}/sample-A1-homework-with-key.pdf`).size > 20000, 'PDF generated');

  // Student-version print should show that student's numbers, matching the student's online view.
  await go('#/print?ids=ibp-a1-train-acceleration&title=Check&a=sample-a1&student=PHYS1:jordan');
  const printStem = await page.locator('.pq-stem').first().innerText();
  expect(printStem === stemBefore, 'student-version PDF has the same numbers the student sees online');

  log('Mobile');
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const mp = await phone.newPage();
  mp.on('pageerror', (e) => problems.push('mobile page error: ' + e.message));
  await mp.goto(BASE + '#/');
  await mp.waitForLoadState('networkidle');
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow <= 0, `no horizontal scroll on phone home (overflow ${overflow}px)`);
  await mp.screenshot({ path: `${OUT}/mobile-home.png`, fullPage: false });
  await mp.goto(BASE + '#/q/ibp-a1-train-acceleration?sol=1&ms=1');
  await mp.waitForLoadState('networkidle');
  const overflow2 = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow2 <= 0, `no horizontal scroll on phone question page (overflow ${overflow2}px)`);
  await mp.screenshot({ path: `${OUT}/mobile-question.png`, fullPage: true });
  await mp.goto(BASE + '#/bank');
  await mp.waitForLoadState('networkidle');
  const overflow3 = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow3 <= 0, `no horizontal scroll on phone bank (overflow ${overflow3}px)`);

  await browser.close();
  log('\nProblems:', problems.length ? problems : 'none');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
