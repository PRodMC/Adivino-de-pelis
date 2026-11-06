/* Costura del catálogo. Hoy lee el snapshot estático window.TP_CATALOG (generado por
 * tools/build-catalog.js): sin fetch/XHR en el STB.
 * TBD: feed/API de producción de Totalplay (y red de producción: HTTPS/CORS/allowlist) — reemplazar aquí. */
(function (root) {
  var TP = root.TP = root.TP || {};
  var cache = null;

  function posterUrl(item) {
    var env = TP.env;
    if (!item.posterPath) return null;
    if (env.POSTER_MODE === 'local') return env.POSTER_LOCAL_DIR + item.id + '.jpg';
    return env.POSTER_BASE + env.POSTER_SIZE + item.posterPath;
  }

  TP.catalog = {
    load: function () {
      if (cache) return cache;
      var raw = root.TP_CATALOG || { items: [] };
      var items = [];
      for (var i = 0; i < raw.items.length; i++) {
        var src = raw.items[i];
        var it = {};
        for (var k in src) if (src.hasOwnProperty(k)) it[k] = src[k];
        it.posterUrl = posterUrl(it);
        items.push(it);
      }
      cache = { items: items, generatedAt: raw.generatedAt, totalplayMode: raw.totalplayMode || 'demo' };
      if (cache.totalplayMode === 'demo') {
        TP.debug.log('AVISO: Catálogo Totalplay SIMULADO — no refleja disponibilidad real');
      }
      return cache;
    }
  };
})(this);
