/* 9. Resultados: 2 carruseles + Volver a jugar. Entre carruseles la vista se desplaza en vertical
 * por transform (decisión confirmada): la página nunca hace scroll real.
 * OK en una tarjeta abre el panel de detalle (components/detail.js); BACK o "Volver" lo cierra. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.screens = TP.screens || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  var VIEW_H = 972; // 1080 - 2 x 54 de zona segura

  TP.screens.results = {
    render: function (ctx) {
      var c = TP.copy.results;
      var state = ctx.state;
      var res = state.results || TP.recommender.recommend(state.answers, state.subs, ctx.catalog, []);

      var detail = null; // TP.ui.detailController (se crea al tener la pantalla)
      function openItem(item, card) { detail.open(item, card, card.__poster); }
      function subsLabel(item) {
        for (var i = 0; i < item.platforms.length; i++) {
          if (state.subs.indexOf(item.platforms[i]) !== -1) return TP.platforms.nameOf(item.platforms[i]);
        }
        return TP.platforms.nameOf(item.source);
      }

      var el = h('div', 'screen screen--night screen--results');
      detail = TP.ui.detailController(ctx, el);
      TP.ui.starfield(el, false); // estático: el presupuesto de animación es para las cartas
      var viewport = h('div', 'results__viewport');
      var content = h('div', 'results__content');

      var railA = TP.ui.carousel({
        id: 'rail-a', title: c.platforms, items: res.platforms, emptyText: c.empty,
        platformLabel: subsLabel, onActivate: openItem, later: ctx.later, revealCount: 4, revealDelay: 0
      });
      var railB = TP.ui.carousel({
        id: 'rail-b', title: c.totalplay, items: res.totalplay, emptyText: c.empty,
        platformLabel: function () { return TP.platforms.nameOf('totalplay'); },
        onActivate: openItem, later: ctx.later, revealCount: 4, revealDelay: state.noPlatforms ? 0 : 480
      });
      // Con "Ninguna plataforma" solo se muestra el catálogo Totalplay.
      if (!state.noPlatforms) content.appendChild(railA.el);
      content.appendChild(railB.el);

      var again = TP.ui.button(c.again, function () {
        TP.state.resetTrivia(state);
        ctx.go(TP.routes.indexOf('question', 0));
      }, 'results__again');
      again.setAttribute('data-section', 'again');
      content.appendChild(again);
      viewport.appendChild(content);
      el.appendChild(viewport);

      var offsetY = 0;
      function scrollTo(section) {
        if (TP.layout.isFluid()) { if (section === again) TP.ui.scrollIntoView(again); return; }
        var max = Math.max(0, content.offsetHeight - VIEW_H);
        var target = section === content.firstChild ? 0 : Math.min(section.offsetTop, max);
        if (section === again) target = max;
        if (target !== offsetY) {
          offsetY = target;
          content.style.webkitTransform = content.style.transform = 'translateY(' + (-target) + 'px)';
        }
      }

      return {
        el: el,
        focus: railA.cards[0] || railB.cards[0] || again,
        onBack: function (event, fromHistory) {
          if (detail.isOpen()) detail.close(fromHistory);
          else ctx.back(event);
        },
        onFocus: function (focused) {
          if (detail.isOpen()) return;
          if (railA.owns(focused)) { railA.onFocus(focused); scrollTo(railA.el); }
          else if (railB.owns(focused)) { railB.onFocus(focused); scrollTo(railB.el); }
          else scrollTo(again);
        }
      };
    }
  };
})(this);
