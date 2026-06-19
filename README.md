# Muzika

**Camper:** Abdiel Morales

Muzika es una aplicacion web interactiva construida con HTML5, CSS3 y JavaScript puro que consume la API publica de Deezer para explorar musica, buscar canciones, ver detalles, reproducir previews y guardar favoritos.

## Descripcion

La aplicacion permite descubrir canciones reales desde Deezer sin usar frameworks ni librerias externas de JavaScript. El usuario puede consultar el top global, buscar artistas o canciones, abrir una ficha de detalle, escuchar previews de 30 segundos, revisar informacion del artista y administrar favoritos.

## API utilizada

- **Nombre:** Deezer API publica
- **URL base:** `https://api.deezer.com`
- **Documentacion:** https://developers.deezer.com/api
- **Autenticacion:** No requiere API key para consultas basicas.
- **Endpoints usados:**
  - `/chart/0/tracks`
  - `/search`
  - `/track/{id}`
  - `/artist/{id}`
  - `/artist/{id}/albums`
  - `/artist/{id}/top`

> Nota: Deezer no siempre habilita CORS directo en navegadores, por eso el proyecto usa proxys publicos de respaldo en `js/api.js`.

## Funcionalidades principales

- Listado de mas de 10 canciones obtenidas desde Deezer.
- Busqueda por artista, cancion, album o genero.
- Detalle de cancion con portada, artista, album, duracion y enlace a Deezer.
- Reproductor de preview de 30 segundos.
- Favoritos guardados en `localStorage`.
- Indicadores de carga con skeletons.
- Manejo de errores con mensajes visibles para el usuario.
- Panel de informacion del artista usando datos disponibles de Deezer.
- Historial de busquedas recientes.
- Radio automatica por artista.
- Filtro de canciones con preview.
- Cola de reproduccion visible.
- Panel de atajos de teclado.
- Vista compacta/lista.
- Exportacion de favoritos como JSON.
- Compartir canciones con Web Share API o copia al portapapeles.
- Indicador de fuente de datos Deezer.

## Captura de pantalla

Agrega una captura de la aplicacion funcionando en la siguiente ruta antes de entregar:

```text
assets/screenshot.png
```

Ejemplo en README:

```markdown
![Captura de Muzika](assets/screenshot.png)
```

## Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- `fetch()` con `async/await`
- `localStorage`
- Google Fonts

## Instrucciones para ejecutar localmente

1. Clona o descarga este repositorio.
2. Abre `index.html` en el navegador.
3. No requiere instalacion de dependencias ni servidor local.
4. Asegurate de tener conexion a internet para consultar Deezer.

## Estructura del proyecto

```text
.
├── assets/
│   ├── muzika.ico
│   ├── muzika.jpg
│   └── screenshot.png
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   └── app.js
├── index.html
└── README.md
```

## Buenas practicas aplicadas

- Separacion de responsabilidades entre `api.js` y `app.js`.
- Peticiones HTTP con `fetch()` y `async/await`.
- Manejo de errores con `try/catch`.
- Renderizado del DOM con `createElement`, `textContent`, `setAttribute`, `appendChild` y `replaceChildren`.
- No se usa `innerHTML` en el codigo JavaScript propio.
- Persistencia local con `localStorage`.
- Diseno responsive y accesible.
- No se usan frameworks como React, Vue, Angular ni jQuery.

## Limitaciones de la API

Deezer proporciona datos como nombre del artista, imagen, seguidores aproximados, albums, canciones populares y enlaces externos. No proporciona biografia, pais de origen, genero musical o fecha de inicio de carrera en los endpoints publicos usados; por eso esos campos se muestran como no disponibles dentro del panel del artista.
