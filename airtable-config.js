// 🗄️ Configuración de Airtable API - VERSIÓN COMPLETA CON DEBUG
// Hospital Susana López de Valencia - Sistema de Gestión

console.log('🚀 Cargando airtable-config.js...');

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI...');
        
        // 🌐 Detección FORZADA de entorno
        this.hostname = window.location.hostname;
        console.log('🔍 Hostname detectado:', this.hostname);
        
        // 🚨 FORZAR PROXY si NO es localhost exacto
        this.isLocalDevelopment = this.hostname === 'localhost' || 
                                 this.hostname === '127.0.0.1' ||
                                 this.hostname.startsWith('localhost:') ||
                                 this.hostname.startsWith('127.0.0.1:');
        
        console.log('🏠 Es desarrollo local:', this.isLocalDevelopment);
        
        // ✅ SIEMPRE usar proxy excepto en localhost
        if (this.isLocalDevelopment) {
            // 🔧 Solo en localhost: conexión directa
            this.useProxy = false;
            this.baseUrl = 'https://api.airtable.com/v0/appFyEBCedQGOeJyV';
            this.directApiKey = 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570';
            console.log('🔧 MODO DESARROLLO: Conexión directa permitida');
        } else {
            // 🛡️ En cualquier otro dominio: PROXY OBLIGATORIO
            this.useProxy = true;
            this.baseUrl = '/.netlify/functions/airtable-proxy';
            this.directApiKey = null;
            console.log('🛡️ MODO PRODUCCIÓN: PROXY FORZADO');
        }
        
        // Tablas de Airtable
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('🔗 AirtableAPI configurada');
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        
        // Test inicial
        this.initializeConnection();
    }

    async initializeConnection() {
        console.log('🔄 Iniciando conexión...');
        
        try {
            const isConnected = await this.testConnection();
            
            if (isConnected) {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
                console.log('✅ Conectado exitosamente');
            } else {
                throw new Error('Test de conexión falló');
            }
            
        } catch (error) {
            console.error('❌ Error en conexión:', error);
            this.connectionStatus = 'disconnected';
            this.notifyConnectionStatus(false);
            console.warn('⚠️ Activando modo localStorage');
        }
    }

    notifyConnectionStatus(connected) {
        const event = new CustomEvent('airtableConnectionUpdate', {
            detail: { 
                connected, 
                timestamp: new Date(),
                method: this.useProxy ? 'proxy' : 'direct',
                hostname: this.hostname
            }
        });
        window.dispatchEvent(event);
    }

    async makeRequest(endpoint, method = 'GET', data = null, retries = 2) {
        // 🚨 BLOQUEO ABSOLUTO de conexiones directas en producción
        if (!this.isLocalDevelopment && !this.useProxy) {
            console.error('🚨 BLOQUEADO: Intento de conexión directa en producción');
            return this.localStorageFallback(endpoint, method, data);
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                let url, options;
                
                if (this.useProxy) {
                    // 🛡️ MODO PROXY - Para evitar CSP
                    url = `${this.baseUrl}/${endpoint}`;
                    options = {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        // 🔒 Configuración anti-CSP
                        mode: 'same-origin',
                        credentials: 'omit',
                        cache: 'no-cache'
                    };
                    
                    console.log(`📡 PROXY request: ${method} ${url}`);
                    
                } else {
                    // 🔧 MODO DIRECTO - Solo localhost
                    if (!this.isLocalDevelopment) {
                        throw new Error('🚨 Conexión directa bloqueada fuera de localhost');
                    }
                    
                    url = `${this.baseUrl}/${endpoint}`;
                    options = {
                        method: method,
                        headers: {
                            'Authorization': `Bearer ${this.directApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        mode: 'cors',
                        credentials: 'omit'
                    };
                    
                    console.log(`📡 DIRECT request: ${method} ${url}`);
                }
                
                if (data && (method === 'POST' || method === 'PATCH')) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ Error ${response.status}:`, errorText);
                    
                    if (response.status === 404 && this.useProxy) {
                        throw new Error('❌ Función Netlify no encontrada - Verificar deploy');
                    }
                    
                    throw new Error(`Error ${response.status}: ${errorText}`);
                }
                
                const result = await response.json();
                console.log('✅ Request exitoso');
                
                if (this.connectionStatus !== 'connected') {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                }
                
                return result;
                
            } catch (error) {
                console.error(`❌ Intento ${attempt + 1} falló:`, error);
                
                // Si es error de CSP o TypeError en producción, ir directo a fallback
                if ((error.message.includes('Content Security Policy') || 
                     error.message.includes('Failed to fetch') ||
                     error.name === 'TypeError') && !this.isLocalDevelopment) {
                    
                    console.error('🚨 Error de CSP/Fetch detectado - usando fallback');
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    return this.localStorageFallback(endpoint, method, data);
                }
                
                if (attempt === retries) {
                    console.warn('⚠️ Todos los intentos fallaron - usando fallback');
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    return this.localStorageFallback(endpoint, method, data);
                }
                
                await this.delay(1000 * (attempt + 1));
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    localStorageFallback(endpoint, method, data) {
        console.log('💾 Usando localStorage para:', endpoint);
        
        const tableName = endpoint.split('/')[0];
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        
        try {
            switch (method) {
                case 'GET':
                    const stored = localStorage.getItem(storageKey);
                    return {
                        records: stored ? JSON.parse(stored).map(item => ({
                            id: item.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
                            fields: item
                        })) : []
                    };
                    
                case 'POST':
                    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const newRecord = { ...data.fields };
                    newRecord.id = newRecord.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
                    existing.push(newRecord);
                    localStorage.setItem(storageKey, JSON.stringify(existing));
                    
                    console.log('💾 Guardado en localStorage:', newRecord.id);
                    return { id: newRecord.id, fields: newRecord };
                    
                case 'PATCH':
                    const existingPatch = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const recordIndex = existingPatch.findIndex(r => r.id === endpoint.split('/').pop());
                    
                    if (recordIndex !== -1) {
                        existingPatch[recordIndex] = { ...existingPatch[recordIndex], ...data.fields };
                        localStorage.setItem(storageKey, JSON.stringify(existingPatch));
                    }
                    
                    return { id: 'local', fields: data.fields };
                    
                default:
                    return { records: [] };
            }
        } catch (localError) {
            console.error('❌ Error en localStorage:', localError);
            return { records: [] };
        }
    }

    // 📋 MÉTODOS DE AIRTABLE
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

    async generateUniqueAccessCode() {
        const usuarios = await this.getUsuarios();
        const existingCodes = usuarios.map(u => u.codigoAcceso).filter(Boolean);
        
        let code;
        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
        } while (existingCodes.includes(code));
        
        return code;
    }

    async testConnection() {
        try {
            console.log('🧪 Probando conexión...');
            
            let url, options;
            
            if (this.useProxy) {
                url = `${this.baseUrl}/${this.tables.solicitudes}?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'same-origin',
                    credentials: 'omit',
                    cache: 'no-cache'
                };
                console.log('🧪 Test via PROXY');
            } else {
                if (!this.isLocalDevelopment) {
                    throw new Error('Test directo bloqueado en producción');
                }
                
                url = `${this.baseUrl}/${this.tables.solicitudes}?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'omit'
                };
                console.log('🧪 Test DIRECTO');
            }
            
            console.log('🔗 Test URL:', url);
            
            const result = await fetch(url, options);
            
            if (!result.ok) {
                throw new Error(`HTTP ${result.status}: ${result.statusText}`);
            }
            
            await result.json();
            console.log('✅ Test exitoso');
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error);
            return false;
        }
    }
}

