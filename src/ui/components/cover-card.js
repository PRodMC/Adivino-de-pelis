/* Portada de checkpoint (2:3, borde dorado) con revelado tipo carta de tarot:
 * entra boca abajo y se voltea con falso flip scaleX (sin rotateY/perspective). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  // Estructura común de carta: reverso (estrella dorada) + frente (arte CSS + imagen perezosa).
  TP.ui.flipFace = function (item, accentIndex) {
    var face = h('div', 'flip-face');
    var back = h('div', 'flip flip--back');
    back.appendChild(h('div', 'star8'));
    var front = h('div', 'flip flip--front');
    front.appendChild(TP.ui.posterArt(item, accentIndex));
    face.appendChild(back);
    face.appendChild(front);
    return { face: face, front: front };
  };

  // Secuencia: entra (200 ms) -> scaleX 1->0 (250 ms) -> cambia a frente -> scaleX 0->1 (250 ms).
  TP.ui.reveal = function (cardEl, delay, later) {
    cardEl.classList.add('is-entering');
    later(function () {
      cardEl.classList.add('card-in');
      cardEl.classList.remove('is-entering');
    }, delay);
    later(function () { cardEl.classList.add('is-flipping'); }, delay + 250);
    later(function () {
      cardEl.classList.add('is-revealed');
      cardEl.classList.remove('is-flipping');
    }, delay + 500);
  };

  TP.ui.coverCard = function (item, index, onActivate, later) {
    var el = h('div', 'cover');
    el.id = 'cover-' + index;
    el.setAttribute('data-focusable', '');
    el.__tpActivate = onActivate;

    var card = h('div', 'cover__card');
    var parts = TP.ui.flipFace(item, index);
    card.appendChild(parts.face);
    TP.ui.attachImage(parts.front, item, 300, 450);
    el.appendChild(card);
    el.appendChild(h('div', 'cover__title t-body', item.title));

    TP.ui.reveal(card, index * 120, later);
    return el;
  };
})(this);
