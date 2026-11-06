/* Lifecycle (guía §11) y BACK/MENU de raíz (regla R6).
 * Standby/wakeup llegan como keycodes inyectados 0x7000001B / 0x7000001C.
 * No existe API documentada para FORZAR standby: no se implementa. */
(function (root) {
  var TP = root.TP = root.TP || {};
  var standbyHandlers = [];
  var wakeupHandlers = [];

  TP.lifecycle = {
    onStandby: function (fn) { standbyHandlers.push(fn); },
    onWakeup: function (fn) { wakeupHandlers.push(fn); },

    // true si el evento era de lifecycle y ya se manejó.
    handlePlatformKey: function (event) {
      var code = event.keyCode || event.which;
      var list = code === TP.keys.CODES.STANDBY ? standbyHandlers : code === TP.keys.CODES.WAKEUP ? wakeupHandlers : null;
      if (!list) return false;
      if (event.preventDefault) event.preventDefault();
      TP.debug.log(code === TP.keys.CODES.STANDBY ? 'standby' : 'wakeup');
      for (var i = 0; i < list.length; i++) {
        try { list[i](); } catch (e) { TP.debug.log('lifecycle error: ' + e.message); }
      }
      return true;
    },

    // R6: BACK en la pantalla raíz. Aislado y vacío a propósito: la plataforma maneja la salida.
    // TBD: conectar aquí la API oficial de salida cuando Totalplay la confirme. No usar window.close().
    handleRootBack: function (event) {
      if (event && event.preventDefault) event.preventDefault();
    },

    // R6: MENU. Aislado y vacío a propósito (mismo motivo que handleRootBack).
    handleMenu: function (event) {
      if (event && event.preventDefault) event.preventDefault();
    },

    // R6: EXIT/ESC. Lo maneja la plataforma; aquí no se hace nada.
    handleExit: function (event) {
      if (event && event.preventDefault) event.preventDefault();
    }
  };
})(this);
