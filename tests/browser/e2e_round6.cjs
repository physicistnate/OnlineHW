// Browser checks for round 6: one assignment with questions from several courses (they stay
// chosen when the course or topic changes), saving at the end, editing a saved assignment's
// questions, key names by exam style (online, printed and for students), the Sankey diagram,
// and the narrowest phones.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_round6.cjs
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
  const selectAll = () => p.getByRole('button', { name: 'Select all', exact: true }).click();
  const pick = (text) => p.locator('.pick-list li', { hasText: text }).locator('input[type=checkbox]').check();
  const chosen = () => p.locator('.selected-list .sel-title').allInnerTexts();
  const browse = async (course, topic) => {
    await p.selectOption('select[aria-label="Course"]', course);
    await p.selectOption('select[aria-label="Topic"]', topic);
    await selectAll();
  };
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Builder: questions from several courses collect in "Your assignment"');
  await go('#/builder');
  await browse('ib-physics-sl', 'ibp.A.3');
  await pick('Pulling a sledge');
  await pick('Reading a Sankey diagram');
  await browse('ap-physics-c-mech', 'apcm.3');
  await pick('Work as a dot product');
  expect((await chosen()).length === 3, 'changing to AP keeps the two IB questions');
  await browse('university-physics-1', 'up1.3');
  await pick('pump the water');
  let sel = await chosen();
  expect(sel.length === 4 && sel[0].includes('sledge') && sel[3].includes('pump'), `four questions, in the order chosen (${sel.join(' | ')})`);
  const metas = await p.locator('.selected-list .sel-meta').allInnerTexts();
  expect(metas[0].includes('IB Phys SL · A.3') && metas[2].includes('AP Phys C: Mech · Unit 3') && metas[3].includes('Univ Phys I · Topic 3'), `each is labelled with its course and topic (${metas.join(' | ')})`);
  expect((await p.locator('.your-assignment .selection-summary').innerText()).includes('IB Physics SL + AP Physics C: Mechanics + University Physics I'), 'the summary names all three courses');
  expect((await p.locator('.keep-note').innerText()).includes('3 chosen questions are from other courses'), 'a note says the other courses’ questions stay');
  await browse('ib-physics-sl', 'ibp.A.3');
  expect((await p.locator('.pick-list input[type=checkbox]:checked').count()) === 2, 'back in IB A.3, its two questions are still ticked');
  await p.locator('.selected-list li').nth(3).getByRole('button', { name: /Move .* up/ }).click();
  sel = await chosen();
  expect(sel[2].includes('pump') && sel[3].includes('dot product'), 'questions can be reordered');
  const keyOption = await p.locator('label.check', { hasText: 'Marking keys' }).innerText();
  expect(['markscheme', 'scoring guidelines', 'grading rubric'].every((k) => keyOption.includes(k)), `the print option names the mixed keys (${keyOption.trim()})`);
  await p.getByLabel('Assignment title').fill('Mixed energy set');
  await p.getByRole('button', { name: 'Save assignment' }).click();
  expect((await p.locator('.success-msg').innerText()).includes('Saved “Mixed energy set”'), 'saved when done');
  expect((await p.locator('.selected-list li').count()) === 0, 'the list is cleared after saving');
  let row = p.locator('.assignments-table tr', { hasText: 'Mixed energy set' });
  let rowText = await row.innerText();
  expect(['IB Physics SL', 'AP Physics C: Mechanics', 'University Physics I'].every((c) => rowText.includes(c)) && /\b4 ·/.test(rowText), `the saved row lists 4 questions from 3 courses (${rowText.split('\n')[0]})`);
  const id = (await row.getByRole('link', { name: 'Open as student' }).getAttribute('href')).split('/').pop();

  console.log('Editing a saved assignment’s questions');
  await row.getByRole('button', { name: 'Edit questions' }).click();
  expect((await p.locator('.editing-banner').innerText()).includes('Mixed energy set'), 'the builder says which assignment is being edited');
  expect((await p.locator('.selected-list li').count()) === 4, 'its questions are loaded on the right');
  await p.locator('.selected-list li', { hasText: 'dot product' }).getByRole('button', { name: /Remove/ }).click();
  await browse('ap-physics-c-mech', 'apcm.3');
  await pick('vertical loop');
  await p.getByRole('button', { name: 'Save changes' }).click();
  expect((await p.locator('.success-msg').innerText()).includes('Saved the changes'), 'changes saved');
  row = p.locator('.assignments-table tr', { hasText: 'Mixed energy set' });
  rowText = await row.innerText();
  expect(rowText.includes('4 ·') && (await p.locator('.assignments-table tr', { hasText: 'Mixed energy set' }).count()) === 1, 'the same assignment was updated (not a copy)');
  const saved = await p.evaluate((aid) => JSON.parse(localStorage.getItem('rice-hw:assignments')).find((a) => a.id === aid).items.map((i) => i.id), id);
  expect(JSON.stringify(saved) === JSON.stringify(['ibp-a3-sledge-pull', 'ibp-a3-sankey-engine', 'up1-t3-pumping-tank', 'apcm-u3-loop-the-loop']), `questions saved in order (${saved.join(', ')})`);

  console.log('Key names by exam style');
  await go('#/q/apcm-u3-variable-force');
  await p.getByLabel('Scoring guidelines').check();
  // Panel titles are shown in capitals by the style sheet, so compare the text itself.
  const title = async (sel) => (await p.locator(sel).first().textContent()).trim();
  expect((await title('.markscheme .panel-title')).startsWith('Scoring guidelines'), 'AP: “Scoring guidelines”');
  await go('#/q/up1-t3-pumping-tank');
  await p.getByLabel('Grading rubric').check();
  expect((await title('.markscheme .panel-title')).startsWith('Grading rubric'), 'University: “Grading rubric”');
  await go('#/q/ibp-a3-sledge-pull');
  await p.getByLabel('Markscheme').check();
  expect((await title('.markscheme .panel-title')).startsWith('Markscheme'), 'IB: “Markscheme”');

  console.log('Printed keys: one name for one style, each question’s own for a mix');
  await go(`#/print?a=${id}&sol=1&ms=1`);
  expect((await p.locator('.paper-key h2').innerText()) === 'Worked solutions and marking keys', 'mixed paper: a general heading');
  const heads = await p.locator('.paper-key h3').allInnerTexts();
  expect(heads[0].includes('(Markscheme)') && heads[2].includes('(Grading rubric)') && heads[3].includes('(Scoring guidelines)'), `each question’s key is named beside it (${heads.join(' | ')})`);
  expect((await p.locator('.paper-instructions').innerText()).includes('labelled with its course'), 'instructions for a mixed paper');
  expect((await p.locator('.paper-meta').innerText()).includes('IB Physics SL + University Physics I (calculus-based) + AP Physics C: Mechanics'), 'the paper names its courses');
  await go('#/print?ids=apcm-u3-variable-force,apcm-u3-dot-product&course=ap-physics-c-mech&title=AP&sol=1&ms=1');
  expect((await p.locator('.paper-key h2').innerText()) === 'Worked solutions and scoring guidelines', 'AP-only paper: “scoring guidelines” once, in the heading');
  expect((await p.locator('.paper-key .key-style').count()) === 0, 'and no labels beside the questions');
  expect((await title('.paper-key .markscheme .panel-title')).startsWith('Scoring guidelines'), 'its key blocks are titled “Scoring guidelines”');

  console.log('Students see each question’s key under its own name');
  await p.evaluate((aid) => {
    const list = JSON.parse(localStorage.getItem('rice-hw:assignments'));
    list.find((a) => a.id === aid).settings.solutions = 'released';
    localStorage.setItem('rice-hw:assignments', JSON.stringify(list));
  }, id);
  await go('#/student');
  await p.getByLabel('Username').fill('mixkid');
  await p.getByRole('button', { name: 'Sign in' }).click();
  await p.locator('.assignment-card', { hasText: 'Mixed energy set' }).click();
  await p.waitForSelector('.question');
  expect((await p.locator('.banner-info').first().innerText()).includes('markscheme, grading rubric and scoring guidelines'), 'the banner names the keys in this assignment');
  const titles = (await p.locator('.markscheme .panel-title').allTextContents()).map((t) => t.trim());
  expect(titles.some((t) => t.startsWith('Markscheme')) && titles.some((t) => t.startsWith('Scoring guidelines')) && titles.some((t) => t.startsWith('Grading rubric')), 'each question’s key has its own name');

  console.log('Sankey diagram');
  await go('#/q/ibp-a3-sankey-engine');
  expect((await p.locator('.sankey svg path.sk-waste').count()) >= 3 && (await p.locator('.sk-key div').count()) >= 5, 'the diagram and its key are drawn');
  await p.locator('.part').nth(0).locator('.num-input').fill('30');
  await p.locator('.part').nth(0).locator('.num-input').press('Enter');
  expect((await p.locator('.part').nth(0).locator('.feedback').innerText()).includes('Correct'), 'reading 6 squares × 5 kW = 30 kW is correct');

  console.log('Narrowest phones (320 px)');
  await p.setViewportSize({ width: 320, height: 760 });
  for (const h of ['#/q/ibp-a3-home-energy', '#/q/ibp-a3-sankey-engine', '#/builder']) {
    await go(h);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 0, `${h}: no sideways scrolling at 320 px (${over}px)`);
  }
  await go('#/q/ibp-a3-home-energy');
  expect((await p.locator('.q-stem .eq-flow').evaluate((el) => el.scrollWidth - el.clientWidth)) <= 0, 'the appliance table fits at 320 px');

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll round-6 browser checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
