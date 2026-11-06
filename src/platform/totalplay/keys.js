/* Mapa de teclas del control (guía §6). */
(function (root) {
  var TP = root.TP = root.TP || {};

  var CODES = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    OK: 13, BACK: 461, EXIT: 27, MENU: 462,
    STANDBY: 0x7000001B, WAKEUP: 0x7000001C
  };

  var byCode = {};
  for (var name in CODES) if (CODES.hasOwnProperty(name)) byCode[CODES[name]] = name;

  TP.keys = {
    CODES: CODES,
    // Devuelve 'LEFT' | 'UP' | ... | 'NUM_0'..'NUM_9' | null
    normalize: function (event) {
      var code = event.keyCode || event.which;
      if (byCode[code]) return byCode[code];
      if (code >= 48 && code <= 57) return 'NUM_' + (code - 48);
      // Solo en escritorio (sin runtime STB): Backspace = BACK, para probar sin control.
      if (code === 8 && !(TP.hasTotalplayRuntime && TP.hasTotalplayRuntime())) return 'BACK';
      return null;
    }
  };
})(this);
