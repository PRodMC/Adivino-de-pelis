/* Logger de depuración (guía §16). En STB de desarrollo usa sagem.Set("LOG"); fuera, console.log.
 * No es requisito del flujo normal. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.debug = {
    log: function (msg) {
      var text = '[adivino] ' + msg;
      if (TP.hasTotalplayRuntime && TP.hasTotalplayRuntime()) {
        if (TP._sagem.set('LOG', text)) return;
      }
      if (root.console && root.console.log) root.console.log(text);
    }
  };
})(this);
