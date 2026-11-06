/* Orquestador: pantallas, transiciones, teclas, lifecycle y red.
 * La UI nunca llama sagem.*: todo pasa por TP.focus / TP.lifecycle / TP.network / TP.deeplink. */
(function (root) {
  var TP = root.TP = root.TP || {};
  var doc = root.document;
  var h = function () { return TP.ui.h.apply(null, arguments); };

  var stage, sweep, noticeEl, netEl;
  var state;
  var current = null;   // { index, screen: { el, onBack, onFocus } }
  var timers = [];
  var busy = false;
  var paused = false;
  var noticeTimer = null;

  // ---------- temporizadores (se limpian al cambiar de pantalla y en standby) ----------
  function later(fn, ms) {
    var id = root.setTimeout(function () {
      for (var i = 0; i < timers.length; i++) if (timers[i] === id) { timers.splice(i, 1); break; }
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() {
    for (var i = 0; i < timers.length; i++) root.clearTimeout(timers[i]);
    timers = [];
  }

  // ---------- navegación entre pasos ----------
  function render(index) {
    var step = TP.routes.steps[index];
    state.step = index;
    var screen = TP.screens[step.name].render(ctx, step);
    if (current && current.screen.el.parentNode) {
      if (current.screen.destroy) current.screen.destroy();
      stage.removeChild(current.screen.el);
    }
    stage.insertBefore(screen.el, sweep);
    current = { index: index, screen: screen };
    TP.focus.setScope(screen.el, screen.focus || null);
    busy = false;
  }

  // Fuera del STB, cada paso hacia adelante entra al historial: el botón "atrás" del
  // celular/navegador funciona como BACK. En el STB no se toca el historial.
  var useHistory = !TP.hasTotalplayRuntime() && !!(root.history && root.history.pushState);

  function go(index, opts) {
    opts = opts || {};
    clearTimers();
    if (useHistory && !opts.back && !opts.instant && current && index !== current.index) {
      try { root.history.pushState({ step: index }, ''); } catch (e) { /* sin historial */ }
    }
    busy = true;
    var from = current ? TP.routes.steps[current.index] : null;
    var to = TP.routes.steps[index];
    var useSweep = from && !opts.instant && (to.name === 'question' || from.name === 'question');
    if (!useSweep) { render(index); return; }

    // El nuevo color "barre" la pantalla (translateX) y debajo se monta la nueva pantalla.
    sweep.className = (opts.back ? 'from-right ' : '') + 'sweep--' + to.bg;
    void sweep.offsetWidth; // reflow para que arranque la transición
    sweep.className += ' is-running';
    later(function () {
      render(index);
      sweep.className = '';
    }, TP.env.SWEEP_MS);
  }

  function next() { go(current.index + 1); }

  function back(event) {
    var target = TP.routes.backFrom(current.index);
    if (target === null) { TP.lifecycle.handleRootBack(event); return; } // R6: raíz, handler vacío
    if (target === current.index) return;
    go(target, { back: true });
  }

  function notice(text) {
    TP.ui.clear(noticeEl);
    noticeEl.appendChild(doc.createTextNode(text));
    noticeEl.className = 'notice t-caption is-on';
    if (noticeTimer) root.clearTimeout(noticeTimer);
    noticeTimer = root.setTimeout(function () { noticeEl.className = 'notice t-caption'; }, 2200);
  }

  // ---------- mouse / touch ----------
  function pointerActivate(el) {
    if (paused || busy || !current) return;
    if (!TP.focus.set(el)) return;
    TP.focus.activate();
  }
  function pointerMove(dir) {
    if (paused || busy || !current) return;
    TP.focus.move(dir);
  }

  // ---------- teclas ----------
  function onKey(event) {
    if (TP.lifecycle.handlePlatformKey(event)) return;
    var key = TP.keys.normalize(event);
    if (!key) return;
    if (event.preventDefault) event.preventDefault();
    if (key === 'MENU') { TP.lifecycle.handleMenu(event); return; }
    if (key === 'EXIT') { TP.lifecycle.handleExit(event); return; }
    if (paused || busy || !current) return;

    switch (key) {
      case 'LEFT': TP.focus.move('left'); break;
      case 'RIGHT': TP.focus.move('right'); break;
      case 'UP': TP.focus.move('up'); break;
      case 'DOWN': TP.focus.move('down'); break;
      case 'OK': TP.focus.activate(); break;
      case 'BACK':
        if (current.screen.onBack) current.screen.onBack(event);
        else back(event);
        break;
    }
  }

  // ---------- lifecycle ----------
  function onStandby() {
    paused = true;
    clearTimers();
    stage.className = 'is-paused';
    TP.network.stop();
    TP.state.save(state);
  }
  function onWakeup() {
    paused = false;
    stage.className = '';
    try { root.localStorage.removeItem('adivino.state.v1'); } catch (e) { /* sin storage */ }
    TP.network.start(TP.env.NETWORK_POLL_MS);
    // Re-monta la pantalla actual: reinicia "Pensando…" y revalida el foco.
    if (current) go(current.index, { instant: true });
  }

  var ctx = {
    later: later,
    next: next,
    back: back,
    go: go,
    notice: notice,
    lock: function () { busy = true; },
    state: null,   // se asigna en init
    catalog: null
  };

  function init() {
    TP.routes.init();
    stage = doc.getElementById('app');
    sweep = h('div');
    sweep.id = 'sweep';
    stage.appendChild(sweep);
    noticeEl = h('div', 'notice t-caption');
    stage.appendChild(noticeEl);
    netEl = h('div', 'net-status t-caption', TP.copy.network.offline);
    stage.appendChild(netEl);

    ctx.catalog = TP.catalog.load();
    state = TP.state.restore() || TP.state.create();
    ctx.state = state;

    TP.focus.onChange(function (el) {
      if (current && current.screen.onFocus) current.screen.onFocus(el);
    });
    TP.lifecycle.onStandby(onStandby);
    TP.lifecycle.onWakeup(onWakeup);
    TP.network.onChange(function (s) { netEl.className = 'net-status t-caption' + (s === 'offline' ? ' is-on' : ''); });
    TP.network.start(TP.env.NETWORK_POLL_MS);

    doc.addEventListener('keydown', onKey, false);
    TP.pointer.init(pointerActivate, pointerMove);
    if (useHistory) {
      root.addEventListener('popstate', function () {
        if (!paused && current && !busy) back();
      }, false);
    }
    TP.layout.init();
    // Al cambiar entre escalado y fluido (p. ej. al girar el celular) se re-monta la pantalla.
    TP.layout.onModeChange(function () { if (current) go(current.index, { instant: true }); });

    var start = state.step;
    var steps = TP.routes.steps;
    if (steps[start] && (steps[start].name === 'results' || steps[start].name === 'thinking')) {
      start = TP.routes.indexOf('thinking'); // los resultados se recalculan
    }
    go(start, { instant: true });
    TP.debug.log('listo: ' + ctx.catalog.items.length + ' títulos, Totalplay ' + ctx.catalog.totalplayMode);
  }

  TP.app = { init: init, ctx: ctx };
})(this);
