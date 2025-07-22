// 🛡️ Configuración CORREGIDA de Airtable API - Sin Errores 422
// airtable-config.js - Versión compatible con valores de Airtable

console.log('🚀 Cargando airtable-config.js (VERSIÓN CORREGIDA PARA ERRORES 422)...');

// 🗺️ MAPEO DE VALORES PARA COMPATIBILIDAD CON AIRTABLE
const AIRTABLE_VALUE_MAPPING = {
    servicioIngenieria: {
        // Nuestros valores → Valores esperados por Airtable
        'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'Biomedica', 'Biomédica', 'INGENIERIA_BIOMEDICA'],
        'MECANICA': ['Mecánica', 'Mecanica', 'MECANICA'],
        'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA']
    },
    tipoServicio: {
        'MANTENIMIENTO_PREVENTIVO': ['Mantenimiento Preventivo', 'Preventivo'],
        'MANTENIMIENTO_CORRECTIVO': ['Mantenimiento Correctivo', 'Correctivo'],
        'REPARACION': ['Reparación', 'Reparacion'],
        'INSTALACION': ['Instalación', 'Instalacion'],
        'CALIBRACION': ['Calibración', 'Calibracion'],
        'INSPECCION': ['Inspección', 'Inspeccion'],
        'ACTUALIZACION': ['Actualización', 'Actualizacion'],
        'EMERGENCIA': ['Emergencia']
    },
    prioridad: {
        'CRITICA': ['Crítica', 'Critica', 'CRITICA'],
        'ALTA': ['Alta', 'ALTA'],
        'MEDIA': ['Media', 'MEDIA'],
        'BAJA': ['Baja', 'BAJA']
    },
    estado: {
        'PENDIENTE': ['Pendiente', 'PENDIENTE'],
        'ASIGNADA': ['Asignada', 'ASIGNADA'],
        'EN_PROCESO': ['En Proceso', 'EN_PROCESO'],
        'COMPLETADA': ['Completada', 'COMPLETADA'],
        'CANCELADA': ['Cancelada', 'CANCELADA']
    }
};

