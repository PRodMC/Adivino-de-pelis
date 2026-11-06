/* 0. Bienvenida: título + subtítulo + Empezar + atribución TMDB/JustWatch (sin foco). */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.screens = TP.screens || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  TP.screens.welcome = {
    render: function (ctx) {
      var c = TP.copy.welcome;
      var el = h('div', 'screen screen--welcome');
      var body = h('div', 'welcome__body');
      body.appendChild(h('h1', 'welcome__title t-display anim-rise', c.title));
      body.appendChild(h('p', 'welcome__subtitle t-body anim-rise', c.subtitle));
      var start = TP.ui.button(c.start, function () { ctx.next(); });
      body.appendChild(start);
      el.appendChild(body);
      el.appendChild(h('p', 'welcome__attribution t-caption', c.attribution));
      return {
        el: el,
        focus: start,
        // Raíz: BACK no sale de la app (R6).
        onBack: function (event) { TP.lifecycle.handleRootBack(event); }
      };
    }
  };
})(this);
