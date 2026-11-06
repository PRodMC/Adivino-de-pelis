/* FocusManager con navegación espacial real (guía §7–8): compara getBoundingClientRect()
 * de los [data-focusable] visibles del ámbito actual (la pantalla activa).
 * Overrides opcionales: data-nav-left/right/up/down="<id del destino>". */
(function (root) {
  var TP = root.TP = root.TP || {};
  var doc = root.document;

  var scope = null;
  var current = null;
  var listeners = [];

  function isEnabled(el) {
    if (!el || el.getAttribute('data-disabled') === 'true') return false;
    if (scope && !scope.contains(el)) return false;
    // offsetWidth ignora transforms: una tarjeta a media animación (scaleX(0)) sigue siendo enfocable.
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  function focusables() {
    if (!scope) return [];
    var list = scope.querySelectorAll('[data-focusable]');
    var out = [];
    for (var i = 0; i < list.length; i++) if (isEnabled(list[i])) out.push(list[i]);
    return out;
  }

  function setFocus(el) {
    if (!el || !isEnabled(el)) return false;
    if (current && current !== el) current.classList.remove('is-focused');
    current = el;
    el.classList.add('is-focused');
    for (var i = 0; i < listeners.length; i++) listeners[i](el);
    return true;
  }

  function center(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function findNext(dir) {
    var override = current.getAttribute('data-nav-' + dir);
    if (override) {
      var target = doc.getElementById(override);
      if (isEnabled(target)) return target;
    }
    // Se comparan bordes (no centros): tarjetas de la misma fila con alturas distintas siguen
    // siendo "la misma fila". TOL absorbe el scale(1.08–1.1) del elemento enfocado.
    var TOL = 32;
    var fr = current.getBoundingClientRect();
    var from = center(fr);
    var best = null;
    var bestScore = Infinity;
    var list = focusables();
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === current) continue;
      var r = el.getBoundingClientRect();
      var c = center(r);
      var primary; var secondary;
      if (dir === 'right') { if (r.left < fr.right - TOL) continue; primary = r.left - fr.right; secondary = Math.abs(c.y - from.y); }
      else if (dir === 'left') { if (r.right > fr.left + TOL) continue; primary = fr.left - r.right; secondary = Math.abs(c.y - from.y); }
      else if (dir === 'down') { if (r.top < fr.bottom - TOL) continue; primary = r.top - fr.bottom; secondary = Math.abs(c.x - from.x); }
      else { if (r.bottom > fr.top + TOL) continue; primary = fr.top - r.bottom; secondary = Math.abs(c.x - from.x); }
      if (primary < 0) primary = 0;
      // Horizontal: se prefiere fuertemente la misma fila.
      var score = (dir === 'left' || dir === 'right') ? primary + secondary * 4 : primary + secondary * 0.6;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    return best;
  }

  TP.focus = {
    // Cambia el ámbito (pantalla) y fija el foco inicial; nunca queda sin foco si hay focusables.
    setScope: function (el, initial) {
      scope = el;
      current = null;
      if (!initial || !setFocus(initial)) TP.focus.focusFirst();
    },
    focusFirst: function () {
      var list = focusables();
      if (list.length) setFocus(list[0]);
      else current = null;
    },
    set: setFocus,
    current: function () { return current; },
    // Revalida tras refrescos/reordenamientos: si el foco quedó fuera, vuelve al primero.
    ensure: function () {
      if (!current || !isEnabled(current)) TP.focus.focusFirst();
    },
    move: function (dir) {
      TP.focus.ensure();
      if (!current) return false;
      var next = findNext(dir);
      return next ? setFocus(next) : false;
    },
    activate: function () {
      TP.focus.ensure();
      var el = current;
      if (!el) return;
      if (el.tagName === 'A' && el.getAttribute('href')) {
        root.location.href = el.getAttribute('href'); // no .click(): poco confiable en el motor del STB
        return;
      }
      if (typeof el.__tpActivate === 'function') el.__tpActivate(el);
    },
    onChange: function (fn) { listeners.push(fn); }
  };
})(this);
