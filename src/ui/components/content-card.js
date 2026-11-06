/* Tarjeta de resultado: póster 2:3 (320x480, w342) + título (option, máx. 2 líneas) + metadatos (body). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  function duration(min) {
    if (min < 60) return min + ' min';
    var hrs = Math.floor(min / 60);
    var rest = min % 60;
    return hrs + ' h' + (rest ? ' ' + rest + ' min' : '');
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

    var meta = [];
    if (item.year) meta.push(item.year);
    meta.push(item.type === 'series' ? duration(item.durationMin) + '/ep.' : duration(item.durationMin));
    meta.push(platformLabel);
    el.appendChild(h('div', 'card__meta t-body', meta.join(' · ')));

    el.__poster = poster;
    el.__front = parts.front;
    el.__item = item;
    return el;
  };
})(this);
