/* Tarjeta de resultado: póster 2:3 (300x450, w342) + título (máx. 2 líneas) +
 * duración · clasificación · año, género · plataforma, y una sinopsis breve (3 líneas). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };
  var SYNOPSIS_MAX = 62;

  function duration(min) {
    if (min < 60) return min + ' min';
    var hrs = Math.floor(min / 60);
    var rest = min % 60;
    return hrs + ' h' + (rest ? ' ' + rest + ' min' : '');
  }

  // "MX:B" -> "B"; sin dato -> "Sin clasificación"
  function rating(cert) {
    if (!cert) return 'Sin clasificación';
    var parts = String(cert).split(':');
    return parts[1] || parts[0];
  }

  function genres(item) {
    var list = (item.genres && item.genres.length) ? item.genres : item.tags || [];
    var out = [];
    for (var i = 0; i < list.length && out.length < 1; i++) {
      var g = String(list[i]);
      out.push(g.charAt(0).toUpperCase() + g.slice(1));
    }
    return out.join(', ');
  }

  function shortText(s, max) {
    s = String(s || '');
    if (s.length <= max) return s;
    var cut = s.slice(0, max);
    var sp = cut.lastIndexOf(' ');
    return (sp > max / 2 ? cut.slice(0, sp) : cut).replace(/[\s,.;:…]+$/, '') + '…';
  }

  TP.ui.contentCard = function (item, index, platformLabel, onActivate) {
    var el = h('div', 'card');
    el.setAttribute('data-focusable', '');
    el.__tpActivate = onActivate;

    var poster = h('div', 'card__poster');
    var parts = TP.ui.flipFace(item, index);
    poster.appendChild(parts.face);
    el.appendChild(poster);
    el.appendChild(h('div', 'card__title t-option', item.title));

    var line1 = [];
    line1.push(item.type === 'series' ? duration(item.durationMin) + '/ep.' : duration(item.durationMin));
    line1.push(rating(item.certification));
    if (item.year) line1.push(item.year);
    el.appendChild(h('div', 'card__meta t-caption', line1.join(' · ')));

    var g = genres(item);
    el.appendChild(h('div', 'card__meta t-caption', (g ? g + ' · ' : '') + platformLabel));
    if (item.synopsis) el.appendChild(h('p', 'card__desc t-caption', shortText(item.synopsis, SYNOPSIS_MAX)));

    el.__poster = poster;
    el.__front = parts.front;
    el.__item = item;
    return el;
  };
})(this);
