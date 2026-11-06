/* Recomendador: funciones puras, sin DOM ni red. Corre en el STB (TP.recommender) y en Node (tests).
 *
 * answers:       { time, type, attention, mood, audience, novelty } (valores de config/questions.js)
 * subscriptions: ['netflix', 'max', ...]
 * catalog:       Item[] o { items: Item[] }
 * feedback:      [{ shown: [id, id, id], picked: id | null }]  (checkpoints C1/C2)
 */
(function (root) {
  var MAX_PER_CAROUSEL = 8;
  var MIN_RESULTS = 3;
  // Duración máxima: filtro duro, nunca se relaja (si no te da tiempo de verla completa, no sale).
  var DURATION_MAX = { short: 45, normal: 135 };

  // Pesos (Q4 > feedback elegido > Q3 = Q6 > Q5)
  var W = {
    moodPrimary: 10, moodSecondary: 6,
    attention: 3, novelty: 3, audience: 2, rating: 0.2, familyForAdults: -4,
    fbPickMood: 5, fbPickTag: 1.5, fbPickAudience: 1,
    fbNoneMood: -2, fbNoneTag: -0.5
  };

  function itemsOf(catalog) { return (catalog && catalog.items) ? catalog.items : (catalog || []); }
  function has(arr, v) { return !!arr && arr.indexOf(v) !== -1; }
  function shared(a, b) {
    var n = 0;
    for (var i = 0; i < (a || []).length; i++) if (has(b, a[i])) n++;
    return n;
  }
  function indexById(items) {
    var map = {};
    for (var i = 0; i < items.length; i++) map[items[i].id] = items[i];
    return map;
  }
  function refYear(items) {
    var y = 0;
    for (var i = 0; i < items.length; i++) if (items[i].year > y) y = items[i].year;
    return y;
  }

  // ---------- filtros ----------
  function passType(item, a) { return !a.type || a.type === 'any' || item.type === a.type; }
  function passFamily(item, a) { return a.audience !== 'familia' || has(item.audience, 'familia'); }
  function passDuration(item, a) {
    var max = DURATION_MAX[a.time];
    return !max || item.durationMin <= max;
  }
  function passMood(item, a) { return !a.mood || has(item.moods, a.mood); }
  function passAttention(item, a) { return !a.attention || item.attention === a.attention; }
  // strict: lo que pide la respuesta; loose: rango cercano para completar el carrusel.
  function passNovelty(item, a, ref, loose) {
    var age = ref - item.year;
    if (a.novelty === 'classic') return !!item.year && (loose ? age >= 8 : (age >= 15 || (age >= 8 && item.rating >= 7.5)));
    if (a.novelty === 'new') return !!item.year && age <= (loose ? 5 : 2);
    return true;
  }
  function onSubscriptions(item, subs) { return shared(item.platforms, subs) > 0; }

  // Niveles de fallback. Tipo, familia, plataforma y duración nunca se relajan.
  // `fill`: el nivel completa hasta 8 (siempre con el ánimo de Q4 y la novedad de Q6 al menos
  // en su rango cercano); los demás solo entran para llegar al mínimo de 3.
  var LEVELS = [
    { mood: true, attention: true, novelty: 'strict', fill: true },
    { mood: true, attention: true, novelty: 'loose', fill: true },
    { mood: true, attention: false, novelty: 'loose', fill: true },
    { mood: true, attention: false, novelty: false, fill: false },
    { mood: false, attention: false, novelty: false, fill: false }
  ];

  function passLevel(item, a, level, ref) {
    if (!passType(item, a) || !passFamily(item, a)) return false;
    if (!passDuration(item, a)) return false;
    if (level.mood && !passMood(item, a)) return false;
    if (level.attention && !passAttention(item, a)) return false;
    if (level.novelty && !passNovelty(item, a, ref, level.novelty === 'loose')) return false;
    return true;
  }

  // ---------- puntaje ----------
  function feedbackScore(item, feedback, byId) {
    var s = 0;
    for (var i = 0; i < (feedback || []).length; i++) {
      var fb = feedback[i];
      if (fb.picked) {
        var p = byId[fb.picked];
        if (!p) continue;
        s += W.fbPickMood * shared(item.moods, p.moods);
        s += W.fbPickTag * Math.min(3, shared(item.tags, p.tags));
        s += W.fbPickAudience * shared(without(item.audience, 'solo'), p.audience);
      } else {
        for (var j = 0; j < (fb.shown || []).length; j++) {
          var sh = byId[fb.shown[j]];
          if (!sh) continue;
          s += W.fbNoneMood * shared(item.moods, sh.moods);
          s += W.fbNoneTag * Math.min(3, shared(item.tags, sh.tags));
        }
      }
    }
    return s;
  }
  function without(arr, v) {
    var out = [];
    for (var i = 0; i < (arr || []).length; i++) if (arr[i] !== v) out.push(arr[i]);
    return out;
  }

  function score(item, a, feedback, byId, ref) {
    var s = 0;
    if (a.mood) {
      if (item.moods[0] === a.mood) s += W.moodPrimary;
      else if (has(item.moods, a.mood)) s += W.moodSecondary;
    }
    if (a.attention && item.attention === a.attention) s += W.attention;
    if (a.audience && a.audience !== 'familia' && has(item.audience, a.audience)) s += W.audience;
    // Sin niños, lo infantil/familiar baja (TMDB marca mucha animación como "aventura").
    if (a.audience && a.audience !== 'familia' && (has(item.tags, 'familia') || has(item.tags, 'kids'))) s += W.familyForAdults;
    if (a.novelty === 'classic' && item.year) {
      if (ref - item.year >= 15) s += W.novelty;
      else if (ref - item.year >= 8) s += W.novelty / 2;
    } else if (a.novelty === 'new' && item.year) {
      if (ref - item.year <= 2) s += W.novelty;
      else if (ref - item.year <= 4) s += W.novelty / 2;
    }
    // "Un ratito": entre dos opciones, la más corta va primero.
    if (a.time === 'short') s -= (item.durationMin || 0) / 60;
    s += W.rating * (item.rating || 0);
    s += feedbackScore(item, feedback, byId);
    return s;
  }

  function byTitle(x, y) {
    var t = String(x.title).localeCompare(String(y.title), 'es');
    if (t) return t;
    return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
  }

  function rank(pool, a, feedback, byId, ref, extra) {
    var scored = [];
    for (var i = 0; i < pool.length; i++) {
      var it = pool[i];
      scored.push({ item: it, s: score(it, a, feedback, byId, ref) + (extra ? extra(it) : 0) });
    }
    scored.sort(function (x, y) {
      if (y.s !== x.s) return y.s - x.s;
      return byTitle(x.item, y.item);
    });
    var out = [];
    for (var k = 0; k < scored.length; k++) out.push(scored[k].item);
    return out;
  }

  // Relaja nivel por nivel (level = nivel donde se llegó a 3). Los niveles `fill` completan hasta
  // `max`, siempre detrás de los que cumplen más filtros; los de último recurso solo llegan a 3.
  function carousel(items, a, feedback, byId, ref, inPool, max) {
    var out = [];
    var taken = {};
    var level = LEVELS.length - 1;
    for (var l = 0; l < LEVELS.length; l++) {
      var cap = LEVELS[l].fill ? max : Math.max(out.length, MIN_RESULTS);
      if (out.length >= cap) continue;
      var pool = [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!taken[it.id] && inPool(it) && passLevel(it, a, LEVELS[l], ref)) pool.push(it);
      }
      var ranked = rank(pool, a, feedback, byId, ref);
      for (var k = 0; k < ranked.length && out.length < cap; k++) {
        out.push(ranked[k]);
        taken[ranked[k].id] = 1;
      }
      if (out.length >= MIN_RESULTS && level === LEVELS.length - 1) level = l;
    }
    return { items: out, level: level };
  }

  function recommend(answers, subscriptions, catalog, feedback, opts) {
    var items = itemsOf(catalog);
    var a = answers || {};
    var subs = subscriptions || [];
    var max = (opts && opts.max) || MAX_PER_CAROUSEL;
    var byId = indexById(items);
    var ref = refYear(items);

    var c1 = carousel(items, a, feedback, byId, ref, function (it) { return onSubscriptions(it, subs); }, max);
    var used = {};
    for (var i = 0; i < c1.items.length; i++) used[c1.items[i].id] = 1;
    var c2 = carousel(items, a, feedback, byId, ref, function (it) {
      return it.source === 'totalplay' && !used[it.id];
    }, max);

    return { platforms: c1.items, totalplay: c2.items, relaxLevel: { platforms: c1.level, totalplay: c2.level } };
  }

  // ---------- portadas de checkpoint ----------
  function diverse(x, y) {
    return x.moods[0] !== y.moods[0] || shared(x.tags, y.tags) <= 1;
  }

  function pickCheckpointCovers(answersSoFar, subscriptions, catalog, seenIds, feedback) {
    var items = itemsOf(catalog);
    var a = answersSoFar || {};
    var subs = subscriptions || [];
    var seen = {};
    var i;
    for (i = 0; i < (seenIds || []).length; i++) seen[seenIds[i]] = 1;
    var byId = indexById(items);
    var ref = refYear(items);

    // Tipo, duración y familia nunca se relajan: si no alcanza, se muestran menos de 3 portadas.
    function eligible(useMood) {
      var out = [];
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        if (seen[it.id]) continue;
        if (!(it.source === 'totalplay' || onSubscriptions(it, subs))) continue;
        if (!passType(it, a) || !passFamily(it, a)) continue;
        if (!passDuration(it, a)) continue;
        if (useMood && !passMood(it, a)) continue;
        out.push(it);
      }
      return out;
    }
    var pool = eligible(true);
    if (pool.length < 3) pool = eligible(false);

    // Tras "Ninguna": además de la penalización por moods/tags, se evita el mismo mood principal.
    var rejected = {};
    for (i = 0; i < (feedback || []).length; i++) {
      if (feedback[i].picked) continue;
      for (var j = 0; j < (feedback[i].shown || []).length; j++) {
        var sh = byId[feedback[i].shown[j]];
        if (sh) rejected[sh.moods[0]] = 1;
      }
    }
    var ranked = rank(pool, a, feedback, byId, ref, function (it) {
      return (rejected[it.moods[0]] ? -4 : 0) + Math.log(1 + (it.popularity || 0)) * 0.5;
    });

    var picked = [];
    function isTotalplay(it) { return it.source === 'totalplay'; }
    function fits(it, strict) {
      for (var p = 0; p < picked.length; p++) {
        if (picked[p].id === it.id) return false;
        if (strict ? picked[p].moods[0] === it.moods[0] : !diverse(picked[p], it)) return false;
      }
      return true;
    }
    function wantsKind() {
      // Para el 3er lugar, si las 2 primeras salen del mismo origen, intenta mezclar.
      if (picked.length !== 2) return null;
      var tp = isTotalplay(picked[0]);
      return tp === isTotalplay(picked[1]) ? !tp : null;
    }
    var passes = [true, false];
    for (var ps = 0; ps < passes.length && picked.length < 3; ps++) {
      for (var r = 0; r < ranked.length && picked.length < 3; r++) {
        var want = wantsKind();
        if (want !== null) {
          var alt = null;
          for (var q = r; q < ranked.length; q++) {
            if (isTotalplay(ranked[q]) === want && fits(ranked[q], passes[ps])) { alt = ranked[q]; break; }
          }
          if (alt) { picked.push(alt); continue; }
        }
        if (fits(ranked[r], passes[ps])) picked.push(ranked[r]);
      }
    }
    // Último recurso: completa sin diversidad (catálogo muy chico).
    for (var z = 0; z < ranked.length && picked.length < 3; z++) {
      if (picked.indexOf(ranked[z]) === -1) picked.push(ranked[z]);
    }
    return picked;
  }

  var api = {
    recommend: recommend,
    pickCheckpointCovers: pickCheckpointCovers,
    isDiverse: diverse,
    _weights: W,
    _levels: LEVELS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.TP = root.TP || {}; root.TP.recommender = api; }
})(this);
