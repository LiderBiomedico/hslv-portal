# Portal HSLV — Proyecto corregido

Todo el código va corregido y verificado. Este archivo es lo único que necesita
leer para desplegarlo.

---

## ⚠️ Primero: la contraseña que estaba expuesta

`index.html` contenía, en texto plano y visible con Ctrl+U:

```js
const ADMIN_PASSWORD = 'pm2066412';
```

**Considere esa contraseña comprometida.** Cualquiera que haya abierto el código
fuente del portal la tiene. No la reutilice: elija una nueva antes de desplegar.

Y era peor de lo que parece: `portal-gestion.html` no verificaba nada. Escribiendo
la URL directamente en el navegador se entraba al panel completo sin pasar por el
modal. Eso ya está cerrado.

---

## 1. Variables de entorno en Netlify

Site configuration → Environment variables.

| Variable | Valor | Secret | Scope |
|---|---|---|---|
| `AIRTABLE_API_KEY` | la que ya tiene | ✅ | Functions |
| `AIRTABLE_BASE_ID` | `appFyEBCedQGOeJyV` | — | Functions |
| `SESSION_SECRET` | 96 caracteres aleatorios | ✅ | Functions |
| `ADMIN_PASSWORD_HASH` | ver abajo | ✅ | Functions |
| `ALLOWED_ORIGINS` | `https://SU-SITIO.netlify.app` | — | Functions |

Marque **Contains secret values** y limite el scope a **Functions** en las que
llevan ✅. Con "All scopes" el valor queda disponible durante el build.

Generar el secreto de sesión:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generar el hash de la contraseña nueva del panel:

```powershell
node -e "process.env.SESSION_SECRET='x'.repeat(40); console.log(require('./netlify/functions/utils/session.js').hashCode('SU_CONTRASENA_NUEVA'))"
```

Copie el resultado completo (empieza por `scrypt$`) en `ADMIN_PASSWORD_HASH` y
**elimine la variable `ADMIN_PASSWORD`** que creó antes.

Opcionales: `SESSION_TTL_SECONDS` (28800 = 8 h), `LOGIN_MAX_INTENTOS` (5),
`LOGIN_BLOQUEO_MINUTOS` (15), `ADMIN_MAX_INTENTOS` (5), `ADMIN_BLOQUEO_MINUTOS` (15),
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

---

## 2. Airtable — ya está listo

Los campos se crearon en la base `appFyEBCedQGOeJyV`:

- **Usuarios**: `codigoAccesoHash`, `rol`, `intentosFallidos`, `bloqueadoHasta`
- **Tecnicos**: `codigoAccesoHash`, `intentosFallidos`, `bloqueadoHasta`, `fechaUltimoAcceso`

**Paso manual pendiente:** ponga `rol = admin` en su registro de `Usuarios`. Sin
eso, la gestión de usuarios le responderá 403 también a usted.

---

## 3. Desplegar

```powershell
npm install
```

Suba todo el contenido de esta carpeta al repositorio o arrástrela a Netlify.

Después del despliegue, migre los códigos a hash (con las variables de Airtable
cargadas en su terminal). **Duplique la base como respaldo antes**:

```powershell
node scripts/migrar-codigos.js --dry-run
node scripts/migrar-codigos.js
```

Convierte `codigoAcceso` (Usuarios) y `pin` (Tecnicos) en `codigoAccesoHash` y
vacía el campo original. Los códigos actuales siguen funcionando durante la
transición: la verificación acepta hash o texto plano.

---

## 4. Qué se corrigió

### Credenciales fuera del navegador

| Antes | Ahora |
|---|---|
| `ADMIN_PASSWORD` en `index.html` | `admin-login.js` valida contra la variable de entorno |
| `portal-gestion.html` abierto por URL | Guardia de sesión antes de cargar el portal |
| El navegador descargaba `Usuarios` completa con los códigos | `auth-login.js` valida en el servidor; consulta solo el email indicado |
| `Portal-solicitudes.html` aceptaba credenciales desde `localStorage` | Eliminado: era una puerta trasera editable desde la consola |
| `technician-auth.js` aceptaba cualquier código de 4 dígitos | Verifica contra el campo `pin` / `codigoAccesoHash` real |
| Códigos con `Math.random()` en texto plano | `crypto.randomInt`, 6 dígitos, guardados con scrypt + salt |
| Sin límite de intentos | Bloqueo a los 5 fallos, 15 minutos, por cuenta y por IP |