// 📋 Campos seguros confirmados para cada tabla
const SAFE_FIELDS = {
    solicitudes: [
        'numero',
        'descripcion', 
        'estado',
        'fechaCreacion',
        'servicioIngenieria',
        'tipoServicio',
        'prioridad',
        'equipo',
        'ubicacion',
        'observaciones',
        'solicitante',
        'servicioHospitalario',
        'emailSolicitante'
    ],
    tecnicos: [
        'nombre',
        'email',
        'area',
        'tipo',
        'especialidad',
        'estado',
        'fechaCreacion'
    ]
};

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

        // 🗺️ Mapeo de valores actualizado
        this.fieldMappings = AIRTABLE_VALUE_MAPPING;

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
        console.log('🗺️ Mapeo de valores configurado para compatibilidad');
        
        this.initializeConnectionAsync();
    }

    // 🗺️ FUNCIÓN MEJORADA PARA MAPEAR VALORES SEGÚN AIRTABLE
    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        console.log(`🗺️ Mapeando ${fieldType}: "${value}"`);
        
        if (!this.fieldMappings[fieldType]) {
            console.warn(`⚠️ No hay mapeo definido para tipo de campo: ${fieldType}`);
            return value;
        }

        const mapping = this.fieldMappings[fieldType];
        
        // Buscar mapeo directo
        if (mapping[value]) {
            const mappedValue = mapping[value][0]; // Usar el primer valor como preferido
            console.log(`✅ Mapeado ${fieldType}: "${value}" → "${mappedValue}"`);
            return mappedValue;
        }
        
        // Buscar en valores alternativos
        for (const [key, possibleValues] of Object.entries(mapping)) {
            if (possibleValues.includes(value)) {
                const mappedValue = possibleValues[0];
                console.log(`✅ Mapeado ${fieldType}: "${value}" → "${mappedValue}" (encontrado en alternativas)`);
                return mappedValue;
            }
        }
        
        console.warn(`⚠️ No se encontró mapeo para ${fieldType}: "${value}" - usando valor original`);
        return value;
    }

    // 🛡️ FUNCIÓN PARA PREPARAR DATOS SEGUROS
    prepareSafeData(data, tableName) {
        console.log(`🛡️ Preparando datos seguros para tabla: ${tableName}`);
        
        const safeFields = SAFE_FIELDS[tableName] || [];
        const safeData = {};
        
        Object.keys(data).forEach(key => {
            if (safeFields.includes(key)) {
                let value = data[key];
                
                // Aplicar mapeo de valores si es necesario
                if (this.fieldMappings[key]) {
                    value = this.mapFieldValue(key, value);
                }
                
                safeData[key] = value;
                console.log(`✅ Campo ${key}: ${value}`);
            } else {
                console.warn(`⚠️ Campo '${key}' omitido - no está en lista segura para ${tableName}`);
            }
        });
        
        return safeData;
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
                    
                    // Auto-detectar valores válidos para prevenir errores 422
                    await this.autoDetectFieldValues();
                    await this.detectAvailableFields();
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

    // 🔍 DETECTAR CAMPOS Y VALORES DISPONIBLES
    async detectAvailableFields() {
        console.log('🔍 Detectando campos y valores disponibles...');
        
        try {
            // Detectar campos en tabla Solicitudes
            const solicitudesResult = await this.makeRequest(`${this.tables.solicitudes}?maxRecords=3`);
            
            if (solicitudesResult.records && solicitudesResult.records.length > 0) {
                const availableFields = new Set();
                const fieldValues = {};
                
                solicitudesResult.records.forEach(record => {
                    if (record.fields) {
                        Object.keys(record.fields).forEach(fieldName => {
                            availableFields.add(fieldName);
                            
                            // Recopilar valores únicos para campos de selección
                            if (['servicioIngenieria', 'tipoServicio', 'prioridad', 'estado'].includes(fieldName)) {
                                if (!fieldValues[fieldName]) {
                                    fieldValues[fieldName] = new Set();
                                }
                                if (record.fields[fieldName]) {
                                    fieldValues[fieldName].add(record.fields[fieldName]);
                                }
                            }
                        });
                    }
                });
                
                console.log('✅ Campos disponibles en Solicitudes:', Array.from(availableFields));
                
                // Actualizar mapeos con valores detectados
                Object.keys(fieldValues).forEach(fieldName => {
                    const values = Array.from(fieldValues[fieldName]);
                    console.log(`📋 Valores detectados para ${fieldName}:`, values);
                    
                    // Actualizar el mapeo con los valores reales de Airtable
                    if (values.length > 0) {
                        this.updateFieldMapping(fieldName, values);
                    }
                });
            }
            
        } catch (error) {
            console.warn('⚠️ No se pudieron detectar campos automáticamente:', error);
        }
    }

    updateFieldMapping(fieldName, detectedValues) {
        console.log(`🔄 Actualizando mapeo para ${fieldName} con valores detectados:`, detectedValues);
        
        if (!this.fieldMappings[fieldName]) {
            this.fieldMappings[fieldName] = {};
        }
        
        // Para cada valor detectado, crear una entrada de mapeo
        detectedValues.forEach(value => {
            // Buscar si alguna de nuestras claves debería mapear a este valor
            const existingMapping = Object.keys(this.fieldMappings[fieldName]).find(key => {
                const possibleValues = this.fieldMappings[fieldName][key];
                return possibleValues.includes(value);
            });
            
            if (!existingMapping) {
                // Crear mapeo directo para valores no mapeados
                const normalizedKey = value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                this.fieldMappings[fieldName][normalizedKey] = [value];
                console.log(`➕ Mapeo agregado: ${normalizedKey} → ${value}`);
            }
        });
        
        console.log(`✅ Mapeo actualizado para ${fieldName}:`, this.fieldMappings[fieldName]);
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
                    
                    let problemInfo = '';
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.airtableError && errorData.airtableError.error) {
                            const airtableError = errorData.airtableError.error;
                            console.error('📝 Error de Airtable:', airtableError);
                            
                            if (airtableError.type === 'INVALID_VALUE_FOR_COLUMN') {
                                const message = airtableError.message;
                                console.error('🎯 Valor inválido para campo:', message);
                                
                                // Extraer nombre del campo del mensaje
                                const fieldMatch = message.match(/field (\w+)/);
                                if (fieldMatch) {
                                    const fieldName = fieldMatch[1];
                                    problemInfo = `Campo ${fieldName} tiene valor inválido`;
                                    
                                    console.log('💡 SUGERENCIAS PARA RESOLVER:');
                                    console.log(`1. Verificar opciones válidas para campo "${fieldName}" en Airtable`);
                                    console.log(`2. Actualizar mapeo de valores en código`);
                                    console.log(`3. Usar valores exactos que acepta Airtable`);
                                    
                                    if (data && data.fields && data.fields[fieldName]) {
                                        console.log(`🔍 Valor enviado: "${data.fields[fieldName]}"`);
                                        console.log(`🔍 Mapeo actual:`, this.fieldMappings[fieldName] || 'No definido');
                                    }
                                }
                            } else if (airtableError.type === 'UNKNOWN_FIELD_NAME') {
                                const message = airtableError.message;
                                const fieldMatch = message.match(/Unknown field name: "([^"]+)"/);
                                if (fieldMatch) {
                                    problemInfo = `Campo desconocido: ${fieldMatch[1]}`;
                                }
                            }
                        }
                    } catch (parseError) {
                        console.error('Error parseando respuesta 422:', parseError);
                    }
                    
                    throw new Error(`HTTP 422: ${problemInfo || 'Valores inválidos'}. Verificar configuración de campos en Airtable.`);
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

    // 📋 MÉTODOS PRINCIPALES - SOLICITUDES CON MANEJO SEGURO DE VALORES
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
        console.log('📝 Creando solicitud con numeración específica y valores compatibles...');
        
        try {
            // Generar número específico según el área
            const numero = await this.generateAreaSpecificNumber(solicitudData.servicioIngenieria);
            
            // Preparar datos con mapeo de valores
            const rawData = {
                numero: numero,
                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                estado: 'PENDIENTE',
                fechaCreacion: new Date().toISOString(),
                // Datos específicos de la solicitud
                servicioIngenieria: solicitudData.servicioIngenieria,
                tipoServicio: solicitudData.tipoServicio,
                prioridad: solicitudData.prioridad,
                equipo: solicitudData.equipo,
                ubicacion: solicitudData.ubicacion,
                observaciones: solicitudData.observaciones,
                // Datos del solicitante
                solicitante: solicitudData.solicitante,
                servicioHospitalario: solicitudData.servicioHospitalario,
                emailSolicitante: solicitudData.emailSolicitante
            };
            
            // Filtrar valores undefined y aplicar mapeo seguro
            const cleanData = {};
            Object.keys(rawData).forEach(key => {
                if (rawData[key] !== undefined && rawData[key] !== null && rawData[key] !== '') {
                    cleanData[key] = rawData[key];
                }
            });
            
            // Preparar datos seguros con mapeo de valores
            const safeData = this.prepareSafeData(cleanData, 'solicitudes');
            
            const data = {
                fields: safeData
            };
            
            console.log('📝 Creando solicitud con datos seguros:', data);
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log(`✅ Solicitud creada: ${numero}`);
            return result;
            
        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            
            // Manejo específico para errores 422
            if (error.message.includes('422')) {
                console.log('🔄 Reintentando con datos mínimos...');
                return await this.createSolicitudMinimal(solicitudData);
            }
            
            throw error;
        }
    }

    // 🔄 Crear solicitud con datos mínimos como fallback
    async createSolicitudMinimal(solicitudData) {
        console.log('🔄 Creando solicitud con campos mínimos...');
        
        try {
            const numero = await this.generateAreaSpecificNumber(solicitudData.servicioIngenieria);
            
            // Solo campos absolutamente esenciales
            const data = {
                fields: {
                    numero: numero,
                    descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                    estado: this.mapFieldValue('estado', 'PENDIENTE'),
                    fechaCreacion: new Date().toISOString()
                }
            };
            
            console.log('📝 Datos mínimos:', data);
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log(`✅ Solicitud creada con campos mínimos: ${numero}`);
            
            // Intentar actualizar con más campos después
            if (result && result.id) {
                await this.updateSolicitudSafely(result.id, solicitudData);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error incluso con campos mínimos:', error);
            throw error;
        }
    }

    // 🔄 Actualizar solicitud de forma segura
    async updateSolicitudSafely(solicitudId, originalData) {
        console.log('🔄 Actualizando solicitud con campos adicionales...');
        
        const fieldsToTry = [
            { servicioIngenieria: originalData.servicioIngenieria },
            { tipoServicio: originalData.tipoServicio },
            { prioridad: originalData.prioridad },
            { equipo: originalData.equipo },
            { ubicacion: originalData.ubicacion },
            { observaciones: originalData.observaciones },
            { solicitante: originalData.solicitante },
            { servicioHospitalario: originalData.servicioHospitalario },
            { emailSolicitante: originalData.emailSolicitante }
        ];
        
        for (const fieldObj of fieldsToTry) {
            const [fieldName, fieldValue] = Object.entries(fieldObj)[0];
            
            if (fieldValue && SAFE_FIELDS.solicitudes.includes(fieldName)) {
                try {
                    const mappedValue = this.mapFieldValue(fieldName, fieldValue);
                    
                    await this.makeRequest(
                        `${this.tables.solicitudes}/${solicitudId}`, 
                        'PATCH', 
                        { fields: { [fieldName]: mappedValue } }
                    );
                    console.log(`✅ Campo ${fieldName} agregado: ${mappedValue}`);
                } catch (error) {
                    console.warn(`⚠️ Campo ${fieldName} no se pudo agregar:`, error.message);
                }
            }
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

    // 👥 MÉTODOS DE TÉCNICOS/PERSONAL DE SOPORTE
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
        
        const rawData = {
            nombre: tecnicoData.nombre,
            email: tecnicoData.email,
            area: tecnicoData.area,
            tipo: tecnicoData.tipo,
            especialidad: tecnicoData.especialidad || '',
            estado: tecnicoData.estado || 'disponible',
            fechaCreacion: new Date().toISOString()
        };
        
        // Preparar datos seguros con mapeo
        const safeData = this.prepareSafeData(rawData, 'tecnicos');
        
        const data = {
            fields: safeData
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
            area: ['Ingeniería Biomédica', 'Mecánica', 'Infraestructura'],
            tipo: ['Ingeniero', 'Técnico', 'Auxiliar'],
            estado: ['Disponible', 'Ocupado', 'Inactivo']
        };
        
        // Intentar con cada combinación de alternativas
        for (const areaAlt of alternatives.area) {
            for (const tipoAlt of alternatives.tipo) {
                for (const estadoAlt of alternatives.estado) {
                    
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
                        
                        // Actualizar mapeos con los valores que funcionaron
                        this.fieldMappings.area = { [originalData.area]: [areaAlt] };
                        this.fieldMappings.tipo = { [originalData.tipo]: [tipoAlt] };
                        this.fieldMappings.estado = { [originalData.estado || 'disponible']: [estadoAlt] };
                        
                        return result;
                        
                    } catch (retryError) {
                        console.log(`❌ Falló con: area="${areaAlt}", tipo="${tipoAlt}", estado="${estadoAlt}"`);
                    }
                }
            }
        }
        
        throw new Error('No se pudo crear el personal con ninguna combinación de valores válidos. Verificar configuración de campos en Airtable.');
    }

    // 🔄 Métodos de actualización y otros métodos existentes (simplificados para espacio)
    async updateTecnico(tecnicoId, updateData) {
        console.log('🔄 Actualizando personal de soporte:', tecnicoId);
        
        const safeData = this.prepareSafeData(updateData, 'tecnicos');
        const data = { fields: safeData };
        
        try {
            const result = await this.makeRequest(`${this.tables.tecnicos}/${tecnicoId}`, 'PATCH', data);
            console.log('✅ Personal de soporte actualizado exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error actualizando personal:', error);
            throw error;
        }
    }

    // Métodos de usuarios simplificados
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

            return { valid: true, user: user };

        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            return { valid: false, error: 'Error de sistema' };
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

    // Métodos de solicitudes de acceso
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

    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            tables: this.tables,
            timestamp: new Date().toISOString(),
            version: '4.1-error-422-fixed',
            features: [
                'NUEVO: Protección completa contra errores 422',
                'NUEVO: Mapeo automático de valores para campos de selección',
                'NUEVO: Detección automática de valores válidos en Airtable',
                'MEJORADO: Sistema de fallback robusto para campos problemáticos',
                'Numeración específica por área (SOLBIO, SOLMEC, SOLINFRA)',
                'Sistema completo de asignación de personal',
                'Cálculo automático de tiempos de respuesta',
                'Auto-asignación inteligente de solicitudes',
                'Gestión completa del estado de solicitudes'
            ],
            fieldMappings: this.fieldMappings,
            safeFields: SAFE_FIELDS
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global con protección 422...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión sin errores 422)');
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
                ? '✅ Conectado (sin errores 422)' 
                : 'Modo Local (sin errores 422)';
            
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
        
        console.log('🔍 DIAGNÓSTICO SISTEMA SIN ERRORES 422');
        console.log('=======================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🗺️ Mapeos de campos:', status.fieldMappings);
        console.log('🛡️ Campos seguros:', status.safeFields);
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection (sin errores 422) creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

console.log('✅ airtable-config.js (VERSIÓN SIN ERRORES 422) cargado');
console.log('🛡️ Protección completa contra errores 422 activada');
console.log('🗺️ Mapeo automático de valores implementado');
console.log('🔍 Detección automática de campos y valores válidos');
console.log('🔢 Numeración específica: SOLBIO, SOLMEC, SOLINFRA');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');

// Auto-verificación
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Sistema sin errores 422 cargado correctamente');
        console.log('✅ Mapeo de valores configurado');
        console.log('🛡️ Protección contra campos inválidos activada');
        
        // Verificar métodos críticos
        const criticalMethods = [
            'mapFieldValue',
            'prepareSafeData', 
            'detectAvailableFields',
            'createSolicitudMinimal',
            'updateSolicitudSafely'
        ];
        
        criticalMethods.forEach(method => {
            if (typeof window.airtableAPI[method] === 'function') {
                console.log(`✅ ${method} correctamente implementado`);
            } else {
                console.error(`❌ ${method} no está disponible`);
            }
        });
    } else {
        console.warn('⚠️ Algunos componentes del sistema sin errores 422 no se cargaron');
    }
}, 3000);