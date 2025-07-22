// 🌐 CONFIGURACIÓN AIRTABLE CORREGIDA - Versión compatible
// airtable-config.js - Con todos los métodos necesarios

class AirtableAPI {
    constructor() {
        this.baseUrl = '/.netlify/functions/airtable-proxy';
        this.debugMode = true;
        this.connectionStatus = 'disconnected';
        this.lastError = null;
        this.requestCount = 0;
        this.isConnected = false;
        
        // Mapeo de tablas
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };

        this.log('🚀 AirtableAPI iniciado - versión corregida');
    }

    // 📝 Logging simple
    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString('es-CO');
        console.log(`[${timestamp}] AirtableAPI: ${message}`, data || '');
        
        // Dispatchar evento para logging externo
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            try {
                window.dispatchEvent(new CustomEvent('airtable-log', {
                    detail: { message, data, timestamp: new Date().toISOString() }
                }));
            } catch (e) {
                // Ignorar errores de eventos
            }
        }
    }

    // 📊 MÉTODO GETATUS (el que faltaba)
    getStatus() {
        return {
            isConnected: this.isConnected,
            connectionStatus: this.connectionStatus,
            lastError: this.lastError,
            requestCount: this.requestCount,
            timestamp: new Date().toISOString()
        };
    }

    // 🔗 Función base para requests
    async makeRequest(endpoint, method = 'GET', data = null) {
        this.requestCount++;
        
        try {
            const url = `${this.baseUrl}/${endpoint}`;
            this.log(`📡 ${method} ${url}`);

            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseText = await response.text();
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = { message: responseText };
                }
                
                this.lastError = {
                    status: response.status,
                    error: errorData,
                    url,
                    timestamp: new Date().toISOString()
                };
                
                this.connectionStatus = 'error';
                this.isConnected = false;
                
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const responseData = JSON.parse(responseText);
            this.connectionStatus = 'connected';
            this.isConnected = true;
            
            return responseData;

        } catch (error) {
            this.connectionStatus = 'error';
            this.isConnected = false;
            this.lastError = {
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.log(`❌ Error en request: ${error.message}`);
            throw error;
        }
    }

    // ✅ Test de conexión
    async testConnection() {
        this.log('🧪 Probando conexión...');
        
        try {
            // Primero probar función básica
            const helloResponse = await fetch('/.netlify/functions/hello');
            if (!helloResponse.ok) {
                throw new Error('Funciones Netlify no disponibles');
            }
            
            // Luego probar Airtable
            const result = await this.makeRequest(this.tables.solicitudes + '?maxRecords=1');
            
            this.isConnected = true;
            this.connectionStatus = 'connected';
            this.log('✅ Conexión exitosa');
            
            return true;
            
        } catch (error) {
            this.isConnected = false;
            this.connectionStatus = 'error';
            this.log(`❌ Error de conexión: ${error.message}`);
            
            return false;
        }
    }

    // 📋 Obtener solicitudes
    async getSolicitudes() {
        try {
            const result = await this.makeRequest(this.tables.solicitudes);
            const solicitudes = result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            this.log(`✅ ${solicitudes.length} solicitudes obtenidas`);
            return solicitudes;
            
        } catch (error) {
            this.log(`❌ Error obteniendo solicitudes: ${error.message}`);
            return [];
        }
    }

    // 👨‍🔧 Obtener técnicos
    async getTecnicos() {
        try {
            const result = await this.makeRequest(this.tables.tecnicos);
            const tecnicos = result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            this.log(`✅ ${tecnicos.length} técnicos obtenidos`);
            return tecnicos;
            
        } catch (error) {
            this.log(`❌ Error obteniendo técnicos: ${error.message}`);
            return [];
        }
    }

    // 👤 Obtener usuarios
    async getUsuarios() {
        try {
            const result = await this.makeRequest(this.tables.usuarios);
            const usuarios = result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            this.log(`✅ ${usuarios.length} usuarios obtenidos`);
            return usuarios;
            
        } catch (error) {
            this.log(`❌ Error obteniendo usuarios: ${error.message}`);
            return [];
        }
    }

    // 📝 Obtener solicitudes de acceso
    async getSolicitudesAcceso() {
        try {
            const result = await this.makeRequest(this.tables.solicitudesAcceso);
            const solicitudes = result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            this.log(`✅ ${solicitudes.length} solicitudes de acceso obtenidas`);
            return solicitudes;
            
        } catch (error) {
            this.log(`❌ Error obteniendo solicitudes de acceso: ${error.message}`);
            return [];
        }
    }

    // 🔢 Generar número de solicitud
    async generateSolicitudNumber(area) {
        try {
            const solicitudes = await this.getSolicitudes();
            
            const prefijos = {
                'INGENIERIA_BIOMEDICA': 'SOLBIO',
                'MECANICA': 'SOLMEC', 
                'INFRAESTRUCTURA': 'SOLINFRA'
            };
            
            const prefijo = prefijos[area] || 'SOL';
            const solicitudesArea = solicitudes.filter(s => 
                s.numero && s.numero.startsWith(prefijo)
            );
            
            let maxNumber = 0;
            solicitudesArea.forEach(solicitud => {
                const numeroStr = solicitud.numero.replace(prefijo, '');
                const numero = parseInt(numeroStr);
                if (!isNaN(numero) && numero > maxNumber) {
                    maxNumber = numero;
                }
            });
            
            const siguienteNumero = maxNumber + 1;
            const numeroFormateado = siguienteNumero.toString().padStart(5, '0');
            const numeroCompleto = `${prefijo}${numeroFormateado}`;
            
            this.log(`✅ Número generado: ${numeroCompleto}`);
            return numeroCompleto;
            
        } catch (error) {
            this.log(`❌ Error generando número: ${error.message}`);
            const fallback = `SOL${Date.now().toString().slice(-5)}`;
            return fallback;
        }
    }

    // ⏰ Calcular fecha límite
    calcularFechaLimite(prioridad) {
        const ahora = new Date();
        const horasMap = {
            'CRITICA': 2,
            'ALTA': 8,
            'MEDIA': 24,
            'BAJA': 72
        };
        
        const horasLimite = horasMap[prioridad] || 24;
        const fechaLimite = new Date(ahora.getTime() + (horasLimite * 60 * 60 * 1000));
        
        return fechaLimite.toISOString();
    }

    // 📋 Crear solicitud
    async createSolicitud(solicitudData) {
        try {
            const numeroSolicitud = await this.generateSolicitudNumber(solicitudData.servicioIngenieria);
            
            const data = {
                fields: {
                    numero: numeroSolicitud,
                    servicioIngenieria: solicitudData.servicioIngenieria,
                    tipoServicio: solicitudData.tipoServicio || 'MANTENIMIENTO_PREVENTIVO',
                    prioridad: solicitudData.prioridad || 'MEDIA',
                    equipo: solicitudData.equipo || 'Equipo no especificado',
                    ubicacion: solicitudData.ubicacion || 'Ubicación no especificada',
                    descripcion: solicitudData.descripcion || 'Descripción no especificada',
                    observaciones: solicitudData.observaciones || '',
                    solicitante: solicitudData.solicitante || 'Usuario sistema',
                    servicioHospitalario: solicitudData.servicioHospitalario || 'NO_ESPECIFICADO',
                    emailSolicitante: solicitudData.emailSolicitante || '',
                    estado: 'PENDIENTE',
                    fechaCreacion: new Date().toISOString(),
                    fechaLimiteRespuesta: this.calcularFechaLimite(solicitudData.prioridad),
                    tecnicoAsignado: '',
                    fechaAsignacion: '',
                    fechaInicio: '',
                    fechaCompletado: '',
                    tiempoRespuestaHoras: 0,
                    tiempoResolucionHoras: 0,
                    estadoTiempo: 'EN_TIEMPO'
                }
            };
            
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            this.log(`✅ Solicitud creada: ${numeroSolicitud}`);
            
            return {
                success: true,
                id: result.id,
                numero: numeroSolicitud,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error creando solicitud: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ➕ Crear usuario
    async createUsuario(userData) {
        try {
            const data = {
                fields: userData
            };
            
            const result = await this.makeRequest(this.tables.usuarios, 'POST', data);
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error creando usuario: ${error.message}`);
            throw error;
        }
    }

    // ➕ Crear solicitud de acceso
    async createSolicitudAcceso(solicitudData) {
        try {
            const data = {
                fields: solicitudData
            };
            
            const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error creando solicitud de acceso: ${error.message}`);
            throw error;
        }
    }

    // ✅ Validar credenciales
    async validateUserCredentials(email, codigoAcceso) {
        try {
            const usuarios = await this.getUsuarios();
            
            const usuario = usuarios.find(u => 
                u.email && u.email.toLowerCase() === email.toLowerCase()
            );

            if (!usuario) {
                return {
                    valid: false,
                    error: 'Usuario no encontrado con ese email'
                };
            }

            if (usuario.estado !== 'ACTIVO') {
                return {
                    valid: false,
                    error: 'Usuario inactivo. Contacte al administrador.'
                };
            }

            if (usuario.codigoAcceso !== codigoAcceso) {
                return {
                    valid: false,
                    error: 'Código de acceso incorrecto'
                };
            }

            return {
                valid: true,
                user: usuario
            };
            
        } catch (error) {
            this.log(`❌ Error validando credenciales: ${error.message}`);
            return {
                valid: false,
                error: 'Error interno del sistema'
            };
        }
    }

    // 🧪 Diagnóstico completo
    async runDiagnostic() {
        this.log('🧪 Ejecutando diagnóstico completo...');
        
        const diagnostic = {
            timestamp: new Date().toISOString(),
            connectionStatus: this.connectionStatus,
            isConnected: this.isConnected,
            lastError: this.lastError,
            requestCount: this.requestCount,
            tests: {}
        };
        
        try {
            // Test conexión
            diagnostic.tests.connection = await this.testConnection();
            
            // Test datos básicos
            try {
                const solicitudes = await this.getSolicitudes();
                const tecnicos = await this.getTecnicos();
                const usuarios = await this.getUsuarios();
                
                diagnostic.tests.dataAccess = {
                    success: true,
                    solicitudes: solicitudes.length,
                    tecnicos: tecnicos.length,
                    usuarios: usuarios.length
                };
            } catch (error) {
                diagnostic.tests.dataAccess = {
                    success: false,
                    error: error.message
                };
            }
            
            diagnostic.success = diagnostic.tests.connection && diagnostic.tests.dataAccess.success;
            
        } catch (error) {
            diagnostic.success = false;
            diagnostic.error = error.message;
        }
        
        this.log('📊 Diagnóstico completado', diagnostic);
        return diagnostic;
    }

    // 📊 Estadísticas del sistema
    getSystemStats() {
        return this.getStatus(); // Usar el mismo método
    }
}

// 🚀 Inicializar API Global
window.airtableAPI = new AirtableAPI();

// 👂 Event listener para logs
if (typeof window !== 'undefined') {
    window.addEventListener('airtable-log', function(event) {
        const logElement = document.getElementById('diagnostic-log');
        if (logElement) {
            const { message, timestamp } = event.detail;
            const time = new Date(timestamp).toLocaleTimeString('es-CO');
            logElement.textContent += `[${time}] ${message}\n`;
            logElement.scrollTop = logElement.scrollHeight;
        }
    });
}

console.log('✅ AirtableAPI corregido iniciado');
console.log('🔍 Métodos disponibles:', Object.getOwnPropertyNames(AirtableAPI.prototype));
console.log('📊 Estado inicial:', window.airtableAPI.getStatus());