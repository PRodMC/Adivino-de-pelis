/* Adaptación al tamaño de pantalla (regla R5), con D-pad como caso base:
 * - 'scaled' (TV, STB, computadora): el lienzo 1920x1080 se escala para caber completo
 *   (720p, 1080p, laptops). A 1920x1080 exactos no se aplica ningún transform.
 * - 'fluid' (celular / ventana angosta, nunca en el STB): layout fluido con clamp()/vw y
 *   scroll vertical natural (styles/responsive.css). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var doc = root.document;
  var W = 1920;
  var H = 1080;
  var mode = null;
  var listeners = [];
  var timer = null;

  function decide() {
    var w = root.innerWidth || W;
    var h = root.innerHeight || H;
    var scale = Math.min(w / W, h / H);
    var fluid = !TP.hasTotalplayRuntime() && (w < h || scale < 0.45);
    return { mode: fluid ? 'fluid' : 'scaled', scale: scale, w: w, h: h };
  }

  function apply() {
    var d = decide();
    var app = doc.getElementById('app');
    var html = doc.documentElement;
    html.className = html.className.replace(/ ?layout-(scaled|fluid)/g, '') + ' layout-' + d.mode;
    if (d.mode === 'scaled' && Math.abs(d.scale - 1) > 0.001) {
      var x = Math.round((d.w - W * d.scale) / 2);
      var y = Math.round((d.h - H * d.scale) / 2);
      app.style.webkitTransform = app.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + d.scale + ')';
    } else {
      app.style.webkitTransform = app.style.transform = '';
    }
    var changed = mode !== null && mode !== d.mode;
    mode = d.mode;
    if (changed) for (var i = 0; i < listeners.length; i++) listeners[i](mode);
  }

  function onResize() {
    if (timer) root.clearTimeout(timer);
    timer = root.setTimeout(apply, 150);
  }

  TP.layout = {
    init: function () {
      apply();
      root.addEventListener('resize', onResize, false);
      root.addEventListener('orientationchange', onResize, false);
    },
    isFluid: function () { return mode === 'fluid'; },
    onModeChange: function (fn) { listeners.push(fn); }
  };
})(this);
