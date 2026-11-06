#!/usr/bin/env node
/* Genera src/config/catalog.generated.js a partir de TMDB (API v3).
 * SOLO DESARROLLO: no se despliega al STB. El STB nunca llama a TMDB.
 *
 * Requisitos: Node >= 18 (usa fetch global). Sin dependencias.
 * Credenciales en .env (nunca en el repo): TMDB_READ_TOKEN (v4, Bearer) o TMDB_API_KEY (v3).
 * Uso:   node tools/build-catalog.js
 * Opc.:  POSTER_MODE=local node tools/build-catalog.js   (descarga los w342 a posters/)
 */
'use strict';

var fs = require('fs');
var path = require('path');
var TAX = require('./taxonomy');
var PLATFORMS = require('../src/config/platforms');

var ROOT = path.join(__dirname, '..');
var OUT_FILE = path.join(ROOT, 'src/config/catalog.generated.js');
var CSV_FILE = path.join(ROOT, 'src/config/totalplay-titles.csv');
var REPORT_FILE = path.join(__dirname, 'totalplay-report.txt');
var POSTER_DIR = path.join(ROOT, 'posters');

var API = 'https://api.themoviedb.org/3';
var LANG = 'es-MX';
var REGION = 'MX';
var PER_TYPE = 40;          // ~80 títulos, 50/50
var DEMO_TOTALPLAY = 20;    // subconjunto SIMULADO si no hay CSV
var PAUSE_MS = 260;
var POSTER_SIZE = 'w342';
var SYNOPSIS_MAX = 140;

