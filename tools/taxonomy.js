/* Mapeos editables TMDB -> atributos del recomendador. Documentados en TAXONOMY.md.
 * IDs de género: lista oficial de TMDB (/genre/movie/list y /genre/tv/list). */
'use strict';

// Género TMDB -> mood. El orden de los géneros del título decide el mood principal (máx. 2 moods).
var GENRE_TO_MOOD = {
  35: 'reir',                         // Comedia
  18: 'emocionarme', 10749: 'emocionarme', 10766: 'emocionarme', // Drama, Romance, Telenovela
  28: 'adrenalina', 12: 'adrenalina', 80: 'adrenalina', 10752: 'adrenalina',
  10759: 'adrenalina', 10768: 'adrenalina', 37: 'adrenalina',    // Acción, Aventura, Crimen, Bélica, Western
  9648: 'pensar', 878: 'pensar', 99: 'pensar', 36: 'pensar', 10765: 'pensar', // Misterio, Sci-Fi, Docu, Historia
  27: 'miedito', 53: 'miedito'        // Terror, Suspenso
};

// Géneros que se consultan en /discover para cubrir cada mood.
var MOOD_DISCOVER = {
  movie: { reir: '35', emocionarme: '18|10749', adrenalina: '28|12|80', pensar: '9648|878|99', miedito: '27|53' },
  tv: { reir: '35', emocionarme: '18|10766', adrenalina: '10759|80|10768', pensar: '9648|10765|99', miedito: null }
};
// TV no tiene género "Terror" en TMDB: para miedito en series se buscan estas palabras clave
// (/search/keyword, el ID se lee de la respuesta) y se usa with_keywords en /discover/tv.
var MOOD_KEYWORD_QUERIES = { miedito: ['horror', 'supernatural'] };
// Palabra clave del título (inglés, TMDB) -> mood extra. Así las series de terror reciben "miedito".
var KEYWORD_TO_MOOD = {
  'horror': 'miedito', 'supernatural horror': 'miedito', 'supernatural': 'miedito', 'zombie': 'miedito',
  'ghost': 'miedito', 'haunted house': 'miedito', 'slasher': 'miedito', 'demon': 'miedito', 'vampire': 'miedito'
};

// attention: decide el género principal (primero de la lista). Ver TAXONOMY.md.
var LOW_ATTENTION = { 35: 1, 16: 1, 10764: 1, 10751: 1, 10767: 1, 10762: 1 };
var HIGH_ATTENTION = { 18: 1, 9648: 1, 53: 1, 878: 1, 10765: 1, 10752: 1, 10768: 1 };

// Certificaciones aptas para familia (spec §4.1).
// B en México es 12+: se excluye para que "En familia (hay niños)" sea de verdad apto para niños.
var FAMILY_CERTS = { MX: ['AA', 'A'], US: ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G'] };
var KIDS_ONLY_CERTS = ['TV-Y'];
var KIDS_GENRES = { 10762: 1 };

var PAREJA_GENRES = { 10749: 1, 18: 1, 10766: 1 };
var AMIGOS_GENRES = { 35: 1, 28: 1, 10759: 1, 27: 1, 12: 1 };

// Palabras clave (inglés en TMDB) -> etiqueta en español. Las no listadas se ignoran.
var KEYWORD_ES = {
  'superhero': 'superhéroes', 'based on comic': 'cómic', 'based on novel or book': 'basada en libro',
  'friendship': 'amistad', 'family': 'familia', 'love': 'amor', 'romance': 'romance',
  'revenge': 'venganza', 'murder': 'asesinato', 'serial killer': 'asesino serial',
  'detective': 'detectives', 'investigation': 'investigación', 'police': 'policías',
  'heist': 'atracos', 'mafia': 'mafia', 'drug cartel': 'narcos', 'prison': 'prisión',
  'time travel': 'viajes en el tiempo', 'space': 'espacio', 'alien': 'extraterrestres',
  'dystopia': 'distopía', 'artificial intelligence (a.i.)': 'inteligencia artificial',
  'robot': 'robots', 'magic': 'magia', 'dragon': 'dragones', 'zombie': 'zombis',
  'ghost': 'fantasmas', 'haunted house': 'casa embrujada', 'supernatural': 'sobrenatural',
  'demon': 'demonios', 'vampire': 'vampiros', 'survival': 'supervivencia',
  'high school': 'prepa', 'coming of age': 'crecer', 'sports': 'deportes', 'soccer': 'futbol',
  'music': 'música', 'musical': 'musical', 'true story': 'historia real',
  'biography': 'biografía', 'war': 'guerra', 'world war ii': 'segunda guerra',
  'animals': 'animales', 'dog': 'perritos', 'christmas': 'navidad', 'sitcom': 'sitcom',
  'mockumentary': 'falso documental', 'parody': 'parodia', 'satire': 'sátira',
  'teenager': 'adolescentes', 'workplace comedy': 'oficina', 'mexico': 'México',
  'anime': 'anime', 'based on video game': 'videojuegos', 'cooking': 'cocina',
  'competition': 'competencia', 'reality': 'reality', 'spy': 'espías', 'assassin': 'asesinos',
  'conspiracy': 'conspiración', 'psychological thriller': 'psicológico', 'mystery': 'misterio'
};

module.exports = {
  GENRE_TO_MOOD: GENRE_TO_MOOD,
  MOOD_DISCOVER: MOOD_DISCOVER,
  MOOD_KEYWORD_QUERIES: MOOD_KEYWORD_QUERIES,
  KEYWORD_TO_MOOD: KEYWORD_TO_MOOD,
  LOW_ATTENTION: LOW_ATTENTION,
  HIGH_ATTENTION: HIGH_ATTENTION,
  FAMILY_CERTS: FAMILY_CERTS,
  KIDS_ONLY_CERTS: KIDS_ONLY_CERTS,
  KIDS_GENRES: KIDS_GENRES,
  PAREJA_GENRES: PAREJA_GENRES,
  AMIGOS_GENRES: AMIGOS_GENRES,
  KEYWORD_ES: KEYWORD_ES
};
