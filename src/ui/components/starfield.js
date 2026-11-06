/* Campo de estrellas estático: 3 capas (1 elemento c/u, puntos por box-shadow sin blur).
 * twinkle=true hace que 2 capas alternen opacity un número limitado de veces. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.ui.starfield = function (screen, twinkle) {
    var layers = ['a', 'b', 'c'];
    for (var i = 0; i < layers.length; i++) {
      screen.appendChild(TP.ui.h('div', 'stars stars--' + layers[i] + (twinkle ? ' stars--twinkle' : '')));
    }
  };
})(this);