### El proxy, que era el hueco más grande

`airtable-proxy.js` reenviaba cualquier ruta y método a Airtable con la API key
del servidor, sin autenticación. Desde cualquier navegador del mundo:
`GET /.netlify/functions/airtable-proxy/Usuarios` devolvía la tabla completa, y
un `DELETE` borraba registros.

Ahora hay lista blanca por tabla y método, `Usuarios` está fuera del proxy por
completo, y los campos sensibles se depuran de toda respuesta. Verificado:

```
GET /Usuarios sin sesión   → 403
GET /Usuarios con admin    → 403   (nunca por este canal)
GET /Solicitudes sin sesión→ 401
DELETE /Solicitudes        → 405
```

### Funciones que estaban abiertas

`get-technician-requests`, `start-work`, `submit-technician-response`,
`save-push-subscription` y `send-push-notification` exigen sesión. Además, el
técnico se toma **del token**, no del parámetro que envía el cliente: antes
bastaba cambiar el `technicianId` en la petición para ver o modificar el trabajo
de otro técnico.

### Otros

- `form-data` a 4.0.4 (CVE-2025-7783, crítico 9.4), con `overrides`.
- Node 18 → 20 en `netlify.toml` (18 está fuera de soporte).
- Se quitó `Access-Control-Allow-Origin = "*"` del `netlify.toml`: anulaba el
  control por `ALLOWED_ORIGINS` de cada función.
- Se bloqueó el acceso web a `/set.env*`, `/package.json`, `/scripts/*`,
  `/netlify/*` y `/_local/*`.
- El service worker ya no cachea respuestas de las funciones (servía datos de
  una sesión a otra) y apunta a `/AppMovil.html`, no a `/tech-app.html`, que no
  existe.
- `desempeno-personal.js`, `ranking-equipos.js` e `informe-mensual.js` se movieron
  a `modules/`: son scripts de navegador, no funciones, y Netlify intentaba
  desplegarlos como endpoints.
- `set.env.txt`, `generate-vapid-keys.js.txt` y `reporte-doctor.json` se movieron
  a `_local/`, fuera del alcance público.
- Hallazgos de rendimiento de React Doctor: `fetch` sin verificar estado,
  `includes()` en bucle → `Set`, 4 PATCH secuenciales → 1 solo.

---

## 5. Verificación después de desplegar

Sin haber iniciado sesión:

```powershell
curl -i https://SU-SITIO.netlify.app/.netlify/functions/airtable-proxy/Usuarios
curl -i "https://SU-SITIO.netlify.app/.netlify/functions/user-management?operation=list"
curl -i https://SU-SITIO.netlify.app/set.env.txt
```

Las tres deben responder 403, 401 y 404. Si alguna devuelve datos, quedó algo sin
desplegar.

Luego, en el navegador:

1. Abra `portal-gestion.html` escribiendo la URL directamente → debe mostrar
   "Acceso restringido".
2. Entre desde `index.html` con la contraseña nueva → debe funcionar.
3. Ctrl+U en `index.html` y busque la contraseña con Ctrl+F → no debe aparecer.
4. Con sesión iniciada, pestaña Network: ninguna respuesta debe contener
   `codigoAcceso`.

---

## 6. Lo que queda pendiente

- **Rote la API key de Airtable.** Nada de esto protege una clave que ya estuvo
  expuesta, y no puedo verificar si la actual lo estuvo.
- **`tech-login.html` sigue siendo una maqueta**: acepta cualquier usuario y lo
  guarda en `localStorage`. No la publique. La app real es `AppMovil.html`.
- **Códigos de 4 dígitos** en usuarios existentes hasta que se regeneren. Con el
  bloqueo por intentos el riesgo baja mucho, pero conviene regenerarlos.
- **Bloqueo por IP del login de usuarios**: el control es por cuenta. Un atacante
  puede repartir intentos entre muchas cuentas sin acumular bloqueo.
- **`send-push-notification.js`** sigue sin enviar nada: solo devuelve éxito. La
  lógica de envío nunca se implementó (está marcada como pendiente en el código
  original).
- **Trazabilidad del panel**: la contraseña compartida no registra quién entró.
  El campo `rol` ya está creado y `auth-login.js` emite tokens de administrador,
  así que puede migrar a acceso por persona cuando quiera. Los dos caminos
  conviven.
