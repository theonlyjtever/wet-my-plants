// Run: node --test app/logic.test.js
const test = require('node:test');
const assert = require('node:assert');
const L = require('./logic.js');

const plant = { id: 'p1', name: 'Monty', room: 'Lounge', added: '2026-11-01', every: { water: 7, feed: 14, rotate: 0 } };
const state = (log, hemi = 'S') => ({ settings: { hemisphere: hemi }, plants: [plant], log });

test('dates cross months and years', () => {
  assert.strictEqual(L.addDays('2026-12-30', 3), '2027-01-02');
  assert.strictEqual(L.diffDays('2026-02-27', '2026-03-01'), 2);
});

test('seasons follow the hemisphere', () => {
  assert.strictEqual(L.season('2026-07-10', 'S'), 'winter');
  assert.strictEqual(L.season('2026-07-10', 'N'), 'summer');
  assert.strictEqual(L.season('2026-11-17', 'S'), 'spring');
  assert.strictEqual(L.season('2026-01-05', 'N'), 'winter');
});

test('feeding doubles only in local winter', () => {
  assert.strictEqual(L.interval(plant, 'feed', '2026-07-01', 'S'), 28);
  assert.strictEqual(L.interval(plant, 'feed', '2026-07-01', 'N'), 14);
  assert.strictEqual(L.interval(plant, 'rotate', '2026-07-01', 'S'), 0);
  assert.strictEqual(L.interval(plant, 'feed', '2026-01-15', ''), 14); // no location yet: no winter easing
});

test('due date uses last care, rain and snooze', () => {
  assert.strictEqual(L.dueDate(plant, [], 'water', 'S', '2026-11-17'), '2026-11-08');
  const log = [{ plantId: 'p1', type: 'rain', date: '2026-11-15' }];
  assert.strictEqual(L.dueDate(plant, log, 'water', 'S', '2026-11-17'), '2026-11-22');
  const snoozed = { ...plant, snooze: { water: '2026-11-25' } };
  assert.strictEqual(L.dueDate(snoozed, log, 'water', 'S', '2026-11-17'), '2026-11-25');
});

test('tasks list only what is due, with overdue days', () => {
  const t = L.tasks(state([]), '2026-11-17');
  assert.deepStrictEqual(t.map((x) => [x.type, x.overdue]), [['water', 9], ['feed', 2]]);
  assert.strictEqual(L.tasks(state([{ plantId: 'p1', type: 'water', date: '2026-11-17' }]), '2026-11-17').length, 1);
});

test('health drops with overdue care and recent pests', () => {
  assert.strictEqual(L.health(plant, [{ plantId: 'p1', type: 'water', date: '2026-11-17' }, { plantId: 'p1', type: 'feed', date: '2026-11-17' }], 'S', '2026-11-17'), 100);
  assert.strictEqual(L.health(plant, [], 'S', '2026-11-17'), 100 - 50 - 4);
  const pest = [{ plantId: 'p1', type: 'water', date: '2026-11-17' }, { plantId: 'p1', type: 'feed', date: '2026-11-17' }, { plantId: 'p1', type: 'pest', date: '2026-11-10' }];
  assert.strictEqual(L.health(plant, pest, 'S', '2026-11-17'), 90);
});

test('streak counts consecutive days, ignoring rain', () => {
  const log = ['2026-11-14', '2026-11-15', '2026-11-16'].map((date) => ({ plantId: 'p1', type: 'water', date }));
  assert.strictEqual(L.streak(log, '2026-11-17'), 3); // nothing yet today: still counts to yesterday
  assert.strictEqual(L.streak([...log, { plantId: 'p1', type: 'rain', date: '2026-11-17' }], '2026-11-17'), 3);
  assert.strictEqual(L.streak([], '2026-11-17'), 0);
});

test('CSV quotes cells and defuses formulas', () => {
  const s = { settings: {}, plants: [{ ...plant, name: '=HYPERLINK("x")', common: 'Say "hi", ok' }], log: [{ plantId: 'p1', type: 'water', date: '2026-11-17', note: '' }] };
  const lines = L.toCSV(s).split('\r\n');
  assert.strictEqual(lines[1], '"2026-11-17","\'=HYPERLINK(""x"")","Say ""hi"", ok","Lounge","water",""');
});

