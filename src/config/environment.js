/* Configuración editable sin tocar código. */
(function (root) {
  root.TP = root.TP || {};
  root.TP.env = {
    // Portadas: 'cdn' = image.tmdb.org (HTTPS en el STB = TBD); 'local' = posters/ descargados por
    // tools/build-catalog.js (POSTER_MODE=local). posters/ está en .gitignore (derechos de terceros).
    POSTER_MODE: 'cdn',
    POSTER_BASE: 'https://image.tmdb.org/t/p/',
    POSTER_SIZE: 'w342',
    POSTER_LOCAL_DIR: 'posters/',

    // Tiempos de la trivia (ms)
    REACTION_MS: 400,
    SWEEP_MS: 350,
    THINKING_MS: 1800,

    // Polling de red (solo con runtime Totalplay; el catálogo es snapshot local)
    NETWORK_POLL_MS: 15000,

    RESULTS_PER_CAROUSEL: 8,
    DEBUG: false
  };
})(this);
