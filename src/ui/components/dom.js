/* Utilidades DOM mínimas y póster con imagen perezosa + arte CSS de respaldo. */
(function (root) {
  var TP = root.TP = root.TP || {};
  var doc = root.document;
  TP.ui = TP.ui || {};

  function h(tag, className, text) {
    var el = doc.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.appendChild(doc.createTextNode(text));
    return el;
  }

  // Texto con *palabras* resaltadas en dorado (sin innerHTML con datos externos).
  function richText(el, text) {
    var parts = String(text).split('*');
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      if (i % 2) el.appendChild(h('em', 'gold', parts[i]));
      else el.appendChild(doc.createTextNode(parts[i]));
    }
    return el;
  }

  function accentClass(i) { return 'accent-' + (i % 6); }

  // Arte CSS plano (rotación de acentos + forma geométrica + título). La app es usable sin imágenes.
  function posterArt(item, index) {
    var art = h('div', 'poster-art ' + accentClass(index));
    art.appendChild(h('div', 'poster-art__shape'));
    art.appendChild(h('div', 'poster-art__title t-option', item.title));
    return art;
  }

  // Crea la <img> (si no existe) encima del arte. Si falla, se quita y queda el arte.
  function attachImage(container, item, w, hgt) {
    if (!item.posterUrl || container.__img) return;
    var img = doc.createElement('img');
    img.className = 'poster-img';
    img.width = w;
    img.height = hgt;
    img.alt = item.title;
    img.style.visibility = 'hidden'; // mientras carga se ve el arte
    img.onload = function () { img.style.visibility = 'visible'; };
    img.onerror = function () { releaseImage(container); };
    img.src = item.posterUrl;
    container.__img = img;
    container.appendChild(img);
  }

  // Suelta la imagen decodificada (cuida RAM: ~0.7 MB por póster w342).
  function releaseImage(container) {
    var img = container.__img;
    if (!img) return;
    img.onload = img.onerror = null;
    img.removeAttribute('src');
    if (img.parentNode) img.parentNode.removeChild(img);
    container.__img = null;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  // Solo en modo fluido (scroll nativo). Navegadores viejos: sin opciones.
  function scrollIntoView(el) {
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
    catch (e) { try { el.scrollIntoView(false); } catch (e2) { /* sin soporte */ } }
  }

  TP.ui.h = h;
  TP.ui.richText = richText;
  TP.ui.accentClass = accentClass;
  TP.ui.posterArt = posterArt;
  TP.ui.attachImage = attachImage;
  TP.ui.releaseImage = releaseImage;
  TP.ui.clear = clear;
  TP.ui.scrollIntoView = scrollIntoView;
})(this);
