/* Tarjeta de opción (preguntas) y botón pill. */
(function (root) {
  var TP = root.TP = root.TP || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  TP.ui.optionCard = function (label, onActivate, index) {
    var el = h('div', 'option t-option anim-pop', label);
    el.setAttribute('data-focusable', '');
    el.style.webkitAnimationDelay = el.style.animationDelay = (120 + index * 40) + 'ms';
    el.__tpActivate = onActivate;
    return el;
  };

  TP.ui.button = function (label, onActivate, extraClass) {
    var el = h('div', 'btn t-option' + (extraClass ? ' ' + extraClass : ''), label);
    el.setAttribute('data-focusable', '');
    el.__tpActivate = onActivate;
    return el;
  };
})(this);
