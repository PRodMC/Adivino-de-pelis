/* Secuencia fija de pantallas: bienvenida, suscripciones, Q1..Q6 con checkpoints
 * (C1 tras Q2, C2 tras Q4, según config/questions.js), pensando y resultados. */
(function (root) {
  var TP = root.TP = root.TP || {};

  function build() {
    var steps = [{ name: 'welcome', bg: 'ink' }, { name: 'subscriptions', bg: 'ink' }];
    var qs = TP.copy.questions;
    var cps = TP.copy.checkpoints;
    for (var i = 0; i < qs.length; i++) {
      steps.push({ name: 'question', q: i, bg: qs[i].color });
      for (var c = 0; c < cps.length; c++) {
        if (cps[c].after === i) steps.push({ name: 'checkpoint', c: c, bg: 'night' });
      }
    }
    steps.push({ name: 'thinking', bg: 'night' });
    steps.push({ name: 'results', bg: 'night' });
    return steps;
  }

  TP.routes = {
    steps: null,
    init: function () { TP.routes.steps = build(); return TP.routes.steps; },
    indexOf: function (name, q) {
      var s = TP.routes.steps;
      for (var i = 0; i < s.length; i++) {
        if (s[i].name === name && (q === undefined || s[i].q === q)) return i;
      }
      return 0;
    },
    // BACK: un paso atrás. Preguntas y checkpoints regresan a la pregunta anterior;
    // resultados regresa a la última pregunta; pensando no tiene BACK. null = raíz.
    backFrom: function (index) {
      var s = TP.routes.steps;
      var step = s[index];
      if (step.name === 'welcome') return null;
      if (step.name === 'thinking') return index;
      for (var i = index - 1; i >= 0; i--) {
        if (step.name === 'subscriptions') return i;
        if (s[i].name === 'question' || s[i].name === 'subscriptions') return i;
      }
      return 0;
    }
  };
})(this);
