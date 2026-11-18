// Pure care logic. No DOM here, so it can be tested in Node (see logic.test.js).
(function () {
  const DAY = 86400000;
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => new Date(s + 'T00:00:00');
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  // Rounding absorbs the 1-hour shift on daylight-saving days.
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / DAY);

  const CARE = ['water', 'feed', 'rotate'];
  // A rain entry counts as a watering for outdoor plants.
  const COUNTS_AS = { water: ['water', 'rain'], feed: ['feed'], rotate: ['rotate'] };

  function season(dateStr, hemi) {
    let m = +dateStr.slice(5, 7);
    if (hemi === 'S') m = ((m + 5) % 12) + 1; // shift six months
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  // Feeding eases off in the user's own winter: the interval doubles.
  // Without a known hemisphere (no location set) there is no winter adjustment.
  function interval(plant, type, dateStr, hemi) {
    const every = +(plant.every && plant.every[type]) || 0;
    if (!every) return 0;
    return type === 'feed' && (hemi === 'S' || hemi === 'N') && season(dateStr, hemi) === 'winter' ? every * 2 : every;
  }

  function lastDone(log, plantId, type) {
    let last = null;
    for (const e of log) {
      if (e.plantId === plantId && COUNTS_AS[type].includes(e.type) && (!last || e.date > last)) last = e.date;
    }
    return last;
  }

  function dueDate(plant, log, type, hemi, todayStr) {
    const every = interval(plant, type, todayStr, hemi);
    if (!every) return null;
    let due = addDays(lastDone(log, plant.id, type) || plant.added, every);
    const snooze = plant.snooze && plant.snooze[type];
    if (snooze && snooze > due) due = snooze;
    return due;
  }

  function tasks(state, todayStr) {
    const out = [];
    for (const p of state.plants) {
      const paused = (p.sick && p.sick.pause) || []; // sick bay can pause watering or feeding
      for (const type of CARE) {
        if (paused.includes(type)) continue;
        const due = dueDate(p, state.log, type, state.settings.hemisphere, todayStr);
        if (due && due <= todayStr) out.push({ plant: p, type, due, overdue: diffDays(due, todayStr) });
      }
    }
    return out;
  }

  // Simple, explainable score: falls with overdue care and a recent pest treatment.
  function health(plant, log, hemi, todayStr) {
    let s = 100;
    const late = (type) => {
      const due = dueDate(plant, log, type, hemi, todayStr);
      return due ? Math.max(0, diffDays(due, todayStr)) : 0;
    };
    s -= Math.min(50, late('water') * 8);
    s -= Math.min(20, late('feed') * 2);
    if (log.some((e) => e.plantId === plant.id && e.type === 'pest' && diffDays(e.date, todayStr) <= 14)) s -= 10;
    if (plant.sick) s -= 15;
    return Math.max(0, s);
  }

  // Days in a row with at least one care action, ending today (or yesterday).
  function streak(log, todayStr) {
    const days = new Set(log.filter((e) => e.type !== 'rain').map((e) => e.date));
    let d = days.has(todayStr) ? todayStr : addDays(todayStr, -1);
    let n = 0;
    while (days.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }

  // Quotes every cell; a leading = + - @ is defused so spreadsheets don't run it as a formula.
  function cell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function toCSV(state) {
    const byId = Object.fromEntries(state.plants.map((p) => [p.id, p]));
    const rows = [['date', 'plant', 'common name', 'room', 'action', 'note']];
    for (const e of [...state.log].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      const p = byId[e.plantId] || {};
      rows.push([e.date, p.name, p.common, p.room, e.type, e.note]);
    }
    return rows.map((r) => r.map(cell).join(',')).join('\r\n');
  }

  // Backups come from files the user picks, so check every field the UI puts into HTML attributes or text.
  const ID = /^[a-z0-9]+$/i;
  const DATE = /^\d{4}-\d\d-\d\d$/;
  const PHOTO = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
  const isId = (v) => typeof v === 'string' && ID.test(v);
  const isNum = (v) => typeof v === 'number' && isFinite(v) && v >= 0;
  const validPlant = (p) => !!p && isId(p.id) && typeof p.name === 'string' && DATE.test(p.added) &&
    !!p.every && CARE.every((k) => isNum(p.every[k])) &&
    (p.tags == null || (Array.isArray(p.tags) && p.tags.every((t) => typeof t === 'string'))) &&
    (p.group == null || (typeof p.group === 'string' && p.group.length <= 40)) &&
    (p.photos == null || (Array.isArray(p.photos) && p.photos.every((ph) => ph && DATE.test(ph.date) && PHOTO.test(ph.data)))) &&
    (p.sick == null || (typeof p.sick === 'object' && typeof p.sick.issue === 'string' && /^[a-z-]+$/.test(p.sick.issue) && DATE.test(p.sick.since) &&
      Array.isArray(p.sick.steps) && p.sick.steps.every((x) => typeof x === 'boolean') &&
      Array.isArray(p.sick.pause) && p.sick.pause.every((x) => CARE.includes(x))));
  function validState(o) {
    return !!o && typeof o === 'object' &&
      Array.isArray(o.plants) && Array.isArray(o.log) && !!o.settings && typeof o.settings === 'object' && validLocation(o.settings.location) &&
      o.plants.every(validPlant) &&
      o.log.every((e) => e && isId(e.id) && isId(e.plantId) && typeof e.type === 'string' && DATE.test(e.date));
  }

  // Claude's identification -> plant form values. Its numbers are suggestions, so they are clamped to what the form allows.
  function fromIdentification(r) {
    if (!r || typeof r !== 'object' || r.is_plant !== true) return null;
    const str = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '');
    const days = (n, min) => Math.max(min, Math.min(365, Math.round(+n) || 0));
    const common = str(r.common_name, 60);
    return {
      name: common, common, species: str(r.species, 60),
      confidence: ['high', 'medium', 'low'].includes(r.confidence) ? r.confidence : 'low',
      every: { water: days(r.water_every_days, 1), feed: days(r.fertilise_every_days, 0), rotate: days(r.rotate_every_days, 0) },
      notes: str(r.care_note, 500), tags: [],
    };
  }

  // ---------- weather (Open-Meteo response shapes) ----------
  const RAIN_MM = 5;   // this much in 24 h waters outdoor pots
  const HEAT_C = 35;   // daily max at or above: heatwave warning
  const FROST_C = 2;   // daily min at or below: frost warning
  const n = (a, i) => (Array.isArray(a) && typeof a[i] === 'number' && isFinite(a[i]) ? a[i] : null);

  // Sum of hourly rain over the 24 hours ending with the current hour.
  function rainLast24(hourly, nowIso) {
    if (!hourly || !Array.isArray(hourly.time) || typeof nowIso !== 'string') return 0;
    const i = hourly.time.findIndex((t) => typeof t === 'string' && t.slice(0, 13) === nowIso.slice(0, 13));
    if (i < 0) return 0;
    let sum = 0;
    for (let k = Math.max(0, i - 23); k <= i; k++) sum += n(hourly.precipitation, k) || 0;
    return Math.round(sum * 10) / 10;
  }

  const RAIN_DAY_MM = 5;  // forecast rain that waters outdoor pots
  const WIND_KMH = 40;    // gusty enough to tip light pots
  const WARM_C = 28;
  const CHILLY_C = 8;

  // One plant-care tip for a day's forecast; the most important condition wins.
  function dayTip(day) {
    const { max, min, rain, wind, code } = day;
    if (min !== null && min <= FROST_C) return { kind: 'frost', tip: 'Frost likely: bring tender plants in or cover them overnight.' };
    if (max !== null && max >= HEAT_C) return { kind: 'heat', tip: 'Very hot: water outdoor pots early and give them afternoon shade.' };
    if (rain !== null && rain >= RAIN_DAY_MM) return { kind: 'rain', tip: 'Rain on the way: skip watering outdoor plants.' };
    if (wind !== null && wind >= WIND_KMH) return { kind: 'wind', tip: 'Windy: move tall or light pots somewhere sheltered.' };
    if (max !== null && max >= WARM_C) return { kind: 'warm', tip: 'Warm: check soil in the morning, pots dry out fast.' };
    if (min !== null && min <= CHILLY_C) return { kind: 'chilly', tip: 'Chilly night: keep plants off cold windowsills.' };
    if (code !== null && code <= 1) return { kind: 'sunny', tip: 'Bright day: rotate plants so every side gets light.' };
    if (code !== null && code <= 48) return { kind: 'dull', tip: 'Dull day: indoor soil dries slowly, so water less.' };
    return { kind: 'mild', tip: 'Mild day: a good time to repot or prune.' };
  }

  // Rain so far, current conditions, and today plus the next three days, each with a tip.
  function weatherSummary(w, todayStr) {
    if (!w || !w.daily || !Array.isArray(w.daily.time)) return null;
    const d = w.daily;
    const i0 = d.time.indexOf(todayStr);
    if (i0 < 0) return null;
    const days = [];
    for (let i = i0; i < Math.min(d.time.length, i0 + 4); i++) {
      const day = {
        date: d.time[i], max: n(d.temperature_2m_max, i), min: n(d.temperature_2m_min, i), rain: n(d.precipitation_sum, i),
        wind: n(d.wind_speed_10m_max, i), code: n(d.weather_code, i),
      };
      days.push({ ...day, ...dayTip(day) });
    }
    const c = w.current || {};
    return {
      rain: rainLast24(w.hourly, c.time), days,
      temp: typeof c.temperature_2m === 'number' ? Math.round(c.temperature_2m) : null,
      code: typeof c.weather_code === 'number' ? c.weather_code : null,
    };
  }

  // WMO weather codes, grouped.
  function weatherLabel(code) {
    if (code === null || code === undefined) return { label: '', icon: 'cloud' };
    if (code === 0) return { label: 'Clear', icon: 'sun' };
    if (code <= 3) return { label: 'Partly cloudy', icon: 'cloud' };
    if (code <= 48) return { label: 'Fog', icon: 'cloud' };
    if (code <= 67 || (code >= 80 && code <= 82)) return { label: 'Rain', icon: 'rain' };
    if (code <= 77 || code === 85 || code === 86) return { label: 'Snow', icon: 'snow' };
    return { label: 'Thunderstorm', icon: 'rain' };
  }

  // ---------- chat ----------
  // Assistant turns go back to the API unchanged, except after a refusal fallback: model-internal blocks
  // before the last fallback block are left out, as the API requires.
  function echoable(content) {
    const cut = content.map((b) => b.type).lastIndexOf('fallback');
    if (cut < 0) return content;
    return content.filter((b, i) => i >= cut || b.type === 'text');
  }

  // Claude is asked for plain text with "- " bullets; turn that into safe HTML (everything escaped).
  const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function prose(text) {
    const out = [];
    let list = [];
    const flush = () => { if (list.length) out.push(`<ul>${list.map((li) => `<li>${escHtml(li)}</li>`).join('')}</ul>`); list = []; };
    for (const line of String(text).split('\n')) {
      const m = line.match(/^\s*[-•*]\s+(.*)/);
      if (m) list.push(m[1].replace(/\*\*/g, ''));
      else { flush(); if (line.trim()) out.push(`<p>${escHtml(line.replace(/\*\*/g, ''))}</p>`); }
    }
    flush();
    return out.join('');
  }

  const validLocation =(l) => l == null || (typeof l === 'object' && typeof l.name === 'string' &&
    typeof l.lat === 'number' && l.lat >= -90 && l.lat <= 90 && typeof l.lon === 'number' && l.lon >= -180 && l.lon <= 180);

  const api = { ymd, today, addDays, diffDays, season, interval, lastDone, dueDate, tasks, health, streak, toCSV, validState, fromIdentification,
    rainLast24, weatherSummary, weatherLabel, dayTip, echoable, prose, CARE, RAIN_MM };
  if (typeof module !== 'undefined') module.exports = api; else window.Logic = api;
})();
