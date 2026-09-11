# Portal de Gestión — Optimización de carga

## El diagnóstico

Consulté la base antes de tocar código. Los números explican todo:

| | |
|---|---|
| Solicitudes en Airtable | **5.239** (3.604 de 2026 + 1.635 de 2025) |
| Solicitudes abiertas | **21** (el resto: 4.934 completadas, 284 canceladas) |
| Páginas de 100 que hay que pedir | 53 |
| Tarjetas que el portal pintaba de una vez | 5.239 |

El portal descargaba **las 5.239 solicitudes con sus 28 campos, incluidos adjuntos
y evidencias, antes de pintar un solo píxel**. Y luego las convertía todas en
tarjetas HTML en una sola asignación a `innerHTML`.

Nadie necesita ver 5.239 tarjetas. La pantalla muestra unas 10.

---

## Los cinco cuellos de botella

### 1. Un segundo de espera pura

```js
setTimeout(async () => { ... await loadAllDataFromCloud(); }, 1000);
```

`airtable-config.js` ya estaba cargado en ese punto: su `<script>` va antes. Ese
segundo no esperaba nada. Eliminado.

### 2. Pausa fija de 200 ms entre páginas

```js
if (continuar) await new Promise(resolve => setTimeout(resolve, 200));
```

La intención era correcta: Airtable permite 5 peticiones por segundo. Pero la
pausa se sumaba *encima* del tiempo de la petición. Si la petición ya tardaba
350 ms, el límite ya se respetaba sin dormir nada.

Ahora la espera es adaptativa: duerme solo lo que falte para completar 210 ms
desde el inicio de la petición anterior. **10,4 segundos recuperados.**

### 3. Se descargaban campos que el portal no muestra

Verifiqué cuáles se usan realmente en el código. Estos tienen **cero usos** en
todo el portal y en los módulos:

`Attachments`, `evidencias`, `observacionesCompletado`, `tiempoTotalMinutos`,
`tiempoTotalRespuesta`, `emailSolicitante`, `FechaLimiteRespuesta`,
`tecnicoAsignadoId`

`Attachments` es el peor: cada adjunto trae URL, miniaturas y metadatos. La
consulta ahora pide solo los 20 campos que se usan, con `fields[]`. **−57 % de
datos transferidos.**

### 4. El render congelaba la pestaña

```js
container.innerHTML = `...${solicitudesSorted.map(createSolicitudCard).join('')}`;
```

5.239 tarjetas ≈ varios MB de HTML construidos en memoria y analizados por el
navegador de golpe. La pestaña se quedaba sin responder.

Ahora se pintan 40, y el resto entra al llegar al final de la lista
(`IntersectionObserver`, con botón "Mostrar más" como respaldo). Se usa
`insertAdjacentHTML` en vez de `innerHTML +=`, que reconstruye todo el bloque
cada vez.

### 5. El auto-refresh repetía la descarga completa cada 60 segundos

Cada minuto volvía a bajar las 5.239 solicitudes para detectar cambios en las
21 que están abiertas.

Ahora `getSolicitudesActivas()` pide, en **una sola petición**, las no cerradas
más las creadas en los últimos 7 días, y las fusiona con lo que ya hay. Solo
repinta si algo cambió de verdad.

---

## Además

- **chart.js** pasa a `defer`; **jsPDF** y **html2canvas** (≈500 KB) ya no se
  cargan al abrir el portal, sino la primera vez que se exporta un PDF.
- **Caché de sesión** de 5 minutos: volver al portal dentro de ese lapso pinta
  al instante, sin red. Los refrescos manuales la ignoran a propósito.
- **Logs**: los `console.log` del bucle de paginación se dispararaban ~200 veces
  por carga. Ahora dependen de `window.HSLV_DEBUG = true`.
- **Orden de la consulta**: `sort` por `fechaCreacion desc`, para que la primera
  página traiga justo lo que se ve en pantalla.

---

## Resultado

```
ANTES — pantalla vacía hasta que terminaba todo
  Espera artificial                1,0 s
  Descarga de 53 páginas          17,0 s
  Pausas fijas                    10,4 s
  Librerías bloqueantes            0,6 s
  Render de 5.239 tarjetas         3,2 s
  ─────────────────────────────────────
  Hasta ver algo                  32,2 s     7,2 MB

DESPUÉS
  Hasta ver algo                  ~0,3 s     0,1 MB
  Histórico completo, de fondo    ~17 s      3,1 MB
```

**Primera pintura: de ~32 s a menos de medio segundo.** El histórico sigue
cargándose detrás, con un indicador discreto, y la vista se actualiza sola
cuando termina. El auto-refresh pasa de ~27 s a una petición.

Los tiempos de red son estimados sobre 320 ms de ida y vuelta
(navegador → Netlify → Airtable). El número exacto dependerá de su conexión,
pero las proporciones se mantienen: lo que se eliminó es trabajo que no había
que hacer.

---

## Cómo verificarlo

1. Abra el portal con la pestaña Network abierta y **Disable cache** marcado.
2. Mire el momento en que aparece la primera tarjeta, no cuando termina todo.
3. En la consola, `window.HSLV_DEBUG = true` y recargue para ver el detalle
   página por página.
4. Busque en la consola la línea `⚡ Primera pintura en N ms`.

---

## Lo que no toqué, y por qué

- **`portal-gestion.html` sigue siendo un archivo de 380 KB.** Partirlo en
  módulos daría otra mejora, pero es una refactorización grande con riesgo real
  de romper algo. Los cinco cambios de arriba dan la mayor parte del beneficio
  con una fracción del riesgo.
- **Las gráficas y los informes siguen calculándose sobre el histórico
  completo.** Es correcto: ahí sí se necesitan los 5.239 registros. Por eso el
  histórico se sigue cargando, solo que sin bloquear la pantalla.
- **La sincronización por marca de tiempo** sería lo ideal para el refresco,
  pero la tabla `Solicitudes` no tiene un campo de última modificación. Si lo
  agrega en Airtable (tipo "Last modified time"), el refresco incremental puede
  volverse exacto en lugar de aproximado por estado y fecha.
