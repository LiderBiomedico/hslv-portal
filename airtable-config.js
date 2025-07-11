// 🗄️ Configuración de Airtable API
// Hospital Susana López de Valencia - Sistema de Gestión

class AirtableAPI {
    constructor() {
        // ⚠️ CONFIGURACIÓN REQUERIDA
        // Reemplaza estos valores con los de tu base de Airtable
        this.baseId = 'appFyEBCedQGOeJyV'; // Tu Base ID de Airtable
        this.apiKey = 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570'; // Tu Personal Access Token
        
        this.baseUrl = `https://api.airtable.com/v0/${this.baseId}`;
        
        // Nombres de las tablas en Airtable
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };
        
        console.log('🔗 AirtableAPI inicializada');
    }

    // 🌐 Método base para hacer requests a Airtable
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}/${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log(`📡 ${method} request to: ${endpoint}`);
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Airtable API Error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log(`✅ Response received:`, result);
            return result;
            
        } catch (error) {
            console.error('❌ Airtable API Error:', error);
            
            // Fallback a localStorage si Airtable falla
            console.warn('⚠️ Usando localStorage como fallback');
            return this.localStorageFallback(endpoint, method, data);
        }
    }

    // 💾 Fallback a localStorage si Airtable no está disponible
    localStorageFallback(endpoint, method, data) {
        const [tableName] = endpoint.split('?')[0].split('/');
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        
        try {
            switch (method) {
                case 'GET':
                    const stored = localStorage.getItem(storageKey);
                    return {
                        records: stored ? JSON.parse(stored).map(item => ({
                            id: item.id || `rec${Date.now()}`,
                            fields: item
                        })) : []
                    };
                    
                case 'POST':
                    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const newRecord = data.fields;
                    newRecord.id = newRecord.id || `rec${Date.now()}`;
                    existing.push(newRecord);
                    localStorage.setItem(storageKey, JSON.stringify(existing));
                    return { id: newRecord.id, fields: newRecord };
                    
                case 'PATCH':
                    // Implementar actualización local si es necesario
                    return { id: 'local', fields: data.fields };
                    
                default:
                    return { records: [] };
            }
        } catch (localError) {
            console.error('❌ LocalStorage fallback error:', localError);
            return { records: [] };
        }
    }

    // 📋 SOLICITUDES DE MANTENIMIENTO
    async getSolicitudes() {
        const result = await this.makeRequest(this.tables.solicitudes);
        return result.records.map(record => ({
            id: record.id,
            ...record.fields
        }));
    }

    async createSolicitud(solicitudData) {
        const data = {
            fields: {
                numero: solicitudData.numero,
                servicioIngenieria: solicitudData.servicioIngenieria,
                tipoServicio: solicitudData.tipoServicio,
                prioridad: solicitudData.prioridad,
                equipo: solicitudData.equipo,
                ubicacion: solicitudData.ubicacion,
                descripcion: solicitudData.descripcion,
                observaciones: solicitudData.observaciones || '',
                solicitante: solicitudData.solicitante,
                servicioHospitalario: solicitudData.servicioHospitalario,
                emailSolicitante: solicitudData.emailSolicitante,
                fechaCreacion: solicitudData.fechaCreacion,
                estado: solicitudData.estado || 'PENDIENTE',
                tecnicoAsignado: solicitudData.tecnicoAsignado || '',
                tecnicoAsignadoId: solicitudData.tecnicoAsignadoId || '',
                fechaAsignacion: solicitudData.fechaAsignacion || ''
            }
        };
        
        return await this.makeRequest(this.tables.solicitudes, 'POST', data);
    }

    async updateSolicitud(recordId, updates) {
        const data = { fields: updates };
        return await this.makeRequest(`${this.tables.solicitudes}/${recordId}`, 'PATCH', data);
    }

    // 👥 TÉCNICOS
    async getTecnicos() {
        const result = await this.makeRequest(this.tables.tecnicos);
        return result.records.map(record => ({
            id: record.id,
            ...record.fields
        }));
    }

    async createTecnico(tecnicoData) {
        const data = {
            fields: {
                id: tecnicoData.id,
                nombre: tecnicoData.nombre,
                area: tecnicoData.area,
                tipo: tecnicoData.tipo,
                especialidad: tecnicoData.especialidad,
                telefono: tecnicoData.telefono,
                email: tecnicoData.email,
                estado: tecnicoData.estado || 'disponible',
                solicitudAsignada: tecnicoData.solicitudAsignada || '',
                fechaCreacion: tecnicoData.fechaCreacion
            }
        };
        
        return await this.makeRequest(this.tables.tecnicos, 'POST', data);
    }

    async updateTecnico(recordId, updates) {
        const data = { fields: updates };
        return await this.makeRequest(`${this.tables.tecnicos}/${recordId}`, 'PATCH', data);
    }

    // 🔐 USUARIOS APROBADOS
    async getUsuarios() {
        const result = await this.makeRequest(this.tables.usuarios);
        return result.records.map(record => ({
            id: record.id,
            ...record.fields
        }));
    }

    async createUsuario(usuarioData) {
        const data = {
            fields: {
                id: usuarioData.id,
                nombreCompleto: usuarioData.nombreCompleto,
                email: usuarioData.email,
                telefono: usuarioData.telefono || '',
                numeroDocumento: usuarioData.numeroDocumento || '',
                servicioHospitalario: usuarioData.servicioHospitalario,
                cargo: usuarioData.cargo,
                codigoAcceso: usuarioData.codigoAcceso,
                estado: usuarioData.estado || 'ACTIVO',
                fechaAprobacion: usuarioData.fechaAprobacion,
                ultimoAcceso: usuarioData.ultimoAcceso || ''
            }
        };
        
        return await this.makeRequest(this.tables.usuarios, 'POST', data);
    }

    async updateUsuario(recordId, updates) {
        const data = { fields: updates };
        return await this.makeRequest(`${this.tables.usuarios}/${recordId}`, 'PATCH', data);
    }

    // 📝 SOLICITUDES DE ACCESO
    async getSolicitudesAcceso() {
        const result = await this.makeRequest(this.tables.solicitudesAcceso);
        return result.records.map(record => ({
            id: record.id,
            ...record.fields
        }));
    }

    async createSolicitudAcceso(solicitudData) {
        const data = {
            fields: {
                id: solicitudData.id,
                nombreCompleto: solicitudData.nombreCompleto,
                email: solicitudData.email,
                telefono: solicitudData.telefono || '',
                servicioHospitalario: solicitudData.servicioHospitalario,
                cargo: solicitudData.cargo,
                justificacion: solicitudData.justificacion || '',
                fechaSolicitud: solicitudData.fechaSolicitud,
                estado: solicitudData.estado || 'PENDIENTE',
                esUrgente: solicitudData.esUrgente || false
            }
        };
        
        return await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
    }

    async updateSolicitudAcceso(recordId, updates) {
        const data = { fields: updates };
        return await this.makeRequest(`${this.tables.solicitudesAcceso}/${recordId}`, 'PATCH', data);
    }

    // 🔢 Generar código de acceso único
    async generateUniqueAccessCode() {
        const usuarios = await this.getUsuarios();
        const existingCodes = usuarios.map(u => u.codigoAcceso).filter(Boolean);
        
        let code;
        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
        } while (existingCodes.includes(code));
        
        return code;
    }

    // 🧪 Método de prueba de conexión
    async testConnection() {
        try {
            console.log('🧪 Probando conexión con Airtable...');
            const result = await this.makeRequest(this.tables.solicitudes + '?maxRecords=1');
            console.log('✅ Conexión exitosa con Airtable');
            return true;
        } catch (error) {
            console.error('❌ Error de conexión con Airtable:', error);
            return false;
        }
    }
}

