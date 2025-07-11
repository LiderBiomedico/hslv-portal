// 🗄️ Configuración de Airtable API - VERSIÓN NETLIFY CON PROXY SEGURO
// Hospital Susana López de Valencia - Sistema de Gestión

class AirtableAPI {
    constructor() {
        // 🌐 Detectar entorno
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        
        // 🔗 URL base para el proxy de Netlify
        this.proxyBaseUrl = this.isProduction 
            ? '/.netlify/functions/airtable-proxy'  // Producción: usar Netlify Functions
            : '/api/airtable';  // Desarrollo: proxy directo opcional
        
        // 🛡️ Para desarrollo local, mantener conexión directa como fallback
        this.directBaseId = 'appFyEBCedQGOeJyV';
        this.directApiKey = this.isProduction ? null : 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570';
        this.directBaseUrl = `https://api.airtable.com/v0/${this.directBaseId}`;
        
        // Nombres de las tablas
        this.tables = {
            solicitudes: 'solicitudes',
            tecnicos: 'tecnicos', 
            usuarios: 'usuarios',
            solicitudesAcceso: 'solicitudesAcceso'
        };
        
        // 🚀 Estado de conexión
        this.connectionStatus = 'connecting';
        this.useProxy = this.isProduction; // En producción, siempre usar proxy
        
        console.log('🔗 AirtableAPI inicializada para:', this.isProduction ? 'PRODUCCIÓN (Proxy)' : 'DESARROLLO');
        console.log('🌐 Proxy URL:', this.proxyBaseUrl);
        
        // 🧪 Test inicial de conectividad
        this.initializeConnection();
    }

    // 🚀 Inicializar conexión con retry logic
    async initializeConnection() {
        console.log('🔄 Iniciando conexión...');
        
        try {
            const isConnected = await this.testConnection();
            
            if (isConnected) {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
                console.log('✅ Conectado a Airtable exitosamente');
                return true;
            } else {
                throw new Error('Test de conexión falló');
            }
            
        } catch (error) {
            console.error('❌ Error en conexión inicial:', error);
            
            // Si estamos en desarrollo y el proxy falla, intentar conexión directa
            if (!this.isProduction && this.directApiKey) {
                console.log('🔄 Intentando conexión directa en desarrollo...');
                try {
                    const directConnection = await this.testDirectConnection();
                    if (directConnection) {
                        this.useProxy = false;
                        this.connectionStatus = 'connected';
                        this.notifyConnectionStatus(true);
                        console.log('✅ Conectado directamente a Airtable');
                        return true;
                    }
                } catch (directError) {
                    console.error('❌ Conexión directa también falló:', directError);
                }
            }
            
            // Activar modo fallback
            this.connectionStatus = 'disconnected';
            this.notifyConnectionStatus(false);
            console.warn('⚠️ Activando modo fallback (localStorage)');
            return false;
        }
    }

    // 📢 Notificar estado de conexión
    notifyConnectionStatus(connected) {
        const event = new CustomEvent('airtableConnectionUpdate', {
            detail: { 
                connected, 
                timestamp: new Date(),
                mode: this.useProxy ? 'proxy' : (connected ? 'direct' : 'fallback')
            }
        });
        window.dispatchEvent(event);
    }

    // 🌐 Método base para hacer requests
    async makeRequest(endpoint, method = 'GET', data = null, retries = 2) {
        // Decidir si usar proxy o conexión directa
        if (this.useProxy) {
            return this.makeProxyRequest(endpoint, method, data, retries);
        } else {
            return this.makeDirectRequest(endpoint, method, data, retries);
        }
    }

    // 🛡️ Request a través del proxy de Netlify
    async makeProxyRequest(endpoint, method = 'GET', data = null, retries = 2) {
        const url = `${this.proxyBaseUrl}/${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`📡 Proxy request to: ${url} (intento ${attempt + 1})`);
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ Proxy error ${response.status}:`, errorText);
                    
