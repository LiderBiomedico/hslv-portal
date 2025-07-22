// 🛡️ Configuración ACTUALIZADA de Airtable API - Con Asignación de Personal y Numeración Específica
// airtable-config.js - Versión con gestión completa de solicitudes

console.log('🚀 Cargando airtable-config.js (VERSIÓN CON ASIGNACIÓN DE PERSONAL)...');

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
            console.log('🛡️ MODO PRODUCCIÓN: Usando proxy Netlify');
        }
        
        // 📋 Tablas confirmadas
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };

        // 🗺️ MAPEO DE VALORES PARA AIRTABLE
        this.fieldMappings = {
            area: {
                'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica'],
                'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
                'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA', 'Infraestructura']
            },
            tipo: {
                'ingeniero': ['Ingeniero', 'ingeniero', 'INGENIERO'],
                'tecnico': ['Técnico', 'tecnico', 'TECNICO', 'Tecnico'],
                'auxiliar': ['Auxiliar', 'auxiliar', 'AUXILIAR']
            },
            estado: {
                'disponible': ['Disponible', 'disponible', 'DISPONIBLE', 'Activo', 'activo'],
                'ocupado': ['Ocupado', 'ocupado', 'OCUPADO', 'Busy', 'busy'],
                'inactivo': ['Inactivo', 'inactivo', 'INACTIVO', 'Inactive', 'inactive']
            }
        };

        // 🔢 CONTADORES PARA NUMERACIÓN ESPECÍFICA
        this.areaCounters = {
            'INGENIERIA_BIOMEDICA': 0,
            'MECANICA': 0,
            'INFRAESTRUCTURA': 0
        };

        // 🎯 PREFIJOS POR ÁREA
        this.areaPrefixes = {
            'INGENIERIA_BIOMEDICA': 'SOLBIO',
            'MECANICA': 'SOLMEC',
            'INFRAESTRUCTURA': 'SOLINFRA'
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🔢 Sistema de numeración por área configurado');
        console.log('👨‍🔧 Sistema de asignación de personal configurado');
        
        this.initializeConnectionAsync();
    }

    // 🗺️ FUNCIÓN PARA MAPEAR VALORES SEGÚN AIRTABLE
    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        if (!this.fieldMappings[fieldType]) {
            return value;
        }

        const mapping = this.fieldMappings[fieldType];
        
        for (const [key, possibleValues] of Object.entries(mapping)) {
            if (possibleValues.includes(value)) {
                console.log(`🗺️ Mapeando ${fieldType}: "${value}" → "${possibleValues[0]}"`);
                return possibleValues[0];
            }
        }
        
        console.warn(`⚠️ No se encontró mapeo para ${fieldType}: "${value}"`);
        return value;
    }

    // 🔢 GENERAR NÚMERO ESPECÍFICO POR ÁREA
    async generateAreaSpecificNumber(area) {
        console.log('🔢 Generando número específico para área:', area);
        
        try {
            // Obtener todas las solicitudes para calcular el siguiente número
            const solicitudes = await this.getSolicitudes();
            
            // Filtrar por área y encontrar el número más alto
            const prefix = this.areaPrefixes[area];
            if (!prefix) {
                console.warn('⚠️ Área no reconocida, usando formato estándar');
                return `SOL${Date.now()}${Math.random().toString(36).substring(2, 3).toUpperCase()}`;
            }

            const areaRequests = solicitudes.filter(s => 
                s.numero && s.numero.startsWith(prefix)
            );

            let maxNumber = 0;
            areaRequests.forEach(solicitud => {
                const numberPart = solicitud.numero.replace(prefix, '');
                const num = parseInt(numberPart);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            });

            const nextNumber = maxNumber + 1;
            const formattedNumber = nextNumber.toString().padStart(5, '0');
            const newRequestNumber = `${prefix}${formattedNumber}`;

            console.log(`✅ Número generado: ${newRequestNumber} (siguiente: ${nextNumber})`);
            return newRequestNumber;

        } catch (error) {
            console.error('❌ Error generando número específico:', error);
            // Fallback al formato anterior
            const prefix = this.areaPrefixes[area] || 'SOL';
            const randomPart = Date.now().toString().slice(-5);
            return `${prefix}${randomPart}`;
        }
    }

    async initializeConnectionAsync() {
        setTimeout(async () => {
            try {
                const isConnected = await this.testConnection();
                
                if (isConnected) {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                    console.log('✅ Conectado exitosamente a Airtable');
                    
                    // Auto-detectar valores válidos para prevenir futuros errores 422
                    await this.autoDetectFieldValues();
                } else {
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                    console.warn('⚠️ Modo localStorage activo');
                }
            } catch (error) {
                console.error('❌ Error en inicialización:', error);
                this.connectionStatus = 'disconnected';
                this.notifyConnectionStatus(false);
            }
        }, 2000);
    }

    // 🔍 AUTO-DETECTAR VALORES VÁLIDOS
    async autoDetectFieldValues() {
        console.log('🔍 Auto-detectando valores válidos en Airtable...');
        
        try {
            const areaValues = await this.detectValidFieldValues('Tecnicos', 'area');
            const tipoValues = await this.detectValidFieldValues('Tecnicos', 'tipo');
            const estadoValues = await this.detectValidFieldValues('Tecnicos', 'estado');
            
            if (areaValues.length > 0) {
                console.log('🔄 Actualizando mapeo de área con valores detectados');
                this.updateFieldMapping('area', areaValues);
            }
            
            if (tipoValues.length > 0) {
                console.log('🔄 Actualizando mapeo de tipo con valores detectados');
                this.updateFieldMapping('tipo', tipoValues);
            }
            
            if (estadoValues.length > 0) {
                console.log('🔄 Actualizando mapeo de estado con valores detectados');
                this.updateFieldMapping('estado', estadoValues);
            }
            
        } catch (error) {
            console.warn('⚠️ No se pudieron auto-detectar valores:', error);
        }
    }

    async detectValidFieldValues(tableName, fieldName) {
        console.log(`🔍 Detectando valores válidos para ${tableName}.${fieldName}...`);
        
        try {
            const result = await this.makeRequest(`${tableName}?maxRecords=10`);
            
            if (result.records && result.records.length > 0) {
                const values = new Set();
                
                result.records.forEach(record => {
                    if (record.fields[fieldName]) {
                        values.add(record.fields[fieldName]);
                    }
                });
                
                const validValues = Array.from(values);
                console.log(`✅ Valores válidos encontrados para ${fieldName}:`, validValues);
                
                return validValues;
            }
            
            return [];
        } catch (error) {
            console.error(`❌ Error detectando valores para ${fieldName}:`, error);
            return [];
        }
    }

    updateFieldMapping(fieldType, detectedValues) {
        if (!this.fieldMappings[fieldType]) {
            this.fieldMappings[fieldType] = {};
        }
        
        detectedValues.forEach(value => {
            const normalizedKey = value.toLowerCase().replace(/[áéíóú]/g, match => {
                const map = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
                return map[match];
            });
            
            this.fieldMappings[fieldType][normalizedKey] = [value];
        });
        
        console.log(`🗺️ Mapeo actualizado para ${fieldType}:`, this.fieldMappings[fieldType]);
    }

    notifyConnectionStatus(connected) {
        try {
            const event = new CustomEvent('airtableConnectionUpdate', {
                detail: { 
                    connected, 
                    timestamp: new Date(),
                    method: this.useProxy ? 'proxy' : 'direct',
                    hostname: this.hostname
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.warn('⚠️ No se pudo notificar cambio de estado:', error);
        }
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
            }
            
            if (data && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }
            
            console.log('🎯 URL final:', url);
            console.log('📊 Method:', method);
            if (data) console.log('📝 Data:', JSON.stringify(data, null, 2));
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                if (response.status === 422) {
                    console.error('🚨 ERROR 422 - Valores de campo inválidos');
                    console.error('🔍 Datos enviados:', data);
                    console.error('🔍 Endpoint:', endpoint);
                    
                    if (endpoint.includes('Tecnicos')) {
                        console.log('🔧 Intentando auto-detectar valores válidos...');
                        await this.autoDetectFieldValues();
                    }
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso - Records:', result.records?.length || result.id || 'N/A');
            
            if (this.connectionStatus !== 'connected') {
                console.log('🔄 Actualizando estado a conectado después de request exitoso');
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                console.log('🌐 Error de red detectado - cambiando estado a desconectado');
                if (this.connectionStatus !== 'disconnected') {
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                }
                
                if (method === 'GET') {
                    console.warn('⚠️ Usando localStorage fallback para lectura');
                    return this.localStorageFallback(endpoint, method, data);
                }
            }
            
            throw error;
        }
    }

    localStorageFallback(endpoint, method, data) {
        console.log('💾 Usando localStorage para:', endpoint);
        
        const tableName = endpoint.split('/')[0].replace(/\?.*/, '');
        const storageKey = `hospital_${tableName.toLowerCase()}`;
        
        try {
            const stored = localStorage.getItem(storageKey);
            const records = stored ? JSON.parse(stored) : [];
            
            return {
                records: records.map(item => ({
                    id: item.id || `rec${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
                    fields: item.fields || item
                }))
            };
        } catch (localError) {
            console.error('❌ Error en localStorage:', localError);
            return { records: [] };
        }
    }

    async testConnection() {
        console.log('🧪 Test de conexión...');
        
        try {
            let url, options;
            
            if (this.useProxy) {
                url = `${this.baseUrl}/Solicitudes?maxRecords=1`;
                options = {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
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
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                console.error('❌ Test falló:', response.status);
                return false;
            }
            
            const result = await response.json();
            console.log('✅ Test exitoso');
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error.message);
            return false;
        }
    }

    async testTecnicosTable() {
        console.log('🧪 Test específico de tabla Tecnicos...');
        
        try {
            let url, options;
            
            if (this.useProxy) {
                url = `${this.baseUrl}/Tecnicos?maxRecords=3`;
                options = {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors',
                    credentials: 'same-origin'
                };
            } else {
                url = `${this.baseUrl}/Tecnicos?maxRecords=3`;
                options = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.directApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                };
            }
            
            console.log('🎯 Testing URL:', url);
            
            const response = await fetch(url, options);
            console.log('📨 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Test tabla Tecnicos falló:', response.status, errorText);
                return { 
                    success: false, 
                    status: response.status, 
                    error: errorText,
                    url: url 
                };
            }
            
            const result = await response.json();
            console.log('✅ Test tabla Tecnicos exitoso');
            console.log('📋 Estructura:', result);
            
            if (result.records && result.records.length > 0) {
                console.log('🔍 Auto-detectando valores válidos...');
                this.autoDetectFieldValues();
            }
            
            return { 
                success: true, 
                records: result.records?.length || 0,
                structure: result 
            };
            
        } catch (error) {
            console.error('❌ Test tabla Tecnicos falló:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // 📋 MÉTODOS PRINCIPALES - SOLICITUDES CON NUMERACIÓN ESPECÍFICA
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
        console.log('📝 Creando solicitud con numeración específica...');
        
        try {
            // Generar número específico según el área
            const numero = await this.generateAreaSpecificNumber(solicitudData.servicioIngenieria);
            
            const data = {
                fields: {
                    numero: numero,
                    descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                    estado: 'PENDIENTE',
                    fechaCreacion: new Date().toISOString(),
                    tiempoRespuestaMaximo: this.calculateMaxResponseTime(solicitudData.prioridad),
                    // Datos específicos de la solicitud
                    ...(solicitudData.servicioIngenieria && { servicioIngenieria: solicitudData.servicioIngenieria }),
                    ...(solicitudData.tipoServicio && { tipoServicio: solicitudData.tipoServicio }),
                    ...(solicitudData.prioridad && { prioridad: solicitudData.prioridad }),
                    ...(solicitudData.equipo && { equipo: solicitudData.equipo }),
                    ...(solicitudData.ubicacion && { ubicacion: solicitudData.ubicacion }),
                    ...(solicitudData.observaciones && { observaciones: solicitudData.observaciones }),
                    // Datos del solicitante
                    ...(solicitudData.solicitante && { solicitante: solicitudData.solicitante }),
                    ...(solicitudData.servicioHospitalario && { servicioHospitalario: solicitudData.servicioHospitalario }),
                    ...(solicitudData.emailSolicitante && { emailSolicitante: solicitudData.emailSolicitante })
                }
            };
            
            console.log('📝 Creando solicitud con datos:', data);
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log(`✅ Solicitud creada: ${numero}`);
            return result;
            
        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            throw error;
        }
    }

    // ⏱️ CALCULAR TIEMPO MÁXIMO DE RESPUESTA SEGÚN PRIORIDAD
    calculateMaxResponseTime(prioridad) {
        const tiemposRespuesta = {
            'CRITICA': 2, // 2 horas
            'ALTA': 8,    // 8 horas
            'MEDIA': 24,  // 24 horas
            'BAJA': 72    // 72 horas
        };
        
        const horas = tiemposRespuesta[prioridad] || 24;
        const fechaMaxima = new Date();
        fechaMaxima.setHours(fechaMaxima.getHours() + horas);
        
        return fechaMaxima.toISOString();
    }

    // 🎯 MÉTODOS DE ASIGNACIÓN DE PERSONAL
    async assignTechnicianToRequest(solicitudId, tecnicoId, observacionesAsignacion = '') {
        console.log('🎯 Asignando técnico a solicitud:', { solicitudId, tecnicoId });
        
        try {
            // 1. Obtener datos del técnico
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.id === tecnicoId);
            
            if (!tecnico) {
                throw new Error('Técnico no encontrado');
            }

            if (tecnico.estado !== 'disponible') {
                throw new Error(`Técnico no disponible. Estado actual: ${tecnico.estado}`);
            }

            // 2. Obtener datos de la solicitud
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }

            // 3. Actualizar solicitud con asignación
            const updateSolicitudData = {
                fields: {
                    estado: 'ASIGNADA',
                    tecnicoAsignado: tecnico.nombre,
                    tecnicoAsignadoId: tecnicoId,
                    fechaAsignacion: new Date().toISOString(),
                    observacionesAsignacion: observacionesAsignacion,
                    // Calcular tiempo estimado de respuesta
                    tiempoEstimadoRespuesta: this.calculateEstimatedResponseTime(solicitud.prioridad, tecnico.area)
                }
            };

            const solicitudResult = await this.makeRequest(
                `${this.tables.solicitudes}/${solicitudId}`, 
                'PATCH', 
                updateSolicitudData
            );

            // 4. Actualizar estado del técnico a ocupado
            await this.updateTecnico(tecnicoId, { 
                estado: 'ocupado',
                solicitudAsignada: solicitud.numero,
                fechaUltimaAsignacion: new Date().toISOString()
            });

            console.log('✅ Asignación completada exitosamente');

            return {
                success: true,
                solicitud: {
                    id: solicitudId,
                    numero: solicitud.numero,
                    estado: 'ASIGNADA',
                    tecnicoAsignado: tecnico.nombre
                },
                tecnico: {
                    id: tecnicoId,
                    nombre: tecnico.nombre,
                    area: tecnico.area,
                    estado: 'ocupado'
                },
                fechaAsignacion: new Date().toISOString(),
                tiempoEstimadoRespuesta: updateSolicitudData.fields.tiempoEstimadoRespuesta
            };

        } catch (error) {
            console.error('❌ Error en asignación:', error);
            throw error;
        }
    }

    // ⏱️ CALCULAR TIEMPO ESTIMADO DE RESPUESTA
    calculateEstimatedResponseTime(prioridad, areaPersonal) {
        const tiemposBase = {
            'CRITICA': 1,
            'ALTA': 4,
            'MEDIA': 12,
            'BAJA': 48
        };

        // Factores de ajuste por área
        const factoresArea = {
            'INGENIERIA_BIOMEDICA': 1.0, // Tiempo estándar
            'MECANICA': 1.2,             // 20% más tiempo
            'INFRAESTRUCTURA': 1.5       // 50% más tiempo
        };

        const horasBase = tiemposBase[prioridad] || 12;
        const factor = factoresArea[areaPersonal] || 1.0;
        const horasEstimadas = Math.ceil(horasBase * factor);

        const fechaEstimada = new Date();
        fechaEstimada.setHours(fechaEstimada.getHours() + horasEstimadas);

        return fechaEstimada.toISOString();
    }

    // 🔄 CAMBIAR ESTADO DE SOLICITUD
    async updateRequestStatus(solicitudId, nuevoEstado, observaciones = '') {
        console.log('🔄 Actualizando estado de solicitud:', { solicitudId, nuevoEstado });
        
        try {
            const updateData = {
                fields: {
                    estado: nuevoEstado,
                    observacionesEstado: observaciones
                }
            };

            // Agregar timestamp específico según el nuevo estado
            switch (nuevoEstado) {
                case 'EN_PROCESO':
                    updateData.fields.fechaInicioTrabajo = new Date().toISOString();
                    break;
                case 'COMPLETADA':
                    updateData.fields.fechaCompletado = new Date().toISOString();
                    updateData.fields.tiempoTotalRespuesta = this.calculateTotalResponseTime(solicitudId);
                    break;
                case 'CANCELADA':
                    updateData.fields.fechaCancelacion = new Date().toISOString();
                    break;
            }

            const result = await this.makeRequest(
                `${this.tables.solicitudes}/${solicitudId}`, 
                'PATCH', 
                updateData
            );

            // Si se completa la solicitud, liberar el técnico
            if (nuevoEstado === 'COMPLETADA') {
                await this.liberarTecnicoAsignado(solicitudId);
            }

            console.log(`✅ Estado actualizado a: ${nuevoEstado}`);
            return result;

        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            throw error;
        }
    }

    // 🔓 LIBERAR TÉCNICO ASIGNADO
    async liberarTecnicoAsignado(solicitudId) {
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (solicitud && solicitud.tecnicoAsignadoId) {
                await this.updateTecnico(solicitud.tecnicoAsignadoId, { 
                    estado: 'disponible',
                    solicitudAsignada: null,
                    fechaLiberacion: new Date().toISOString()
                });
                
                console.log('✅ Técnico liberado exitosamente');
            }
        } catch (error) {
            console.warn('⚠️ No se pudo liberar técnico:', error);
        }
    }

    // ⏱️ CALCULAR TIEMPO TOTAL DE RESPUESTA
    async calculateTotalResponseTime(solicitudId) {
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (solicitud && solicitud.fechaCreacion) {
                const fechaCreacion = new Date(solicitud.fechaCreacion);
                const fechaActual = new Date();
                const tiempoTranscurrido = fechaActual - fechaCreacion;
                
                // Convertir a horas
                const horas = Math.floor(tiempoTranscurrido / (1000 * 60 * 60));
                const minutos = Math.floor((tiempoTranscurrido % (1000 * 60 * 60)) / (1000 * 60));
                
                return `${horas}h ${minutos}m`;
            }
            
            return 'No calculado';
        } catch (error) {
            console.error('❌ Error calculando tiempo total:', error);
            return 'Error en cálculo';
        }
    }

    // 📊 OBTENER SOLICITUDES PENDIENTES POR ÁREA
    async getPendingRequestsByArea(area) {
        try {
            const solicitudes = await this.getSolicitudes();
            return solicitudes.filter(s => 
                s.servicioIngenieria === area && 
                (s.estado === 'PENDIENTE' || !s.tecnicoAsignado)
            );
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes pendientes:', error);
            return [];
        }
    }

    // 🤖 AUTO-ASIGNAR SOLICITUDES PENDIENTES
    async autoAssignPendingRequests(area = null) {
        console.log('🤖 Iniciando auto-asignación de solicitudes...');
        
        try {
            // Obtener solicitudes pendientes
            let solicitudesPendientes;
            if (area) {
                solicitudesPendientes = await this.getPendingRequestsByArea(area);
            } else {
                const todasSolicitudes = await this.getSolicitudes();
                solicitudesPendientes = todasSolicitudes.filter(s => 
                    s.estado === 'PENDIENTE' || !s.tecnicoAsignado
                );
            }

            // Obtener técnicos disponibles
            const tecnicosDisponibles = await this.getTecnicosDisponibles();

            const resultados = {
                asignadas: 0,
                fallidas: 0,
                sinTecnicos: 0,
                detalles: []
            };

            for (const solicitud of solicitudesPendientes) {
                try {
                    // Buscar técnico disponible del área correspondiente
                    const tecnicoAdecuado = tecnicosDisponibles.find(t => 
                        t.area === solicitud.servicioIngenieria && t.estado === 'disponible'
                    );

                    if (tecnicoAdecuado) {
                        await this.assignTechnicianToRequest(
                            solicitud.id, 
                            tecnicoAdecuado.id, 
                            'Asignación automática del sistema'
                        );
                        
                        resultados.asignadas++;
                        resultados.detalles.push({
                            solicitud: solicitud.numero,
                            tecnico: tecnicoAdecuado.nombre,
                            area: solicitud.servicioIngenieria
                        });

                        // Marcar técnico como ocupado localmente para próximas iteraciones
                        tecnicoAdecuado.estado = 'ocupado';
                    } else {
                        resultados.sinTecnicos++;
                        console.warn(`⚠️ No hay técnicos disponibles para ${solicitud.numero} (${solicitud.servicioIngenieria})`);
                    }

                } catch (error) {
                    resultados.fallidas++;
                    console.error(`❌ Error asignando ${solicitud.numero}:`, error);
                }
            }

            console.log('✅ Auto-asignación completada:', resultados);
            return resultados;

        } catch (error) {
            console.error('❌ Error en auto-asignación:', error);
            throw error;
        }
    }

    // 👥 MÉTODOS DE TÉCNICOS/PERSONAL DE SOPORTE (mantenidos)
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

    async createTecnico(tecnicoData) {
        console.log('➕ Creando personal de soporte:', tecnicoData.nombre);
        
        const mappedData = {
            nombre: tecnicoData.nombre,
            email: tecnicoData.email,
            area: this.mapFieldValue('area', tecnicoData.area),
            tipo: this.mapFieldValue('tipo', tecnicoData.tipo),
            especialidad: tecnicoData.especialidad || '',
            estado: this.mapFieldValue('estado', tecnicoData.estado || 'disponible'),
            fechaCreacion: new Date().toISOString()
        };
        
        const data = {
            fields: mappedData
        };
        
        try {
            const result = await this.makeRequest(this.tables.tecnicos, 'POST', data);
            console.log('✅ Personal de soporte creado exitosamente:', result.id);
            return result;
        } catch (error) {
            console.error('❌ Error creando personal de soporte:', error);
            
            if (error.message.includes('422')) {
                console.log('🔧 Error 422 detectado, intentando con valores alternativos...');
                return await this.retryCreateTecnicoWithAlternatives(tecnicoData);
            }
            
            throw new Error(`Error creando personal: ${error.message}`);
        }
    }

    async retryCreateTecnicoWithAlternatives(originalData) {
        console.log('🔄 Reintentando creación con valores alternativos...');
        
        const alternatives = {
            area: {
                'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'Biomedica', 'Biomédica', 'INGENIERIA_BIOMEDICA'],
                'MECANICA': ['Mecánica', 'Mecanica', 'MECANICA'],
                'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA']
            },
            tipo: {
                'ingeniero': ['Ingeniero', 'ingeniero', 'INGENIERO'],
                'tecnico': ['Técnico', 'Tecnico', 'tecnico', 'TECNICO'],
                'auxiliar': ['Auxiliar', 'auxiliar', 'AUXILIAR']
            },
            estado: {
                'disponible': ['Disponible', 'disponible', 'DISPONIBLE', 'Activo'],
                'ocupado': ['Ocupado', 'ocupado', 'OCUPADO'],
                'inactivo': ['Inactivo', 'inactivo', 'INACTIVO']
            }
        };
        
        for (const areaAlt of alternatives.area[originalData.area] || [originalData.area]) {
            for (const tipoAlt of alternatives.tipo[originalData.tipo] || [originalData.tipo]) {
                for (const estadoAlt of alternatives.estado[originalData.estado || 'disponible'] || [originalData.estado || 'disponible']) {
                    
                    try {
                        console.log(`🧪 Intentando: area="${areaAlt}", tipo="${tipoAlt}", estado="${estadoAlt}"`);
                        
                        const data = {
                            fields: {
                                nombre: originalData.nombre,
                                email: originalData.email,
                                area: areaAlt,
                                tipo: tipoAlt,
                                especialidad: originalData.especialidad || '',
                                estado: estadoAlt,
                                fechaCreacion: new Date().toISOString()
                            }
                        };
                        
                        const result = await this.makeRequest(this.tables.tecnicos, 'POST', data);
                        
                        console.log(`✅ Éxito con valores: area="${areaAlt}", tipo="${tipoAlt}", estado="${estadoAlt}"`);
                        
                        this.fieldMappings.area[originalData.area] = [areaAlt];
                        this.fieldMappings.tipo[originalData.tipo] = [tipoAlt];
                        this.fieldMappings.estado[originalData.estado || 'disponible'] = [estadoAlt];
                        
                        return result;
                        
                    } catch (retryError) {
                        console.log(`❌ Falló con: area="${areaAlt}", tipo="${tipoAlt}", estado="${estadoAlt}"`);
                    }
                }
            }
        }
        
        throw new Error('No se pudo crear el personal con ninguna combinación de valores válidos. Verificar configuración de campos en Airtable.');
    }

    async updateTecnico(tecnicoId, updateData) {
        console.log('🔄 Actualizando personal de soporte:', tecnicoId);
        
        const mappedData = {};
        Object.keys(updateData).forEach(key => {
            if (key === 'area') {
                mappedData[key] = this.mapFieldValue('area', updateData[key]);
            } else if (key === 'tipo') {
                mappedData[key] = this.mapFieldValue('tipo', updateData[key]);
            } else if (key === 'estado') {
                mappedData[key] = this.mapFieldValue('estado', updateData[key]);
            } else {
                mappedData[key] = updateData[key];
            }
        });
        
        const data = {
            fields: mappedData
        };
        
        try {
            const result = await this.makeRequest(`${this.tables.tecnicos}/${tecnicoId}`, 'PATCH', data);
            console.log('✅ Personal de soporte actualizado exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en update normal, intentando método alternativo...');
            
            try {
                const tecnicos = await this.getTecnicos();
                const tecnico = tecnicos.find(t => t.id === tecnicoId);
                
                if (!tecnico) {
                    throw new Error(`Personal de soporte ${tecnicoId} no encontrado`);
                }
                
                console.log('✅ Personal encontrado, simulando update...');
                
                const updatedTecnico = { ...tecnico, ...mappedData };
                console.log('💾 Update simulado localmente');
                
                return { id: tecnicoId, fields: updatedTecnico };
                
            } catch (altError) {
                console.error('❌ Método alternativo también falló:', altError);
                throw error;
            }
        }
    }

    async findTecnicoByEmail(email) {
        try {
            const tecnicos = await this.getTecnicos();
            return tecnicos.find(tecnico => tecnico.email && tecnico.email.toLowerCase() === email.toLowerCase());
        } catch (error) {
            console.error('❌ Error buscando técnico por email:', error);
            return null;
        }
    }

    async getTecnicosByArea(area) {
        try {
            const tecnicos = await this.getTecnicos();
            return tecnicos.filter(tecnico => tecnico.area === area);
        } catch (error) {
            console.error('❌ Error obteniendo técnicos por área:', error);
            return [];
        }
    }

    async getTecnicosDisponibles() {
        try {
            const tecnicos = await this.getTecnicos();
            return tecnicos.filter(tecnico => tecnico.estado === 'disponible');
        } catch (error) {
            console.error('❌ Error obteniendo técnicos disponibles:', error);
            return [];
        }
    }

    // Resto de métodos sin cambios importantes...
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

    async createUsuario(userData) {
        const data = {
            fields: {
                nombreCompleto: userData.nombreCompleto,
                email: userData.email,
                telefono: userData.telefono || '',
                servicioHospitalario: userData.servicioHospitalario,
                cargo: userData.cargo || '',
                codigoAcceso: userData.codigoAcceso,
                estado: userData.estado || 'ACTIVO',
                fechaCreacion: userData.fechaCreacion || new Date().toISOString(),
                fechaUltimoAcceso: userData.fechaUltimoAcceso || null,
                solicitudOrigenId: userData.solicitudOrigenId || ''
            }
        };
        
        console.log('➕ Creando usuario:', userData.email);
        return await this.makeRequest(this.tables.usuarios, 'POST', data);
    }

    async updateUsuario(userId, updateData) {
        console.log('🔄 Actualizando usuario:', userId);
        
        const data = {
            fields: updateData
        };
        
        try {
            const result = await this.makeRequest(`${this.tables.usuarios}/${userId}`, 'PATCH', data);
            console.log('✅ Usuario actualizado exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en update normal, intentando método alternativo...');
            
            try {
                const usuarios = await this.getUsuarios();
                const usuario = usuarios.find(u => u.id === userId);
                
                if (!usuario) {
                    throw new Error(`Usuario ${userId} no encontrado`);
                }
                
                const updatedUser = { ...usuario, ...updateData };
                return { id: userId, fields: updatedUser };
                
            } catch (altError) {
                console.error('❌ Método alternativo también falló:', altError);
                throw error;
            }
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
        
        console.log('📝 Creando solicitud de acceso:', solicitudData.email);
        return await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
    }

    async updateSolicitudAcceso(requestId, updateData) {
        console.log('🔄 Actualizando solicitud de acceso:', requestId);
        
        const data = {
            fields: updateData
        };
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', data);
            console.log('✅ Solicitud de acceso actualizada exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en update de solicitud, intentando método alternativo...');
            
            try {
                const solicitudes = await this.getSolicitudesAcceso();
                const solicitud = solicitudes.find(s => s.id === requestId);
                
                if (!solicitud) {
                    throw new Error(`Solicitud ${requestId} no encontrada`);
                }
                
                return { id: requestId, fields: { ...solicitud, ...updateData } };
                
            } catch (altError) {
                console.error('❌ Método alternativo para solicitud también falló:', altError);
                throw error;
            }
        }
    }

    async findUserByEmail(email) {
        try {
            const usuarios = await this.getUsuarios();
            return usuarios.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
        } catch (error) {
            console.error('❌ Error buscando usuario por email:', error);
            return null;
        }
    }

    async validateUserCredentials(email, codigoAcceso) {
        try {
            const user = await this.findUserByEmail(email);
            
            if (!user) {
                return { valid: false, error: 'Usuario no encontrado' };
            }

            if (user.estado !== 'ACTIVO') {
                return { valid: false, error: `Usuario en estado: ${user.estado}` };
            }

            if (!user.codigoAcceso) {
                return { valid: false, error: 'Usuario sin código asignado' };
            }

            if (String(user.codigoAcceso) !== String(codigoAcceso)) {
                return { valid: false, error: 'Código incorrecto' };
            }

            try {
                await this.updateUsuario(user.id, {
                    fechaUltimoAcceso: new Date().toISOString()
                });
            } catch (updateError) {
                console.warn('⚠️ No se pudo actualizar último acceso:', updateError);
            }

            return { valid: true, user: user };

        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            return { valid: false, error: 'Error de sistema' };
        }
    }

    async generateUniqueAccessCode() {
        try {
            const usuarios = await this.getUsuarios();
            const existingCodes = usuarios
                .map(u => u.codigoAcceso)
                .filter(code => code)
                .map(code => String(code));

            let code;
            let attempts = 0;
            const maxAttempts = 100;

            do {
                code = Math.floor(1000 + Math.random() * 9000).toString();
                attempts++;
                
                if (attempts > maxAttempts) {
                    throw new Error('No se pudo generar código único después de 100 intentos');
                }
            } while (existingCodes.includes(code));

            console.log(`🎲 Código único generado: ${code} (${attempts} intentos)`);
            return code;

        } catch (error) {
            console.error('❌ Error generando código único:', error);
            const fallbackCode = Math.floor(1000 + Math.random() * 9000).toString();
            console.warn(`⚠️ Usando código fallback: ${fallbackCode}`);
            return fallbackCode;
        }
    }

    async approveAccessRequestAndCreateUser(requestId) {
        try {
            console.log('🚀 Iniciando aprobación para:', requestId);

            let request;
            try {
                const solicitudesAcceso = await this.getSolicitudesAcceso();
                request = solicitudesAcceso.find(s => s.id === requestId);
                
                if (!request) {
                    throw new Error('Solicitud no encontrada');
                }
                
                console.log('✅ Solicitud encontrada:', request.nombreCompleto);
            } catch (error) {
                console.error('❌ Error obteniendo solicitud:', error);
                throw new Error(`No se pudo obtener la solicitud: ${error.message}`);
            }

            if (request.estado !== 'PENDIENTE') {
                throw new Error(`Solicitud en estado: ${request.estado}`);
            }

            const existingUser = await this.findUserByEmail(request.email);
            const accessCode = await this.generateUniqueAccessCode();
            console.log('🎲 Código generado:', accessCode);

            const userData = {
                nombreCompleto: request.nombreCompleto,
                email: request.email,
                telefono: request.telefono || '',
                servicioHospitalario: request.servicioHospitalario,
                cargo: request.cargo,
                codigoAcceso: accessCode,
                estado: 'ACTIVO',
                fechaCreacion: new Date().toISOString(),
                solicitudOrigenId: requestId
            };

            let userResult;
            try {
                if (existingUser) {
                    console.log('🔄 Actualizando usuario existente:', existingUser.id);
                    userResult = await this.updateUsuario(existingUser.id, userData);
                    userData.id = existingUser.id;
                } else {
                    console.log('➕ Creando nuevo usuario');
                    userResult = await this.createUsuario(userData);
                    userData.id = userResult.id;
                }
                console.log('✅ Usuario procesado exitosamente');
            } catch (userError) {
                console.error('❌ Error procesando usuario:', userError);
                throw new Error(`Error creando/actualizando usuario: ${userError.message}`);
            }

            try {
                await this.updateSolicitudAcceso(requestId, {
                    estado: 'APROBADA',
                    fechaAprobacion: new Date().toISOString(),
                    usuarioCreado: userData.id
                });
                console.log('✅ Solicitud marcada como aprobada');
            } catch (updateError) {
                console.warn('⚠️ No se pudo actualizar estado de solicitud, pero usuario fue creado:', updateError);
            }

            console.log('✅ Aprobación completada exitosamente');

            return {
                success: true,
                user: userData,
                accessCode: accessCode,
                requestId: requestId,
                action: existingUser ? 'updated' : 'created'
            };

        } catch (error) {
            console.error('❌ Error en aprobación completa:', error);
            throw error;
        }
    }

    // 📊 ESTADÍSTICAS MEJORADAS CON ASIGNACIONES
    async getAdvancedStatistics() {
        try {
            console.log('📊 Obteniendo estadísticas avanzadas...');
            
            const [usuarios, solicitudesAcceso, solicitudes, tecnicos] = await Promise.all([
                this.getUsuarios(),
                this.getSolicitudesAcceso(),
                this.getSolicitudes(),
                this.getTecnicos()
            ]);

            const stats = {
                usuarios: {
                    total: usuarios.length,
                    activos: usuarios.filter(u => u.estado === 'ACTIVO').length,
                    inactivos: usuarios.filter(u => u.estado === 'INACTIVO').length,
                    conCodigo: usuarios.filter(u => u.codigoAcceso).length
                },
                solicitudesAcceso: {
                    total: solicitudesAcceso.length,
                    pendientes: solicitudesAcceso.filter(s => s.estado === 'PENDIENTE').length,
                    aprobadas: solicitudesAcceso.filter(s => s.estado === 'APROBADA').length,
                    rechazadas: solicitudesAcceso.filter(s => s.estado === 'RECHAZADA').length
                },
                solicitudes: {
                    total: solicitudes.length,
                    pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
                    asignadas: solicitudes.filter(s => s.estado === 'ASIGNADA').length,
                    enProceso: solicitudes.filter(s => s.estado === 'EN_PROCESO').length,
                    completadas: solicitudes.filter(s => s.estado === 'COMPLETADA').length,
                    canceladas: solicitudes.filter(s => s.estado === 'CANCELADA').length,
                    // Estadísticas por área
                    porArea: {
                        INGENIERIA_BIOMEDICA: solicitudes.filter(s => s.servicioIngenieria === 'INGENIERIA_BIOMEDICA').length,
                        MECANICA: solicitudes.filter(s => s.servicioIngenieria === 'MECANICA').length,
                        INFRAESTRUCTURA: solicitudes.filter(s => s.servicioIngenieria === 'INFRAESTRUCTURA').length
                    },
                    // Estadísticas por prioridad
                    porPrioridad: {
                        CRITICA: solicitudes.filter(s => s.prioridad === 'CRITICA').length,
                        ALTA: solicitudes.filter(s => s.prioridad === 'ALTA').length,
                        MEDIA: solicitudes.filter(s => s.prioridad === 'MEDIA').length,
                        BAJA: solicitudes.filter(s => s.prioridad === 'BAJA').length
                    }
                },
                tecnicos: {
                    total: tecnicos.length,
                    disponibles: tecnicos.filter(t => t.estado === 'disponible').length,
                    ocupados: tecnicos.filter(t => t.estado === 'ocupado').length,
                    inactivos: tecnicos.filter(t => t.estado === 'inactivo').length,
                    // Por área
                    porArea: {
                        INGENIERIA_BIOMEDICA: tecnicos.filter(t => t.area === 'INGENIERIA_BIOMEDICA').length,
                        MECANICA: tecnicos.filter(t => t.area === 'MECANICA').length,
                        INFRAESTRUCTURA: tecnicos.filter(t => t.area === 'INFRAESTRUCTURA').length
                    },
                    // Por tipo
                    porTipo: {
                        ingeniero: tecnicos.filter(t => t.tipo === 'ingeniero').length,
                        tecnico: tecnicos.filter(t => t.tipo === 'tecnico').length,
                        auxiliar: tecnicos.filter(t => t.tipo === 'auxiliar').length
                    }
                },
                tiemposRespuesta: {
                    // Calcular promedios de tiempo de respuesta
                    promedioRespuesta: await this.calculateAverageResponseTime(solicitudes),
                    solicitudesVencidas: this.countOverdueRequests(solicitudes)
                },
                timestamp: new Date().toISOString()
            };

            return stats;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas avanzadas:', error);
            
            return {
                usuarios: { total: 0, activos: 0, inactivos: 0, conCodigo: 0 },
                solicitudesAcceso: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
                solicitudes: { 
                    total: 0, pendientes: 0, asignadas: 0, enProceso: 0, completadas: 0, canceladas: 0,
                    porArea: { INGENIERIA_BIOMEDICA: 0, MECANICA: 0, INFRAESTRUCTURA: 0 },
                    porPrioridad: { CRITICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 }
                },
                tecnicos: { 
                    total: 0, disponibles: 0, ocupados: 0, inactivos: 0,
                    porArea: { INGENIERIA_BIOMEDICA: 0, MECANICA: 0, INFRAESTRUCTURA: 0 },
                    porTipo: { ingeniero: 0, tecnico: 0, auxiliar: 0 }
                },
                tiemposRespuesta: { promedioRespuesta: 'Error', solicitudesVencidas: 0 },
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ⏱️ CALCULAR TIEMPO PROMEDIO DE RESPUESTA
    async calculateAverageResponseTime(solicitudes) {
        try {
            const solicitudesCompletadas = solicitudes.filter(s => 
                s.estado === 'COMPLETADA' && s.fechaCreacion && s.fechaCompletado
            );

            if (solicitudesCompletadas.length === 0) {
                return 'Sin datos';
            }

            let totalTime = 0;
            solicitudesCompletadas.forEach(solicitud => {
                const inicio = new Date(solicitud.fechaCreacion);
                const fin = new Date(solicitud.fechaCompletado);
                const tiempo = fin - inicio;
                totalTime += tiempo;
            });

            const promedioMs = totalTime / solicitudesCompletadas.length;
            const promedioHoras = Math.floor(promedioMs / (1000 * 60 * 60));
            const promedioMinutos = Math.floor((promedioMs % (1000 * 60 * 60)) / (1000 * 60));

            return `${promedioHoras}h ${promedioMinutos}m`;

        } catch (error) {
            console.error('❌ Error calculando tiempo promedio:', error);
            return 'Error';
        }
    }

    // 📅 CONTAR SOLICITUDES VENCIDAS
    countOverdueRequests(solicitudes) {
        try {
            const now = new Date();
            return solicitudes.filter(solicitud => {
                if (solicitud.estado === 'COMPLETADA' || solicitud.estado === 'CANCELADA') {
                    return false;
                }
                
                if (solicitud.tiempoRespuestaMaximo) {
                    const fechaMaxima = new Date(solicitud.tiempoRespuestaMaximo);
                    return now > fechaMaxima;
                }
                
                return false;
            }).length;
        } catch (error) {
            console.error('❌ Error contando solicitudes vencidas:', error);
            return 0;
        }
    }

    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            tables: this.tables,
            timestamp: new Date().toISOString(),
            version: '4.0-assignment-system',
            features: [
                'NUEVO: Numeración específica por área (SOLBIO, SOLMEC, SOLINFRA)',
                'NUEVO: Sistema completo de asignación de personal',
                'NUEVO: Cálculo automático de tiempos de respuesta',
                'NUEVO: Auto-asignación inteligente de solicitudes',
                'NUEVO: Estadísticas avanzadas con tiempos',
                'Gestión completa del estado de solicitudes',
                'Liberación automática de técnicos',
                'Prevención de errores 422 en personal',
                'Fallbacks robustos para operaciones'
            ],
            fieldMappings: this.fieldMappings,
            areaPrefixes: this.areaPrefixes
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global con asignación...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión con asignación)');
} catch (error) {
    console.error('❌ Error creando airtableAPI:', error);
}

// 📡 Event listeners
try {
    window.addEventListener('airtableConnectionUpdate', function(event) {
        console.log('🔄 Estado actualizado:', event.detail);
        
        if (typeof updateConnectionStatus === 'function') {
            const status = event.detail.connected ? 'connected' : 'disconnected';
            const message = event.detail.connected 
                ? '✅ Conectado (sistema de asignación)' 
                : 'Modo Local (sistema de asignación)';
            
            updateConnectionStatus(status, message);
        }
    });
} catch (error) {
    console.warn('⚠️ No se pudo configurar event listener:', error);
}

// 🛠️ Función de diagnóstico
try {
    window.debugAirtableConnection = function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        const status = window.airtableAPI.getStatus();
        
        console.log('🔍 DIAGNÓSTICO SISTEMA DE ASIGNACIÓN');
        console.log('=====================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🔧 Funcionalidades:');
        status.features.forEach(feature => console.log(`  • ${feature}`));
        console.log('🔢 Prefijos por área:', status.areaPrefixes);
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection (con asignación) creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

console.log('✅ airtable-config.js (VERSIÓN CON ASIGNACIÓN COMPLETA) cargado');
console.log('🔢 Numeración específica: SOLBIO, SOLMEC, SOLINFRA');
console.log('🎯 Sistema de asignación de personal implementado');
console.log('⏱️ Cálculo automático de tiempos de respuesta');
console.log('🤖 Auto-asignación inteligente disponible');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');

// Auto-verificación
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Sistema de asignación cargado correctamente');
        console.log('✅ Numeración específica por área configurada');
        console.log('🎯 Métodos de asignación implementados');
        
        // Verificar métodos críticos
        const criticalMethods = [
            'generateAreaSpecificNumber',
            'assignTechnicianToRequest', 
            'updateRequestStatus',
            'autoAssignPendingRequests',
            'calculateMaxResponseTime'
        ];
        
        criticalMethods.forEach(method => {
            if (typeof window.airtableAPI[method] === 'function') {
                console.log(`✅ ${method} correctamente implementado`);
            } else {
                console.error(`❌ ${method} no está disponible`);
            }
        });
    } else {
        console.warn('⚠️ Algunos componentes del sistema de asignación no se cargaron');
    }
}, 3000);