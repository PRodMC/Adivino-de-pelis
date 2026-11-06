/* Pruebas del recomendador. Sin framework: node tests/recommender.test.js */
'use strict';

var assert = require('assert');
var path = require('path');
var R = require('../src/app/recommender');

var passed = 0;
var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
function ids(list) { return list.map(function (x) { return x.id; }); }

// ---------- catálogo de prueba ----------
var n = 0;
function mk(o) {
  n++;
  return {
    id: o.id || 'x' + n, title: o.title || 'Título ' + String(n).padStart(3, '0'),
    type: o.type || 'movie', year: o.year || 2020, durationMin: o.dur || 100, rating: o.rating || 7,
    popularity: 10, moods: o.moods || ['reir'], tags: o.tags || ['comedia'], attention: o.attention || 'low',
    audience: o.audience || ['solo', 'amigos'], source: o.source || (o.platforms ? o.platforms[0] : 'netflix'),
    platforms: o.platforms || ['netflix']
  };
}

var FIX = [
  mk({ id: 'a1', title: 'Aa risa', moods: ['reir'], tags: ['comedia', 'familia'], audience: ['solo', 'familia'], dur: 90 }),
  mk({ id: 'a2', title: 'Ab risa', moods: ['reir'], tags: ['comedia', 'sitcom'], type: 'series', dur: 25 }),
  mk({ id: 'a3', title: 'Ac acción', moods: ['adrenalina'], tags: ['acción', 'crimen'], attention: 'high', dur: 130 }),
  mk({ id: 'a4', title: 'Ad miedo', moods: ['miedito'], tags: ['terror'], attention: 'high', dur: 95, platforms: ['max'] }),
  mk({ id: 'a5', title: 'Ae drama', moods: ['emocionarme'], tags: ['drama', 'romance'], attention: 'high', audience: ['solo', 'pareja'], platforms: ['max'] }),
  mk({ id: 'a6', title: 'Af pensar', moods: ['pensar'], tags: ['ciencia ficción', 'misterio'], attention: 'high', year: 1999, dur: 140, platforms: ['prime'] }),
  mk({ id: 'a7', title: 'Ag risa vieja', moods: ['reir'], tags: ['comedia'], year: 1995, platforms: ['disney'], audience: ['solo', 'familia'] }),
  mk({ id: 'a8', title: 'Ah serie miedo', moods: ['miedito', 'pensar'], tags: ['terror', 'misterio'], type: 'series', dur: 50, platforms: ['netflix'] }),
  mk({ id: 't1', title: 'Ta risa TP', moods: ['reir'], tags: ['comedia'], source: 'totalplay', platforms: [], audience: ['solo', 'familia'] }),
  mk({ id: 't2', title: 'Tb acción TP', moods: ['adrenalina'], tags: ['acción'], source: 'totalplay', platforms: ['netflix'], attention: 'high' }),
  mk({ id: 't3', title: 'Tc drama TP', moods: ['emocionarme'], tags: ['drama'], source: 'totalplay', platforms: [], attention: 'high' }),
  mk({ id: 't4', title: 'Td miedo TP', moods: ['miedito'], tags: ['terror', 'suspenso'], source: 'totalplay', platforms: [], type: 'series', dur: 40 }),
  mk({ id: 't5', title: 'Te pensar TP', moods: ['pensar'], tags: ['documental'], source: 'totalplay', platforms: [], dur: 44 })
];
var ALL_SUBS = ['netflix', 'max', 'prime', 'disney'];

