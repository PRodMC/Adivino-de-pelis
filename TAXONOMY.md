# Taxonomía TMDB → recomendador

Los mapeos viven en `tools/taxonomy.js` (editables). Este archivo explica las reglas. Después de cambiar algo, corre `node tools/build-catalog.js`.

## moods (máx. 2 por título)
Se recorren los géneros del título en el orden de TMDB; el primero que mapea es el mood principal.

| Mood | Géneros TMDB |
|---|---|
| reir | Comedia |
| emocionarme | Drama, Romance, Telenovela |
| adrenalina | Acción, Aventura, Crimen, Bélica, Acción y Aventura (TV), Guerra y Política (TV), Western |
| pensar | Misterio, Ciencia ficción, Documental, Historia, Sci-Fi y Fantasía (TV) |
| miedito | Terror, Suspenso |

TV no tiene género "Terror" en TMDB. Por eso las palabras clave `horror`, `supernatural`, `zombie`, `ghost`, `haunted house`, `slasher`, `demon` y `vampire` agregan **miedito**: si el título ya tiene 2 moods, miedito reemplaza al segundo. Para el bucket de series de miedo, `/discover/tv` usa `with_keywords`. Los IDs de keyword se leen de `/search/keyword`; no se escriben de memoria.

Un título sin ningún mood mapeable se descarta.

## tags (máx. 5, en español)
Nombres de género en es-MX más las palabras clave de TMDB que tienen traducción en `KEYWORD_ES`. Las que no tienen traducción se ignoran.

## attention
Lo decide el **género principal**: el primero de la lista que esté en una de las dos tablas.
- `low`: Comedia, Animación, Reality, Familia, Talk, Kids
- `high`: Drama, Misterio, Suspenso, Ciencia ficción, Sci-Fi y Fantasía, Bélica, Guerra y Política
- Si no está en ninguna: `high`

## audience
- `familia`: solo con certificación apta. MX: A, AA, B. US (respaldo): G, PG, TV-Y, TV-G. Sin certificación no se marca familia (criterio conservador).
  - Ojo: en México **B** es para 12 años en adelante. Se incluye porque así lo pide la especificación; quitarlo de `FAMILY_CERTS.MX` lo vuelve más estricto.
- `pareja`: Romance, Drama o Telenovela
- `amigos`: Comedia, Acción, Acción y Aventura, Terror o Aventura
- `solo`: siempre, salvo contenido infantil exclusivo (género Kids o certificación TV-Y)

## durationMin
- Película: `runtime`
- Serie: `episode_run_time[0]` o, si falta, `last_episode_to_air.runtime`
- Si no hay duración, el título se descarta.

## Selección (~80 títulos, 40 películas / 40 series)
`/discover` con `watch_region=MX`, `with_watch_monetization_types=flatrate` y las plataformas objetivo, ordenado por popularidad. Hay un bucket por:
- cada mood
- familia
- series cortas (≤ 30 y 31–45 min)
- clásicos (por número de votos, antes de 2005/2008)
- novedades (últimos 2 años)
- cada plataforma, para que ViX y Apple TV también aparezcan

La selección final reparte los lugares entre los buckets en round-robin. Solo cuenta `flatrate` (suscripción).
