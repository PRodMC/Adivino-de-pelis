/* Mouse y touch como capa encima del D-pad (progressive enhancement, regla R5).
 * Nunca se activa con runtime Totalplay: algunos navegadores de STB generan eventos de mouse
 * sintéticos desde el control remoto y pelearían con el foco del D-pad. */
(function (root) {
  var TP = root.TP = root.TP || {};
  var doc = root.document;

  function focusableFrom(node) {
    while (node && node !== doc) {
      if (node.getAttribute && node.getAttribute('data-focusable') !== null) return node;
      node = node.parentNode;
    }
    return null;
  }

  TP.pointer = {
    // onActivate(el) y onMove(dir): la app decide si acepta (respeta transiciones/standby).
    init: function (onActivate, onMove) {
      if (TP.hasTotalplayRuntime()) return;
      doc.addEventListener('click', function (event) {
        var el = focusableFrom(event.target);
        if (el) onActivate(el);
      }, false);

      // En modo escalado los carruseles se mueven por transform (no hay scroll nativo):
      // la rueda/trackpad mueve el foco como las flechas. En modo fluido manda el scroll nativo.
      var last = 0;
      doc.addEventListener('wheel', function (event) {
        if (TP.layout.isFluid()) return;
        if (event.preventDefault) event.preventDefault();
        var now = new Date().getTime();
        if (now - last < 250) return;
        var dx = event.deltaX || 0;
        var dy = event.deltaY || 0;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        last = now;
        if (Math.abs(dx) > Math.abs(dy) || event.shiftKey) onMove((dx || dy) > 0 ? 'right' : 'left');
        else onMove(dy > 0 ? 'down' : 'up');
      }, { passive: false });
    }
  };
})(this);
