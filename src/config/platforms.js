/* Plataformas objetivo. El nombre se muestra en texto (sin logos: no hay assets/licencia).
 * `tmdbNames`: nombres exactos (normalizados a minúsculas) con los que TMDB/JustWatch
 * reporta al proveedor en watch_region=MX. tools/build-catalog.js lee los IDs de proveedor
 * de la respuesta de TMDB y los mapea con esta lista: aquí NO se guardan IDs de memoria. */
(function (root) {
  var PLATFORMS = [
    { id: 'netflix', name: 'Netflix', tmdbNames: ['netflix'] },
    { id: 'disney', name: 'Disney+', tmdbNames: ['disney plus', 'disney+'] },
    { id: 'max', name: 'HBO Max', tmdbNames: ['max', 'hbo max'] },
    { id: 'prime', name: 'Prime Video', tmdbNames: ['amazon prime video'] },
    { id: 'paramount', name: 'Paramount+', tmdbNames: ['paramount plus', 'paramount+', 'paramount plus premium'] },
    { id: 'vix', name: 'ViX', tmdbNames: ['vix', 'vix premium', 'vix gratis'] },
    { id: 'appletv', name: 'Apple TV', tmdbNames: ['apple tv', 'apple tv plus', 'apple tv+'] }
  ];

  var byId = {};
  for (var i = 0; i < PLATFORMS.length; i++) byId[PLATFORMS[i].id] = PLATFORMS[i];

  var api = {
    list: PLATFORMS,
    byId: byId,
    nameOf: function (id) {
      if (id === 'totalplay') return 'Totalplay';
      return byId[id] ? byId[id].name : id;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.TP = root.TP || {}; root.TP.platforms = api; }
})(this);
