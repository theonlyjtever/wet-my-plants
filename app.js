// Wet My Plants UI. Data lives in this browser's localStorage under KEY.
// The app was first called Verdant; the storage keys keep that name so existing data still loads.
(function () {
  const L = window.Logic;
  const KEY = 'verdant.v1';
  const app = document.getElementById('app');
  const tabs = document.getElementById('tabs');
  const dialog = document.getElementById('plantDialog');
  const GUIDES = window.GUIDES;
  const guideById = (id) => GUIDES.find((g) => g.id === id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const s = (n) => (n === 1 ? '' : 's');

  const I = {
    drop: '<path d="M12 3.5c3.3 4.1 5.6 7.1 5.6 10.1a5.6 5.6 0 0 1-11.2 0c0-3 2.3-6 5.6-10.1z"/>',
    flask: '<path d="M9 3.5h6M10 3.5v5l-4.6 9.2A1.9 1.9 0 0 0 7.1 20.5h9.8a1.9 1.9 0 0 0 1.7-2.8L14 8.5v-5M7.6 15h8.8"/>',
    rotate: '<path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4M19.5 4v4.5H15"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.2l2.6 2.3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    rain: '<path d="M7.5 14.5a4 4 0 0 1-.4-8 5.3 5.3 0 0 1 10.2 1.6 3.2 3.2 0 0 1-.3 6.4z"/><path d="M9 17.5l-1 2.5M13 17.5l-1 2.5M17 17.5l-1 2.5"/>',
    cloud: '<path d="M7.5 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 2 3.6 3.6 0 0 1-.5 7z"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
    thermo: '<path d="M10 13.6V5a2 2 0 0 1 4 0v8.6a4 4 0 1 1-4 0z"/><path d="M12 16.5v-6"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.4-4 2.5-5 .3 2 1.2 3 2.5 3-1-3 0-5.5 0-8z"/>',
    home: '<path d="M4 11l8-7 8 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
    leaf: '<path d="M5 19.5C5 11 10 5 20 4.5c0 10-6 15-14 15M5 19.5l8.5-8.5"/>',
    pulse: '<path d="M3 12.5h4l2.2-5.5 4.3 11 2.3-5.5H21"/>',
    pot: '<path d="M4.5 10h15M6 10l1.4 9a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3L18 10M12 10V6.5M12 7c-1.4-2-3.4-2.6-5-2.1.5 1.8 2.6 2.7 5 2.1zM12 7c1.4-2 3.4-2.6 5-2.1-.5 1.8-2.6 2.7-5 2.1z"/>',
    scissors: '<circle cx="6.5" cy="6.5" r="2.6"/><circle cx="6.5" cy="17.5" r="2.6"/><path d="M8.6 8.2L20 18M8.6 15.8L20 6"/>',
    bug: '<path d="M9 7.5a3 3 0 0 1 6 0M8 9.5h8v4.5a4 4 0 0 1-8 0zM12 9.5v8.5M4 12h4M16 12h4M4.5 18l3.7-1.6M19.5 18l-3.7-1.6M5.5 6.5l2.8 2.4M18.5 6.5l-2.8 2.4"/>',
    pin: '<path d="M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.5 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.5-3.5-8.5s1.1-6 3.5-8.5z"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    cross: '<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8.5v7M8.5 12h7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const icon = (n, size = 18) => `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

  const ACT = {
    water: { label: 'Watered', verb: 'Water', icon: 'drop' },
    feed: { label: 'Fertilised', verb: 'Fertilise', icon: 'flask' },
    rotate: { label: 'Rotated', verb: 'Rotate', icon: 'rotate' },
    repot: { label: 'Repotted', icon: 'pot' },
    prune: { label: 'Pruned', icon: 'scissors' },
    pest: { label: 'Pest treatment', icon: 'bug' },
    rain: { label: 'Rained (watering skipped)', icon: 'rain' },
    sick: { label: 'Moved to sick bay', icon: 'cross' },
    checkin: { label: 'Sick bay check-in', icon: 'pulse' },
    recovered: { label: 'Recovered', icon: 'check' },
  };

  // ---------- plant ID with Claude ----------
  // The key is the user's own and lives only in this browser; it is never part of backups or exports.
  const API_KEY = 'verdant.apiKey';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.8.0/+esm';
  const getKey = () => { try { return localStorage.getItem(API_KEY) || ''; } catch (e) { return ''; } };
  const ID_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['is_plant', 'common_name', 'species', 'confidence', 'water_every_days', 'fertilise_every_days', 'rotate_every_days', 'care_note'],
    properties: {
      is_plant: { type: 'boolean', description: 'False if the photo does not clearly show a plant.' },
      common_name: { type: 'string' },
      species: { type: 'string', description: 'Botanical name, e.g. Monstera deliciosa.' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      water_every_days: { type: 'integer', description: 'Typical days between waterings indoors in the growing season.' },
      fertilise_every_days: { type: 'integer', description: 'Days between feeds in the growing season; 0 if it should not be fed.' },
      rotate_every_days: { type: 'integer', description: 'Days between quarter turns for even growth; 0 if not needed.' },
      care_note: { type: 'string', description: 'One short sentence on light and the most common mistake.' },
    },
  };
  let SDK = null;
  // name: the owner's correction. Then Claude trusts the name and only uses the photo (if any) as context.
  async function identify(base64, name = '') {
    const ask = name
      ? `The owner says this plant is “${name.slice(0, 60)}”. Treat that as correct: fix the spelling, give its usual common name and botanical name, and give growing-season care intervals for it; the app adjusts feeding for winter itself. Set is_plant to false only if that is not the name of a plant.`
      : 'Identify this plant. Give growing-season care intervals; the app adjusts feeding for winter itself.';
    SDK = SDK || (await import(SDK_URL));
    const client = new SDK.default({ apiKey: getKey(), dangerouslyAllowBrowser: true });
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: ID_SCHEMA } },
      system: 'You identify houseplants and garden plants from photos or names for a plant-care app and suggest typical care intervals. If unsure of the species, give your best guess and lower the confidence.',
      messages: [{
        role: 'user',
        content: [
          ...(base64 ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } }] : []),
          { type: 'text', text: ask },
        ],
      }],
    });
    if (res.stop_reason === 'refusal') throw new Error('refused');
    return JSON.parse(res.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
  }
  function explain(e) {
    const A = SDK && SDK.default;
    if (!A) return 'Could not load the Claude library. Check your internet connection.';
    if (e instanceof A.AuthenticationError) return 'Your Anthropic API key was rejected. Check it in Settings.';
    if (e instanceof A.RateLimitError) return 'Too many requests right now. Wait a minute and try again.';
    if (e instanceof A.APIConnectionError) return 'Could not reach Claude. Check your internet connection.';
    if (e instanceof A.APIError) return `Claude returned an error (${e.status || 'unknown'}). Try again later.`;
    if (e && e.message === 'refused') return 'Claude declined to identify this photo.';
    return 'Claude’s answer could not be read. Try again.';
  }

  // ---------- sick bay chat with Claude ----------
  // shortcut: chats live in memory only and reset when the page reloads; persist them if people want history.
  const chats = {}; // key ('general' or a plant id) -> { messages, busy, pending, error, draft }
  // attach: a photo waiting to be sent (JPEG data URL). Each message keeps `shown` (photos to display) apart from the API content.
  const chatOf = (key) => chats[key] || (chats[key] = { messages: [], busy: false, pending: '', error: '', draft: '', attach: null });

  const { echoable, prose } = L;

  function plantContext(p) {
    const t = T();
    const lines = [`Plant: ${p.name}${p.common ? ` (${p.common}${p.species ? ', ' + p.species : ''})` : p.species ? ` (${p.species})` : ''}.`];
    lines.push(`Where: ${[p.room, p.spot].filter(Boolean).join(', ') || 'not set'}; ${p.outdoor ? 'outdoors' : 'indoors'}.`);
    const sched = L.CARE.filter((type) => p.every[type]).map((type) => `${ACT[type].verb.toLowerCase()} every ${p.every[type]} days (last: ${L.lastDone(state.log, p.id, type) || 'never logged'})`);
    lines.push('Care schedule: ' + (sched.join('; ') || 'none set') + '.');
    lines.push(`Health score in the app: ${L.health(p, state.log, hemi(), t)}/100 (drops with overdue care, recent pests, or being in sick bay).`);
    if (p.tags && p.tags.length) lines.push('Tags: ' + p.tags.join(', ') + '.');
    if (p.notes) lines.push('Owner notes: ' + p.notes);
    const recent = state.log.filter((e) => e.plantId === p.id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12)
      .map((e) => `${e.date} ${ACT[e.type] ? ACT[e.type].label : e.type}${e.note ? ` (${e.note})` : ''}`);
    if (recent.length) lines.push('Recent history: ' + recent.join('; ') + '.');
    if (p.sick) {
      const g = guideById(p.sick.issue);
      lines.push(`In sick bay since ${p.sick.since} for: ${g ? g.title : p.sick.issue}. Paused care: ${p.sick.pause.join(', ')}.`);
      if (g) lines.push('Recovery plan progress:\n' + g.steps.map((st, i) => `${p.sick.steps[i] ? '[done]' : '[not yet]'} ${st}`).join('\n'));
    }
    return lines.join('\n');
  }

  function chatSystem(p) {
    const t = T(), loc = state.settings.location, w = weather();
    const parts = ['You are the plant-care advisor in the Sick bay of Wet My Plants, a plant-care app. Give practical, specific advice for the owner’s situation, using the details below. ' +
      'Keep answers short: a few sentences or a short list. Use plain text; "- " bullets are fine, but no headings, tables or bold. ' +
      'If you can’t be sure, say what to look for or check. Mention toxicity to pets or children only when it matters. If a plant may not survive, suggest taking cuttings.'];
    parts.push(`Today is ${t}.` + (loc ? ` The owner lives in ${loc.name}${hemi() ? `; it is ${L.season(t, hemi())} there` : ''}.` : ''));
    if (w && w.days[0]) {
      const d = w.days[0];
      parts.push(`Weather today: ${d.max === null ? '?' : Math.round(d.max)}°C high, ${d.min === null ? '?' : Math.round(d.min)}°C low, ${d.rain || 0} mm rain.` +
        (w.days.length > 1 ? ' Next days: ' + w.days.slice(1).map((x) => `${x.date} ${x.max === null ? '?' : Math.round(x.max)}/${x.min === null ? '?' : Math.round(x.min)}°C ${x.rain || 0} mm`).join('; ') + '.' : ''));
    }
    if (p) parts.push(plantContext(p));
    else {
      const sick = state.plants.filter((x) => x.sick);
      parts.push(sick.length ? 'Plants in sick bay:\n\n' + sick.map(plantContext).join('\n\n') : 'No plants are in sick bay right now.');
      const others = state.plants.filter((x) => !x.sick).map((x) => `${x.name}${x.common ? ` (${x.common})` : ''}`);
      if (others.length) parts.push('Other plants the owner has: ' + others.join(', ') + '.');
    }
    return parts.join('\n\n');
  }

  async function sendChat(key, text) {
    const c = chatOf(key);
    text = (text || '').trim().slice(0, 1000);
    const attached = c.attach;
    if (c.busy || (!text && !attached)) return;
    const p = key === 'general' ? null : plantById(key);
    const content = [];
    const img = (dataUrl) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] } });
    const ph = p && latest(p);
    const auto = !!ph && !c.messages.length; // the plant's latest photo goes with the first question
    if (auto) content.push(img(ph.data));
    if (attached) content.push(img(attached));
    content.push({ type: 'text', text: text || 'Here’s a photo. What do you see, and what should I do?' });
    c.messages.push({ role: 'user', content, shown: attached, auto, typed: text });
    Object.assign(c, { busy: true, pending: '', error: '', draft: '', attach: null });
    paintChat(key);
    try {
      SDK = SDK || (await import(SDK_URL));
      const client = new SDK.default({ apiKey: getKey(), dangerouslyAllowBrowser: true });
      const stream = client.beta.messages.stream({
        model: 'claude-opus-5-5',
        max_tokens: 64000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        system: chatSystem(p),
        messages: c.messages.map((m) => ({ role: m.role, content: m.role === 'assistant' ? echoable(m.content) : m.content })),
      });
      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { c.pending += ev.delta.text; paintPending(key); }
      }
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new Error('refused');
      c.messages.push({ role: 'assistant', content: msg.content });
    } catch (e) {
      c.messages.pop(); // keep the history valid; the question and photo go back in the box
      c.error = explain(e);
      c.draft = text;
      c.attach = attached;
    } finally {
      c.busy = false;
      c.pending = '';
      paintChat(key);
    }
  }

  const textOf = (content) => content.filter((b) => b.type === 'text').map((b) => b.text).join('');

  function chatInner(key, p) {
    const c = chatOf(key);
    if (!getKey()) {
      return `<p class="muted small">To chat with Claude about your plants, add your Anthropic API key in Settings.</p>
        <button class="btn outline sm" data-act="tab" data-tab="more">Open Settings</button>`;
    }
    const name = p ? p.name : 'your plants';
    const ideas = p
      ? [`Is ${p.name} getting better?`, 'What should I check today?', 'Should I repot it?']
      : ['Why are my leaves turning yellow?', 'How do I get rid of fungus gnats?', 'Which plant needs my attention most?'];
    const msgs = c.messages.map((m) => m.role === 'user'
      ? `<div class="msg me">${m.auto ? `<span class="att">${icon('camera', 13)} Latest photo of ${esc(p ? p.name : 'the plant')} included</span>` : ''}${m.shown ? `<img class="msgimg" src="${m.shown}" alt="Photo you shared">` : ''}${esc(m.typed !== undefined ? m.typed : textOf(m.content))}</div>`
      : `<div class="msg ai">${prose(textOf(m.content)) || '<p class="muted">(No answer came back. Try asking again.)</p>'}</div>`).join('');
    return `${msgs || `<p class="muted small">Ask anything about ${esc(name)}. Claude sees ${p ? `${esc(p.name)}’s care history${latest(p) ? ', latest photo' : ''} and recovery plan` : 'who is in sick bay and your local weather'}.</p>`}
      ${c.busy ? `<div class="msg ai pending">${c.pending ? prose(c.pending) : '<span class="typing"><i></i><i></i><i></i></span>'}</div>` : ''}
      ${c.error ? `<p class="chaterr">${esc(c.error)}</p>` : ''}
      ${!c.messages.length && !c.busy ? `<div class="ideas">${ideas.map((q) => `<button class="chip" data-act="ask" data-key="${key}" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
      ${c.attach ? `<div class="attached"><img src="${c.attach}" alt="Photo ready to send"><span>Photo ready to send</span><button type="button" class="round" data-act="unattach" data-key="${key}" aria-label="Remove photo">${icon('x', 16)}</button></div>` : ''}
      <form class="composer" data-chat="${key}"><button type="button" class="round" data-act="attach" data-key="${key}" aria-label="Snap or share a photo" title="Snap or share a photo" ${c.busy ? 'disabled' : ''}>${icon('camera', 20)}</button>
        <textarea rows="1" maxlength="1000" aria-label="Message to Claude about ${esc(name)}" placeholder="${c.attach ? 'Add a question, or just send' : `Ask about ${esc(name)}…`}" ${c.busy ? 'disabled' : ''}>${esc(c.draft)}</textarea>
        <button class="round go send" aria-label="Send" ${c.busy ? 'disabled' : ''}>${icon('arrow', 18)}</button></form>
      ${c.messages.length ? `<button class="link small" data-act="newchat" data-key="${key}">Start a new chat</button>` : ''}`;
  }
  function chatPanel(key, p) {
    return `<section class="room chat"><header><h2 class="serif">Ask Claude</h2><span class="muted small">a few cents per answer</span></header>
      <div class="chatbox" data-chat-key="${key}">${chatInner(key, p)}</div></section>`;
  }
  function paintChat(key) {
    const box = document.querySelector(`[data-chat-key="${key}"]`);
    if (!box) return;
    box.innerHTML = chatInner(key, key === 'general' ? null : plantById(key));
    const ta = box.querySelector('textarea');
    if (ta && !ta.disabled && chatOf(key).messages.length) ta.focus();
  }
  function paintPending(key) {
    const el = document.querySelector(`[data-chat-key="${key}"] .pending`);
    if (el) el.innerHTML = prose(chatOf(key).pending);
  }

  // ---------- weather (Open-Meteo, no key needed) ----------
  const WX_KEY = 'verdant.weather';
  let wx = null;
  try { wx = JSON.parse(localStorage.getItem(WX_KEY)); } catch (e) { wx = null; }
  let wxLoading = false, wxFailedAt = 0, places = [];
  const WX_VERSION = 2; // bump when the requested fields change, so old caches are refetched
  const sameLoc = (a, b) => !!a && !!b && a.v === WX_VERSION && a.lat === b.lat && a.lon === b.lon;
  const weather = () => (wx && sameLoc(wx, state.settings.location) ? L.weatherSummary(wx.data, L.today()) : null);
  async function refreshWeather() {
    const loc = state.settings.location;
    if (!loc || wxLoading) return;
    if (wx && sameLoc(wx, loc) && Date.now() - wx.at < 3600e3) return; // fresh enough
    if (Date.now() - wxFailedAt < 600e3) return; // don't hammer the service after a failure
    wxLoading = true;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
        '&current=temperature_2m,weather_code&hourly=precipitation' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&past_days=1&forecast_days=4&timezone=auto';
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      wx = { v: WX_VERSION, at: Date.now(), lat: loc.lat, lon: loc.lon, data: await r.json() };
      try { localStorage.setItem(WX_KEY, JSON.stringify(wx)); } catch (e) { /* cache is optional */ }
    } catch (e) {
      wxFailedAt = Date.now();
    } finally {
      wxLoading = false;
      if (view.tab === 'today') render();
    }
  }
  async function searchPlaces(q) {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return (Array.isArray(j.results) ? j.results : [])
      .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && typeof p.name === 'string')
      .map((p) => ({ name: [p.name, p.admin1, p.country].filter((x) => typeof x === 'string' && x).join(', ').slice(0, 80), lat: +p.latitude.toFixed(2), lon: +p.longitude.toFixed(2) }));
  }
  function setLocation(loc) {
    state.settings.location = loc;
    if (loc) state.settings.hemisphere = loc.lat < 0 ? 'S' : 'N'; // seasons follow the place
    places = [];
    save();
    render();
    refreshWeather();
  }

  // ---------- storage ----------
  const fresh = () => ({ settings: { name: '', hemisphere: '' }, plants: [], log: [] });
  let canStore = true;
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { canStore = false; return fresh(); }
    if (!raw) return fresh();
    try { const st = JSON.parse(raw); if (L.validState(st)) return st; } catch (e) { /* handled below */ }
    // Keep unreadable data aside instead of overwriting it.
    try { localStorage.setItem(KEY + '.unreadable.' + Date.now(), raw); } catch (e) { /* nothing more we can do */ }
    alert('Your saved plant data could not be read. It was kept aside and Wet My Plants started fresh.');
    return fresh();
  }
  function save() {
    if (!canStore) return false;
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) {
      alert('Could not save: this browser’s storage is full. Delete some photos, then try again.');
      return false;
    }
  }

  let state = load();
  let view = { tab: 'today' };
  let lastView = '';
  const T = () => L.today();
  // Set from the chosen location; '' until there is one (then feeding has no winter easing).
  const hemi = () => (state.settings.hemisphere === 'S' || state.settings.hemisphere === 'N' ? state.settings.hemisphere : '');
  const plantById = (id) => state.plants.find((p) => p.id === id);

  // ---------- actions ----------
  function addLog(plantId, type, date = T(), note) {
    state.log.push(note ? { id: uid(), plantId, type, date, note } : { id: uid(), plantId, type, date });
    const p = plantById(plantId);
    if (p && p.snooze) delete p.snooze[type === 'rain' ? 'water' : type];
  }
  // Outdoor plants on a watering schedule that haven't been watered (or rained on) today.
  const outdoorDry = () => state.plants.filter((p) => p.outdoor && p.every.water &&
    !state.log.some((e) => e.plantId === p.id && e.date === T() && (e.type === 'water' || e.type === 'rain')));

  function act(a, d) {
    const p = d.id && plantById(d.id);
    if (['tab', 'open', 'back', 'guide', 'patient'].includes(a)) window.scrollTo(0, 0);
    switch (a) {
      case 'tab': view = { tab: d.tab }; break;
      case 'open': view = { tab: 'plants', plantId: d.id }; break;
      case 'back': view = { tab: 'plants' }; break;
      case 'log': addLog(d.id, d.type); break;
      case 'rain': addLog(d.id, 'rain'); break;
      case 'rainall': outdoorDry().forEach((x) => addLog(x.id, 'rain')); break;
      case 'snooze': p.snooze = { ...(p.snooze || {}), [d.type]: L.addDays(T(), 1) }; break;
      case 'batch':
        L.tasks(state, T()).filter((t) => t.type === 'water' && (t.plant.room || 'Unsorted') === d.room).forEach((t) => addLog(t.plant.id, 'water'));
        break;
      case 'undo': state.log = state.log.filter((e) => e.id !== d.log); break;
      case 'add': return openForm(null);
      case 'admit': return openAdmit(d.id, d.guide);
      case 'ask': return sendChat(d.key, d.q);
      case 'newchat': delete chats[d.key]; return paintChat(d.key);
      case 'attach':
        return pickImage((img) => { chatOf(d.key).attach = toJpeg(img, 1024, 0.82); paintChat(d.key); });
      case 'unattach': chatOf(d.key).attach = null; return paintChat(d.key);
      case 'guide': view = { tab: 'sick', guide: d.guide }; break;
      case 'patient': view = { tab: 'sick', plantId: d.id }; break;
      case 'step':
        if (!p || !p.sick || !(+d.i in p.sick.steps)) return;
        p.sick.steps[+d.i] = !p.sick.steps[+d.i];
        break;
      case 'checkin':
        if (!p || !['better', 'same', 'worse'].includes(d.mood)) return;
        // one check-in per plant per day: a new answer replaces today's
        state.log = state.log.filter((e) => !(e.plantId === p.id && e.type === 'checkin' && e.date === T()));
        addLog(p.id, 'checkin', T(), d.mood);
        break;
      case 'discharge':
        if (!p || !p.sick) return;
        addLog(p.id, 'recovered');
        p.sick = null;
        view = { tab: 'sick' };
        break;
      case 'fromphoto': return addFromPhoto();
      case 'forgetkey':
        try { localStorage.removeItem(API_KEY); } catch (e) { /* storage unavailable */ }
        break;
      case 'edit': return openForm(p);
      case 'delete':
        if (!confirm(`Delete ${p.name} and its ${state.log.filter((e) => e.plantId === p.id).length} care entries? This can’t be undone.`)) return;
        state.plants = state.plants.filter((x) => x !== p);
        state.log = state.log.filter((e) => e.plantId !== p.id);
        view = { tab: 'plants' };
        break;
      case 'photo': return pickPhoto(p);
      case 'delphoto':
        if (!confirm('Delete this photo?')) return;
        p.photos.splice(+d.i, 1);
        break;
      case 'setloc': return setLocation(places[+d.i]);
      case 'myloc': return useMyLocation();
      case 'clearloc': return setLocation(null);
      case 'csv': return download(`wet-my-plants-care-log-${T()}.csv`, '﻿' + L.toCSV(state), 'text/csv');
      case 'backup': return backup();
      case 'backuplater': setMark(BACKUP_SNOOZE); return render();
      case 'restore': return restore();
      default: return;
    }
    save();
    render();
  }

  function useMyLocation() {
    if (!navigator.geolocation) return alert('This browser can’t share your location. Search for your town instead.');
    navigator.geolocation.getCurrentPosition(
      // Rounded to about 1 km: plenty for weather, and less precise than the device gives.
      (pos) => setLocation({ name: 'Your location', lat: +pos.coords.latitude.toFixed(2), lon: +pos.coords.longitude.toFixed(2) }),
      () => alert('Location was not shared. Search for your town instead.'),
      { timeout: 15000, maximumAge: 3600e3 },
    );
  }

  // Per-device dates (not in the backup itself): when this phone last backed up, and when "Not now" was tapped.
  const BACKUP_AT = 'verdant.backupAt', BACKUP_SNOOZE = 'verdant.backupSnooze';
  const getMark = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const setMark = (k) => { try { localStorage.setItem(k, T()); } catch (e) { /* reminder is optional */ } };
  const BACKUP_EVERY = 14, SNOOZE_DAYS = 3;
  function backupDue() {
    if (!state.plants.length) return false;
    const t = T();
    const snoozed = getMark(BACKUP_SNOOZE);
    if (snoozed && L.diffDays(snoozed, t) < SNOOZE_DAYS) return false;
    // Never backed up: count from the oldest plant, so brand-new users aren't nagged on day one.
    const since = getMark(BACKUP_AT) || state.plants.map((p) => p.added).sort()[0];
    return L.diffDays(since, t) >= BACKUP_EVERY;
  }

  // On phones, open the share sheet so the file can go to iCloud Drive, Google Drive or email.
  async function backup() {
    const name = `wet-my-plants-backup-${T()}`, text = JSON.stringify(state);
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare) {
      // Chrome on Android won't share .json files, so fall back to the same JSON in a .txt file.
      const file = [new File([text], name + '.json', { type: 'application/json' }), new File([text], name + '.txt', { type: 'text/plain' })]
        .find((f) => navigator.canShare({ files: [f] }));
      if (file) {
        try {
          await navigator.share({ files: [file], title: 'Wet My Plants backup' });
          setMark(BACKUP_AT);
        } catch (e) {
          if (e.name !== 'AbortError') { download(name + '.json', text, 'application/json'); setMark(BACKUP_AT); }
        }
        return render();
      }
    }
    download(name + '.json', text, 'application/json');
    setMark(BACKUP_AT);
    render();
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function chooseFile(accept, cb) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => input.files[0] && cb(input.files[0]);
    input.click();
  }

  function restore() {
    chooseFile('application/json,.json,text/plain,.txt', async (file) => {
      let st;
      try { st = JSON.parse(await file.text()); } catch (e) { st = null; }
      if (!L.validState(st)) return alert('That file is not a Wet My Plants backup.');
      if (!confirm(`Replace your current data with this backup (${st.plants.length} plants, ${st.log.length} care entries)?`)) return;
      const before = state;
      state = st;
      if (!save()) state = before;
      view = { tab: 'today' };
      render();
    });
  }

  // shortcut: photos are stored as small JPEGs in localStorage (~5 MB total, roughly 150 photos); move to IndexedDB if people keep more.
  function toJpeg(img, max, quality) {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  }
  function pickImage(cb) {
    chooseFile('image/*', async (file) => {
      let img;
      try { img = await createImageBitmap(file); } catch (e) { return alert('That image could not be opened.'); }
      cb(img);
    });
  }

  function pickPhoto(p) {
    pickImage((img) => {
      p.photos = p.photos || [];
      p.photos.push({ date: T(), data: toJpeg(img, 640, 0.74) });
      if (!save()) p.photos.pop();
      render();
    });
  }

  function addFromPhoto() {
    if (!getKey()) {
      alert('To identify plants from a photo, add your Anthropic API key in Settings first.');
      view = { tab: 'more' };
      return render();
    }
    pickImage(async (img) => {
      const photo = { date: T(), data: toJpeg(img, 640, 0.74) };
      dialog.innerHTML = `<div class="form busy"><div class="scan"><img class="preview" src="${photo.data}" alt=""><span class="beam"></span></div>
        <h2>Identifying your plant…</h2><p class="muted">This usually takes a few seconds.</p>
        <div class="formbtns"><button type="button" class="btn ghost">Cancel</button></div></div>`;
      let waiting = true, cancelled = false;
      dialog.onclose = () => { if (waiting) cancelled = true; };
      dialog.querySelector('button').onclick = () => dialog.close();
      dialog.showModal();
      let preset = null, problem = '';
      try {
        preset = L.fromIdentification(await identify(toJpeg(img, 1024, 0.85).split(',')[1]));
        if (!preset) problem = 'That doesn’t look like a plant. Try a closer photo of the leaves.';
      } catch (e) {
        problem = explain(e);
      }
      waiting = false;
      if (cancelled) return;
      dialog.close();
      if (problem && !confirm(problem + '\n\nAdd this plant by hand instead?')) return;
      openForm(null, preset, photo);
    });
  }

  // ---------- plant form ----------
  // preset: values suggested by Claude; photo: the picture the plant was added from.
  function openForm(p, preset = null, photo = null) {
    const rooms = [...new Set(state.plants.map((x) => x.room).filter(Boolean))];
    const v = p || preset || { every: { water: 7, feed: 30, rotate: 14 }, tags: [] };
    const field = (name, label, value, attrs = '') => `<label>${label}<input name="${name}" value="${esc(value)}" ${attrs}></label>`;
    dialog.onclose = null;
    dialog.innerHTML = `<form class="form">
      <h2 class="serif">${p ? 'Edit plant' : 'New plant'}</h2>
      ${p ? '' : '<div class="photoslot"></div>'}
      ${preset ? `<p class="aihint">${icon('leaf', 16)} Suggested by Claude · ${esc(preset.confidence)} confidence. Check the details, then save.</p>` : ''}
      ${field('name', 'Nickname *', v.name, 'required maxlength="40"')}
      ${field('common', 'Common name', v.common, 'maxlength="60"')}
      ${field('species', 'Species', v.species, 'maxlength="60"')}
      <div class="fixid"><button type="button" class="btn ghost sm" data-fix>${icon('leaf', 16)} ${p ? 'Wrong plant? Update care for this name' : 'Fill in care for this name'}</button>
        <small class="muted">Type the right common name or species above, then tap. Claude updates the species, care intervals and notes; nothing changes until you save.</small></div>
      <div class="row2">${field('room', 'Room or zone', v.room, 'list="rooms" maxlength="30"')}${field('spot', 'Spot', v.spot, 'maxlength="40" placeholder="e.g. north window"')}</div>
      <datalist id="rooms">${rooms.map((r) => `<option value="${esc(r)}">`).join('')}</datalist>
      <div class="row2">${field('acquired', 'Date acquired', v.acquired, 'type="date"')}${field('source', 'Source', v.source, 'maxlength="60" placeholder="nursery, cutting…"')}</div>
      <fieldset><legend>Care every … days (0 = never)</legend><div class="row3">
        ${field('water', 'Water', v.every.water, 'type="number" min="0" max="365" required')}
        ${field('feed', 'Fertilise', v.every.feed, 'type="number" min="0" max="365" required')}
        ${field('rotate', 'Rotate', v.every.rotate, 'type="number" min="0" max="365" required')}
      </div></fieldset>
      <label class="check"><input type="checkbox" name="outdoor" ${v.outdoor ? 'checked' : ''}> Outdoors (rain can count as watering)</label>
      ${field('tags', 'Tags, comma separated', (v.tags || []).join(', '), 'maxlength="200"')}
      <label>Notes<textarea name="notes" rows="2" maxlength="500">${esc(v.notes)}</textarea></label>
      <div class="formbtns"><button type="button" class="btn ghost" value="cancel">Cancel</button><button class="btn primary">Save plant</button></div>
    </form>`;
    const form = dialog.querySelector('form');
    form.querySelector('[value=cancel]').onclick = () => dialog.close();
    // New plants only: take or choose a first photo. Only this slot redraws, so typed fields are kept.
    const slot = form.querySelector('.photoslot');
    const paintSlot = () => {
      if (!slot) return;
      slot.innerHTML = photo
        ? `<img class="preview" src="${photo.data}" alt="Photo of the new plant"><div class="pair"><button type="button" class="btn ghost sm" data-photo="pick">${icon('camera', 16)} Change photo</button>${preset ? '' : `<button type="button" class="btn ghost sm" data-photo="remove">${icon('x', 16)} Remove</button>`}</div>`
        : `<button type="button" class="photopick" data-photo="pick">${icon('camera', 26)}<b>Take or choose a photo</b><small>Optional. It becomes the plant’s first growth photo.</small></button>`;
      slot.querySelector('[data-photo=pick]').onclick = () => pickImage((img) => { photo = { date: T(), data: toJpeg(img, 640, 0.74) }; paintSlot(); });
      const rm = slot.querySelector('[data-photo=remove]');
      if (rm) rm.onclick = () => { photo = null; paintSlot(); };
    };
    paintSlot();
    // Correct a wrong identification: ask Claude about the typed name and fill the form in place.
    const fixBtn = form.querySelector('[data-fix]');
    const startCommon = v.common || '';
    fixBtn.onclick = async () => {
      const el = (n) => form.elements[n];
      const asked = el('common').value.trim() || el('species').value.trim();
      if (!asked) return alert('Type the plant’s common name or species first.');
      if (!getKey()) return alert('To look up care for a plant name, add your Anthropic API key in Settings. You can still change the details by hand.');
      const pic = (p && latest(p)) || photo;
      const label = fixBtn.innerHTML;
      fixBtn.disabled = true;
      fixBtn.textContent = 'Asking Claude…';
      try {
        const r = L.fromIdentification(await identify(pic ? pic.data.split(',')[1] : '', asked));
        if (!r) { alert(`Claude doesn’t recognise “${asked}” as a plant. Check the spelling and try again.`); return; }
        // Keep a custom nickname; replace one that was just the old (wrong) common name.
        const nick = el('name').value.trim();
        if (!nick || nick === startCommon || nick === asked) el('name').value = r.name.slice(0, 40);
        el('common').value = r.common;
        el('species').value = r.species;
        el('water').value = r.every.water;
        el('feed').value = r.every.feed;
        el('rotate').value = r.every.rotate;
        const old = el('notes').value.trim();
        el('notes').value = (old && old !== r.notes ? `${r.notes}\n\nEarlier notes: ${old}` : r.notes).slice(0, 500);
        let hint = form.querySelector('.aihint');
        if (!hint) { hint = document.createElement('p'); hint.className = 'aihint'; fixBtn.parentNode.before(hint); }
        hint.innerHTML = `${icon('leaf', 16)} Updated by Claude for ${esc(r.common || asked)} · ${esc(r.confidence)} confidence. Check the details, then save.`;
      } catch (e) {
        alert(explain(e));
      } finally {
        fixBtn.disabled = false;
        fixBtn.innerHTML = label;
      }
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const num = (x) => Math.max(0, Math.min(365, Math.round(+x) || 0));
      const data = {
        name: f.name.trim(), common: f.common.trim(), species: f.species.trim(), room: f.room.trim(), spot: f.spot.trim(),
        acquired: f.acquired, source: f.source.trim(), outdoor: !!f.outdoor, notes: f.notes.trim(),
        tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
        every: { water: num(f.water), feed: num(f.feed), rotate: num(f.rotate) },
      };
      if (!data.name) return;
      // Look the plant up again: another tab may have reloaded state while the form was open.
      const target = p && plantById(p.id);
      if (target) Object.assign(target, data);
      else { const np = { id: uid(), added: T(), photos: photo ? [photo] : [], snooze: {}, ...data }; state.plants.push(np); view = { tab: 'plants', plantId: np.id }; }
      save();
      dialog.close();
      render();
    };
    dialog.showModal();
  }

  // ---------- view helpers ----------
  // Plants without a photo get a calm generated "print": a gradient picked from the plant's id.
  const ARTS = [['#1F4D33', '#5E9A4A'], ['#2C5E6E', '#7FB3A8'], ['#6A3B2A', '#C9805C'], ['#3D4A1E', '#A7BD5B'], ['#40335A', '#8F7BB8'], ['#1E3A2A', '#C8F169']];
  function art(p) {
    let h = 0;
    for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = ARTS[h % ARTS.length];
    return `background:linear-gradient(150deg, ${a}, ${b})`;
  }
  const latest = (p) => p.photos && p.photos.length ? p.photos[p.photos.length - 1] : null;
  function photo(p, cls) {
    const ph = latest(p);
    return ph ? `<img class="${cls}" src="${ph.data}" alt="">` : `<span class="${cls} art" style="${art(p)}">${icon('leaf', cls === 'thumb' ? 20 : 44)}</span>`;
  }
  function dueText(due) {
    if (!due) return 'not scheduled';
    const d = L.diffDays(T(), due);
    if (d < 0) return `${-d} day${s(-d)} overdue`;
    if (d === 0) return 'due today';
    if (d === 1) return 'tomorrow';
    return `in ${d} days`;
  }
  const hClass = (h) => (h >= 70 ? 'good' : h >= 40 ? 'ok' : 'low');
  function ring(score, size = 64) {
    const r = size / 2 - 5, c = 2 * Math.PI * r;
    return `<div class="ring ${hClass(score)}" style="width:${size}px" title="Health falls when care is overdue or pests were treated recently">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="arc" stroke-dasharray="${(score / 100) * c} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
      <b>${score}</b></div>`;
  }
  function dayName(dateStr) {
    const d = L.diffDays(T(), dateStr);
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    return new Date(dateStr + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' });
  }

  function alerts() {
    const out = [];
    const patients = state.plants.filter((p) => p.sick);
    if (patients.length) {
      const waiting = patients.filter((p) => !checkinToday(p)).length;
      out.push(`<button class="alert sickbay" data-act="tab" data-tab="sick">${icon('cross', 22)}<div><b>${patients.length} in sick bay</b>
        <span>${esc(patients.map((p) => p.name).join(', '))} · ${waiting ? `${waiting} still to check in today` : 'all checked in today'}</span></div>${icon('arrow', 18)}</button>`);
    }
    const w = weather();
    if (w && w.rain >= L.RAIN_MM) {
      const dry = outdoorDry();
      out.push(`<div class="alert rain">${icon('rain', 22)}<div><b>Rained ${w.rain} mm in the last 24 hours</b>
        <span>${dry.length ? `${dry.length} outdoor plant${s(dry.length)} probably don’t need watering today.` : 'Outdoor plants are covered for today.'}</span>
        ${dry.length ? `<button class="chip light" data-act="rainall">${icon('check', 14)} Count rain as watering</button>` : ''}</div></div>`);
    }
    if (w && w.days.length) {
      const KIND_ICON = { frost: 'snow', heat: 'thermo', rain: 'rain', wind: 'cloud', warm: 'sun', sunny: 'sun', chilly: 'thermo', dull: 'cloud', mild: 'leaf' };
      const deg = (v) => (v === null ? '–' : Math.round(v) + '°');
      out.push(`<section class="forecast" aria-label="Weather tips for the next four days">${w.days.map((d) => {
        const wl = L.weatherLabel(d.code);
        const name = dayName(d.date);
        return `<article class="day k-${d.kind}"><header><b>${esc(name[0].toUpperCase() + name.slice(1))}</b>${icon(wl.icon, 20)}</header>
          <p class="temps"><span>${deg(d.max)}</span> ${deg(d.min)}</p>
          ${d.rain ? `<p class="rainmm">${icon('drop', 12)} ${Math.round(d.rain * 10) / 10} mm</p>` : ''}
          <p class="tip">${icon(KIND_ICON[d.kind], 14)} ${esc(d.tip)}</p></article>`;
      }).join('')}</section>`);
    }
    if (backupDue()) {
      const last = getMark(BACKUP_AT);
      out.push(`<div class="alert hint">${icon('download', 22)}<div><b>Time for a backup</b>
        <span>${last ? `Last backup ${L.diffDays(last, T())} days ago.` : 'You haven’t backed up yet.'} Your plants live only on this device, so save a copy somewhere safe, like iCloud Drive, Google Drive or email.</span>
        <span class="pair"><button class="chip" data-act="backup">${icon('download', 14)} Back up now</button><button class="link" data-act="backuplater">Not now</button></span></div></div>`);
    }
    if (!state.settings.location) {
      out.push(`<button class="alert hint" data-act="tab" data-tab="more">${icon('pin', 22)}<div><b>Add your town for weather tips</b><span>Daily plant tips from your forecast, and lighter feeding in your winter.</span></div>${icon('arrow', 18)}</button>`);
    }
    return out.join('');
  }

  // ---------- views ----------
  function todayView() {
    refreshWeather();
    const t = T();
    const list = L.tasks(state, t);
    const doneCare = state.log.filter((e) => e.date === t && ['water', 'feed', 'rotate', 'rain'].includes(e.type)).length;
    const done = state.log.filter((e) => e.date === t);
    const pct = list.length + doneCare ? Math.round((doneCare / (list.length + doneCare)) * 100) : 100;
    const thriving = state.plants.filter((p) => L.health(p, state.log, hemi(), t) >= 70).length;
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const w = weather();
    const wl = w && L.weatherLabel(w.code);
    const loc = state.settings.location;

    let html = `<section class="hero">
      <div class="hero-top"><p class="eyebrow">${esc(dateLabel)}</p>
        ${w && w.temp !== null ? `<span class="wx">${icon(wl.icon, 16)} ${w.temp}° ${esc(wl.label)}${loc ? ` · ${esc(loc.name.split(',')[0])}` : ''}</span>` : ''}</div>
      <h1 class="display">${greet}${state.settings.name ? `,<br>${esc(state.settings.name)}` : ''}</h1>
      ${state.plants.length ? `<div class="hero-stat">
        <div class="bignum">${list.length}</div>
        <div class="hs-text"><b>${list.length ? `task${s(list.length)} left today` : 'All done today'}</b><span>${doneCare} done · ${pct}% of today’s care</span>
          <div class="bar"><i style="width:${pct}%"></i></div></div></div>
      <div class="hero-chips"><span>${icon('flame', 15)} ${L.streak(state.log, t)}-day streak</span><span>${icon('leaf', 15)} ${state.plants.length} plant${s(state.plants.length)}</span><span>${icon('pulse', 15)} ${thriving} thriving</span></div>` : ''}
    </section>
    <div class="alerts">${alerts()}</div>`;

    if (!state.plants.length) {
      return html + `<section class="empty"><h2 class="serif">Start your collection</h2><p>Snap a photo and let Claude name it, or add a plant by hand.</p>
        <div class="stack"><button class="btn primary" data-act="fromphoto">${icon('camera', 18)} Add from a photo</button><button class="btn outline" data-act="add">${icon('plus', 18)} Add by hand</button></div></section>`;
    }

    if (!list.length) html += `<section class="alldone"><span class="burst">${icon('check', 28)}</span><h2 class="serif">Nothing left to do</h2><p>Every plant is looked after for today.</p></section>`;
    const rooms = {};
    list.forEach((x) => (rooms[x.plant.room || 'Unsorted'] = rooms[x.plant.room || 'Unsorted'] || []).push(x));
    for (const room of Object.keys(rooms).sort()) {
      const items = rooms[room];
      const waters = items.filter((x) => x.type === 'water').length;
      html += `<section class="room"><header><h2 class="serif">${esc(room)}</h2>${waters >= 2 ? `<button class="chip t-water" data-act="batch" data-room="${esc(room)}">${icon('drop', 14)} Water all ${waters}</button>` : `<span class="muted small">${items.length} task${s(items.length)}</span>`}</header>`;
      for (const x of items) {
        const a = ACT[x.type];
        html += `<article class="task t-${x.type}">
          <button class="task-main" data-act="open" data-id="${x.plant.id}">${photo(x.plant, 'thumb')}
            <span class="tm-text"><b>${esc(x.plant.name)}</b><span class="tag-row"><span class="care">${icon(a.icon, 13)} ${a.verb}</span><small class="${x.overdue ? 'late' : ''}">${dueText(x.due)}</small></span></span></button>
          <div class="task-acts">
            ${x.type === 'water' && x.plant.outdoor ? `<button class="round" data-act="rain" data-id="${x.plant.id}" aria-label="It rained: skip watering ${esc(x.plant.name)}" title="It rained: skip">${icon('rain')}</button>` : ''}
            <button class="round" data-act="snooze" data-id="${x.plant.id}" data-type="${x.type}" aria-label="Snooze ${a.verb.toLowerCase()} until tomorrow" title="Snooze until tomorrow">${icon('clock')}</button>
            <button class="round go" data-act="log" data-id="${x.plant.id}" data-type="${x.type}" aria-label="${a.label} ${esc(x.plant.name)}">${icon(a.icon, 20)}</button>
          </div></article>`;
      }
      html += `</section>`;
    }
    if (done.length) {
      html += `<section class="room"><header><h2 class="serif">Done today</h2></header><div class="card list">`;
      for (const e of done.slice().reverse()) {
        const p = plantById(e.plantId);
        html += `<div class="doneitem t-${esc(e.type)}"><span class="dot">${icon(ACT[e.type] ? ACT[e.type].icon : 'check', 14)}</span><span>${esc(p ? p.name : '?')} · ${esc(ACT[e.type] ? ACT[e.type].label : e.type)}</span><button class="link" data-act="undo" data-log="${e.id}">Undo</button></div>`;
      }
      html += `</div></section>`;
    }
    return html;
  }

  function plantsView() {
    if (view.plantId && plantById(view.plantId)) return profileView(plantById(view.plantId));
    const t = T();
    let html = `<header class="pagehead"><div><p class="eyebrow dark">Your collection</p><h1 class="display sm">Plants</h1></div>
      <div class="pair"><button class="btn outline sm" data-act="fromphoto">${icon('camera', 16)} Photo</button><button class="btn primary sm" data-act="add">${icon('plus', 16)} Add</button></div></header>`;
    if (!state.plants.length) return html + `<section class="empty"><p>No plants yet. Add one by hand or from a photo.</p></section>`;
    const rooms = {};
    state.plants.forEach((p) => (rooms[p.room || 'Unsorted'] = rooms[p.room || 'Unsorted'] || []).push(p));
    for (const room of Object.keys(rooms).sort()) {
      html += `<section class="room"><header><h2 class="serif">${esc(room)}</h2><span class="muted small">${rooms[room].length}</span></header><div class="grid">`;
      for (const p of rooms[room].sort((a, b) => a.name.localeCompare(b.name))) {
        const h = L.health(p, state.log, hemi(), t);
        const due = L.dueDate(p, state.log, 'water', hemi(), t);
        html += `<button class="pcard" data-act="open" data-id="${p.id}">${photo(p, 'pimg')}
          <span class="badge ${hClass(h)}">${h}</span>${p.sick ? `<span class="sickflag">${icon('cross', 13)} Sick bay</span>` : ''}
          <span class="pinfo"><b>${esc(p.name)}</b><small>${esc(p.common || p.species || '')}</small>
            <span class="due ${due && due < t ? 'late' : ''}">${icon('drop', 12)} ${dueText(due)}</span></span></button>`;
      }
      html += `</div></section>`;
    }
    return html;
  }

  function profileView(p) {
    const t = T();
    const log = state.log.filter((e) => e.plantId === p.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const winterFeed = hemi() && L.season(t, hemi()) === 'winter' && p.every.feed;
    const next = L.CARE.filter((type) => p.every[type]).map((type) => {
      const due = L.dueDate(p, state.log, type, hemi(), t);
      if (p.sick && p.sick.pause.includes(type)) return `<div class="need t-${type}">${icon(ACT[type].icon, 18)}<b>Paused</b><small>While in sick bay</small></div>`;
      return `<div class="need t-${type}">${icon(ACT[type].icon, 18)}<b class="${due < t ? 'late' : ''}">${dueText(due)}</b><small>${ACT[type].verb} every ${type === 'feed' && winterFeed ? p.every.feed * 2 : p.every[type]} d</small></div>`;
    }).join('');
    const photos = p.photos || [];
    const ph = latest(p);
    const since = p.acquired && 'Since ' + new Date(p.acquired + 'T00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    return `<section class="phero">${ph ? `<img src="${ph.data}" alt="Latest photo of ${esc(p.name)}">` : `<div class="art big" style="${art(p)}">${icon('leaf', 96)}</div>`}
      <div class="scrim"></div>
      <button class="round glass left" data-act="back" aria-label="Back to plants">${icon('back')}</button>
      <button class="round glass right" data-act="edit" data-id="${p.id}" aria-label="Edit plant">${icon('more')}</button>
      <div class="ptitle"><p class="eyebrow">${esc([p.room, p.spot].filter(Boolean).join(' · ') || 'No room yet')}${p.outdoor ? ' · outdoors' : ''}</p>
        <h1 class="display">${esc(p.name)}</h1><p class="sub">${esc(p.common)}${p.common && p.species ? ' · ' : ''}<i>${esc(p.species)}</i></p></div>
      ${ring(L.health(p, state.log, hemi(), t))}
    </section>
    ${p.sick ? `<button class="alert sickbay" data-act="patient" data-id="${p.id}">${icon('cross', 22)}<div><b>In sick bay · day ${L.diffDays(p.sick.since, t) + 1}</b>
      <span>${esc(guideById(p.sick.issue) ? guideById(p.sick.issue).title : 'Unwell')} · open the recovery plan</span></div>${icon('arrow', 18)}</button>` : ''}
    ${since || p.source ? `<p class="meta">${icon('cal', 14)} ${esc([since, p.source].filter(Boolean).join(' · '))}</p>` : ''}
    ${next ? `<div class="needs">${next}</div>` : ''}
    <section class="room"><header><h2 class="serif">Log care</h2><span class="muted small">One tap</span></header>
      <div class="loggrid">${['water', 'feed', 'repot', 'prune', 'rotate', 'pest'].map((type) => `<button class="pill t-${type}" data-act="log" data-id="${p.id}" data-type="${type}">${icon(ACT[type].icon, 16)}${type === 'pest' ? 'Pest spray' : ACT[type].label}</button>`).join('')}</div></section>
    <section class="room"><header><h2 class="serif">Growth</h2><button class="link" data-act="photo" data-id="${p.id}">${icon('camera', 15)} Add photo</button></header>
      ${photos.length ? `<div class="strip">${photos.map((x, i) => `<figure><img src="${x.data}" alt="${esc(p.name)}, ${esc(x.date)}"><figcaption>${new Date(x.date + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' })}</figcaption><button class="x" data-act="delphoto" data-id="${p.id}" data-i="${i}" aria-label="Delete photo">${icon('x', 12)}</button></figure>`).join('')}</div>` : `<p class="muted small">No photos yet. Add one now and then to watch it grow.</p>`}</section>
    ${(p.tags && p.tags.length) || p.notes ? `<section class="room"><header><h2 class="serif">Notes</h2></header>
      <div class="tags">${(p.tags || []).map((tg) => `<span class="tag">${esc(tg)}</span>`).join('')}</div>${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ''}</section>` : ''}
    <section class="room"><header><h2 class="serif">History</h2><span class="muted small">${log.length} entr${log.length === 1 ? 'y' : 'ies'}</span></header>
      <div class="card list">${log.slice(0, 30).map((e) => `<div class="doneitem t-${esc(e.type)}"><span class="dot">${icon(ACT[e.type] ? ACT[e.type].icon : 'check', 14)}</span><span>${esc(ACT[e.type] ? ACT[e.type].label : e.type)}<small> · ${esc(e.date)}</small></span><button class="link" data-act="undo" data-log="${e.id}" aria-label="Remove entry">Remove</button></div>`).join('') || '<p class="muted small">Nothing logged yet.</p>'}</div></section>
    <div class="pair end">${p.sick ? '' : `<button class="btn outline" data-act="admit" data-id="${p.id}">${icon('cross', 16)} Move to sick bay</button>`}<button class="btn ghost" data-act="edit" data-id="${p.id}">Edit or fix the name</button><button class="btn danger" data-act="delete" data-id="${p.id}">Delete plant</button></div>`;
  }

  // ---------- sick bay ----------
  const checkinToday = (p) => {
    const e = state.log.filter((x) => x.plantId === p.id && x.type === 'checkin' && x.date === T()).pop();
    return e ? e.note || '' : '';
  };
  const cap = (str) => str[0].toUpperCase() + str.slice(1);

  function openAdmit(plantId, guideId) {
    const candidates = state.plants.filter((p) => !p.sick);
    if (!candidates.length) return alert(state.plants.length ? 'All your plants are already in sick bay.' : 'Add a plant first.');
    dialog.onclose = null;
    dialog.innerHTML = `<form class="form admit">
      <h2 class="serif">Admit to sick bay</h2>
      <label>Which plant?<select name="plant" required>${candidates.map((p) => `<option value="${p.id}" ${p.id === plantId ? 'selected' : ''}>${esc(p.name)}${p.common ? ' · ' + esc(p.common) : ''}</option>`).join('')}</select></label>
      <fieldset><legend>What does it look like?</legend><div class="issues">${GUIDES.map((g) => `<label class="issue"><input type="radio" name="issue" value="${g.id}" ${g.id === guideId ? 'checked' : ''} required>
        <span class="issue-card">${icon(g.icon, 18)}<span><b>${esc(g.title)}</b><small>${esc(g.signs)}</small></span></span></label>`).join('')}</div></fieldset>
      <div class="formbtns"><button type="button" class="btn ghost" value="cancel">Cancel</button><button class="btn primary">${icon('cross', 16)} Admit</button></div>
    </form>`;
    const form = dialog.querySelector('form');
    form.querySelector('[value=cancel]').onclick = () => dialog.close();
    form.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const p = plantById(f.plant), g = guideById(f.issue);
      if (!p || !g || p.sick) return;
      p.sick = { issue: g.id, since: T(), steps: g.steps.map(() => false), pause: [...g.pause] };
      addLog(p.id, 'sick', T(), g.title);
      save();
      dialog.close();
      view = { tab: 'sick', plantId: p.id };
      window.scrollTo(0, 0);
      render();
    };
    dialog.showModal();
  }

  function guideSections(g, p) {
    const steps = g.steps.map((st, i) => p
      ? `<button class="step" data-act="step" data-id="${p.id}" data-i="${i}" aria-pressed="${!!p.sick.steps[i]}"><span class="box">${icon('check', 14)}</span><span>${esc(st)}</span></button>`
      : `<li>${esc(st)}</li>`).join('');
    return `<section class="gsec"><h3>What’s happening</h3><p>${esc(g.cause)}</p></section>
      <section class="room"><header><h2 class="serif">Recovery plan</h2>${p ? `<span class="muted small">${p.sick.steps.filter(Boolean).length} of ${g.steps.length} done</span>` : ''}</header>
        ${p ? `<div class="steps">${steps}</div>` : `<ol class="steplist">${steps}</ol>`}</section>
      <section class="gsec"><h3>After that</h3><p>${esc(g.after)}</p></section>
      <section class="gsec good"><h3>Signs it’s working</h3><p>${esc(g.recovery)}</p></section>`;
  }

  function sickView() {
    if (view.guide && guideById(view.guide)) return guideView(guideById(view.guide));
    const open = view.plantId && plantById(view.plantId);
    if (open && open.sick) return patientView(open);
    const patients = state.plants.filter((p) => p.sick);
    let html = `<header class="pagehead"><div><p class="eyebrow dark">Extra care</p><h1 class="display sm">Sick bay</h1></div>
      <button class="btn primary sm" data-act="admit">${icon('plus', 16)} Admit a plant</button></header>`;
    if (!patients.length) {
      html += `<section class="alldone"><span class="burst">${icon('check', 28)}</span><h2 class="serif">Everyone’s healthy</h2>
        <p>When a plant looks unwell, admit it here. You’ll get a step-by-step recovery plan, and watering or feeding pauses where that helps.</p></section>`;
    } else {
      html += `<div class="patients">${patients.map((p) => {
        const g = guideById(p.sick.issue);
        const done = p.sick.steps.filter(Boolean).length, total = p.sick.steps.length;
        const mood = checkinToday(p);
        return `<button class="patient" data-act="patient" data-id="${p.id}">${photo(p, 'thumb')}
          <span class="pt-text"><b>${esc(p.name)}</b><small>${esc(g ? g.title : 'Unwell')} · day ${L.diffDays(p.sick.since, T()) + 1}</small>
            <span class="bar"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></span>
            <small>${done} of ${total} steps · ${mood ? `today: ${esc(mood)}` : '<span class="late">check in today</span>'}</small></span>${icon('arrow', 18)}</button>`;
      }).join('')}</div>`;
    }
    html += chatPanel('general', null);
    html += `<section class="room"><header><h2 class="serif">Care guides</h2><span class="muted small">${GUIDES.length} problems</span></header>
      <div class="guides">${GUIDES.map((g) => `<button class="guidecard" data-act="guide" data-guide="${g.id}">${icon(g.icon, 20)}<span><b>${esc(g.title)}</b><small>${esc(g.signs)}</small></span>${icon('arrow', 16)}</button>`).join('')}</div></section>`;
    return html;
  }

  function patientView(p) {
    const g = guideById(p.sick.issue);
    const mood = checkinToday(p);
    const trail = state.log.filter((e) => e.plantId === p.id && e.type === 'checkin' && e.date >= p.sick.since).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-14);
    const paused = p.sick.pause.map((type) => ACT[type].verb.toLowerCase());
    const ph = latest(p);
    return `<section class="phero short">${ph ? `<img src="${ph.data}" alt="Latest photo of ${esc(p.name)}">` : `<div class="art big" style="${art(p)}">${icon('leaf', 80)}</div>`}
      <div class="scrim"></div>
      <button class="round glass left" data-act="tab" data-tab="sick" aria-label="Back to sick bay">${icon('back')}</button>
      <div class="ptitle"><p class="eyebrow">Sick bay · day ${L.diffDays(p.sick.since, T()) + 1}</p><h1 class="display">${esc(p.name)}</h1>
        <p class="sub">${esc(g ? g.title : 'Unwell')}</p></div></section>
    ${paused.length ? `<p class="paused">${icon('clock', 16)} ${esc(cap(paused.join(' and ')))} paused while ${esc(p.name)} recovers.</p>` : ''}
    <section class="room"><header><h2 class="serif">How does it look today?</h2></header>
      <div class="moods">${['better', 'same', 'worse'].map((m) => `<button class="mood m-${m}" data-act="checkin" data-id="${p.id}" data-mood="${m}" aria-pressed="${mood === m}">${cap(m)}</button>`).join('')}</div>
      ${trail.length ? `<div class="trail" aria-label="Recent check-ins">${trail.map((e) => `<span class="tdot m-${esc(e.note)}" title="${esc(e.date)}: ${esc(e.note)}"></span>`).join('')}<small class="muted">last ${trail.length} check-in${s(trail.length)}</small></div>` : ''}
    </section>
    ${chatPanel(p.id, p)}
    ${g ? guideSections(g, p) : '<p class="muted">This problem’s guide is no longer available.</p>'}
    <div class="pair end"><button class="btn ghost" data-act="open" data-id="${p.id}">Plant page</button><button class="btn primary" data-act="discharge" data-id="${p.id}">${icon('check', 16)} Recovered</button></div>`;
  }

  function guideView(g) {
    return `<header class="pagehead"><div><button class="link" data-act="tab" data-tab="sick">${icon('back', 16)} Sick bay</button>
      <h1 class="display sm">${esc(g.title)}</h1></div></header>
      <section class="gsec signs">${icon(g.icon, 22)}<div><h3>You might see</h3><p>${esc(g.signs)}</p></div></section>
      ${guideSections(g, null)}
      <div class="pair end"><button class="btn primary" data-act="admit" data-guide="${g.id}">${icon('cross', 16)} Admit a plant with this</button></div>`;
  }

  function moreView() {
    let used = 0;
    try { used = (localStorage.getItem(KEY) || '').length; } catch (e) { /* storage unavailable */ }
    const loc = state.settings.location;
    return `<header class="pagehead"><div><p class="eyebrow dark">Make it yours</p><h1 class="display sm">Settings</h1></div></header>
    ${canStore ? '' : '<p class="card warn">This browser is blocking storage, so nothing will be saved. Use a normal (not private) window.</p>'}
    <section class="card form">
      <label>Your name<input id="setName" value="${esc(state.settings.name)}" maxlength="30" placeholder="Shown in the greeting"></label>    </section>
    <section class="room"><header><h2 class="serif">Weather</h2></header>
      <div class="card form">
        ${loc ? `<div class="locrow">${icon('pin', 18)}<b>${esc(loc.name)}</b><button class="link" data-act="clearloc">Remove</button></div>` : ''}
        <form id="locForm" class="locsearch"><input id="locQ" placeholder="${loc ? 'Change town or city' : 'Search your town or city'}" maxlength="60" autocomplete="off"><button class="btn primary sm">Search</button></form>
        <div id="locResults" class="results">${places.map((pl, i) => `<button class="result" data-act="setloc" data-i="${i}">${icon('pin', 16)} ${esc(pl.name)}</button>`).join('')}</div>
        <button class="btn ghost sm" data-act="myloc">${icon('pin', 16)} Use my location</button>
        <p class="muted small">Forecasts come from Open-Meteo, a free weather service. Only your town’s rough coordinates are sent. Your place also tells the app when your winter is, so feeding eases off then.</p>
      </div></section>
    <section class="room"><header><h2 class="serif">Plant ID from photos</h2></header>
      <div class="card form">
        <label>Anthropic API key<input id="setKey" type="password" autocomplete="off" spellcheck="false" placeholder="${getKey() ? 'Saved. Paste a new key to replace it.' : 'sk-ant-…'}"></label>
        <p class="muted small">Photos you add with “Photo” are sent to Anthropic’s Claude to identify the plant, costing a few cents each on your API account. The key stays in this browser and is never included in backups or exports.</p>
        ${getKey() ? '<button class="btn ghost sm" data-act="forgetkey">Remove key</button>' : ''}
      </div></section>
    <section class="room"><header><h2 class="serif">Your data</h2><span class="muted small">${Math.ceil((used * 2) / 1024)} KB used</span></header>
      <p class="muted small">Everything is stored only in this browser on this device. Back up now and then.</p>
      <div class="stack">
        <button class="btn primary" data-act="backup">${icon('download', 16)} Back up everything (JSON)</button>
        <p class="muted small">${getMark(BACKUP_AT) ? `Last backup on this device: ${esc(getMark(BACKUP_AT))}.` : 'No backup from this device yet.'} Keep the file off this phone (iCloud Drive, Google Drive or email) so a lost phone doesn’t lose your plants. On Android the backup is saved as a .txt file; it restores the same way.</p>
        <button class="btn ghost" data-act="restore">Restore from backup…</button>
        <button class="btn outline" data-act="csv">${icon('download', 16)} Export care log (CSV, for spreadsheets)</button>
      </div></section>`;
  }

  function render() {
    const tab = view.tab;
    const key = tab + (view.plantId || '') + (view.guide || '');
    app.innerHTML = tab === 'plants' ? plantsView() : tab === 'sick' ? sickView() : tab === 'more' ? moreView() : todayView();
    app.classList.toggle('enter', key !== lastView); // entrance motion only when the screen changes
    lastView = key;
    const t = (id, ic, label) => `<button data-act="tab" data-tab="${id}" aria-label="${label}" class="${tab === id ? 'on' : ''}" ${tab === id ? 'aria-current="page"' : ''}>${icon(ic, 20)}<span>${label}</span></button>`;
    const nSick = state.plants.filter((p) => p.sick).length;
    tabs.innerHTML = t('today', 'home', 'Today') + t('plants', 'leaf', 'Plants') + t('sick', 'cross', 'Sick bay') + t('more', 'gear', 'Settings');
    if (nSick) tabs.querySelector('[data-tab=sick]').insertAdjacentHTML('beforeend', `<em class="count" aria-hidden="true">${nSick}</em>`);
    tabs.querySelector('[data-tab=sick]').setAttribute('aria-label', nSick ? `Sick bay, ${nSick} plant${s(nSick)}` : 'Sick bay');
    if (tab === 'more') {
      document.getElementById('setName').onchange = (e) => { state.settings.name = e.target.value.trim(); save(); };
      document.getElementById('setKey').onchange = (e) => {
        const k = e.target.value.trim();
        if (!k) return;
        try { localStorage.setItem(API_KEY, k); } catch (err) { return alert('This browser is blocking storage, so the key could not be saved.'); }
        render();
      };
      document.getElementById('locForm').onsubmit = async (e) => {
        e.preventDefault();
        const q = document.getElementById('locQ').value.trim();
        if (q.length < 2) return;
        const box = document.getElementById('locResults');
        box.innerHTML = '<p class="muted small">Searching…</p>';
        try { places = await searchPlaces(q); } catch (err) { places = []; box.innerHTML = '<p class="muted small">Search failed. Check your connection and try again.</p>'; return; }
        render();
        if (!places.length) document.getElementById('locResults').innerHTML = '<p class="muted small">No places found. Try a nearby larger town.</p>';
      };
    }
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || dialog.contains(b)) return;
    const card = b.dataset.act === 'log' && b.closest('.task');
    if (card && !reduceMotion.matches) {
      // Let the card finish its "done" animation before the list redraws.
      card.classList.add('leaving');
      setTimeout(() => act(b.dataset.act, b.dataset), 320);
      return;
    }
    act(b.dataset.act, b.dataset);
  });
  // Chat: send with the button or Enter (Shift+Enter for a new line).
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form.composer');
    if (!f) return;
    e.preventDefault();
    sendChat(f.dataset.chat, f.querySelector('textarea').value);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.matches('form.composer textarea')) {
      e.preventDefault();
      e.target.form.requestSubmit();
    }
  });
  document.addEventListener('input', (e) => {
    if (!e.target.matches('form.composer textarea')) return;
    chatOf(e.target.form.dataset.chat).draft = e.target.value; // survives screen redraws
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  });

  // Another tab changed the data: reload so this tab doesn't overwrite it.
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); render(); } });

  render();
})();
