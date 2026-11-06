/* 1. Suscripciones: selección múltiple + Continuar (deshabilitado sin selección).
 * El catálogo Totalplay se incluye siempre aparte (no es una opción). */
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
      var nextBtn;

      function refresh() {
        var disabled = !state.subs.length;
        nextBtn.setAttribute('data-disabled', disabled ? 'true' : 'false');
        nextBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      }

      for (var i = 0; i < list.length; i++) {
        (function (pl, idx) {
          var tile = h('div', 'tile t-option anim-pop ' + TP.ui.accentClass(idx), pl.name);
          tile.setAttribute('data-focusable', '');
          tile.setAttribute('role', 'checkbox');
          tile.style.webkitAnimationDelay = tile.style.animationDelay = (80 + idx * 40) + 'ms';
          function paint() {
            var on = state.subs.indexOf(pl.id) !== -1;
            tile.className = tile.className.replace(/ ?is-selected/g, '') + (on ? ' is-selected' : '');
            tile.setAttribute('aria-checked', on ? 'true' : 'false');
          }
          tile.__tpActivate = function () {
            var at = state.subs.indexOf(pl.id);
            if (at === -1) state.subs.push(pl.id);
            else state.subs.splice(at, 1);
            paint();
            refresh();
          };
          paint();
          grid.appendChild(tile);
        })(list[i], i);
      }
      el.appendChild(grid);

      var footer = h('div', 'subs__footer');
      nextBtn = TP.ui.button(c.next, function () {
        if (state.subs.length) ctx.next();
      });
      footer.appendChild(nextBtn);
      el.appendChild(footer);
      refresh();

      // Al volver desde Q1 con plataformas ya elegidas, el foco regresa a Continuar.
      return { el: el, focus: state.subs.length ? nextBtn : grid.firstChild };
    }
  };
})(this);
