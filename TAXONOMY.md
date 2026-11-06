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

Si ningún género da ánimo, se usa un respaldo: Animación, Familia, Kids, Reality y Talk → **reir**; Música → **emocionarme**. Así no se pierden cortos y especiales. Solo si tampoco hay respaldo, el título se descarta.

## tags (máx. 5, en español)
Nombres de género en es-MX más las palabras clave de TMDB que tienen traducción en `KEYWORD_ES`. Las que no tienen traducción se ignoran.

## attention
Lo decide el **género principal**: el primero de la lista que esté en una de las dos tablas.
- `low`: Comedia, Animación, Reality, Familia, Talk, Kids
- `high`: Drama, Misterio, Suspenso, Ciencia ficción, Sci-Fi y Fantasía, Bélica, Guerra y Política
- Si no está en ninguna: `high`

## audience
- `familia`: solo con certificación apta para niños. MX: AA, A. US (respaldo): G, PG, TV-Y, TV-Y7, TV-G. Sin certificación no se marca familia (criterio conservador).
  - **B** (México, 12+) ya no cuenta como familiar: "En familia (hay niños)" debe ser de verdad apto para niños.
- `pareja`: Romance, Drama o Telenovela
- `amigos`: Comedia, Acción, Acción y Aventura, Terror o Aventura
- `solo`: siempre, salvo contenido infantil exclusivo (género Kids o certificación TV-Y)

## durationMin
- Película: `runtime`
- Serie: `episode_run_time[0]` o, si falta, `last_episode_to_air.runtime`
- Si no hay duración, el título se descarta.

## Selección (~150 títulos, 75 películas / 75 series)
`/discover` con `watch_region=MX`, `with_watch_monetization_types=flatrate` y las plataformas objetivo, ordenado por popularidad. Hay un bucket por:
- cada mood
- familia
- series cortas (≤ 30 y 31–45 min) y películas cortas (≤ 95 min)
- clásicos (por número de votos, antes de 2005/2008)
- novedades (últimos 2 años)
- cada plataforma, para que ViX y Apple TV también aparezcan

La selección final reparte los lugares entre los buckets en round-robin. Solo cuenta `flatrate` (suscripción).

## Cómo decide el recomendador (`src/app/recommender.js`)

### 1. Filtros duros: nunca se relajan
| Respuesta | Regla |
|---|---|
| Q1 "Un ratito (≤ 45 min)" | duración ≤ 45 min (película: total; serie: episodio) |
| Q1 "Una peli normal (~2 h)" | duración ≤ 135 min |
| Q1 "Hoy no tengo prisa" | sin límite |
| Q2 Película / Serie | solo ese tipo ("Sorpréndeme" = ambos) |
| Q5 "En familia (hay niños)" | solo clasificación AA/A (MX) o G/PG/TV-Y/TV-Y7/TV-G (US) |
| Plataformas | carrusel 1: disponible en alguna plataforma elegida; carrusel 2: catálogo Totalplay |

Si no alcanza, el carrusel o checkpoint muestra menos títulos, o el mensaje "Hoy mi bola de cristal no vio nada aquí". Un checkpoint sin ninguna portada válida se salta.

### 2. Niveles: se llenan en orden hasta 8
| Nivel | Ánimo Q4 | Atención Q3 | Novedad Q6 | Llena hasta |
|---|---|---|---|---|
| 0 | sí | sí | estricta (recién: ≤ 2 años · clásico: ≥ 15 años, o ≥ 8 con ★ ≥ 7.5) | 8 |
| 1 | sí | sí | cercana (recién: ≤ 5 años · clásico: ≥ 8 años) | 8 |
| 2 | sí | no | cercana | 8 |
| 3 | sí | no | no | 3 (último recurso) |
| 4 | no | no | no | 3 (último recurso) |

### 3. Puntaje dentro de cada nivel (mayor primero; empate por título)
| Señal | Puntos |
|---|---|
| Ánimo Q4 = ánimo principal del título | +10 |
| Ánimo Q4 = ánimo secundario | +6 |
| Portada elegida en un checkpoint ("¡Esta me late!") | +5 por ánimo compartido, +1.5 por etiqueta (máx. 3), +1 por audiencia |
| "Ninguna" en un checkpoint | −2 por ánimo y −0.5 por etiqueta compartidos con cada portada mostrada |
| Atención Q3 coincide | +3 |
| Novedad Q6 coincide (estricta / cercana) | +3 / +1.5 |
| Audiencia Q5 (solo/pareja/amigos) coincide | +2 |
| Sin niños y el título es familiar/infantil | −4 |
| "Un ratito": más corto | −(minutos ÷ 60) |
| Calificación TMDB | +0.2 × ★ |

### 4. Checkpoints
- **C1** sale después de Q3 y **C2** después de Q5.
- Las portadas cumplen los filtros duros de lo ya respondido. En C2 también cumplen el ánimo de Q4, si hay al menos 3 portadas así.
- Las 3 portadas tienen ánimos o etiquetas distintos, mezclan plataformas y Totalplay, y C2 no repite las de C1.
