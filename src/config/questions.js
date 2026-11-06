/* Copy y opciones de la trivia (datos, no lógica). Editar aquí el texto sin tocar pantallas.
 * `key` es el campo de answers que usa src/app/recommender.js; `value` no se muestra. */
(function (root) {
  root.TP = root.TP || {};
  root.TP.copy = {
    welcome: {
      title: '¿Qué vemos hoy?',
      subtitle: 'Respóndeme 6 cosas y yo adivino',
      start: 'Empezar',
      attribution: 'Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB. Datos de disponibilidad: JustWatch.'
    },
    subscriptions: {
      title: '¿En qué plataformas buscamos?',
      next: 'Continuar'
    },
    progress: '{n} de {total}', // agregado a confirmar
    questions: [
      {
        key: 'time', color: 'yellow',
        text: '¿Cuánto tiempo tienes?',
        options: [
          { value: 'short', label: 'Un ratito (≤\u00a045\u00a0min)' },
          { value: 'normal', label: 'Una peli normal (~2\u00a0h)' },
          { value: 'any', label: 'Hoy no tengo prisa' }
        ],
        reactions: ['Anotado.', 'Ah, va.', 'Me cuadra.', 'Perfecto.']
      },
      {
        key: 'type', color: 'pink',
        text: '¿Peli o serie?',
        options: [
          { value: 'movie', label: 'Película' },
          { value: 'series', label: 'Serie' },
          { value: 'any', label: 'Sorpréndeme' }
        ],
        reactions: ['Mmm, interesante…', 'Buena elección.', '¡Eso!']
      },
      {
        key: 'attention', color: 'cyan',
        text: '¿Le vas a poner atención o es de fondo?',
        options: [
          { value: 'high', label: 'Atención total' },
          { value: 'low', label: 'Voy a andar en el celular / cocinando' }
        ],
        reactions: ['Te conozco.', 'Muy tú.', 'Ya decía yo.']
      },
      {
        key: 'mood', color: 'lime',
        text: '¿Con qué ánimo andas?',
        options: [
          { value: 'reir', label: 'Reír' },
          { value: 'emocionarme', label: 'Emocionarme' },
          { value: 'adrenalina', label: 'Adrenalina' },
          { value: 'pensar', label: 'Que me haga pensar' },
          { value: 'miedito', label: 'Miedito' }
        ],
        reactions: ['¡Lo sabía!', 'Se nota.', 'Uy, órale.']
      },
      {
        key: 'audience', color: 'violet',
        text: '¿Quién ve?',
        options: [
          { value: 'solo', label: 'Solo yo' },
          { value: 'pareja', label: 'En pareja' },
          { value: 'amigos', label: 'Con amigos' },
          { value: 'familia', label: 'En familia (hay niños)' }
        ],
        reactions: ['Qué bonito.', 'Va, va.', 'Entendido.']
      },
      {
        key: 'novelty', color: 'orange',
        text: '¿Algo conocido o descubrir algo nuevo?',
        options: [
          { value: 'classic', label: 'Un clásico seguro' },
          { value: 'new', label: 'Algo recién salido' },
          { value: 'any', label: 'Me da igual' }
        ],
        reactions: ['Ya casi…', 'Lo tengo.', 'Mmm, ya veo.']
      }
    ],
    // Checkpoints de portadas: después de la pregunta con índice `after` (0-based).
    // En los titulares, *texto* se pinta en dorado.
    checkpoints: [
      {
        after: 1,
        headlines: [
          'Mmm… veo algo así en tu *futuro*. ¿Voy por buen camino?',
          'Veo… veo… algo así en tu *futuro*. ¿Le atino?',
          'Mi bola de cristal dice *esto*. ¿Voy bien?'
        ]
      },
      {
        after: 3,
        headlines: [
          'La imagen se *aclara*… ¿alguna de estas es lo tuyo?',
          'Ya te estoy *leyendo*… ¿alguna de estas?',
          'Lo veo más *claro*… ¿cuál va contigo?'
        ]
      }
    ],
    checkpointNone: 'Ninguna',
    thinking: [
      'Consultando a mi bola de cristal…',
      'Descartando lo que ya viste mil veces…',
      'Esquivando spoilers…'
    ],
    results: {
      platforms: 'En tus plataformas',
      totalplay: 'En el catálogo Totalplay',
      empty: 'Hoy mi bola de cristal no vio nada aquí',
      again: 'Volver a jugar',
      detailUnavailable: 'Ficha no disponible en esta demo'
    },
    network: {
      offline: 'Sin conexión'
    }
  };
})(this);
