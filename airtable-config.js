// airtable-config.js
// Configuración de Airtable para el Portal Cloud del Hospital Susana López de Valencia
// Desarrollado por: Ing. Paul Eduardo Muñoz R.

window.airtableAPI = {
    // 🔧 CONFIGURACIÓN DE AIRTABLE
    baseId: 'appFyEBCedQGOeJyV', // Reemplazar con el ID real de tu base de Airtable
    apiKey: 'pat7xJ5u0pzGcbOO3.43982b73b388d10497b60186516f35fcebae2a03ce602439037aef3aa8c29d7d', // Reemplazar con tu Personal Access Token de Airtable
    
    // 📋 NOMBRES DE LAS TABLAS EN AIRTABLE
    tables: {
        solicitudes: 'Solicitudes', // Tabla para solicitudes de mantenimiento
        tecnicos: 'Tecnicos', // Tabla para personal técnico
        usuarios: 'Usuarios', // Tabla para usuarios con acceso al portal
        solicitudesAcceso: 'Solicitudes_Acceso' // Tabla para solicitudes de acceso
    },
    
    // 🌐 URL base de la API de Airtable
    get baseUrl() {
        return `https://api.airtable.com/v0/${this.baseId}`;
    },
    
    // 🔗 Headers para las peticiones
    get headers() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    },
    
    // 🧪 Probar conexión con Airtable
    async testConnection() {
        try {
            console.log('🔍 Probando conexión con Airtable...');
            
            // Verificar si las credenciales están configuradas
            if (this.baseId === 'appXXXXXXXXXXXXXX' || this.apiKey === 'patXXXXXXXXXXXXXX') {
                console.log('⚠️ Credenciales de Airtable no configuradas');
                return false;
            }
            
            // Hacer una petición simple para probar la conexión
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudes}?maxRecords=1`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (response.ok) {
                console.log('✅ Conexión exitosa con Airtable');
                return true;
            } else {
                console.log('❌ Error de autenticación o configuración');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
    },
    
    // 📋 Obtener todas las solicitudes de mantenimiento
    async getSolicitudes() {
        try {
            console.log('📋 Cargando solicitudes desde Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudes}`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            const solicitudes = data.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            console.log(`✅ ${solicitudes.length} solicitudes cargadas desde Airtable`);
            return solicitudes;
            
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes:', error);
            throw error;
        }
    },
    
    // 👥 Obtener todos los técnicos
    async getTecnicos() {
        try {
            console.log('👥 Cargando técnicos desde Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.tecnicos}`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            const tecnicos = data.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            console.log(`✅ ${tecnicos.length} técnicos cargados desde Airtable`);
            return tecnicos;
            
        } catch (error) {
            console.error('❌ Error obteniendo técnicos:', error);
            throw error;
        }
    },
    
    // 👤 Obtener todos los usuarios
    async getUsuarios() {
        try {
            console.log('👤 Cargando usuarios desde Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.usuarios}`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            const usuarios = data.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            console.log(`✅ ${usuarios.length} usuarios cargados desde Airtable`);
            return usuarios;
            
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            throw error;
        }
    },
    
    // 🔐 Obtener todas las solicitudes de acceso
    async getSolicitudesAcceso() {
        try {
            console.log('🔐 Cargando solicitudes de acceso desde Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudesAcceso}`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            const solicitudesAcceso = data.records.map(record => ({
                id: record.id,
                airtableId: record.id, // Guardar ID de Airtable para actualizaciones
                ...record.fields
            }));
            
            console.log(`✅ ${solicitudesAcceso.length} solicitudes de acceso cargadas desde Airtable`);
            return solicitudesAcceso;
            
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes de acceso:', error);
            throw error;
        }
    },
    
    // ✍️ Crear nueva solicitud de mantenimiento
    async createSolicitud(solicitudData) {
        try {
            console.log('✍️ Creando solicitud en Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudes}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    fields: solicitudData
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Solicitud ${solicitudData.numero} creada en Airtable`);
            return data;
            
        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            throw error;
        }
    },
    
    // 📝 Crear nueva solicitud de acceso
    async createSolicitudAcceso(solicitudData) {
        try {
            console.log('📝 Creando solicitud de acceso en Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudesAcceso}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    fields: solicitudData
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Solicitud de acceso ${solicitudData.nombreCompleto} creada en Airtable`);
            return data;
            
        } catch (error) {
            console.error('❌ Error creando solicitud de acceso:', error);
            throw error;
        }
    },
    
    // 👤 Crear nuevo usuario
    async createUsuario(usuarioData) {
        try {
            console.log('👤 Creando usuario en Airtable...');
            
            const response = await fetch(`${this.baseUrl}/${this.tables.usuarios}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    fields: usuarioData
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Usuario ${usuarioData.nombreCompleto} creado en Airtable`);
            return data;
            
        } catch (error) {
            console.error('❌ Error creando usuario:', error);
            throw error;
        }
    },
    
    // 🔄 Actualizar solicitud de acceso
    async updateSolicitudAcceso(solicitudId, updateData) {
        try {
            console.log(`🔄 Actualizando solicitud ${solicitudId} en Airtable...`);
            
            // Si solicitudId no tiene el formato de Airtable, buscar el registro
            let airtableId = solicitudId;
            if (!solicitudId.startsWith('rec')) {
                // Buscar por ID personalizado
                const allRecords = await this.getSolicitudesAcceso();
                const record = allRecords.find(r => r.id === solicitudId);
                if (record && record.airtableId) {
                    airtableId = record.airtableId;
                } else {
                    throw new Error('No se encontró el registro en Airtable');
                }
            }
            
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudesAcceso}/${airtableId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    fields: updateData
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Solicitud ${solicitudId} actualizada en Airtable`);
            return data;
            
        } catch (error) {
            console.error('❌ Error actualizando solicitud de acceso:', error);
            throw error;
        }
    },
    
    // 🗑️ Eliminar solicitud de acceso
    async deleteSolicitudAcceso(solicitudId) {
        try {
            console.log(`🗑️ Eliminando solicitud ${solicitudId} de Airtable...`);
            
            // Si solicitudId no tiene el formato de Airtable, buscar el registro
            let airtableId = solicitudId;
            if (!solicitudId.startsWith('rec')) {
                // Buscar por ID personalizado
                const allRecords = await this.getSolicitudesAcceso();
                const record = allRecords.find(r => r.id === solicitudId);
                if (record && record.airtableId) {
                    airtableId = record.airtableId;
                } else {
                    throw new Error('No se encontró el registro en Airtable');
                }
            }
            
            const response = await fetch(`${this.baseUrl}/${this.tables.solicitudesAcceso}/${airtableId}`, {
                method: 'DELETE',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            console.log(`✅ Solicitud ${solicitudId} eliminada de Airtable`);
            return true;
            
        } catch (error) {
            console.error('❌ Error eliminando solicitud de acceso:', error);
            throw error;
        }
    },
    
    // 🔄 Actualizar usuario
    async updateUsuario(usuarioId, updateData) {
        try {
            console.log(`🔄 Actualizando usuario ${usuarioId} en Airtable...`);
            
            const response = await fetch(`${this.baseUrl}/${this.tables.usuarios}/${usuarioId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    fields: updateData
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Usuario ${usuarioId} actualizado en Airtable`);
            return data;
            
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error);
            throw error;
        }
    },
    
    // 📊 Obtener estadísticas del sistema
    async getSystemStats() {
        try {
            console.log('📊 Obteniendo estadísticas del sistema...');
            
            const [solicitudes, tecnicos, usuarios, solicitudesAcceso] = await Promise.all([
                this.getSolicitudes(),
                this.getTecnicos(),
                this.getUsuarios(),
                this.getSolicitudesAcceso()
            ]);
            
            const stats = {
                solicitudes: {
                    total: solicitudes.length,
                    pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
                    asignadas: solicitudes.filter(s => s.estado === 'ASIGNADA').length,
                    completadas: solicitudes.filter(s => s.estado === 'COMPLETADA').length
                },
                tecnicos: {
                    total: tecnicos.length,
                    disponibles: tecnicos.filter(t => t.estado === 'disponible').length,
                    ocupados: tecnicos.filter(t => t.estado === 'ocupado').length
                },
                usuarios: {
                    total: usuarios.length,
                    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
                    inactivos: usuarios.filter(u => u.estado === 'INACTIVO').length
                },
                accesos: {
                    total: solicitudesAcceso.length,
                    pendientes: solicitudesAcceso.filter(s => s.estado === 'PENDIENTE').length,
                    aprobadas: solicitudesAcceso.filter(s => s.estado === 'APROBADA').length,
                    rechazadas: solicitudesAcceso.filter(s => s.estado === 'RECHAZADA').length
                }
            };
            
            console.log('✅ Estadísticas del sistema obtenidas');
            return stats;
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }
};

// 🚀 Inicialización y verificación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Configuración de Airtable cargada');
    console.log('🌐 Base ID:', window.airtableAPI.baseId);
    console.log('🔑 API Key configurado:', window.airtableAPI.apiKey !== 'patXXXXXXXXXXXXXX');
    
    // Mostrar instrucciones si no está configurado
    if (window.airtableAPI.baseId === 'appXXXXXXXXXXXXXX' || window.airtableAPI.apiKey === 'patXXXXXXXXXXXXXX') {
        console.warn('⚠️ CONFIGURACIÓN PENDIENTE DE AIRTABLE');
        console.warn('📋 Pasos para configurar:');
        console.warn('1. Crear una base en Airtable con las tablas necesarias');
        console.warn('2. Obtener el Base ID desde https://airtable.com/api');
        console.warn('3. Generar un Personal Access Token');
        console.warn('4. Actualizar las credenciales en este archivo');
    }
});

// 📋 ESTRUCTURA RECOMENDADA PARA LAS TABLAS EN AIRTABLE:

/*
🔧 TABLA "Solicitudes" (Solicitudes de Mantenimiento):
- numero (Single line text) - Primary field
- servicioIngenieria (Single select: INGENIERIA_BIOMEDICA, MECANICA, INFRAESTRUCTURA)
- tipoServicio (Single select: MANTENIMIENTO_PREVENTIVO, MANTENIMIENTO_CORRECTIVO, etc.)
- prioridad (Single select: CRITICA, ALTA, MEDIA, BAJA)
- equipo (Long text)
- ubicacion (Single line text)
- descripcion (Long text)
- observaciones (Long text)
- solicitante (Single line text)
- servicioHospitalario (Single line text)
- emailSolicitante (Email)
- fechaCreacion (Date and time)
- estado (Single select: PENDIENTE, ASIGNADA, EN_PROCESO, COMPLETADA)
- tecnicoAsignado (Single line text)

👥 TABLA "Tecnicos" (Personal Técnico):
- nombre (Single line text) - Primary field
- area (Single select: INGENIERIA_BIOMEDICA, MECANICA, INFRAESTRUCTURA)
- tipo (Single select: INTERNO, EXTERNO)
- especialidad (Single line text)
- email (Email)
- telefono (Phone number)
- estado (Single select: disponible, ocupado, inactivo)

👤 TABLA "Usuarios" (Usuarios del Portal):
- nombreCompleto (Single line text) - Primary field
- email (Email)
- telefono (Phone number)
- servicioHospitalario (Single line text)
- cargo (Single line text)
- codigoAcceso (Single line text)
- estado (Single select: ACTIVO, INACTIVO)
- fechaCreacion (Date and time)
- creadoPor (Single line text)
- solicitudOrigenId (Single line text)

🔐 TABLA "Solicitudes_Acceso" (Solicitudes de Acceso):
- nombreCompleto (Single line text) - Primary field
- email (Email)
- telefono (Phone number)
- servicioHospitalario (Single line text)
- cargo (Single line text)
- justificacion (Long text)
- fechaSolicitud (Date and time)
- estado (Single select: PENDIENTE, APROBADA, RECHAZADA)
- fechaAprobacion (Date and time)
- fechaRechazo (Date and time)
- motivoRechazo (Long text)
- aprobadoPor (Single line text)
- rechazadoPor (Single line text)
*/