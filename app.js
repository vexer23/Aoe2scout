(function () {
  const DEFAULT_API = 'https://data.aoe2companion.com/api';
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  const state = { busy: false };
  const apiBase = () => (store.get('apiBase', '') || DEFAULT_API).replace(/\/+$/, '');

  class ScoutError extends Error { constructor(kind, msg) { super(msg); this.kind = kind; } }

  async function getJson(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    let res;
    try { res = await fetch(url, { signal: ctl.signal }); }
    catch (e) {
      throw new ScoutError('unreachable', 'Cannot reach the aoe2companion API. Check your connection, or set a proxy URL in Settings (CORS or blocked network).');
    } finally { clearTimeout(timer); }
    if (res.status === 429) throw new ScoutError('rate', 'Rate limited by the API. Wait a minute and try again.');
    if (res.status === 404) throw new ScoutError('notfound', 'Profile not found. Check the profile ID.');
    if (!res.ok) throw new ScoutError('http', `API error ${res.status}. Try again later.`);
    try { return await res.json(); }
    catch { throw new ScoutError('http', 'API returned unexpected data (not JSON).'); }
  }

  // Short cache so repeated presses do not hammer the API.
  const cache = new Map();
  async function matchesFor(pid) {
    const hit = cache.get(pid);
    if (hit && Date.now() - hit.t < 90000) return hit.v;
    const data = await getJson(`${apiBase()}/matches?profile_ids=${pid}&count=40`);
    const v = data.matches || [];
    cache.set(pid, { t: Date.now(), v });
    return v;
  }

  function status(msg, kind) {
    const el = $('status');
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
    el.hidden = !msg;
  }

  function lineEl(l) {
    const li = document.createElement('li');
    li.className = l.role;
    const head = document.createElement('div');
    head.className = 'head';
    const nm = document.createElement('span');
    nm.className = 'name';
    nm.textContent = `${l.name}${l.rating ? ' · ' + l.rating : ''}`;
    const chip = document.createElement('span');
    chip.className = 'chip' + (l.tag.thin ? ' thin' : '');
    chip.textContent = l.tag.text;
    head.append(nm, chip);
    const body = document.createElement('div');
    body.className = 'line';
    body.textContent = l.text;
    li.append(head, body);
    return li;
  }

  function render(res, live) {
    $('mapInfo').textContent = `${live ? 'LIVE' : 'Latest match'} · ${res.map}${res.mapNote ? ' (' + res.mapNote + ')' : ''} · you: ${res.mine}`;
    const fill = (ul, items) => { ul.replaceChildren(...items.map(lineEl)); };
    fill($('opps'), res.opponents);
    fill($('mates'), res.teammates);
    $('mateHead').hidden = !res.teammates.length;
    $('results').hidden = false;
  }

  async function run() {
    if (state.busy) return;
    const pid = parseInt($('profileId').value, 10);
    if (!pid) { status('Enter your profile ID first (Settings).', 'err'); return; }
    store.set('profileId', String(pid));
    state.busy = true;
    $('scoutBtn').disabled = true;
    $('scoutBtn').textContent = 'Scouting…';
    $('results').hidden = true;
    status('');
    try {
      const mine = await matchesFor(pid);
      const pick = Scout.pickMatch(mine);
      if (!pick) throw new ScoutError('nomatch', 'No matches found for this profile. It may be private, or you have not played yet.');
      const m = pick.match;
      const others = [];
      for (const t of m.teams) for (const p of t.players) if (p.profileId && p.profileId !== pid) others.push(p.profileId);
      const histories = { [pid]: mine };
      const settled = await Promise.allSettled(others.map(id => matchesFor(id).then(v => [id, v])));
      let failed = 0, rateHit = false;
      settled.forEach(r => {
        if (r.status === 'fulfilled') histories[r.value[0]] = r.value[1];
        else { failed++; if (r.reason && r.reason.kind === 'rate') rateHit = true; }
      });
      if (failed === settled.length && settled.length) throw settled[0].reason;
      const res = Scout.scout(pid, m, histories);
      if (res.error) throw new ScoutError('nomatch', 'You are not listed in the latest match.');
      render(res, pick.live);
      const notes = [];
      if (!pick.live) notes.push('No live match found: showing your latest finished match.');
      if (failed) notes.push(`${failed} player(s) could not be loaded${rateHit ? ' (rate limited)' : ' (private profile or error)'}; their lines show thin data.`);
      status(notes.join(' '), notes.length ? 'warn' : '');
    } catch (e) {
      status(e && e.message ? e.message : 'Something went wrong.', 'err');
      $('diag').textContent = String(e && e.stack || e);
    } finally {
      state.busy = false;
      $('scoutBtn').disabled = false;
      $('scoutBtn').textContent = 'Scout match';
    }
  }

  function init() {
    $('profileId').value = store.get('profileId', '6560794');
    $('apiBase').value = store.get('apiBase', '');
    $('scoutBtn').addEventListener('click', run);
    $('saveSettings').addEventListener('click', () => {
      store.set('profileId', $('profileId').value.trim());
      store.set('apiBase', $('apiBase').value.trim());
      cache.clear();
      status('Saved.', '');
      setTimeout(() => status(''), 1500);
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  init();
})();
