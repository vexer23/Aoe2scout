// Scout logic: pure functions, no DOM. Works in browser and node.
(function (root) {
  const D = typeof module !== 'undefined' ? require('./civs.js') : root.CivData;
  const TEAM_LB = 'rm_team';
  const MIN_GAMES = 5;      // below this: flag thin data, no play-style claims
  const DECAY = 0.9;        // recent games weigh more

  function civInfo(id) { return D.CIVS[id] || D.UNKNOWN; }

  function findPlayer(match, profileId) {
    for (const team of match.teams || []) {
      for (const p of team.players || []) if (p.profileId === profileId) return { p, team: team.teamId };
    }
    return null;
  }

  // Newest-first list of finished Team RM matches (excluding the current one), max 10.
  function teamHistory(matches, excludeMatchId) {
    return (matches || [])
      .filter(m => m.leaderboardId === TEAM_LB && m.finished && m.matchId !== excludeMatchId)
      .slice(0, 10);
  }

  // Summarise one player's history: weighted civ frequency, army-type shares, win rate per civ.
  function profile(history, profileId) {
    const civs = {}, types = {};
    let n = 0, totalW = 0;
    history.forEach((m, i) => {
      const f = findPlayer(m, profileId);
      if (!f) return;
      const w = Math.pow(DECAY, i);
      const civ = f.p.civ;
      const c = civs[civ] || (civs[civ] = { games: 0, w: 0, wins: 0 });
      c.games++; c.w += w; if (f.p.won) c.wins++;
      const t = civInfo(civ).t;
      types[t] = (types[t] || 0) + w;
      totalW += w; n++;
    });
    return { n, civs, types, totalW };
  }

  function dominantType(pr) {
    let best = null, bw = 0;
    for (const [t, w] of Object.entries(pr.types)) if (w > bw) { best = t; bw = w; }
    if (!best || !pr.totalW) return null;
    const share = bw / pr.totalW;
    const count = Object.entries(pr.civs).reduce((s, [id, c]) => s + (civInfo(id).t === best ? c.games : 0), 0);
    return { type: best, share, count };
  }

  function mapInfo(mapId) { return D.MAPS[mapId] || null; }

  function tag(k, n) {
    if (n === 0) return { text: 'no data', thin: true };
    return n < MIN_GAMES ? { text: `thin data: ${n} game${n === 1 ? '' : 's'}`, thin: true }
                         : { text: `${k}/${n} games`, thin: false };
  }

  function opponentLine(p, pr, mapId) {
    const info = civInfo(p.civ);
    const k = pr.civs[p.civ] ? pr.civs[p.civ].games : 0;
    const tg = tag(k, pr.n);
    const lead = pr.n ? `${p.civName || p.civ} ${k}/${pr.n}` : (p.civName || p.civ);
    const parts = [`${lead}: ${info.u}, ${D.COUNTERS[info.t]}.`];
    const mi = mapInfo(mapId);
    if (info.r === 2 && (!mi || mi.open)) parts.push('Early pressure possible.');
    if (!tg.thin) {
      const d = dominantType(pr);
      if (d && d.share >= 0.5) parts.push(`Usually picks ${D.TYPE_NAME[d.type]} civs (${d.count}/${pr.n}).`);
      const c = pr.civs[p.civ];
      if (c && c.games >= 3) parts.push(`Wins ${c.wins}/${c.games} on this civ.`);
    }
    if (info.rough) parts.push('(civ notes rough)');
    return { role: 'opponent', name: p.name, civ: p.civName || p.civ, rating: p.rating, tag: tg, text: parts.join(' ') };
  }

  function teammateLine(p, pr) {
    const info = civInfo(p.civ);
    const k = pr.civs[p.civ] ? pr.civs[p.civ].games : 0;
    const tg = tag(k, pr.n);
    const lead = pr.n ? `Teammate ${p.civName || p.civ} ${k}/${pr.n}` : `Teammate ${p.civName || p.civ}`;
    const parts = [`${lead}: ${D.ROLES[info.t]}.`];
    if (!tg.thin) {
      const c = pr.civs[p.civ];
      if (c && c.games >= 3) parts.push(`${c.wins}/${c.games} wins on this civ.`);
    }
    if (info.rough) parts.push('(civ notes rough)');
    return { role: 'teammate', name: p.name, civ: p.civName || p.civ, rating: p.rating, tag: tg, text: parts.join(' ') };
  }

  // Which match to scout: the newest one the user is in (live if unfinished).
  function pickMatch(matches) {
    if (!matches || !matches.length) return null;
    const m = matches[0];
    return { match: m, live: !m.finished };
  }

  // Build scouting output. histories: { profileId: matches[] } (unfiltered).
  function scout(userId, match, histories) {
    const me = findPlayer(match, userId);
    if (!me) return { error: 'not_in_match' };
    const out = { opponents: [], teammates: [], map: match.mapName, mapId: match.map, mapNote: (mapInfo(match.map) || {}).note || null, mine: me.p.civName || me.p.civ };
    for (const team of match.teams) {
      for (const p of team.players) {
        if (p.profileId === userId) continue;
        const hist = teamHistory(histories[p.profileId] || [], match.matchId);
        const pr = profile(hist, p.profileId);
        const line = team.teamId === me.team ? teammateLine(p, pr) : opponentLine(p, pr, match.map);
        (line.role === 'opponent' ? out.opponents : out.teammates).push(line);
      }
    }
    return out;
  }

  const api = { scout, pickMatch, teamHistory, profile, opponentLine, teammateLine, findPlayer, MIN_GAMES };
  if (typeof module !== 'undefined') module.exports = api; else root.Scout = api;
})(typeof window !== 'undefined' ? window : globalThis);
