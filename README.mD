# 🏥 Portal de Solicitudes Cloud - Hospital Susana López de Valencia

Sistema completo de gestión de solicitudes de mantenimiento con autenticación de usuarios y gestión de accesos, desarrollado por **Ing. Paul Eduardo Muñoz R.**

## 🌟 Características Principales

### ✅ **SISTEMA COMPLETAMENTE FUNCIONAL**
- **Portal de Solicitudes**: Usuarios pueden crear solicitudes de mantenimiento
- **Portal de Gestión**: Administradores pueden gestionar solicitudes, usuarios y accesos
- **Sistema de Autenticación**: Login con email + código de 4 dígitos
- **Gestión de Accesos**: Aprobación de solicitudes y generación automática de códigos
- **Sincronización Cloud**: Datos guardados en Airtable en tiempo real
- **Modo Fallback**: Funciona localmente si no hay conexión

## 📋 Estructura del Proyecto

```
├── portal-solicitudes.html          # Portal para usuarios finales
├── portal-gestion.html              # Portal para administradores
├── airtable-config.js               # Configuración y API de Airtable
├── test-completo.html               # Sistema de pruebas completo
├── netlify.toml                     # Configuración de Netlify
├── netlify/functions/
│   ├── airtable-proxy.js           # Proxy principal para Airtable
│   ├── user-management.js          # Gestión específica de usuarios
│   ├── hello.js                    # Función de prueba básica
│   ├── test-config.js              # Test de configuración
│   ├── simple-debug.js             # Debug de conexión
│   └── inspect-table.js            # Inspección de tablas
└── README.md                       # Esta documentación
```

## 🚀 Instalación y Configuración

### 1. **Variables de Entorno en Netlify**

Configurar las siguientes variables en el panel de Netlify:

```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### 2. **Estructura de Tablas en Airtable**

Crear las siguientes tablas en Airtable:

#### **Tabla: Solicitudes**
```
- numero (Single line text)
- servicioIngenieria (Single select)
- tipoServicio (Single select)
- prioridad (Single select)
- equipo (Single line text)
- ubicacion (Single line text)
- descripcion (Long text)
- observaciones (Long text)
- solicitante (Single line text)
- servicioHospitalario (Single select)
- emailSolicitante (Email)
- fechaCreacion (Date)
- estado (Single select)
- tecnicoAsignado (Single line text)
```

#### **Tabla: Usuarios**
```
- nombreCompleto (Single line text)
- email (Email)
- telefono (Phone number)
- servicioHospitalario (Single select)
- cargo (Single select)
- codigoAcceso (Single line text)
- estado (Single select: ACTIVO, INACTIVO)
- fechaCreacion (Date)
- fechaUltimoAcceso (Date)
- solicitudOrigenId (Single line text)
```

#### **Tabla: SolicitudesAcceso**
```
- id (Single line text)
- nombreCompleto (Single line text)
- email (Email)
- telefono (Phone number)
- servicioHospitalario (Single select)
- cargo (Single select)
- justificacion (Long text)
- fechaSolicitud (Date)
- estado (Single select: PENDIENTE, APROBADA, RECHAZADA)
- esUrgente (Checkbox)
- fechaAprobacion (Date)
- motivoRechazo (Long text)
- usuarioCreado (Single line text)
```

#### **Tabla: Tecnicos**
```
- nombre (Single line text)
- email (Email)
- area (Single select)
- tipo (Single select)
- especialidad (Single line text)
- estado (Single select)
```

### 3. **Despliegue en Netlify**

1. Conectar repositorio con Netlify
2. Configurar variables de entorno
3. Deploy automático activado

## 🎯 Flujo de Uso del Sistema

### **Para Usuarios Finales:**

1. **Solicitar Acceso** (portal-solicitudes.html)
   - Ir a la pestaña "Solicitar Acceso"
   - Llenar formulario con datos personales
   - Solicitud se envía automáticamente a Airtable
   - Esperar aprobación del administrador

2. **Iniciar Sesión** (portal-solicitudes.html)
   - Usar email registrado
   - Ingresar código de 4 dígitos (recibido tras aprobación)
   - Acceso al portal de solicitudes

3. **Crear Solicitudes** (portal-solicitudes.html)
   - Seleccionar área de ingeniería
   - Completar detalles del equipo y problema
   - Enviar solicitud (se guarda en Airtable automáticamente)

### **Para Administradores:**

1. **Acceder al Portal de Gestión** (portal-gestion.html)
   - No requiere autenticación (versión admin)
   - Dashboard con estadísticas en tiempo real

2. **Gestionar Solicitudes de Acceso**
   - Ver solicitudes pendientes en tiempo real
   - Aprobar/Rechazar con un click
   - Generación automática de códigos únicos

3. **Gestionar Usuarios**
   - Ver usuarios activos
   - Regenerar códigos si es necesario
   - Desactivar/Activar usuarios

4. **Gestionar Solicitudes de Mantenimiento**
   - Ver todas las solicitudes
   - Asignar técnicos
   - Actualizar estados

## 🔧 Funcionalidades Principales

### **🔐 Sistema de Autenticación**
- **Email + Código de 4 dígitos**
- **Validación en tiempo real con Airtable**
- **Códigos únicos autogenerados**
- **Control de estados de usuario (ACTIVO/INACTIVO)**

### **📝 Gestión de Solicitudes**
- **Creación en tiempo real**
- **Sincronización automática con Airtable**
- **Estados: PENDIENTE, ASIGNADA, EN_PROCESO, COMPLETADA**
- **Filtros por área, estado y prioridad**

### **👥 Gestión de Accesos**
- **Flujo completo: Solicitud → Aprobación → Usuario**
- **Generación automática de códigos únicos**
- **Validación de credenciales**
- **Estadísticas en tiempo real**

### **🌐 Sistema Cloud**
- **Datos en Airtable en tiempo real**
- **Acceso desde cualquier dispositivo**
- **Respaldo automático**
- **Modo offline como fallback**

## 🧪 Testing del Sistema

### **Usar test-completo.html**

Archivo completo de pruebas que incluye:

```bash
# Tests de Conexión
- Conexión básica con Airtable
- Test de todas las tablas
- Verificación de funciones Netlify

