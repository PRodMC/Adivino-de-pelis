/* 8. "Pensando…": 1.8 s con frase rotativa y tres puntos dorados. Sin foco; avanza solo. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.screens = TP.screens || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  TP.screens.thinking = {
    render: function (ctx) {
      var state = ctx.state;
      var feedback = [];
      for (var i = 0; i < state.feedback.length; i++) if (state.feedback[i]) feedback.push(state.feedback[i]);
      state.results = TP.recommender.recommend(state.answers, state.subs, ctx.catalog, feedback,
        { max: TP.env.RESULTS_PER_CAROUSEL });
      TP.debug.log('resultados: ' + state.results.platforms.length + ' + ' + state.results.totalplay.length +
        ' (relajado ' + state.results.relaxLevel.platforms + '/' + state.results.relaxLevel.totalplay + ')');

      var phrases = TP.copy.thinking;
      var start = Math.floor(Math.random() * phrases.length);
      var el = h('div', 'screen screen--night screen--thinking');
      TP.ui.starfield(el, true);
      var body = h('div', 'thinking__body');
      var phrase = h('p', 'thinking__phrase t-display anim-rise', phrases[start]);
      body.appendChild(phrase);
      var dots = h('div', 'dots');
      for (var d = 0; d < 3; d++) dots.appendChild(h('span', 'dot'));
      body.appendChild(dots);
      el.appendChild(body);

      ctx.later(function () {
        TP.ui.clear(phrase);
        phrase.appendChild(root.document.createTextNode(phrases[(start + 1) % phrases.length]));
        phrase.className = 'thinking__phrase t-display is-swap';
      }, Math.round(TP.env.THINKING_MS / 2));
      ctx.later(ctx.next, TP.env.THINKING_MS);

      return { el: el, focus: null, onBack: function () { /* no se interrumpe: avanza solo */ } };
    }
  };
})(this);