test('import validation rejects broken backups', () => {
  assert.ok(L.validState(state([])));
  assert.ok(!L.validState({ plants: [], log: [] }));
  assert.ok(!L.validState({ settings: {}, plants: [{ id: 1, name: 'x', added: '2026-01-01' }], log: [] }));
  assert.ok(!L.validState(null));
});

test('identification becomes safe form values', () => {
  const r = { is_plant: true, common_name: '  Peace lily ', species: 'Spathiphyllum', confidence: 'high', water_every_days: 6.6, fertilise_every_days: 9999, rotate_every_days: -3, care_note: 'Likes shade' };
  assert.deepStrictEqual(L.fromIdentification(r), {
    name: 'Peace lily', common: 'Peace lily', species: 'Spathiphyllum', confidence: 'high',
    every: { water: 7, feed: 365, rotate: 0 }, notes: 'Likes shade', tags: [],
  });
  assert.strictEqual(L.fromIdentification({ ...r, is_plant: false }), null);
  assert.strictEqual(L.fromIdentification(null), null);
  const odd = L.fromIdentification({ is_plant: true, common_name: 42, water_every_days: 'x', confidence: 'sure' });
  assert.deepStrictEqual([odd.common, odd.every.water, odd.confidence], ['', 1, 'low']);
});

test('rain is summed over the last 24 hours only', () => {
  const time = [], precipitation = [];
  for (let h = 0; h < 48; h++) { time.push(`2026-11-${h < 24 ? '16' : '17'}T${String(h % 24).padStart(2, '0')}:00`); precipitation.push(h === 2 ? 50 : h >= 30 ? 1 : 0); }
  // now = 17th 09:30 -> window is 16th 10:00 .. 17th 09:00; the 50 mm at 16th 02:00 is outside it
  assert.strictEqual(L.rainLast24({ time, precipitation }, '2026-11-17T09:30'), 4);
  assert.strictEqual(L.rainLast24({ time, precipitation }, '2026-12-01T00:00'), 0);
  assert.strictEqual(L.rainLast24(null, '2026-11-17T09:30'), 0);
});

test('weather summary gives today and the next three days, each with a tip', () => {
  const w = {
    current: { time: '2026-11-17T09:00', temperature_2m: 27.4, weather_code: 2 },
    daily: { time: ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'],
      temperature_2m_max: [40, 24, 36, 22, 20, 41], temperature_2m_min: [-5, 12, 18, 14, 0.5, -9],
      precipitation_sum: [0, 0, 0, 12, 0, 0], wind_speed_10m_max: [0, 10, 10, 10, 10, 10], weather_code: [0, 0, 1, 63, 3, 0] },
  };
  const s = L.weatherSummary(w, '2026-11-17');
  assert.deepStrictEqual(s.days.map((d) => [d.date, d.kind]), [
    ['2026-11-17', 'sunny'], ['2026-11-18', 'heat'], ['2026-11-19', 'rain'], ['2026-11-20', 'frost'],
  ]); // yesterday and day five are left out
  assert.strictEqual(s.temp, 27);
  assert.strictEqual(L.weatherSummary(w, '2027-01-01'), null);
  const junk = L.weatherSummary({ daily: { time: ['2026-11-17'], temperature_2m_max: ['hot'] } }, '2026-11-17').days[0];
  assert.deepStrictEqual([junk.max, junk.kind], [null, 'mild']);
  assert.strictEqual(L.weatherLabel(0).icon, 'sun');
  assert.strictEqual(L.weatherLabel(63).label, 'Rain');
});

test('day tips put the most important condition first', () => {
  const day = (o) => L.dayTip({ max: 20, min: 12, rain: 0, wind: 10, code: 3, ...o }).kind;
  assert.strictEqual(day({ min: 1, max: 36 }), 'frost'); // frost beats heat
  assert.strictEqual(day({ max: 35, rain: 20 }), 'heat');
  assert.strictEqual(day({ rain: 5, wind: 60 }), 'rain');
  assert.strictEqual(day({ wind: 40 }), 'wind');
  assert.strictEqual(day({ max: 28 }), 'warm');
  assert.strictEqual(day({ min: 8 }), 'chilly');
  assert.strictEqual(day({ code: 0 }), 'sunny');
  assert.strictEqual(day({ code: 45 }), 'dull');
  assert.strictEqual(day({ code: 80 }), 'mild');
});

