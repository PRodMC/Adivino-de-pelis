/* 2–7. Pregunta: texto grande + 2–5 opciones. OK elige, muestra reacción (~400 ms) y avanza solo. */
(function (root) {
  var TP = root.TP = root.TP || {};
  TP.screens = TP.screens || {};
  var h = function () { return TP.ui.h.apply(null, arguments); };

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  TP.screens.question = {
    render: function (ctx, step) {
      var q = TP.copy.questions[step.q];
      var total = TP.copy.questions.length;
      var state = ctx.state;
      var el = h('div', 'screen screen--question screen--' + q.color);

      // Agregado a confirmar: indicador discreto de progreso (no cuenta checkpoints).
      el.appendChild(h('p', 'question__progress t-caption',
        TP.copy.progress.replace('{n}', step.q + 1).replace('{total}', total)));
      el.appendChild(h('h1', 'question__text t-question anim-rise', q.text));
      var reaction = h('p', 'question__reaction t-title', '');
      el.appendChild(reaction);

      var opts = h('div', 'question__options' + (q.options.length > 4 ? ' question__options--wrap' : ''));
      var initial = null;
      for (var i = 0; i < q.options.length; i++) {
        (function (opt, idx) {
          var card = TP.ui.optionCard(opt.label, function () {
            state.answers[q.key] = opt.value;
            card.className += ' is-chosen';
            TP.ui.clear(reaction);
            reaction.appendChild(root.document.createTextNode(pick(q.reactions)));
            reaction.className += ' is-on';
            ctx.lock();
            ctx.later(ctx.next, TP.env.REACTION_MS);
          }, idx);
          if (state.answers[q.key] === opt.value) initial = card; // restaura foco al volver
          opts.appendChild(card);
        })(q.options[i], i);
      }
      el.appendChild(opts);
      return { el: el, focus: initial || opts.firstChild };
    }
  };
})(this);