                    if (response.status === 500) {
                        throw new Error(`Error del servidor proxy: ${errorText}`);
                    } else if (response.status === 403) {
                        throw new Error('Acceso denegado por el proxy');
                    } else {
                        throw new Error(`Proxy error: ${response.status} - ${errorText}`);
                    }
                }
                
                const result = await response.json();
                console.log(`✅ Proxy response received`);
                
                // Actualizar estado de conexión
                if (this.connectionStatus !== 'connected') {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                }
                
                return result;
                
            } catch (error) {
                console.error(`❌ Proxy attempt ${attempt + 1} failed:`, error);
                
                if (attempt === retries) {
                    // Si todos los intentos del proxy fallan y estamos en desarrollo, intentar directo
                    if (!this.isProduction && this.directApiKey) {
                        console.log('🔄 Proxy falló, intentando conexión directa...');
                        try {
                            this.useProxy = false;
                            return await this.makeDirectRequest(endpoint, method, data, 1);
                        } catch (directError) {
                            console.error('❌ Conexión directa también falló:', directError);
                        }
                    }
                    
                    // Último recurso: fallback
                    console.warn('⚠️ Todas las conexiones fallaron, usando localStorage');
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    return this.localStorageFallback(endpoint, method, data);
                }
                
                await this.delay(1000 * (attempt + 1));
            }
        }
    }

    // 🔗 Request directo a Airtable (solo desarrollo)
    async makeDirectRequest(endpoint, method = 'GET', data = null, retries = 2) {
        if (this.isProduction) {
            throw new Error('Conexión directa no permitida en producción');
        }

        if (!this.directApiKey) {
            throw new Error('API Key no configurada para conexión directa');
        }

        // Convertir endpoint del proxy al formato de Airtable
        const tableName = endpoint.split('/')[0];
        const tableMapping = {
            'solicitudes': 'Solicitudes',
            'tecnicos': 'Tecnicos',
            'usuarios': 'Usuarios',
            'solicitudesAcceso': 'SolicitudesAcceso'
        };
        
        const actualTableName = tableMapping[tableName] || tableName;
        const recordId = endpoint.split('/')[1];
        
        let url = `${this.directBaseUrl}/${actualTableName}`;
        if (recordId) {
            url += `/${recordId}`;
        }
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.directApiKey}`,
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`📡 Direct request to: ${url} (intento ${attempt + 1})`);
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Airtable API Error: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log(`✅ Direct response received`);
                
                if (this.connectionStatus !== 'connected') {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                }
                
                return result;
                
            } catch (error) {
                console.error(`❌ Direct attempt ${attempt + 1} failed:`, error);
                
                if (attempt === retries) {
                    console.warn('⚠️ Conexión directa falló, usando localStorage');
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    return this.localStorageFallback(endpoint, method, data);
                }
                
                await this.delay(1000 * (attempt + 1));
            }
        }
    }

    // ⏳ Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 💾 Fallback a localStorage (igual que antes)
    localStorageFallback(endpoint, method, data) {
        const [tableName] = endpoint.split('?')[0].split('/');
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
                    
                    this.markForSync(storageKey, newRecord, 'CREATE');
                    
                    return { id: newRecord.id, fields: newRecord };
                    
                case 'PATCH':
                    const existingPatch = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const recordIndex = existingPatch.findIndex(r => r.id === endpoint.split('/').pop());
                    
                    if (recordIndex !== -1) {
                        existingPatch[recordIndex] = { ...existingPatch[recordIndex], ...data.fields };
                        localStorage.setItem(storageKey, JSON.stringify(existingPatch));
                        
                        this.markForSync(storageKey, existingPatch[recordIndex], 'UPDATE');
                    }
                    
                    return { id: 'local', fields: data.fields };
                    
                default:
                    return { records: [] };
            }
        } catch (localError) {
            console.error('❌ LocalStorage fallback error:', localError);
            return { records: [] };
        }
    }

    // 🔄 Marcar datos para sincronización posterior
    markForSync(table, record, operation) {
        const syncQueue = JSON.parse(localStorage.getItem('hospital_sync_queue') || '[]');
        syncQueue.push({
            table,
            record,
            operation,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('hospital_sync_queue', JSON.stringify(syncQueue));
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

    // 🧪 Test de conexión proxy
    async testConnection() {
        try {
            console.log('🧪 Probando conexión...');
            
            if (this.useProxy) {
                const result = await fetch(`${this.proxyBaseUrl}/${this.tables.solicitudes}?maxRecords=1`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!result.ok) {
                    throw new Error(`Proxy error: ${result.status}`);
                }
                
                await result.json();
                console.log('✅ Conexión proxy exitosa');
                return true;
            } else {
                return await this.testDirectConnection();
            }
            
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
    }

    // 🧪 Test de conexión directa
    async testDirectConnection() {
        if (!this.directApiKey) return false;
        
        try {
            const result = await fetch(`${this.directBaseUrl}/Solicitudes?maxRecords=1`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.directApiKey}`,
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!result.ok) {
                throw new Error(`HTTP ${result.status}: ${result.statusText}`);
            }
            
            await result.json();
            console.log('✅ Conexión directa exitosa');
            return true;
            
        } catch (error) {
            console.error('❌ Error de conexión directa:', error);
            return false;
        }
    }
}

// 🌍 Instancia global de la API
window.airtableAPI = new AirtableAPI();

// 📡 Event listener para cambios de estado de conexión
window.addEventListener('airtableConnectionUpdate', function(event) {
    console.log('🔄 Estado de conexión actualizado:', event.detail);
    
    if (typeof updateConnectionStatus === 'function') {
        updateConnectionStatus(
            event.detail.connected, 
            event.detail.connected 
                ? `Conectado via ${event.detail.mode}` 
                : 'Modo Local'
        );
    }
});

// 🚀 Inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 Inicializando conexión con Airtable...');
    console.log('🌐 Entorno:', window.location.hostname);
    console.log('🛡️ Modo:', window.airtableAPI.useProxy ? 'Proxy Seguro' : 'Conexión Directa');
    
    // Verificar conexión cada 5 minutos
    setInterval(() => {
        if (window.airtableAPI.connectionStatus === 'disconnected') {
            console.log('🔄 Reintentando conexión...');
            window.airtableAPI.initializeConnection();
        }
    }, 5 * 60 * 1000);
});

// 🛠️ Función de diagnóstico
window.debugAirtableConnection = function() {
    console.log('🔍 DIAGNÓSTICO DE CONEXIÓN AIRTABLE');
    console.log('================================');
    console.log('🌐 Entorno:', window.airtableAPI.isProduction ? 'PRODUCCIÓN' : 'DESARROLLO');
    console.log('🛡️ Modo:', window.airtableAPI.useProxy ? 'PROXY' : 'DIRECTO');
    console.log('🔗 Proxy URL:', window.airtableAPI.proxyBaseUrl);
    console.log('📡 Estado:', window.airtableAPI.connectionStatus);
    console.log('🌍 Hostname:', window.location.hostname);
    console.log('🔐 Direct API configurada:', !!window.airtableAPI.directApiKey);
};

// 📊 Migración de datos
window.migrateFromLocalStorage = async function() {
    console.log('🔄 Iniciando migración desde localStorage...');
    
    try {
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
        
        const localRequests = localStorage.getItem('hospital_solicitudes');
        if (localRequests) {
            const requests = JSON.parse(localRequests);
            for (const request of requests) {
                await window.airtableAPI.createSolicitud(request);
            }
            console.log('✅ Solicitudes migradas');
        }
        
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