/* Carrusel horizontal: scroll por transform translateX para mantener visible la tarjeta enfocada,
 * y carga perezosa manual de pósters (visibles + 2 a cada lado; fuera de rango se suelta la imagen). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  var VIEW_W = 1728;   // ancho útil (zona segura)
  var PITCH = 340;     // 300 de tarjeta + 40 de margen
  var MARGIN = 2;      // tarjetas extra a cada lado con imagen

  TP.ui.carousel = function (opts) {
    var el = h('section', 'rail');
    el.setAttribute('data-section', opts.id);
    el.appendChild(h('h2', 'rail__title t-title', opts.title));

    var cards = [];
    var offset = 0;

    if (!opts.items.length) {
      el.appendChild(h('p', 'rail__empty t-option', opts.emptyText));
      return { el: el, cards: cards, owns: function () { return false; }, onFocus: function () {} };
    }

    var viewport = h('div', 'rail__viewport');
    var track = h('div', 'rail__track');
    for (var i = 0; i < opts.items.length; i++) {
      (function (item, idx) {
        var card = TP.ui.contentCard(item, idx, opts.platformLabel(item), function () { opts.onActivate(item, card); });
        card.id = opts.id + '-' + idx;
        card.__index = idx;
        cards.push(card);
        track.appendChild(card);
        // Revelado tipo carta solo para las ~4 primeras visibles; el resto aparece sin animación.
        if (idx < opts.revealCount) TP.ui.reveal(card.__poster, opts.revealDelay + idx * 120, opts.later);
        else card.__poster.classList.add('is-revealed');
      })(opts.items[i], i);
    }
    viewport.appendChild(track);
    el.appendChild(viewport);

    function updateImages() {
      // Fluido (celular): scroll nativo y pocas tarjetas (máx. 8): se cargan todas.
      if (TP.layout.isFluid()) {
        for (var f = 0; f < cards.length; f++) TP.ui.attachImage(cards[f].__front, cards[f].__item, 300, 450);
        return;
      }
      var first = Math.floor(-offset / PITCH);
      var last = first + Math.ceil(VIEW_W / PITCH) - 1;
      for (var k = 0; k < cards.length; k++) {
        var c = cards[k];
        if (k >= first - MARGIN && k <= last + MARGIN) TP.ui.attachImage(c.__front, c.__item, 300, 450);
        else TP.ui.releaseImage(c.__front);
      }
    }

    function setOffset(px) {
      offset = px;
      track.style.webkitTransform = track.style.transform = 'translateX(' + px + 'px)';
      updateImages();
    }

    updateImages();

    return {
      el: el,
      cards: cards,
      owns: function (node) { return node && node.__index !== undefined && cards[node.__index] === node; },
      onFocus: function (card) {
        if (TP.layout.isFluid()) { TP.ui.scrollIntoView(card); return; }
        var left = card.__index * PITCH;
        var right = left + 300;
        if (left + offset < 0) setOffset(-left);
        else if (right + offset > VIEW_W) setOffset(VIEW_W - right);
      }
    };
  };
})(this);