// ---------- filtros duros ----------
console.log('Filtros duros');
test('tipo: solo películas si Q2 = Película', function () {
  var r = R.recommend({ type: 'movie', time: 'any' }, ALL_SUBS, FIX);
  r.platforms.concat(r.totalplay).forEach(function (it) { assert.strictEqual(it.type, 'movie', it.id); });
});
test('tipo: solo series si Q2 = Serie (aunque se relaje todo)', function () {
  var r = R.recommend({ type: 'series', time: 'short', attention: 'high', novelty: 'classic' }, ALL_SUBS, FIX);
  r.platforms.concat(r.totalplay).forEach(function (it) { assert.strictEqual(it.type, 'series', it.id); });
});
test('familia: nunca regresa contenido sin "familia"', function () {
  var r = R.recommend({ type: 'any', time: 'any', audience: 'familia', mood: 'miedito' }, ALL_SUBS, FIX);
  r.platforms.concat(r.totalplay).forEach(function (it) { assert.ok(it.audience.indexOf('familia') !== -1, it.id); });
});
test('duración: los ≤ 45 min van primero; los más largos solo completan el carrusel', function () {
  var cat = FIX.concat([
    mk({ id: 's1', type: 'series', dur: 30 }), mk({ id: 's2', type: 'series', dur: 22 }), mk({ id: 's3', type: 'series', dur: 45 })
  ]);
  var r = R.recommend({ type: 'series', time: 'short' }, ['netflix'], cat);
  assert.strictEqual(r.relaxLevel.platforms, 0, 'no debió relajar Q1');
  var seenLong = false;
  r.platforms.forEach(function (it) {
    if (it.durationMin > 45) seenLong = true;
    else assert.ok(!seenLong, it.id + ' (≤ 45) quedó detrás de uno más largo');
  });
});
test('con suficientes resultados estrictos no se relaja ningún filtro', function () {
  var big = [];
  for (var i = 0; i < 10; i++) big.push(mk({ type: 'series', dur: 30, attention: 'high', year: 2020 }));
  big.push(mk({ id: 'largo', type: 'series', dur: 60, attention: 'high', year: 2020 }));
  var r = R.recommend({ type: 'series', time: 'short', attention: 'high' }, ['netflix'], big);
  assert.strictEqual(r.platforms.length, 8);
  assert.ok(ids(r.platforms).indexOf('largo') === -1);
});
test('plataforma: nunca regresa contenido de una plataforma no seleccionada', function () {
  var r = R.recommend({ type: 'any', time: 'any', mood: 'miedito' }, ['max'], FIX);
  assert.ok(r.platforms.length > 0);
  r.platforms.forEach(function (it) { assert.ok(it.platforms.indexOf('max') !== -1, it.id); });
});
test('totalplay: el carrusel 2 solo trae source totalplay y no repite el carrusel 1', function () {
  var r = R.recommend({ type: 'any', time: 'any', mood: 'adrenalina' }, ['netflix'], FIX);
  var c1 = ids(r.platforms);
  r.totalplay.forEach(function (it) {
    assert.strictEqual(it.source, 'totalplay');
    assert.ok(c1.indexOf(it.id) === -1, 'duplicado ' + it.id);
  });
});
test('sin duplicados dentro de un carrusel y máximo 8', function () {
  var big = [];
  for (var i = 0; i < 30; i++) big.push(mk({ platforms: ['netflix'] }));
  var r = R.recommend({ type: 'movie', time: 'any' }, ['netflix'], big);
  assert.strictEqual(r.platforms.length, 8);
  var u = {}; r.platforms.forEach(function (it) { assert.ok(!u[it.id]); u[it.id] = 1; });
});

// ---------- orden ----------
console.log('Orden');
test('el mood de Q4 pesa más que lo demás', function () {
  var r = R.recommend({ type: 'any', time: 'any', mood: 'miedito', attention: 'low' }, ALL_SUBS, FIX);
  assert.strictEqual(r.platforms[0].moods[0], 'miedito');
});
test('sin niños, lo familiar queda detrás de lo demás con el mismo ánimo', function () {
  var cat = [mk({ id: 'kid', title: 'A kids', moods: ['adrenalina'], tags: ['animación', 'familia'], rating: 9 }),
    mk({ id: 'adult', title: 'Z adult', moods: ['adrenalina'], tags: ['acción'], rating: 7 })];
  var r = R.recommend({ type: 'movie', time: 'any', mood: 'adrenalina', audience: 'pareja' }, ['netflix'], cat);
  assert.deepStrictEqual(ids(r.platforms), ['adult', 'kid']);
  var f = R.recommend({ type: 'movie', time: 'any', mood: 'adrenalina', audience: 'solo' }, ['netflix'], cat);
  assert.strictEqual(f.platforms[0].id, 'adult');
});
test('desempate estable por título', function () {
  var cat = [mk({ id: 'z', title: 'Zeta' }), mk({ id: 'b', title: 'Beta' }), mk({ id: 'a', title: 'Alfa' })];
  var r = R.recommend({ type: 'movie', time: 'any' }, ['netflix'], cat);
  assert.deepStrictEqual(ids(r.platforms), ['a', 'b', 'z']);
  var r2 = R.recommend({ type: 'movie', time: 'any' }, ['netflix'], cat.slice().reverse());
  assert.deepStrictEqual(ids(r2.platforms), ['a', 'b', 'z']);
});