// ---------- credenciales ----------
function loadEnv() {
  var file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(function (line) {
    var m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}
loadEnv();
var TOKEN = process.env.TMDB_READ_TOKEN || '';
var KEY = process.env.TMDB_API_KEY || '';
var POSTER_MODE = process.env.POSTER_MODE === 'local' ? 'local' : 'cdn';

if (!TOKEN && !KEY) {
  console.error([
    '',
    'Falta la credencial de TMDB.',
    '1) Crea una cuenta en https://www.themoviedb.org/ y ve a Settings -> API.',
    '2) Copia .env.example a .env y llena UNA de estas variables:',
    '   TMDB_READ_TOKEN=<API Read Access Token (v4)>   (preferida)',
    '   TMDB_API_KEY=<API Key (v3), 32 caracteres>',
    '3) Vuelve a correr: node tools/build-catalog.js',
    'El archivo .env está en .gitignore: nunca subas la key al repo.',
    ''
  ].join('\n'));
  process.exit(1);
}

// ---------- HTTP ----------
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function tmdb(pathname, params, attempt) {
  attempt = attempt || 0;
  var qs = new URLSearchParams(params || {});
  if (!TOKEN) qs.set('api_key', KEY);
  var headers = { accept: 'application/json' };
  if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;
  return sleep(PAUSE_MS).then(function () {
    return fetch(API + pathname + '?' + qs.toString(), { headers: headers });
  }).then(function (res) {
    if (res.status === 429 && attempt < 4) {
      var wait = (parseInt(res.headers.get('retry-after'), 10) || 2) * 1000;
      console.warn('  429, reintento en ' + wait + ' ms');
      return sleep(wait).then(function () { return tmdb(pathname, params, attempt + 1); });
    }
    if (res.status >= 500 && attempt < 2) {
      return sleep(1500).then(function () { return tmdb(pathname, params, attempt + 1); });
    }
    if (!res.ok) throw new Error('TMDB ' + res.status + ' en ' + pathname);
    return res.json();
  });
}

// ---------- utilidades ----------
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function shortText(s, max) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  var cut = s.slice(0, max - 1);
  var sp = cut.lastIndexOf(' ');
  return (sp > 60 ? cut.slice(0, sp) : cut) + '…';
}
function isoDate(d) { return d.toISOString().slice(0, 10); }

// ---------- 1. Proveedores ----------
function loadProviders() {
  var map = {}; // tmdb provider_id -> platformId
  var found = {};
  return Promise.all([]).then(function () {
    return tmdb('/watch/providers/movie', { language: LANG, watch_region: REGION });
  }).then(function (m) {
    return tmdb('/watch/providers/tv', { language: LANG, watch_region: REGION }).then(function (t) {
      return (m.results || []).concat(t.results || []);
    });
  }).then(function (all) {
    all.forEach(function (p) {
      var n = norm(p.provider_name);
      PLATFORMS.list.forEach(function (pl) {
        if (pl.tmdbNames.indexOf(n) !== -1) {
          map[p.provider_id] = pl.id;
          found[pl.id] = found[pl.id] || [];
          if (found[pl.id].indexOf(p.provider_name + ' #' + p.provider_id) === -1) {
            found[pl.id].push(p.provider_name + ' #' + p.provider_id);
          }
        }
      });
    });
    PLATFORMS.list.forEach(function (pl) {
      console.log('  ' + pl.id + ': ' + (found[pl.id] ? found[pl.id].join(', ') : 'NO ENCONTRADO en MX'));
    });
    return map;
  });
}

// ---------- 2. Candidatos (discover) ----------
function discoverBuckets(providerMap) {
  var providerIds = Object.keys(providerMap);
  var now = new Date();
  var twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  var base = {
    language: LANG, watch_region: REGION, with_watch_providers: providerIds.join('|'),
    with_watch_monetization_types: 'flatrate', include_adult: 'false', sort_by: 'popularity.desc'
  };
  function q(extra) { var o = {}; var k; for (k in base) o[k] = base[k]; for (k in extra) o[k] = extra[k]; return o; }

  var buckets = [];
  ['movie', 'tv'].forEach(function (t) {
    var votes = t === 'movie' ? { 'vote_count.gte': 150 } : { 'vote_count.gte': 40 };
    Object.keys(TAX.MOOD_DISCOVER[t]).forEach(function (mood) {
      var g = TAX.MOOD_DISCOVER[t][mood];
      if (g) buckets.push({ name: 'mood:' + mood, type: t, take: 7, params: q(Object.assign({ with_genres: g }, votes)) });
      else buckets.push({ name: 'mood:' + mood, type: t, take: 7, keywordQueries: TAX.MOOD_KEYWORD_QUERIES[mood], params: q(votes) });
    });
    buckets.push({ name: 'familia', type: t, take: 6, params: q(Object.assign({ with_genres: t === 'movie' ? '10751' : '10751|10762' }, votes)) });
    if (t === 'tv') {
      buckets.push({ name: 'corta30', type: t, take: 5, params: q(Object.assign({ 'with_runtime.lte': 30 }, votes)) });
      buckets.push({ name: 'corta45', type: t, take: 4, params: q(Object.assign({ 'with_runtime.gte': 31, 'with_runtime.lte': 45 }, votes)) });
    }
    var classic = t === 'movie' ? { 'primary_release_date.lte': '2005-12-31' } : { 'first_air_date.lte': '2008-12-31' };
    buckets.push({ name: 'clasico', type: t, take: 6, params: q(Object.assign({ sort_by: 'vote_count.desc' }, classic)) });
    // Un bucket por plataforma para que las de catálogo chico (ViX, Apple TV...) también aparezcan.
    PLATFORMS.list.forEach(function (pl) {
      var ids = providerIds.filter(function (id) { return providerMap[id] === pl.id; });
      if (ids.length) buckets.push({ name: 'plataforma:' + pl.id, type: t, take: 3, params: q({ with_watch_providers: ids.join('|'), 'vote_count.gte': 10 }) });
    });
    var fresh = t === 'movie' ? { 'primary_release_date.gte': isoDate(twoYearsAgo) } : { 'first_air_date.gte': isoDate(twoYearsAgo) };
    buckets.push({ name: 'nuevo', type: t, take: 5, params: q(Object.assign({}, votes, fresh, { 'vote_count.gte': 20 })) });
  });
  return buckets;
}

function resolveKeywordIds(queries) {
  var ids = [];
  return queries.reduce(function (p, query) {
    return p.then(function () {
      return tmdb('/search/keyword', { query: query }).then(function (r) {
        var hit = (r.results || []).filter(function (k) { return norm(k.name) === norm(query); })[0];
        if (hit) ids.push(hit.id);
      });
    });
  }, Promise.resolve()).then(function () { return ids.join('|'); });
}

function collectCandidates(buckets) {
  var seen = {};
  var out = []; // {type, tmdbId, bucket}
  return buckets.reduce(function (p, b) {
    return p.then(function () {
      var pre = b.keywordQueries ? resolveKeywordIds(b.keywordQueries).then(function (kw) {
        if (kw) b.params.with_keywords = kw;
      }) : Promise.resolve();
      return pre.then(function () { return tmdb('/discover/' + b.type, b.params); }).then(function (r) {
        var n = 0;
        (r.results || []).forEach(function (x) {
          var key = b.type + ':' + x.id;
          if (n >= b.take + 3 || seen[key]) return; // +3 de colchón por descartes
          seen[key] = 1; n++;
          out.push({ type: b.type, tmdbId: x.id, bucket: b.name + ':' + b.type });
        });
        console.log('  ' + b.type + ' ' + b.name + ': ' + n + ' candidatos');
      });
    });
  }, Promise.resolve()).then(function () { return out; });
}

// ---------- 3. Detalle -> Item ----------
function certificationOf(d, type) {
  function pick(country) {
    if (type === 'movie') {
      var rd = ((d.release_dates || {}).results || []).filter(function (r) { return r.iso_3166_1 === country; })[0];
      if (!rd) return '';
      var c = (rd.release_dates || []).map(function (x) { return (x.certification || '').trim(); }).filter(Boolean)[0];
      return c || '';
    }
    var cr = ((d.content_ratings || {}).results || []).filter(function (r) { return r.iso_3166_1 === country; })[0];
    return cr ? (cr.rating || '').trim() : '';
  }
  var mx = pick('MX');
  if (mx) return { country: 'MX', cert: mx };
  var us = pick('US');
  if (us) return { country: 'US', cert: us };
  return null;
}

function toItem(d, type, providerMap, allowNoPlatform) {
  var tv = type === 'tv';
  var title = tv ? d.name : d.title;
  if (!d.poster_path || !d.overview || !title) return { skip: 'sin póster/sinopsis' };

  var dur = tv ? ((d.episode_run_time && d.episode_run_time[0]) || (d.last_episode_to_air && d.last_episode_to_air.runtime) || 0) : d.runtime;
  if (!dur) return { skip: 'sin duración' };

  var flat = ((((d['watch/providers'] || {}).results || {})[REGION] || {}).flatrate) || [];
  var platforms = [];
  flat.forEach(function (p) {
    var id = providerMap[p.provider_id];
    if (id && platforms.indexOf(id) === -1) platforms.push(id);
  });
  if (!platforms.length && !allowNoPlatform) return { skip: 'sin plataforma objetivo' };

  var genreIds = (d.genres || []).map(function (g) { return g.id; });
  var kws = ((d.keywords || {}).keywords || (d.keywords || {}).results || []).map(function (k) { return norm(k.name); });

  // moods (máx. 2): por orden de géneros, más palabras clave de terror
  var moods = [];
  genreIds.forEach(function (g) {
    var m = TAX.GENRE_TO_MOOD[g];
    if (m && moods.indexOf(m) === -1 && moods.length < 2) moods.push(m);
  });
  kws.forEach(function (k) {
    var m = TAX.KEYWORD_TO_MOOD[k];
    if (m && moods.indexOf(m) === -1) {
      if (moods.length < 2) moods.push(m);
      else moods[1] = m;
    }
  });
  if (!moods.length) return { skip: 'sin mood mapeable' };

  // tags: géneros finos (es-MX) + palabras clave traducidas, máx. 5
  var tags = [];
  (d.genres || []).forEach(function (g) {
    var n = String(g.name || '').toLowerCase();
    if (n && tags.indexOf(n) === -1) tags.push(n);
  });
  kws.forEach(function (k) {
    var es = TAX.KEYWORD_ES[k];
    if (es && tags.indexOf(es) === -1) tags.push(es);
  });
  tags = tags.slice(0, 5);

  // attention: decide el género principal
  var attention = 'high';
  for (var i = 0; i < genreIds.length; i++) {
    if (TAX.LOW_ATTENTION[genreIds[i]]) { attention = 'low'; break; }
    if (TAX.HIGH_ATTENTION[genreIds[i]]) { attention = 'high'; break; }
  }

  // audience
  var cert = certificationOf(d, type);
  var isFamily = !!(cert && TAX.FAMILY_CERTS[cert.country] && TAX.FAMILY_CERTS[cert.country].indexOf(cert.cert) !== -1);
  var kidsOnly = genreIds.some(function (g) { return TAX.KIDS_GENRES[g]; }) || !!(cert && TAX.KIDS_ONLY_CERTS.indexOf(cert.cert) !== -1);
  var audience = [];
  if (!kidsOnly) audience.push('solo');
  if (genreIds.some(function (g) { return TAX.PAREJA_GENRES[g]; })) audience.push('pareja');
  if (genreIds.some(function (g) { return TAX.AMIGOS_GENRES[g]; })) audience.push('amigos');
  if (isFamily) audience.push('familia');
  if (!audience.length) audience.push('solo');

  var date = tv ? d.first_air_date : d.release_date;
  var id = (tv ? 's' : 'm') + d.id;
  return {
    item: {
      id: id,
      tmdbId: d.id,
      title: title,
      tags: tags,
      type: tv ? 'series' : 'movie',
      year: date ? parseInt(date.slice(0, 4), 10) : null,
      durationMin: dur,
      rating: Math.round((d.vote_average || 0) * 10) / 10,
      popularity: Math.round(d.popularity || 0),
      certification: cert ? cert.country + ':' + cert.cert : null,
      moods: moods,
      attention: attention,
      audience: audience,
      source: platforms[0] || 'totalplay',
      platforms: platforms,
      posterPath: d.poster_path,
      posterUrl: POSTER_MODE === 'local' ? 'posters/' + id + '.jpg' : 'https://image.tmdb.org/t/p/' + POSTER_SIZE + d.poster_path,
      synopsis: shortText(d.overview, SYNOPSIS_MAX),
      detailUrl: null // TBD: formato de ficha (deep link) no definido
    }
  };
}

function fetchDetail(type, tmdbId) {
  var append = type === 'movie' ? 'watch/providers,release_dates,keywords' : 'watch/providers,content_ratings,keywords';
  return tmdb('/' + type + '/' + tmdbId, { language: LANG, append_to_response: append });
}

// ---------- 4. Selección balanceada ----------
function selectBalanced(entries) {
  // Round-robin entre buckets (en orden de inserción) para cubrir moods, familia, corta, clásico y nuevo.
  var byType = { movie: [], tv: [] };
  entries.forEach(function (e) { byType[e.type].push(e); });
  var picked = [];
  ['movie', 'tv'].forEach(function (t) {
    var groups = {}; var order = [];
    byType[t].forEach(function (e) {
      if (!groups[e.bucket]) { groups[e.bucket] = []; order.push(e.bucket); }
      groups[e.bucket].push(e);
    });
    var taken = 0; var progressed = true;
    while (taken < PER_TYPE && progressed) {
      progressed = false;
      for (var i = 0; i < order.length && taken < PER_TYPE; i++) {
        var g = groups[order[i]];
        if (g.length) { picked.push(g.shift()); taken++; progressed = true; }
      }
    }
  });
  return picked;
}

// ---------- 5. Totalplay ----------
function readCsv() {
  if (!fs.existsSync(CSV_FILE)) return null;
  var lines = fs.readFileSync(CSV_FILE, 'utf8').split(/\r?\n/).filter(function (l) { return l.trim(); });
  var header = lines.shift().split(',').map(function (h) { return h.trim().toLowerCase(); });
  var ti = header.indexOf('title'); var yi = header.indexOf('year');
  return lines.map(function (l) {
    var cols = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(function (c) { return c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim(); });
    return { title: cols[ti], year: yi >= 0 && cols[yi] ? parseInt(cols[yi], 10) : null };
  }).filter(function (r) { return r.title; });
}

function resolveTotalplay(rows, providerMap, items) {
  var report = { ok: [], notFound: [], doubtful: [] };
  var index = {}; items.forEach(function (it) { index[it.id] = it; });
  return rows.reduce(function (p, row) {
    return p.then(function () {
      var params = { query: row.title, language: LANG, include_adult: 'false' };
      return tmdb('/search/movie', params).then(function (mr) {
        return tmdb('/search/tv', params).then(function (tr) {
          var hits = [];
          (mr.results || []).forEach(function (x) { hits.push({ type: 'movie', id: x.id, names: [x.title, x.original_title], year: (x.release_date || '').slice(0, 4) }); });
          (tr.results || []).forEach(function (x) { hits.push({ type: 'tv', id: x.id, names: [x.name, x.original_name], year: (x.first_air_date || '').slice(0, 4) }); });
          var exact = hits.filter(function (h) {
            var nameOk = h.names.some(function (n) { return norm(n) === norm(row.title); });
            var yearOk = !row.year || Math.abs(parseInt(h.year, 10) - row.year) <= 1;
            return nameOk && yearOk;
          });
          if (!exact.length) {
            report.notFound.push(row.title + (row.year ? ' (' + row.year + ')' : '') +
              (hits[0] ? '  -> ¿quizá "' + hits[0].names[0] + '" ' + hits[0].year + '?' : ''));
            return null;
          }
          if (exact.length > 1) {
            report.doubtful.push(row.title + ': ' + exact.map(function (h) { return h.type + ' ' + h.names[0] + ' ' + h.year; }).join(' | '));
            return null;
          }
          var h = exact[0];
          var id = (h.type === 'tv' ? 's' : 'm') + h.id;
          if (index[id]) { index[id].source = 'totalplay'; report.ok.push(row.title); return null; }
          return fetchDetail(h.type, h.id).then(function (d) {
            var r = toItem(d, h.type, providerMap, true);
            if (!r.item) { report.doubtful.push(row.title + ': descartado (' + r.skip + ')'); return; }
            r.item.source = 'totalplay';
            items.push(r.item); index[id] = r.item;
            report.ok.push(row.title);
          });
        });
      });
    });
  }, Promise.resolve()).then(function () { return report; });
}

function markDemoTotalplay(items) {
  // ~20 títulos variados: round-robin por (tipo, mood principal).
  var groups = {}; var order = [];
  items.forEach(function (it) {
    var k = it.type + ':' + it.moods[0];
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(it);
  });
  var n = 0; var progressed = true;
  while (n < DEMO_TOTALPLAY && progressed) {
    progressed = false;
    for (var i = 0; i < order.length && n < DEMO_TOTALPLAY; i++) {
      var g = groups[order[i]];
      // salta uno de cada dos para que no sean siempre los más populares
      var it = g.length > 1 ? g.splice(1, 1)[0] : g.shift();
      if (it) { it.source = 'totalplay'; it.demo = true; n++; progressed = true; }
    }
  }
  return n;
}

// ---------- 6. Pósters locales (opcional) ----------
function downloadPosters(items) {
  if (!fs.existsSync(POSTER_DIR)) fs.mkdirSync(POSTER_DIR);
  return items.reduce(function (p, it) {
    return p.then(function () {
      var file = path.join(POSTER_DIR, it.id + '.jpg');
      if (fs.existsSync(file)) return;
      return sleep(100).then(function () {
        return fetch('https://image.tmdb.org/t/p/' + POSTER_SIZE + it.posterPath);
      }).then(function (res) {
        if (!res.ok) throw new Error('póster ' + res.status);
        return res.arrayBuffer();
      }).then(function (buf) { fs.writeFileSync(file, Buffer.from(buf)); })
        .catch(function (e) { console.warn('  póster ' + it.id + ': ' + e.message); });
    });
  }, Promise.resolve());
}

// ---------- main ----------
function main() {
  var providerMap;
  var items = [];
  var stats = { skipped: {} };
  var demoCount = 0;
  var report = null;

  console.log('1) Proveedores en ' + REGION);
  return loadProviders().then(function (map) {
    providerMap = map;
    var ids = Object.keys(map);
    if (!ids.length) throw new Error('No se encontró ninguna plataforma objetivo en TMDB.');
    console.log('2) Candidatos (discover)');
    return collectCandidates(discoverBuckets(map));
  }).then(function (cands) {
    console.log('3) Detalle de ' + cands.length + ' candidatos');
    var valid = [];
    return cands.reduce(function (p, c) {
      return p.then(function () {
        return fetchDetail(c.type, c.tmdbId).then(function (d) {
          var r = toItem(d, c.type, providerMap, false);
          if (r.item) valid.push({ type: c.type, bucket: c.bucket, item: r.item });
          else stats.skipped[r.skip] = (stats.skipped[r.skip] || 0) + 1;
        }).catch(function (e) { console.warn('  ' + c.type + ' ' + c.tmdbId + ': ' + e.message); });
      });
    }, Promise.resolve()).then(function () { return valid; });
  }).then(function (valid) {
    items = selectBalanced(valid).map(function (e) { return e.item; });
    var rows = readCsv();
    if (rows) {
      console.log('4) Catálogo Totalplay desde CSV (' + rows.length + ' filas)');
      return resolveTotalplay(rows, providerMap, items).then(function (r) { report = r; });
    }
    console.log('4) Sin src/config/totalplay-titles.csv -> catálogo Totalplay SIMULADO (demo:true)');
    demoCount = markDemoTotalplay(items);
  }).then(function () {
    if (POSTER_MODE === 'local') {
      console.log('5) Descargando pósters a posters/ (NO se suben al repo sin confirmación)');
      return downloadPosters(items);
    }
  }).then(function () {
    items.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    var catalog = {
      generatedAt: new Date().toISOString(),
      source: 'TMDB',
      attribution: 'Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB. Disponibilidad: JustWatch.',
      language: LANG,
      region: REGION,
      posterMode: POSTER_MODE,
      totalplayMode: report ? 'csv' : 'demo',
      items: items
    };
    var banner = report ? '' :
      '/* AVISO: Catálogo Totalplay SIMULADO — no refleja disponibilidad real (items con demo:true). */\n';
    var js = '/* ARCHIVO GENERADO por tools/build-catalog.js — no editar a mano. Fuente: TMDB / JustWatch. */\n' + banner +
      'window.TP_CATALOG = ' + JSON.stringify(catalog, null, 1) + ';\n';
    fs.writeFileSync(OUT_FILE, js);

    if (report) {
      fs.writeFileSync(REPORT_FILE, [
        'Encontrados (' + report.ok.length + '):', report.ok.join('\n'), '',
        'NO encontrados (' + report.notFound.length + ') — revisar a mano:', report.notFound.join('\n'), '',
        'Coincidencia dudosa (' + report.doubtful.length + ') — revisar a mano:', report.doubtful.join('\n'), ''
      ].join('\n'));
    }

    // Resumen de cobertura
    var c = { movie: 0, series: 0, totalplay: 0, short: 0, familia: 0, moods: {} };
    items.forEach(function (it) {
      c[it.type]++;
      if (it.source === 'totalplay') c.totalplay++;
      if (it.durationMin <= 45) c.short++;
      if (it.audience.indexOf('familia') !== -1) c.familia++;
      it.moods.forEach(function (m) { var k = it.type + ':' + m; c.moods[k] = (c.moods[k] || 0) + 1; });
    });
    console.log('\nListo: ' + path.relative(ROOT, OUT_FILE));
    console.log('  títulos: ' + items.length + ' (películas ' + c.movie + ', series ' + c.series + ')');
    console.log('  totalplay: ' + c.totalplay + (report ? ' (CSV)' : ' (SIMULADO, ' + demoCount + ' demo)'));
    console.log('  ≤45 min: ' + c.short + ' · familia: ' + c.familia);
    console.log('  moods: ' + JSON.stringify(c.moods));
    console.log('  descartados: ' + JSON.stringify(stats.skipped));
    if (report) console.log('  reporte Totalplay: ' + path.relative(ROOT, REPORT_FILE));
  });
}

main().catch(function (e) {
  console.error('\nError: ' + e.message);
  process.exit(1);
});
