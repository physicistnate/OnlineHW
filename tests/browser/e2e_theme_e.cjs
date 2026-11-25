// Browser checks for IB Theme E (E.1–E.5, SL and HL) and the University Modern Physics course:
// topic lists and counts in each course, every new question rendering cleanly with its key
// name, marking with follow-through, a mixed printed paper, and phone widths.
// Run against the built site: npm run build && npm run preview, then node tests/browser/e2e_theme_e.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/';
const problems = [];
const expect = (cond, msg) => { console.log(cond ? '  ✓' : '  ✗ FAIL:', msg); if (!cond) problems.push(msg); };

const IB_E = {
  'ibp-e1': ['rutherford-scattering', 'hydrogen-levels', 'star-absorption', 'laser-photons', 'nuclear-radius', 'closest-approach', 'bohr-hydrogen'],
  'ibp-e2': ['photoelectric-effect', 'photoelectric-graph', 'wave-particle-duality', 'de-broglie-electrons', 'compton-scattering'],
  'ibp-e3': ['binding-energy', 'decay-equations', 'absorbers', 'half-life-graph', 'nuclear-stability', 'decay-constant', 'carbon-dating'],
  'ibp-e4': ['fission-energy', 'binding-energy-fission', 'reactor-control', 'moderator', 'reactor-fuel', 'fission-waste'],
  'ibp-e5': ['fusion-reactions', 'star-fusion', 'stellar-evolution', 'hr-diagram', 'parallax-brightness', 'wien-stefan'],
};
const IB_IDS = Object.entries(IB_E).flatMap(([prefix, names]) => names.map((n) => `${prefix}-${n}`));
const UMP_IDS = [
  't2-photoelectric-planck', 't2-compton-recoil', 't3-rutherford-scattering', 't3-bohr-atom', 't4-particle-in-box', 't5-pet-tracer',
  't5-isotope-generator', 't6-fission-fragments', 't6-data-center-reactor', 't6-fusion-barrier', 't7-planet-temperature', 't7-kelvin-helmholtz',
].map((x) => `ump-${x}`);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', (e) => problems.push('page error: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text()); });
  const go = async (h) => { await p.goto(BASE + h); await p.waitForLoadState('networkidle'); };
  const selectAll = () => p.getByRole('button', { name: 'Select all', exact: true }).click();
  const cards = async (course, topic) => {
    await go(`#/bank?course=${course}&topic=${topic}`);
    await p.waitForSelector('.topic-head');
    if (await p.getByRole('button', { name: 'Select all', exact: true }).count()) await selectAll();
    return p.locator('.q-card').count();
  };
  await go('');
  await p.evaluate(() => localStorage.clear());

  console.log('Home page');
  await go('#/');
  const status = await p.locator('.status-card').innerText();
  expect(status.includes('E.4 Fission: 6 questions') && status.includes('E.2 Quantum physics: 5 questions (HL only)'), 'status lists the Theme E topics');
  expect(status.includes('University Modern Physics (calculus-based): 12 questions'), 'status lists the modern physics course');

  console.log('IB SL: Theme E without the HL-only topic E.2 and without HL questions');
  await go('#/builder');
  await p.selectOption('select[aria-label="Course"]', 'ib-physics-sl');
  const slTopics = await p.locator('select[aria-label="Topic"] option').allInnerTexts();
  expect(['E.1', 'E.3', 'E.4', 'E.5'].every((c) => slTopics.some((o) => o.startsWith(c))) && !slTopics.some((o) => o.startsWith('E.2')), 'SL lists E.1, E.3, E.4 and E.5 but not E.2');
  for (const [topic, n] of [['ibp.E.1', 4], ['ibp.E.3', 4], ['ibp.E.4', 6], ['ibp.E.5', 6]]) {
    const got = await cards('ib-physics-sl', topic);
    expect(got === n, `SL ${topic}: ${n} questions (${got})`);
  }

  console.log('IB HL: Theme E with E.2 and the HL questions');
  for (const [topic, n] of [['ibp.E.1', 7], ['ibp.E.2', 5], ['ibp.E.3', 7], ['ibp.E.4', 6], ['ibp.E.5', 6]]) {
    const got = await cards('ib-physics-hl', topic);
    expect(got === n, `HL ${topic}: ${n} questions (${got})`);
  }

  console.log('University Modern Physics: its own course and topics');
  await go('#/bank');
  const options = await p.locator('select[aria-label="Course"] option').allInnerTexts();
  expect(options.some((o) => o.includes('University Modern Physics')), 'the course menu offers University Modern Physics');
  for (const [topic, n] of [['ump.2', 2], ['ump.3', 2], ['ump.4', 1], ['ump.5', 2], ['ump.6', 3], ['ump.7', 2]]) {
    const got = await cards('university-modern-physics', topic);
    expect(got === n, `Modern physics ${topic}: ${n} questions (${got})`);
  }
  await go('#/bank?course=university-modern-physics');
  await p.waitForSelector('.topic-head');
  expect((await p.locator('.side-topic.is-empty').count()) === 1, 'only Topic 1 (special relativity) has no questions yet');

  console.log('Every new question renders cleanly, with the right key name and course');
  const bad = [];
  for (const id of [...IB_IDS, ...UMP_IDS]) {
    await go(`#/q/${id}?sol=1&ms=1`);
    await p.waitForSelector('.question');
    const errs = await p.locator('.katex-error').count();
    const parts = await p.locator('.part').count();
    const keyLabel = (await p.locator('.toolbar .switch').nth(1).innerText()).trim();
    const wantKey = id.startsWith('ump-') ? 'Grading rubric' : 'Markscheme';
    if (errs > 0 || parts < 3 || keyLabel !== wantKey) bad.push(`${id} (maths errors ${errs}, parts ${parts}, key "${keyLabel}")`);
  }
  expect(bad.length === 0, `${IB_IDS.length + UMP_IDS.length} new questions render with no maths errors${bad.length ? ': ' + bad.join(', ') : ''}`);
  await go('#/q/ibp-e2-compton-scattering');
  expect((await p.locator('.question').innerText()).includes('IB Physics HL'), 'an HL-only question is labelled IB Physics HL');
  await go('#/q/ump-t4-particle-in-box');
  expect((await p.locator('.question').innerText()).includes('University Modern Physics'), 'a modern physics question is labelled with its course');

  console.log('Marking: base version of the data center reactor (1.0 GW at 33 %)');
  const part = (i) => p.locator('.part').nth(i);
  const answer = async (i, v) => {
    await part(i).locator('.num-input').fill(v);
    await part(i).locator('.num-input').press('Enter');
    return part(i).locator('.feedback').innerText();
  };
  await go('#/q/ump-t6-data-center-reactor');
  expect((await answer(0, '3.03')).includes('Correct'), '(a) 3.03 GW is correct');
  expect((await answer(1, '9.46e19')).includes('Correct'), '(b) 9.46e19 fissions per second is correct');
  await go('#/q/ump-t6-data-center-reactor');
  await answer(0, '3.5');
  expect((await answer(1, '1.09e20')).includes('error carried forward'), '(b) follows through from a wrong (a) of 3.5 GW');

  console.log('A printed paper mixing IB and university questions');
  await go('#/print?ids=ibp-e4-fission-energy,ump-t6-fission-fragments&title=Fission&sol=1&ms=1');
  await p.waitForSelector('.paper');
  const paper = await p.locator('.paper').innerText();
  expect(paper.includes('IB Physics SL') && paper.includes('University Modern Physics'), 'the paper names both courses');
  expect(paper.includes('Each question is labelled with its course'), 'mixed-course instructions are printed');
  expect(paper.includes('(Markscheme)') && paper.includes('(Grading rubric)'), 'each key is named in parentheses');
  expect((await p.locator('.paper .katex-error').count()) === 0, 'no maths errors on the paper');

  console.log('Phone widths: no sideways scrolling');
  for (const width of [375, 320]) {
    await p.setViewportSize({ width, height: 800 });
    for (const id of ['ibp-e4-fission-energy', 'ibp-e5-fusion-reactions', 'ibp-e3-decay-equations', 'ump-t2-compton-recoil', 'ump-t4-particle-in-box', 'ump-t5-isotope-generator', 'ump-t6-fusion-barrier']) {
      await go(`#/q/${id}?sol=1&ms=1`);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over <= 0, `${id} at ${width} px (${over}px)`);
    }
    await go('#/bank?course=university-modern-physics&topic=ump.6');
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 0, `modern physics bank at ${width} px (${over}px)`);
  }

  await b.close();
  console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n- ${problems.join('\n- ')}` : '\nAll Theme E and modern physics browser checks passed.');
  process.exit(problems.length ? 1 : 0);
})();