// ---------- fallback ----------
console.log('Fallback');
test('relaja Q6 -> Q3 y al final da un margen acotado de duración cuando hay < 3', function () {
  // Solo existe 1 serie "nueva y de atención alta y corta" en netflix: debe relajar hasta tener ≥ 3.
  var cat = [
    mk({ id: 'f1', type: 'series', dur: 30, attention: 'high', year: 2024 }),
    mk({ id: 'f2', type: 'series', dur: 30, attention: 'low', year: 2010 }),
    mk({ id: 'f3', type: 'series', dur: 60, attention: 'low', year: 2010 }),
    mk({ id: 'f4', type: 'movie', dur: 30, attention: 'high', year: 2024 })
  ];
  var r = R.recommend({ type: 'series', time: 'short', attention: 'high', novelty: 'new' }, ['netflix'], cat);
  assert.strictEqual(r.relaxLevel.platforms, 5);
  assert.deepStrictEqual(ids(r.platforms).sort(), ['f1', 'f2', 'f3']);
  assert.strictEqual(r.platforms[0].id, 'f1', 'el que cumple todo va primero');
});
test('el ánimo de Q4 se respeta mientras haya al menos 3 títulos con ese ánimo', function () {
  var cat = [];
  for (var i = 0; i < 4; i++) cat.push(mk({ moods: ['miedito'], tags: ['terror'], attention: 'low' }));
  for (var j = 0; j < 6; j++) cat.push(mk({ moods: ['reir'], tags: ['comedia'], attention: 'high', rating: 9 }));
  var r = R.recommend({ type: 'movie', time: 'any', mood: 'miedito', attention: 'high' }, ['netflix'], cat);
  assert.strictEqual(r.platforms.length, 4, 'no debe rellenar con otro ánimo');
  r.platforms.forEach(function (it) { assert.ok(it.moods.indexOf('miedito') !== -1, it.id); });
});
test('"Algo recién salido" no se rellena con títulos viejos (ni "clásico" con estrenos)', function () {
  var cat = [];
  for (var i = 0; i < 3; i++) cat.push(mk({ year: 2025 }));
  for (var j = 0; j < 6; j++) cat.push(mk({ year: 1999, rating: 9 }));
  var r = R.recommend({ type: 'movie', time: 'any', mood: 'reir', novelty: 'new' }, ['netflix'], cat);
  r.platforms.forEach(function (it) { assert.strictEqual(it.year, 2025, it.id); });
  var c = R.recommend({ type: 'movie', time: 'any', mood: 'reir', novelty: 'classic' }, ['netflix'], cat);
  c.platforms.forEach(function (it) { assert.strictEqual(it.year, 1999, it.id); });
});
test('la duración nunca se relaja más allá del margen (normal <= 150, ratito <= 100)', function () {
  var cat = [mk({ id: 'l1', dur: 200 }), mk({ id: 'l2', dur: 180 }), mk({ id: 'n1', dur: 120 }), mk({ id: 'n2', dur: 149 })];
  var r = R.recommend({ type: 'movie', time: 'normal', mood: 'reir' }, ['netflix'], cat);
  assert.deepStrictEqual(ids(r.platforms).sort(), ['n1', 'n2']);
  var r2 = R.recommend({ type: 'movie', time: 'short' }, ['netflix'], cat);
  assert.deepStrictEqual(r2.platforms, []);
});
test('"Ninguna plataforma": sin carrusel de plataformas, solo Totalplay', function () {
  var r = R.recommend({ type: 'any', time: 'any', mood: 'reir' }, [], FIX);
  assert.deepStrictEqual(r.platforms, []);
  assert.ok(r.totalplay.length > 0);
  r.totalplay.forEach(function (it) { assert.strictEqual(it.source, 'totalplay'); });
  var c = R.pickCheckpointCovers({ type: 'any', time: 'any' }, [], FIX, [], []);
  c.forEach(function (it) { assert.strictEqual(it.source, 'totalplay', it.id); });
});
test('C2 respeta el ánimo elegido en Q4 cuando hay suficientes portadas', function () {
  var c = R.pickCheckpointCovers({ type: 'any', time: 'any', mood: 'miedito' }, ALL_SUBS, FIX, [], []);
  assert.strictEqual(c.length, 3);
  c.forEach(function (it) { assert.ok(it.moods.indexOf('miedito') !== -1, it.id + ' ' + it.moods); });
});
test('conserva tipo + familia + plataforma al relajar', function () {
  var r = R.recommend({ type: 'movie', time: 'short', attention: 'high', novelty: 'new', audience: 'familia' }, ['disney'], FIX);
  r.platforms.forEach(function (it) {
    assert.strictEqual(it.type, 'movie');
    assert.ok(it.audience.indexOf('familia') !== -1);
    assert.ok(it.platforms.indexOf('disney') !== -1);
  });
});
test('carrusel vacío regresa [] sin romper', function () {
  var r = R.recommend({ type: 'series', time: 'any' }, ['appletv'], FIX);
  assert.deepStrictEqual(r.platforms, []);
});