console.log('🔧 Creando instancia de AirtableAPI...');

// 🌍 Instancia global
window.airtableAPI = new AirtableAPI();

console.log('✅ window.airtableAPI creado:', !!window.airtableAPI);

// 📡 Event listener
window.addEventListener('airtableConnectionUpdate', function(event) {
    console.log('🔄 Estado actualizado:', event.detail);
    
    if (typeof updateConnectionStatus === 'function') {
        updateConnectionStatus(
            event.detail.connected, 
            event.detail.connected 
                ? `Conectado via ${event.detail.method}` 
                : 'Modo Local'
        );
    }
});

// 🚀 Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 DOM cargado - Inicializando Hospital System...');
    console.log('🌐 Dominio:', window.location.hostname);
    console.log('🛡️ Modo:', window.airtableAPI.useProxy ? 'PROXY FORZADO' : 'DIRECTO');
    console.log('📡 URL:', window.airtableAPI.baseUrl);
});

// 🛠️ Función de diagnóstico
window.debugAirtableConnection = function() {
    console.log('🔍 DIAGNÓSTICO FORZADO');
    console.log('=====================');
    console.log('🌐 Hostname:', window.location.hostname);
    console.log('🏠 Es localhost:', window.airtableAPI.isLocalDevelopment);
    console.log('🛡️ Proxy forzado:', window.airtableAPI.useProxy);
    console.log('📡 URL base:', window.airtableAPI.baseUrl);
    console.log('🔍 Estado:', window.airtableAPI.connectionStatus);
    console.log('🕐 Timestamp:', new Date().toLocaleTimeString());
    
    // Test inmediato
    console.log('\n🧪 Ejecutando test...');
    window.airtableAPI.testConnection().then(result => {
        console.log('🔍 Resultado del test:', result ? '✅ EXITOSO' : '❌ FALLÓ');
    });
    
    return {
        hostname: window.location.hostname,
        isLocal: window.airtableAPI.isLocalDevelopment,
        useProxy: window.airtableAPI.useProxy,
        baseUrl: window.airtableAPI.baseUrl,
        status: window.airtableAPI.connectionStatus
    };
};

console.log('✅ Función debugAirtableConnection creada:', typeof window.debugAirtableConnection);
console.log('🎉 airtable-config.js cargado completamente!');