/* Apertura de la ficha del contenido.
 * BLOCKED: no hay mecanismo documentado para abrir la ficha nativa de Totalplay ni la de
 * plataformas de terceros desde un Web App (formato de URL/esquema, si abre la app nativa,
 * y cómo se regresa a la trivia). */
(function (root) {
  var TP = root.TP = root.TP || {};

  TP.deeplink = {
    // Devuelve true si navegó. Si no, llama onUnavailable() para el aviso discreto (sin mover el foco).
    openDetail: function (item, onUnavailable) {
      if (item && item.detailUrl) {
        TP.debug.log('openDetail ' + item.id + ' -> ' + item.detailUrl);
        root.location.href = item.detailUrl;
        return true;
      }
      // TBD: reemplazar cuando exista el formato de ficha (Totalplay / plataformas).
      TP.debug.log('openDetail sin detailUrl: ' + (item ? item.id + ' ' + item.title : '(sin item)'));
      if (onUnavailable) onUnavailable();
      return false;
    },

    // Abre el título en una plataforma concreta. BLOCKED: no hay formato de deep link ni para
    // Totalplay ni para terceros; en esta demo nunca sale de la app (decisión confirmada) y
    // llama onUnavailable() para el aviso. Cuando exista, vendrá en item.watchUrls[platformId].
    openPlatform: function (item, platformId, onUnavailable) {
      var url = item && item.watchUrls && item.watchUrls[platformId];
      if (url) {
        TP.debug.log('openPlatform ' + item.id + ' ' + platformId + ' -> ' + url);
        root.location.href = url;
        return true;
      }
      TP.debug.log('openPlatform sin URL (TBD): ' + (item ? item.id : '?') + ' ' + platformId);
      if (onUnavailable) onUnavailable();
      return false;
    }
  };
})(this);