// ---------- checkpoints ----------
console.log('Checkpoints');
test('3 portadas diversas (moods principales distintos en C1)', function () {
  var c = R.pickCheckpointCovers({ time: 'any', type: 'any' }, ALL_SUBS, FIX, [], []);
  assert.strictEqual(c.length, 3);
  var moods = c.map(function (x) { return x.moods[0]; });
  assert.strictEqual(new Set(moods).size, 3, moods.join(','));
});
test('las portadas respetan tipo y duración', function () {
  var c = R.pickCheckpointCovers({ time: 'normal', type: 'movie' }, ALL_SUBS, FIX, [], []);
  c.forEach(function (it) { assert.strictEqual(it.type, 'movie'); assert.ok(it.durationMin <= 135); });
});
test('las portadas salen de plataformas elegidas o Totalplay', function () {
  var c = R.pickCheckpointCovers({ time: 'any', type: 'any' }, ['max'], FIX, [], []);
  c.forEach(function (it) { assert.ok(it.source === 'totalplay' || it.platforms.indexOf('max') !== -1, it.id); });
});
test('C2 no repite portadas de C1', function () {
  var c1 = R.pickCheckpointCovers({ time: 'any', type: 'any' }, ALL_SUBS, FIX, [], []);
  var seen = ids(c1);
  var fb = [{ shown: seen, picked: seen[0] }];
  var c2 = R.pickCheckpointCovers({ time: 'any', type: 'any', attention: 'high', mood: 'reir' }, ALL_SUBS, FIX, seen, fb);
  assert.strictEqual(c2.length, 3);
  c2.forEach(function (it) { assert.ok(seen.indexOf(it.id) === -1, 'repetida ' + it.id); });
});
test('"Ninguna" cambia el perfil de C2 (evita los moods rechazados)', function () {
  var c1 = R.pickCheckpointCovers({ time: 'any', type: 'any' }, ALL_SUBS, FIX, [], []);
  var rejected = c1.map(function (x) { return x.moods[0]; });
  var c2 = R.pickCheckpointCovers({ time: 'any', type: 'any' }, ALL_SUBS, FIX, ids(c1), [{ shown: ids(c1), picked: null }]);
  assert.ok(rejected.indexOf(c2[0].moods[0]) === -1, 'la primera de C2 repite perfil: ' + c2[0].moods[0]);
});

// ---------- retroalimentación ----------
console.log('Retroalimentación');
test('elegir una portada sube contenido parecido', function () {
  var a = { type: 'any', time: 'any' };
  var base = ids(R.recommend(a, ALL_SUBS, FIX).platforms);
  var withFb = ids(R.recommend(a, ALL_SUBS, FIX, [{ shown: ['a4', 'a5', 'a6'], picked: 'a4' }]).platforms);
  assert.ok(withFb.indexOf('a8') < base.indexOf('a8'), 'a8 (miedito) debe subir: ' + base + ' -> ' + withFb);
  assert.strictEqual(withFb[0], 'a4');
});
test('"Ninguna" baja el contenido parecido a lo mostrado', function () {
  var a = { type: 'any', time: 'any' };
  var base = ids(R.recommend(a, ALL_SUBS, FIX).platforms);
  var withFb = ids(R.recommend(a, ALL_SUBS, FIX, [{ shown: ['a1', 'a2', 'a7'], picked: null }]).platforms);
  assert.ok(withFb.indexOf('a1') > base.indexOf('a1'), 'a1 debe bajar: ' + base + ' -> ' + withFb);
});
test('el feedback elegido pesa más que Q3 y Q6', function () {
  var W = R._weights;
  assert.ok(W.fbPickMood > W.attention && W.fbPickMood > W.novelty);
});