test('saved location must be a real place', () => {
  const base = { settings: {}, plants: [], log: [] };
  assert.ok(L.validState({ ...base, settings: { location: { name: 'Sydney', lat: -33.87, lon: 151.21 } } }));
  assert.ok(!L.validState({ ...base, settings: { location: { name: 'X', lat: '0;alert(1)', lon: 0 } } }));
  assert.ok(!L.validState({ ...base, settings: { location: { name: 'X', lat: 95, lon: 0 } } }));
});

test('sick bay pauses chosen care and lowers health', () => {
  const sick = { ...plant, sick: { issue: 'overwatered', since: '2026-11-15', steps: [false, true], pause: ['water', 'feed'] } };
  const st = { settings: { hemisphere: 'S' }, plants: [sick], log: [] };
  assert.deepStrictEqual(L.tasks(st, '2026-11-17'), []); // water and feed were both due
  const thirsty = { ...sick, sick: { ...sick.sick, pause: ['feed'] } };
  assert.deepStrictEqual(L.tasks({ ...st, plants: [thirsty] }, '2026-11-17').map((t) => t.type), ['water']);
  const fed = [{ plantId: 'p1', type: 'water', date: '2026-11-17' }, { plantId: 'p1', type: 'feed', date: '2026-11-17' }];
  assert.strictEqual(L.health(sick, fed, 'S', '2026-11-17'), 85);
  assert.ok(L.validState(st));
  assert.ok(!L.validState({ ...st, plants: [{ ...sick, sick: { ...sick.sick, issue: '<b>' } }] }));
  assert.ok(!L.validState({ ...st, plants: [{ ...sick, sick: { ...sick.sick, pause: ['everything'] } }] }));
});

test('every guide is complete and its id is safe to store', () => {
  const GUIDES = require('./guides.js');
  const ids = new Set();
  for (const g of GUIDES) {
    assert.match(g.id, /^[a-z-]+$/);
    assert.ok(!ids.has(g.id), 'duplicate id ' + g.id);
    ids.add(g.id);
    for (const k of ['title', 'icon', 'signs', 'cause', 'after', 'recovery']) assert.ok(typeof g[k] === 'string' && g[k], `${g.id}.${k}`);
    assert.ok(g.steps.length >= 3, g.id);
    assert.ok(g.pause.includes('feed') && g.pause.every((x) => L.CARE.includes(x)), g.id);
  }
});

test('chat history is sent back unchanged, minus pre-fallback internals', () => {
  const plain = [{ type: 'thinking', thinking: '', signature: 's1' }, { type: 'text', text: 'Hi' }];
  assert.strictEqual(L.echoable(plain), plain);
  const fell = [{ type: 'thinking', signature: 'a' }, { type: 'text', text: 'Part' }, { type: 'fallback' }, { type: 'thinking', signature: 'b' }, { type: 'text', text: 'Rest' }];
  assert.deepStrictEqual(L.echoable(fell).map((b) => b.type + (b.signature || b.text || '')), ['textPart', 'fallback', 'thinkingb', 'textRest']);
});

test('chat answers become safe HTML', () => {
  assert.strictEqual(L.prose('Check the roots.\n\n- **Firm** roots: fine\n- Mushy: trim\nThen repot.'),
    '<p>Check the roots.</p><ul><li>Firm roots: fine</li><li>Mushy: trim</li></ul><p>Then repot.</p>');
  assert.strictEqual(L.prose('<img src=x onerror=alert(1)>'), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
});

test('import validation rejects values that could inject HTML', () => {
  const photo = { date: '2026-11-17', data: 'data:image/jpeg;base64,AAAA' };
  const ok = { settings: {}, plants: [{ ...plant, photos: [photo], tags: ['x'] }], log: [{ id: 'e1', plantId: 'p1', type: 'water', date: '2026-11-17' }] };
  assert.ok(L.validState(ok));
  const bad = (change) => assert.ok(!L.validState(change(JSON.parse(JSON.stringify(ok)))));
  bad((s) => { s.plants[0].photos[0].data = 'x" onerror="alert(1)'; return s; });
  bad((s) => { s.plants[0].id = 'p1" onclick="x'; return s; });
  bad((s) => { s.plants[0].every.feed = '<img src=x onerror=alert(1)>'; return s; });
  bad((s) => { s.plants[0].tags = 'not a list'; return s; });
  bad((s) => { delete s.log[0].id; return s; });
  bad((s) => { s.plants[0].group = { name: 'x' }; return s; });
  assert.ok(L.validState({ ...ok, plants: [{ ...ok.plants[0], group: 'Bamboo trio' }] }));
});
