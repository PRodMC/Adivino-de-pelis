/* Checkpoint C1/C2 ("¿voy por buen camino?"): 3 portadas + "Ninguna". Las portadas son pista,
 * no resultado: no abren la ficha. Elegir/Ninguna se guarda como feedback para el recomendador. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.screens = TP.screens || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  TP.screens.checkpoint = {
    render: function (ctx, step) {
      var cp = TP.copy.checkpoints[step.c];
      var state = ctx.state;

      // Solo cuentan las respuestas hasta esta pausa y los checkpoints anteriores.
      var answersSoFar = {};
      for (var q = 0; q <= cp.after; q++) {
        var key = TP.copy.questions[q].key;
        if (state.answers[key] !== undefined) answersSoFar[key] = state.answers[key];
      }
      var seen = [];
      var feedbackSoFar = [];
      for (var c = 0; c < step.c; c++) {
        if (state.covers[c]) seen = seen.concat(state.covers[c]);
        if (state.feedback[c]) feedbackSoFar.push(state.feedback[c]);
      }
      var covers = TP.recommender.pickCheckpointCovers(answersSoFar, state.subs, ctx.catalog, seen, feedbackSoFar);
      var shownIds = [];
      for (var i = 0; i < covers.length; i++) shownIds.push(covers[i].id);
      state.covers[step.c] = shownIds;
      state.covers.length = step.c + 1;
      state.feedback.length = step.c; // se reescribe al contestar

      function answer(pickedId) {
        state.feedback[step.c] = { shown: shownIds, picked: pickedId };
        ctx.next();
      }

      var el = h('div', 'screen screen--night screen--checkpoint');
      var halo = h('div', 'halo');
      el.appendChild(halo);
      TP.ui.starfield(el, true);
      el.appendChild(TP.ui.richText(h('h1', 'checkpoint__headline t-question anim-rise'), pick(cp.headlines)));

      var row = h('div', 'checkpoint__covers');
      for (var k = 0; k < covers.length; k++) {
        (function (item, idx) {
          var card = TP.ui.coverCard(item, idx, function () { answer(item.id); }, ctx.later);
          row.appendChild(card);
        })(covers[k], k);
      }
      el.appendChild(row);

      var none = TP.ui.button(TP.copy.checkpointNone, function () { answer(null); }, 'checkpoint__none');
      none.id = 'cp-none';
      el.appendChild(none);
      // ←→ recorre portadas y "Ninguna"; ↓ baja al botón; ↑ regresa a las portadas.
      if (row.lastChild) {
        row.lastChild.setAttribute('data-nav-right', 'cp-none');
        none.setAttribute('data-nav-left', row.lastChild.id);
      }

      return {
        el: el,
        focus: row.firstChild || none,
        onFocus: function (focused) {
          // El halo estático se aclara cambiando de clase (sin animar el gradiente).
          halo.className = 'halo' + (focused !== none ? ' is-lit' : '');
        }
      };
    }
  };
})(this);
