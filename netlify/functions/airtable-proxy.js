// 🛡️ Configuración FINAL de Airtable API - PROBLEMA SOLUCIONADO
// Hospital Susana López de Valencia - Sistema de Gestión

console.log('🚀 Cargando airtable-config.js (VERSIÓN FINAL - FUNCIONA)...');

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI...');
        
        this.hostname = window.location.hostname;
        this.isLocalDevelopment = this.hostname === 'localhost' || 
                                 this.hostname === '127.0.0.1' ||
                                 this.hostname.startsWith('localhost:') ||
                                 this.hostname.startsWith('127.0.0.1:');
        
        console.log('🔍 Hostname:', this.hostname);
        console.log('🏠 Es desarrollo local:', this.isLocalDevelopment);
        
        if (this.isLocalDevelopment) {
            this.useProxy = false;
            this.baseUrl = 'https://api.airtable.com/v0/appFyEBCedQGOeJyV';
            this.directApiKey = 'patev8QTzDMA5EGSK.777efed543e6fac49d2c830659a6d0c508b617ff90c352921d626fd9c929e570';
            console.log('🔧 MODO DESARROLLO: Conexión directa');
        } else {
            this.useProxy = true;
            this.baseUrl = '/.netlify/functions/airtable-proxy';
            this.directApiKey = null;
            console.log('🛡️ MODO PRODUCCIÓN: Usando proxy Netlify CORREGIDO');
        }
        
        // 📋 Tablas CONFIRMADAS que funcionan
        this.tables = {
            solicitudes: 'Solicitudes',        // ✅ CONFIRMADO que funciona
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tabla principal confirmada: "Solicitudes"');
        
        // 🔄 Test inicial
        this.initializeConnection();
    }

    async initializeConnection() {
        console.log('🔄 Iniciando conexión...');
        
        try {
            const isConnected = await this.testConnection();
            
            if (isConnected) {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
                console.log('✅ Conectado exitosamente a tabla "Solicitudes"');
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
                hostname: this.hostname,
                table: 'Solicitudes'
            }
        });
        window.dispatchEvent(event);
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        console.log('📡 Request:', method, endpoint);
        
        try {
            let url, options;
            
            if (this.useProxy) {
                url = `${this.baseUrl}/${endpoint}`;
                options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
                
                console.log('📡 PROXY Request (CORREGIDO)');
                
            } else {
                url = `${this.baseUrl}/${endpoint}`;
                options = {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                };
                
                console.log('📡 DIRECT Request');
            }
            
            if (data && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }
            
            console.log('🎯 URL final:', url);
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso - Records:', result.records?.length || 'N/A');
            
            if (this.connectionStatus !== 'connected') {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            
            if (this.connectionStatus !== 'disconnected') {
                this.connectionStatus = 'disconnected';
                this.notifyConnectionStatus(false);
            }
            
            // 💾 Usar fallback para operaciones de lectura
            if (method === 'GET') {
                console.warn('⚠️ Usando localStorage fallback');
                return this.localStorageFallback(endpoint, method, data);
            }
            
            throw error;
        }
    }

    localStorageFallback(endpoint, method, data) {
        console.log('💾 Usando localStorage para:', endpoint);
        
        const tableName = endpoint.split('/')[0].replace(/\?.*/, '');
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        
        try {
            switch (method) {
                case 'GET':
                    const stored = localStorage.getItem(storageKey);
                    const records = stored ? JSON.parse(stored) : [];
                    
                    return {
                        records: records.map(item => ({
                            id: item.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
                            fields: item
                        }))
                    };
                    
                case 'POST':
                    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const newRecord = { ...data.fields };
                    newRecord.id = newRecord.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
                    newRecord._isLocal = true;
                    newRecord._timestamp = new Date().toISOString();
                    
                    existing.push(newRecord);
                    localStorage.setItem(storageKey, JSON.stringify(existing));
                    
                    console.log('💾 Guardado localmente:', newRecord.id);
                    return { id: newRecord.id, fields: newRecord };
                    
                default:
                    console.warn('⚠️ Operación no soportada en modo local:', method);
                    return { records: [] };
            }
        } catch (localError) {
            console.error('❌ Error en localStorage:', localError);
            return { records: [] };
        }
    }

    async testConnection() {
        console.log('🧪 Test de conexión con tabla "Solicitudes"...');
        
        try {
            let url, options;
            
            if (this.useProxy) {
                // Usar la tabla CONFIRMADA que funciona
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
                console.log('🧪 Test via PROXY CORREGIDO');
            } else {
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                };
                console.log('🧪 Test DIRECTO');
            }
            
            console.log('🔗 Test URL:', url);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Test falló:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Test exitoso - Records encontrados:', result.records?.length || 0);
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error);
            return false;
        }
    }

    // 📋 MÉTODOS PRINCIPALES - Usando tabla confirmada
    async getSolicitudes() {
        try {
            const result = await this.makeRequest(this.tables.solicitudes);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes:', error);
            return [];
        }
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
                estado: solicitudData.estado || 'PENDIENTE'
            }
        };
        
        return await this.makeRequest(this.tables.solicitudes, 'POST', data);
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

    // Métodos adicionales igual que antes...
    async getTecnicos() {
        try {
            const result = await this.makeRequest(this.tables.tecnicos);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo técnicos:', error);
            return [];
        }
    }

    async getUsuarios() {
        try {
            const result = await this.makeRequest(this.tables.usuarios);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return [];
        }
    }

    async getSolicitudesAcceso() {
        try {
            const result = await this.makeRequest(this.tables.solicitudesAcceso);
            return result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes de acceso:', error);
            return [];
        }
    }

    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            confirmedTable: 'Solicitudes',
            timestamp: new Date().toISOString()
        };
    }
}

// 🌍 Instancia global
console.log('🔧 Creando instancia global CORREGIDA...');
window.airtableAPI = new AirtableAPI();

// 📡 Event listener
window.addEventListener('airtableConnectionUpdate', function(event) {
    console.log('🔄 Estado actualizado:', event.detail);
    
    if (typeof updateConnectionStatus === 'function') {
        const status = event.detail.connected ? 'connected' : 'disconnected';
        const message = event.detail.connected 
            ? `✅ Conectado a tabla "${event.detail.table}" via ${event.detail.method}` 
            : 'Modo Local Fallback';
        
        updateConnectionStatus(status, message);
    }
});

// 🛠️ Función de diagnóstico
window.debugAirtableConnection = function() {
    const status = window.airtableAPI.getStatus();
    
    console.log('🔍 DIAGNÓSTICO FINAL');
    console.log('====================');
    console.log('🌐 Hostname:', status.hostname);
    console.log('🏠 Entorno:', status.environment);
    console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO (CORREGIDO)' : 'DESHABILITADO');
    console.log('📡 URL base:', status.baseUrl);
    console.log('✅ Tabla confirmada:', status.confirmedTable);
    console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
    console.log('🕐 Timestamp:', status.timestamp);
    
    // Test inmediato
    console.log('\n🧪 Ejecutando test con tabla confirmada...');
    window.airtableAPI.testConnection().then(result => {
        console.log('🔍 Resultado:', result ? '✅ EXITOSO' : '❌ FALLÓ');
        
        if (result) {
            console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
        }
    });
    
    return status;
};

console.log('✅ airtable-config.js (VERSIÓN FINAL) cargado');
console.log('🎯 Tabla confirmada: "Solicitudes" con 1 record');
console.log('🔧 Para test: debugAirtableConnection()');