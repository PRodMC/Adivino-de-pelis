/* Panel de detalle: la tarjeta "crece" (el póster viaja de la tarjeta a su lugar con
 * translate+scale; el resto aparece con opacity). Muestra descripción completa, género,
 * clasificación y botones "Ver en <plataforma>". Solo transform/opacity (R3). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  var GROW_MS = 320;
  var LONG_OVERVIEW = 420; // más largo que esto: tamaño caption para que quepa sin scroll en TV

  function duration(min) {
    if (min < 60) return min + ' min';
    var hrs = Math.floor(min / 60);
    var rest = min % 60;
    return hrs + ' h' + (rest ? ' ' + rest + ' min' : '');
  }
  function ratingOf(cert) {
    if (!cert) return null;
    var p = String(cert).split(':');
    return p[1] || p[0];
  }
  function setTransform(el, value) { el.style.webkitTransform = el.style.transform = value; }

  // Plataformas donde se puede ver: primero las que eligió el usuario, luego el resto; Totalplay al final.
  function watchTargets(item, subs) {
    var out = [];
    var i;
    for (i = 0; i < item.platforms.length; i++) if (subs.indexOf(item.platforms[i]) !== -1) out.push(item.platforms[i]);
    for (i = 0; i < item.platforms.length; i++) if (out.indexOf(item.platforms[i]) === -1) out.push(item.platforms[i]);
    if (item.source === 'totalplay') out.push('totalplay');
    return out;
  }

  /* opts: { host (pantalla), item, fromPoster (elemento de la tarjeta), subs, later,
   *         onWatch(platformId, button), onClose() } */
  TP.ui.detail = function (opts) {
    var c = TP.copy.detail;
    var item = opts.item;

    var el = h('div', 'detail');
    el.setAttribute('role', 'dialog');
    var backdrop = h('div', 'detail__backdrop');
    el.appendChild(backdrop);

    var poster = h('div', 'detail__poster');
    poster.appendChild(TP.ui.posterArt(item, 0));
    TP.ui.attachImage(poster, item, 342, 513);
    el.appendChild(poster);

    var info = h('div', 'detail__info');
    info.appendChild(h('h2', 'detail__title t-question', item.title));

    var meta = [];
    if (item.year) meta.push(item.year);
    meta.push(item.type === 'series' ? c.series + ' · ' + duration(item.durationMin) + ' ' + c.perEpisode : c.movie + ' · ' + duration(item.durationMin));
    info.appendChild(h('p', 'detail__meta t-body', meta.join(' · ')));

    var rating = ratingOf(item.certification);
    info.appendChild(h('p', 'detail__meta t-body', c.rating + ': ' + (rating || c.noRating)));
    var genres = (item.genres && item.genres.length) ? item.genres : item.tags;
    if (genres && genres.length) info.appendChild(h('p', 'detail__meta t-body', c.genre + ': ' + genres.join(', ')));

    var text = item.overview || item.synopsis || '';
    if (text) info.appendChild(h('p', 'detail__overview ' + (text.length > LONG_OVERVIEW ? 't-caption' : 't-body'), text));

    var actions = h('div', 'detail__actions');
    var targets = watchTargets(item, opts.subs);
    var first = null;
    for (var t = 0; t < targets.length; t++) {
      (function (pid) {
        var btn = TP.ui.button(c.watchOn.replace('{p}', TP.platforms.nameOf(pid)), function () { opts.onWatch(pid, btn); }, 'detail__watch');
        actions.appendChild(btn);
        if (!first) first = btn;
      })(targets[t]);
    }
    var back = TP.ui.button(c.back, function () { opts.onClose(); }, 'detail__back');
    actions.appendChild(back);
    info.appendChild(actions);
    el.appendChild(info);

    // Loader "te estamos llevando a…" (oculto hasta que se elige una plataforma).
    var loader = h('div', 'detail__loader');
    var loaderText = h('p', 'detail__loader-text t-question');
    loader.appendChild(loaderText);
    var dots = h('div', 'dots');
    loader.appendChild(dots);
    el.appendChild(loader);

    opts.host.appendChild(el);

    // ---- "crecer" desde la tarjeta (FLIP: se mide el destino y se arranca en el origen) ----
    function grow() {
      var from = opts.fromPoster.getBoundingClientRect();
      var to = poster.getBoundingClientRect();
      var scale = to.width ? from.width / to.width : 1;
      var unit = poster.offsetWidth ? to.width / poster.offsetWidth : 1; // escala del lienzo (modo escalado)
      var dx = (from.left - to.left) / unit;
      var dy = (from.top - to.top) / unit;
      setTransform(poster, 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')');
      el.className = 'detail is-start';
      void poster.offsetWidth;
      el.className = 'detail is-open';
      setTransform(poster, '');
    }
    grow();

    return {
      el: el,
      focus: first || back,
      back: back,
      showLoader: function (platformName) {
        TP.ui.clear(loaderText);
        TP.ui.richText(loaderText, c.loading.replace('{p}', '*' + platformName + '*'));
        TP.ui.clear(dots);
        for (var d = 0; d < 3; d++) dots.appendChild(h('span', 'dot'));
        el.className = 'detail is-open is-loading';
      },
      hideLoader: function () { el.className = 'detail is-open'; },
      close: function (done) {
        el.className = 'detail is-closing';
        opts.later(function () {
          TP.ui.releaseImage(poster);
          if (el.parentNode) el.parentNode.removeChild(el);
          if (done) done();
        }, 200);
      },
      GROW_MS: GROW_MS
    };
  };
})(this);
