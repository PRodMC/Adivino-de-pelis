/* Estado de la trivia. localStorage solo con try/catch: la app no depende de él
 * (se usa únicamente para persistir en standby y restaurar al despertar). */
(function (root) {
  var TP = root.TP = root.TP || {};
  var KEY = 'adivino.state.v1';
  var MAX_AGE_MS = 60 * 60 * 1000;

  function fresh() {
    return { step: 0, subs: [], answers: {}, feedback: [], covers: [], results: null };
  }

  TP.state = {
    create: fresh,

    // Reinicia la trivia conservando las plataformas elegidas.
    resetTrivia: function (s) {
      s.answers = {};
      s.feedback = [];
      s.covers = [];
      s.results = null;
    },

    save: function (s) {
      try {
        root.localStorage.setItem(KEY, JSON.stringify({
          at: new Date().getTime(), step: s.step, subs: s.subs, answers: s.answers,
          feedback: s.feedback, covers: s.covers
        }));
      } catch (e) { /* sin storage: se ignora */ }
    },

    // Devuelve el estado guardado (y lo borra) o null.
    restore: function () {
      var raw = null;
      try {
        raw = root.localStorage.getItem(KEY);
        root.localStorage.removeItem(KEY);
      } catch (e) { return null; }
      if (!raw) return null;
      try {
        var d = JSON.parse(raw);
        if (!d || new Date().getTime() - d.at > MAX_AGE_MS) return null;
        var s = fresh();
        s.step = d.step || 0;
        s.subs = d.subs || [];
        s.answers = d.answers || {};
        s.feedback = d.feedback || [];
        s.covers = d.covers || [];
        return s;
      } catch (e2) { return null; }
    }
  };
})(this);