# Tests de Datos
- Creación y lectura de solicitudes
- Gestión completa de usuarios
- Solicitudes de acceso

# Tests de Flujo Completo
- Flujo de aprobación completo
- Validación de acceso
- Generación de códigos únicos

# Estadísticas del Sistema
- Contadores en tiempo real
- Estado de todas las tablas
```

### **Funciones de Debug Disponibles**

```javascript
// En la consola del navegador:

// Diagnóstico completo
debugAirtableConnection()

// Test específico de usuarios
await testUserManagement()

// Ver estado del sistema
window.airtableAPI.getStatus()

// Test de validación
await window.airtableAPI.validateUserCredentials('email@test.com', '1234')
```

## 📊 APIs y Endpoints

### **Funciones Netlify Disponibles:**

```bash
# Proxy principal
/.netlify/functions/airtable-proxy/{tabla}

# Gestión de usuarios
/.netlify/functions/user-management?operation={operacion}

# Funciones de debug
/.netlify/functions/simple-debug
/.netlify/functions/test-config
/.netlify/functions/hello
```

### **Operaciones de Gestión de Usuarios:**

```javascript
// Listar usuarios
GET /.netlify/functions/user-management?operation=list

// Crear usuario
POST /.netlify/functions/user-management?operation=create

// Actualizar usuario
PATCH /.netlify/functions/user-management?operation=update&id={userId}

// Validar acceso
POST /.netlify/functions/user-management?operation=validate

// Aprobar solicitud
POST /.netlify/functions/user-management?operation=approve-request&requestId={id}

// Estadísticas
GET /.netlify/functions/user-management?operation=statistics
```

## 🔒 Seguridad

### **Configuración Segura:**
- **Variables de entorno en Netlify** (no en código)
- **Proxy para ocultar API keys**
- **Validación de datos en cliente y servidor**
- **Códigos únicos autogenerados**

### **Fallbacks de Seguridad:**
- **Modo local si falla conexión**
- **Validación doble de credenciales**
- **Control de estados de usuario**

## 🎨 Interfaz de Usuario

### **Diseño Moderno y Responsivo:**
- **CSS Grid y Flexbox**
- **Gradientes y animaciones**
- **Indicadores de estado en tiempo real**
- **Modo oscuro para logs**
- **Compatibilidad móvil**

### **Experiencia de Usuario:**
- **Feedback visual instantáneo**
- **Mensajes claros de estado**
- **Navegación intuitiva**
- **Loading states y animaciones**

## 🔄 Flujo Técnico Completo

### **1. Solicitud de Acceso:**
```
Usuario → Portal Solicitudes → Airtable (SolicitudesAcceso)
→ Portal Gestión → Aprobación → Airtable (Usuarios)
→ Código generado → Usuario puede acceder
```

### **2. Creación de Solicitud:**
```
Usuario autenticado → Portal Solicitudes 
→ Airtable (Solicitudes) → Portal Gestión
→ Asignación técnico → Seguimiento
```

### **3. Sincronización:**
```
Cliente ↔ Netlify Functions ↔ Airtable
Fallback: Cliente ↔ localStorage
```

## 📈 Estadísticas y Métricas

El sistema incluye métricas en tiempo real:

- **Total de solicitudes por área**
- **Usuarios activos vs inactivos**
- **Solicitudes de acceso pendientes**
- **Personal técnico disponible**
- **Estados de solicitudes**

## 🛠️ Desarrollo y Mantenimiento

### **Estructura del Código:**
- **Separación clara de responsabilidades**
- **Configuración centralizada en airtable-config.js**
- **Funciones Netlify modulares**
- **Sistema de logging completo**

### **Para Desarrolladores:**
```javascript
// Extender funcionalidad
class AirtableAPI {
  // Agregar nuevos métodos aquí
  async nuevoMetodo() { ... }
}

// Agregar nuevas validaciones
function validarNuevosCampos() { ... }

// Crear nuevas funciones Netlify
exports.handler = async (event, context) => { ... }
```

## 📞 Soporte y Contacto

**Desarrollado por:** Ing. Paul Eduardo Muñoz R.
**Hospital:** Susana López de Valencia E.S.E.
**Ubicación:** Popayán, Cauca, Colombia

---

## 🎉 ¡Sistema Completamente Funcional!

El portal está listo para uso en producción con:

✅ **Autenticación completa**
✅ **Gestión de usuarios y accesos**  
✅ **Sincronización con Airtable**
✅ **Interfaz moderna y responsiva**
✅ **Sistema de pruebas completo**
✅ **Documentación completa**

Para cualquier consulta o soporte técnico, contactar al desarrollador del sistema.