// ---------- snapshot real ----------
console.log('Snapshot real (src/config/catalog.generated.js)');
global.window = {};
require(path.join('..', 'src/config/catalog.generated.js'));
var CAT = global.window.TP_CATALOG;
test('el snapshot tiene ~150 títulos y ninguno trae la key de TMDB', function () {
  assert.ok(CAT.items.length >= 120, CAT.items.length);
  var raw = JSON.stringify(CAT);
  assert.ok(raw.indexOf('api_key') === -1 && raw.indexOf('Bearer') === -1);
});
test('cualquier combinación respeta los filtros duros y nunca da plataformas no elegidas', function () {
  var opts = {
    time: ['short', 'normal', 'any'], type: ['movie', 'series', 'any'], attention: ['high', 'low'],
    mood: ['reir', 'emocionarme', 'adrenalina', 'pensar', 'miedito'], audience: ['solo', 'pareja', 'amigos', 'familia'],
    novelty: ['classic', 'new', 'any']
  };
  var subsSets = [[], ['netflix'], ['vix'], ['appletv', 'paramount'], ['netflix', 'max', 'prime', 'disney']];
  var count = 0;
  opts.time.forEach(function (time) { opts.type.forEach(function (type) { opts.attention.forEach(function (attention) {
    opts.mood.forEach(function (mood) { opts.audience.forEach(function (audience) { opts.novelty.forEach(function (novelty) {
      subsSets.forEach(function (subs) {
        var a = { time: time, type: type, attention: attention, mood: mood, audience: audience, novelty: novelty };
        var r = R.recommend(a, subs, CAT);
        r.platforms.forEach(function (it) {
          assert.ok(it.platforms.some(function (p) { return subs.indexOf(p) !== -1; }), 'plataforma ' + it.id);
        });
        r.platforms.concat(r.totalplay).forEach(function (it) {
          if (type !== 'any') assert.strictEqual(it.type, type);
          if (audience === 'familia') assert.ok(it.audience.indexOf('familia') !== -1);
        });
        r.totalplay.forEach(function (it) { assert.strictEqual(it.source, 'totalplay'); });
        var cap = { short: 100, normal: 150 }[time];
        r.platforms.concat(r.totalplay).forEach(function (it) {
          if (cap) assert.ok(it.durationMin <= cap, it.id + ' ' + it.durationMin + ' > ' + cap);
          if (audience === 'familia') assert.ok(/^(MX:(AA|A)|US:(G|PG|TV-Y|TV-Y7|TV-G))$/.test(it.certification), it.id + ' ' + it.certification);
        });
        count++;
      });
    }); }); }); }); });
  });
  assert.ok(count > 1000);
});
test('en el snapshot, con 4 plataformas el ánimo coincide en >= 90 % de los resultados', function () {
  var moods = ['reir', 'emocionarme', 'adrenalina', 'pensar', 'miedito'];
  var hit = 0; var total = 0;
  ['short', 'normal', 'any'].forEach(function (time) { ['movie', 'series', 'any'].forEach(function (type) {
    moods.forEach(function (mood) {
      var r = R.recommend({ time: time, type: type, mood: mood, attention: 'high', audience: 'solo', novelty: 'any' },
        ['netflix', 'max', 'prime', 'disney'], CAT);
      r.platforms.forEach(function (it) { total++; if (it.moods.indexOf(mood) !== -1) hit++; });
    });
  }); });
  assert.ok(hit / total >= 0.9, Math.round(100 * hit / total) + ' %');
});
test('en el snapshot, C1 y C2 dan 3 portadas diversas y distintas', function () {
  var c1 = R.pickCheckpointCovers({ time: 'normal', type: 'movie' }, ['netflix', 'max'], CAT, [], []);
  assert.strictEqual(c1.length, 3);
  for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) assert.ok(R.isDiverse(c1[i], c1[j]));
  var c2 = R.pickCheckpointCovers({ time: 'normal', type: 'movie', attention: 'high', mood: 'adrenalina' },
    ['netflix', 'max'], CAT, ids(c1), [{ shown: ids(c1), picked: null }]);
  assert.strictEqual(c2.length, 3);
  c2.forEach(function (it) { assert.ok(ids(c1).indexOf(it.id) === -1); });
});

console.log('\n' + passed + ' ok, ' + failed + ' fallaron');
process.exit(failed ? 1 : 0);
