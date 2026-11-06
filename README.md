# Adivino de pelis

Web app de TV para el STB Linux de Totalplay. Se usa con el control remoto (D-pad + OK + BACK), y también funciona en computadora y celular. Respondes 6 preguntas rápidas con 2 pausas de "¿voy por buen camino?" y el adivino te recomienda qué ver en dos carruseles: **En tus plataformas** y **En el catálogo Totalplay**.

> **AVISO — Catálogo Totalplay SIMULADO.** No refleja disponibilidad real. Como TMDB no sabe qué hay en la programación ni en el On Demand de Totalplay, mientras no exista `src/config/totalplay-titles.csv` se marcan ~55 títulos con `source:'totalplay'` y `demo:true` solo para la demo.

Es 100 % estática: un solo `index.html`, rutas relativas, sin build y sin servidor. Funciona desde cualquier subcarpeta, por ejemplo `https://prodmc.github.io/Adivino-de-pelis/`.

## Pantallas y controles
- **TV / STB y computadora:** el lienzo de 1920×1080 se escala para caber completo en la ventana (720p, 1080p, laptops). Se usa con flechas + Enter; en computadora también con clic y rueda del mouse.
- **Celular:** layout fluido con scroll natural. Se usa tocando la pantalla, deslizando los carruseles, y el botón "atrás" del navegador funciona como BACK.
- El mouse y el touch nunca se activan con el runtime de Totalplay, para que no peleen con el D-pad.

## Probar en local
Usa un servidor HTTP real, nunca `file://`:

```bash
python3 -m http.server 8000
```

Luego abre <http://localhost:8000/> con la ventana a 1920×1080.

Teclas en escritorio:

| Tecla | Acción |
|---|---|
| ← ↑ → ↓ | Mover el foco |
| Enter | OK |
| Backspace | BACK (solo fuera del STB) |
| keyCode 461 | BACK en el STB |

## Pruebas del recomendador
Sin framework:

```bash
node tests/recommender.test.js
```

## Regenerar el catálogo (solo desarrollo)
Requiere **Node ≥ 18** (usa el `fetch` de Node). No tiene dependencias.

1. Copia `.env.example` a `.env` y llena `TMDB_READ_TOKEN` (preferida) o `TMDB_API_KEY`. `.env` está en `.gitignore`: nunca subas la key.
2. Corre:
   ```bash
   node tools/build-catalog.js
   ```
3. El resultado es `src/config/catalog.generated.js` (`window.TP_CATALOG`). El STB nunca llama a TMDB.

Más detalles:
- Catálogo Totalplay real: crea `src/config/totalplay-titles.csv` con las columnas `title` y `year` (opcional). El script resuelve cada título en TMDB y deja los no encontrados o dudosos en `tools/totalplay-report.txt` para revisarlos a mano.
- Pósters locales (plan B si el STB no carga HTTPS de image.tmdb.org): corre `POSTER_MODE=local node tools/build-catalog.js` y pon `POSTER_MODE: 'local'` en `src/config/environment.js`. `posters/` está en `.gitignore` porque los pósters tienen derechos de terceros.
- Mapeos de géneros, moods, audiencia y atención: [TAXONOMY.md](TAXONOMY.md).

## Publicar en GitHub Pages
Settings → Pages → Build and deployment → **Deploy from a branch** → rama `main`, carpeta **/ (root)** → Save. El archivo `.nojekyll` ya está en la raíz.

## Estructura
```
index.html              entrada única
Fonts/                  Montserrat local (solo se usan Medium 500 y Bold 700)
src/app/                App, routes, state, recommender (función pura)
src/ui/                 screens/ y components/
src/platform/totalplay/ keys, focus, lifecycle, device, network, debug, deeplink (único lugar con sagem.*)
src/services/catalog.js costura para el feed real de Totalplay (TBD)
src/config/             environment, platforms, questions (copy), catalog.generated
src/styles/             tokens.css, base.css
tools/                  build-catalog.js, taxonomy.js (no se despliegan al STB)
tests/                  recommender.test.js
```

## Pendientes (TBD / BLOCKED)
- Deep link a la ficha (Totalplay y plataformas): `deeplink.js` es un stub. Si el título no trae `detailUrl`, muestra "Ficha no disponible en esta demo".
- Catálogo Totalplay real y feed/API de producción.
- Carga de HTTPS de image.tmdb.org en el STB (certificados, allowlist, TLS).
- Licencia de TMDB para uso comercial: la API gratuita es solo para uso no comercial.
- Player/DRM: no aplica (la app no reproduce).
- Red de producción, zona segura final y API de salida oficial para BACK/MENU de raíz.

Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB. Los datos de disponibilidad por plataforma vienen de JustWatch.
