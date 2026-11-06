/* Identificación de dispositivo (guía §9, §24). Único lugar, junto con el resto de
 * src/platform/totalplay/, donde se permite sagem.*. Fuera del STB usa un mock. */
(function (root) {
  var TP = root.TP = root.TP || {};

  function hasTotalplayRuntime() {
    return typeof root !== 'undefined' && typeof root.sagem !== 'undefined';
  }

  // Mock de desarrollo: valores fijos, nunca se usan para lógica de negocio.
  var MOCK = {
    'WEBSERVICE/USER_AGENT': 'DEV-MOCK',
    'INFO/PRODUCT_ID': 'DEV',
    'INFO/SOFTWARE_VERSION': '0.0.0-dev',
    'INFO/SERIAL_NUMBER': 'DEV-SERIAL',
    'NETWORK/MAC': '00:00:00:00:00:00',
    'INFO/ETHERNET': 'Link OK 100M Full Duplex',
    'STB/HDMI/RESOLUTION': '1920x1080P60'
  };

  function sagemGet() {
    var args = Array.prototype.slice.call(arguments);
    if (hasTotalplayRuntime()) {
      try { return root.sagem.Get.apply(root.sagem, args); } catch (e) { return null; }
    }
    var v = MOCK[args.join('/')];
    return typeof v === 'undefined' ? null : v;
  }

  function sagemSet() {
    if (!hasTotalplayRuntime()) return false;
    try { root.sagem.Set.apply(root.sagem, Array.prototype.slice.call(arguments)); return true; } catch (e) { return false; }
  }

  TP.hasTotalplayRuntime = hasTotalplayRuntime;
  // Acceso interno para los demás módulos de platform/totalplay/. La UI no debe usarlo.
  TP._sagem = { get: sagemGet, set: sagemSet };

  TP.device = {
    getModel: function () { return sagemGet('WEBSERVICE', 'USER_AGENT'); },
    getProductId: function () { return sagemGet('INFO', 'PRODUCT_ID'); },
    getSoftwareVersion: function () { return sagemGet('INFO', 'SOFTWARE_VERSION'); },
    getSerialNumber: function () { return sagemGet('INFO', 'SERIAL_NUMBER'); },
    getMacAddress: function () { return sagemGet('NETWORK', 'MAC'); },
    getResolution: function () { return sagemGet('STB', 'HDMI', 'RESOLUTION'); }
  };
})(this);
