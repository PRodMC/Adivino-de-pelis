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
    }
  };
})(this);
