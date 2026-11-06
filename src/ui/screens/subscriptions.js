/* 1. Suscripciones: selección múltiple + "Ninguna plataforma" (excluyente) + Continuar
 * (deshabilitado si no hay nada elegido). El catálogo Totalplay se incluye siempre aparte;
 * con "Ninguna plataforma" los resultados son solo de Totalplay. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.screens = TP.screens || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  TP.screens.subscriptions = {
    render: function (ctx) {
      var c = TP.copy.subscriptions;
      var state = ctx.state;
      var el = h('div', 'screen screen--subs');
      el.appendChild(h('h1', 'subs__title t-question anim-rise', c.title));

      var grid = h('div', 'subs__grid');
      var list = TP.platforms.list;
      var tiles = [];
      var nextBtn;

      function refresh() {
        var disabled = !state.subs.length && !state.noPlatforms;
        nextBtn.setAttribute('data-disabled', disabled ? 'true' : 'false');
        nextBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        for (var t = 0; t < tiles.length; t++) tiles[t].paint();
      }

      function makeTile(label, idx, isOn, toggle, extraClass) {
        var tile = h('div', 'tile t-option anim-pop ' + TP.ui.accentClass(idx) + (extraClass ? ' ' + extraClass : ''), label);
        tile.setAttribute('data-focusable', '');
        tile.setAttribute('role', 'checkbox');
        tile.style.webkitAnimationDelay = tile.style.animationDelay = (80 + idx * 40) + 'ms';
        tile.paint = function () {
          var on = isOn();
          tile.className = tile.className.replace(/ ?is-selected/g, '') + (on ? ' is-selected' : '');
          tile.setAttribute('aria-checked', on ? 'true' : 'false');
        };
        tile.__tpActivate = function () { toggle(); refresh(); };
        tiles.push(tile);
        grid.appendChild(tile);
        return tile;
      }

      for (var i = 0; i < list.length; i++) {
        (function (pl, idx) {
          makeTile(pl.name, idx, function () { return state.subs.indexOf(pl.id) !== -1; }, function () {
            var at = state.subs.indexOf(pl.id);
            if (at === -1) state.subs.push(pl.id);
            else state.subs.splice(at, 1);
            if (state.subs.length) state.noPlatforms = false;
          });
        })(list[i], i);
      }
      // Excluyente: elegirla limpia las plataformas; elegir una plataforma la apaga.
      makeTile(c.none, list.length, function () { return !!state.noPlatforms; }, function () {
        state.noPlatforms = !state.noPlatforms;
        if (state.noPlatforms) state.subs.length = 0;
      }, 'tile--none');
      el.appendChild(grid);

      var footer = h('div', 'subs__footer');
      nextBtn = TP.ui.button(c.next, function () {
        if (state.subs.length || state.noPlatforms) ctx.next();
      });
      footer.appendChild(nextBtn);
      el.appendChild(footer);
      refresh();

      // Al volver desde Q1 con algo ya elegido, el foco regresa a Continuar.
      return { el: el, focus: (state.subs.length || state.noPlatforms) ? nextBtn : grid.firstChild };
    }
  };
})(this);
