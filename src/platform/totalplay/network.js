/* Conectividad (guía §12). Polling con sagem.Get("INFO","ETHERNET") solo con runtime Totalplay.
 * Hoy el catálogo es un snapshot local, así que la red solo afecta a las portadas remotas;
 * este módulo queda como hook para el catálogo real (TBD). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var status = 'unknown'; // 'online' | 'offline' | 'unknown'
  var timer = null;
  var listeners = [];

  function read() {
    if (!TP.hasTotalplayRuntime()) return 'online'; // escritorio: se asume conectado
    var eth = TP._sagem.get('INFO', 'ETHERNET');
    if (eth === null || eth === 'unknown') return 'unknown';
    return /^No link/i.test(String(eth)) ? 'offline' : 'online';
  }

  function check() {
    var next = read();
    if (next !== status) {
      status = next;
      TP.debug.log('red: ' + status);
      for (var i = 0; i < listeners.length; i++) listeners[i](status);
    }
    return status;
  }

  TP.network = {
    getEthernetStatus: function () { return TP._sagem.get('INFO', 'ETHERNET'); },
    ping: function (host) { return TP._sagem.get('NETWORK', 'PING', host); }, // timeout = -1
    status: function () { return status; },
    check: check,
    onChange: function (fn) { listeners.push(fn); },
    start: function (intervalMs) {
      TP.network.stop();
      check();
      if (TP.hasTotalplayRuntime()) timer = root.setInterval(check, intervalMs);
    },
    stop: function () {
      if (timer) root.clearInterval(timer);
      timer = null;
    }
  };
})(this);