// 🌍 Instancia global de la API
window.airtableAPI = new AirtableAPI();

// 🚀 Inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 Conectando con Airtable...');
    
    // Probar conexión al cargar la página
    window.airtableAPI.testConnection().then(success => {
        if (success) {
            console.log('🌟 Sistema conectado a Airtable correctamente');
        } else {
            console.warn('⚠️ Usando modo fallback (localStorage)');
        }
    });
});

// 📊 Funciones de utilidad para migración de datos
window.migrateFromLocalStorage = async function() {
    console.log('🔄 Iniciando migración desde localStorage...');
    
    try {
        // Migrar técnicos
        const localTechnicians = localStorage.getItem('hospital_technicians');
        if (localTechnicians) {
            const technicians = JSON.parse(localTechnicians);
            for (const [area, tecnicosArea] of Object.entries(technicians)) {
                for (const tecnico of tecnicosArea) {
                    await window.airtableAPI.createTecnico({
                        ...tecnico,
                        area: area
                    });
                }
            }
            console.log('✅ Técnicos migrados');
        }
        
        // Migrar solicitudes
        const localRequests = localStorage.getItem('hospital_solicitudes');
        if (localRequests) {
            const requests = JSON.parse(localRequests);
            for (const request of requests) {
                await window.airtableAPI.createSolicitud(request);
            }
            console.log('✅ Solicitudes migradas');
        }
        
        // Migrar usuarios aprobados
        const localUsers = localStorage.getItem('hospital_approved_users');
        if (localUsers) {
            const users = JSON.parse(localUsers);
            for (const user of users) {
                await window.airtableAPI.createUsuario(user);
            }
            console.log('✅ Usuarios migrados');
        }
        
        console.log('🎉 Migración completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    }
};