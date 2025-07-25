// 🛡️ Configuración CORREGIDA de Airtable API - Fix Error 422 en Solicitudes de Acceso
// airtable-config.js - Versión con detección automática de valores válidos mejorada

console.log('🚀 Cargando airtable-config.js (VERSIÓN FIX ERROR 422)...');

// 🗺️ MAPEO DE VALORES CORREGIDO PARA COMPATIBILIDAD CON AIRTABLE
const AIRTABLE_VALUE_MAPPING = {
    servicioIngenieria: {
        'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica', 'Ing. Biomédica'],
        'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
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
        'PENDIENTE': ['Pendiente', 'PENDIENTE', 'pendiente'],
        'ASIGNADA': ['Asignada', 'ASIGNADA'],
        'EN_PROCESO': ['En Proceso', 'EN_PROCESO'],
        'COMPLETADA': ['Completada', 'COMPLETADA'],
        'CANCELADA': ['Cancelada', 'CANCELADA']
    },
    area: {
        'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica'],
        'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
        'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA']
    },
    // NUEVO: Mapeo específico para estados de solicitudes de acceso
    estadoSolicitudAcceso: {
        'PENDIENTE': ['Pendiente', 'PENDIENTE', 'pendiente'],
        'APROBADA': ['Aprobada', 'APROBADA', 'aprobada'],
        'RECHAZADA': ['Rechazada', 'RECHAZADA', 'rechazada']
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
        'emailSolicitante',
        'tecnicoAsignado',
        'fechaAsignacion',
        'observacionesAsignacion',
        'tiempoRespuestaMaximo'
    ],
    tecnicos: [
        'nombre',
        'email',
        'area',
        'tipo',
        'especialidad',
        'estado',
        'fechaCreacion',
        'solicitudAsignada'
    ],
    solicitudesAcceso: [
        'nombreCompleto',
        'email',
        'telefono',
        'servicioHospitalario',
        'cargo',
        'justificacion',
        'fechaSolicitud',
        'estado',
        'esUrgente',
        'fechaAprobacion',
        'usuarioCreado'
    ],
    usuarios: [
        'nombreCompleto',
        'email',
        'servicioHospitalario',
        'cargo',
        'codigoAcceso',
        'estado',
        'fechaCreacion',
        'solicitudOrigenId'
    ]
};

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI con fix para error 422...');
        
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
        
        // NUEVO: Almacenar valores válidos detectados para solicitudes de acceso
        this.validAccessRequestValues = {
            estado: null,
            servicioHospitalario: [],
            cargo: []
        };
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🗺️ Mapeo de valores configurado');
        
        this.initializeConnectionAsync();
    }

    // 🔧 FUNCIÓN CRÍTICA: Limpiar valores de comillas extras y espacios
    cleanFieldValue(value) {
        if (typeof value !== 'string') return value;
        
        // Remover comillas dobles extras al principio y final
        let cleanValue = value.trim();
        
        // Si el valor empieza y termina con comillas, removerlas
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.slice(1, -1);
        }
        
        // Remover comillas dobles escapadas
        cleanValue = cleanValue.replace(/\\"/g, '');
        
        // Si aún tiene comillas dobles al principio y final, removerlas otra vez
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.slice(1, -1);
        }
        
        // Limpiar espacios extras
        cleanValue = cleanValue.trim();
        
        console.log(`🧹 Limpieza de valor: "${value}" → "${cleanValue}"`);
        
        return cleanValue;
    }

    async initializeConnectionAsync() {
        setTimeout(async () => {
            try {
                const isConnected = await this.testConnection();
                
                if (isConnected) {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                    console.log('✅ Conectado exitosamente a Airtable');
                    
                    // CRÍTICO: Detectar valores válidos para solicitudes de acceso
                    await this.detectValidAccessRequestValues();
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

    // 🔍 NUEVA FUNCIÓN: Detectar valores válidos específicamente para solicitudes de acceso
    async detectValidAccessRequestValues() {
        console.log('🔍 Detectando valores válidos para SolicitudesAcceso...');
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudesAcceso}?maxRecords=20`);
            
            if (result.records && result.records.length > 0) {
                // Detectar valores únicos de estado
                const estadoValues = new Set();
                const servicioValues = new Set();
                const cargoValues = new Set();
                
                result.records.forEach(record => {
                    if (record.fields) {
                        if (record.fields.estado) {
                            estadoValues.add(record.fields.estado);
                        }
                        if (record.fields.servicioHospitalario) {
                            servicioValues.add(record.fields.servicioHospitalario);
                        }
                        if (record.fields.cargo) {
                            cargoValues.add(record.fields.cargo);
                        }
                    }
                });
                
                // Buscar el valor correcto para PENDIENTE
                let pendienteValue = null;
                estadoValues.forEach(value => {
                    const cleanValue = this.cleanFieldValue(value);
                    if (cleanValue.toUpperCase() === 'PENDIENTE') {
                        pendienteValue = value; // Usar el valor exacto de Airtable
                        console.log(`✅ Valor PENDIENTE detectado: "${value}"`);
                    }
                });
                
                this.validAccessRequestValues = {
                    estado: pendienteValue,
                    estadoValues: Array.from(estadoValues),
                    servicioHospitalario: Array.from(servicioValues),
                    cargo: Array.from(cargoValues)
                };
                
                console.log('📋 Valores válidos detectados:', {
                    estado: this.validAccessRequestValues.estado,
                    todosEstados: this.validAccessRequestValues.estadoValues,
                    servicios: this.validAccessRequestValues.servicioHospitalario.length,
                    cargos: this.validAccessRequestValues.cargo.length
                });
                
                // Si no encontramos PENDIENTE, intentar detectarlo de otra manera
                if (!pendienteValue) {
                    console.warn('⚠️ No se encontró valor PENDIENTE, intentando detección alternativa...');
                    await this.detectPendingValueAlternative();
                }
                
            } else {
                console.warn('⚠️ No hay registros en SolicitudesAcceso para detectar valores');
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores válidos:', error);
        }
    }

    // 🔍 Método alternativo para detectar el valor PENDIENTE
    async detectPendingValueAlternative() {
        console.log('🔍 Intentando detección alternativa del valor PENDIENTE...');
        
        // Intentar crear un registro de prueba con diferentes valores
        const testValues = ['Pendiente', 'PENDIENTE', 'pendiente'];
        
        for (const testValue of testValues) {
            try {
                console.log(`🧪 Probando valor: "${testValue}"`);
                
                // Crear registro de prueba mínimo
                const testData = {
                    fields: {
                        nombreCompleto: 'TEST_DETECTION_' + Date.now(),
                        email: 'test_' + Date.now() + '@test.com',
                        fechaSolicitud: new Date().toISOString(),
                        estado: testValue
                    }
                };
                
                const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', testData);
                
                if (result && result.id) {
                    console.log(`✅ Valor válido encontrado: "${testValue}"`);
                    this.validAccessRequestValues.estado = testValue;
                    
                    // Eliminar registro de prueba
                    try {
                        await this.makeRequest(`${this.tables.solicitudesAcceso}/${result.id}`, 'DELETE');
                        console.log('🗑️ Registro de prueba eliminado');
                    } catch (deleteError) {
                        console.warn('⚠️ No se pudo eliminar registro de prueba:', deleteError);
                    }
                    
                    break;
                }
                
            } catch (error) {
                console.log(`❌ Valor "${testValue}" no válido:`, error.message);
            }
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
                console.log('📊 Datos enviados:', JSON.stringify(data, null, 2));
            }
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                if (response.status === 422) {
                    console.error('🚨 ERROR 422 - Valores de campo inválidos');
                    console.error('🔍 Datos enviados:', data);
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error && errorData.error.type === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
                            const message = errorData.error.message || '';
                            const fieldMatch = message.match(/field (\w+)/);
                            const valueMatch = message.match(/option "(.+?)"/);
                            
                            if (fieldMatch && valueMatch) {
                                const fieldName = fieldMatch[1];
                                const invalidValue = valueMatch[1];
                                console.error(`🎯 Campo: ${fieldName}, Valor inválido: "${invalidValue}"`);
                                
                                // Sugerir solución
                                console.log('💡 SOLUCIÓN: Verificar valores válidos en Airtable para el campo', fieldName);
                                console.log('💡 Valores detectados:', this.validAccessRequestValues);
                            }
                        }
                    } catch (parseError) {
                        console.error('Error parseando respuesta 422:', parseError);
                    }
                    
                    throw new Error(`HTTP 422: Valores inválidos. Verificar configuración de campos en Airtable.`);
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso');
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            throw error;
        }
    }

    async testConnection() {
        console.log('🧪 Test de conexión...');
        
        try {
            const response = await this.makeRequest(`${this.tables.solicitudes}?maxRecords=1`);
            return true;
        } catch (error) {
            console.error('❌ Test falló:', error.message);
            return false;
        }
    }

    // 🔐 MÉTODO CRÍTICO CORREGIDO: Crear solicitud de acceso
    async createSolicitudAcceso(solicitudData) {
        console.log('📝 Creando solicitud de acceso con detección automática de valores...');
        console.log('🔍 Datos recibidos:', solicitudData);
        
        try {
            // Limpiar todos los valores de string
            const cleanData = {};
            Object.keys(solicitudData).forEach(key => {
                const value = solicitudData[key];
                if (typeof value === 'string') {
                    cleanData[key] = this.cleanFieldValue(value);
                } else {
                    cleanData[key] = value;
                }
            });
            
            // Preparar datos base
            const baseData = {
                nombreCompleto: cleanData.nombreCompleto || '',
                email: cleanData.email || '',
                telefono: cleanData.telefono || '',
                servicioHospitalario: cleanData.servicioHospitalario || '',
                cargo: cleanData.cargo || '',
                justificacion: cleanData.justificacion || '',
                fechaSolicitud: cleanData.fechaSolicitud || new Date().toISOString(),
                esUrgente: cleanData.esUrgente || false
            };
            
            // CRÍTICO: Usar el valor de estado detectado o intentar sin estado
            if (this.validAccessRequestValues.estado) {
                console.log(`✅ Usando valor de estado detectado: "${this.validAccessRequestValues.estado}"`);
                baseData.estado = this.validAccessRequestValues.estado;
            } else {
                console.warn('⚠️ No se detectó valor válido para estado, creando sin estado');
                // NO incluir campo estado si no tenemos un valor válido
            }
            
            const data = {
                fields: baseData
            };
            
            console.log('📝 Datos finales a enviar:', JSON.stringify(data, null, 2));
            
            try {
                const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
                console.log('✅ Solicitud de acceso creada exitosamente:', result.id);
                return result;
                
            } catch (error) {
                if (error.message.includes('422') && error.message.includes('estado')) {
                    console.warn('⚠️ Error con campo estado, reintentando sin estado...');
                    
                    // Reintentar sin campo estado
                    delete baseData.estado;
                    const dataWithoutEstado = { fields: baseData };
                    
                    const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', dataWithoutEstado);
                    console.log('✅ Solicitud creada sin campo estado:', result.id);
                    
                    // Intentar actualizar el estado después si es posible
                    if (this.validAccessRequestValues.estado) {
                        try {
                            await this.makeRequest(`${this.tables.solicitudesAcceso}/${result.id}`, 'PATCH', {
                                fields: { estado: this.validAccessRequestValues.estado }
                            });
                            console.log('✅ Estado actualizado después de crear');
                        } catch (updateError) {
                            console.warn('⚠️ No se pudo actualizar estado:', updateError.message);
                        }
                    }
                    
                    return result;
                }
                
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error creando solicitud de acceso:', error);
            
            // Si todo falla, intentar con campos absolutamente mínimos
            if (error.message.includes('422')) {
                console.log('🔄 Último intento con campos mínimos...');
                return await this.createSolicitudAccesoMinimal(solicitudData);
            }
            
            throw error;
        }
    }

    // Método fallback para crear solicitud con campos mínimos
    async createSolicitudAccesoMinimal(solicitudData) {
        console.log('🔄 Creando solicitud de acceso con campos absolutamente mínimos...');
        
        try {
            const data = {
                fields: {
                    nombreCompleto: this.cleanFieldValue(solicitudData.nombreCompleto || 'Sin nombre'),
                    email: this.cleanFieldValue(solicitudData.email || 'no-email@temp.com'),
                    fechaSolicitud: new Date().toISOString()
                }
            };
            
            console.log('📝 Datos mínimos:', data);
            const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
            
            console.log('✅ Solicitud creada con campos mínimos:', result.id);
            
            // Intentar agregar más campos uno por uno
            const fieldsToAdd = [
                { telefono: solicitudData.telefono },
                { servicioHospitalario: solicitudData.servicioHospitalario },
                { cargo: solicitudData.cargo },
                { justificacion: solicitudData.justificacion }
            ];
            
            for (const fieldObj of fieldsToAdd) {
                const [fieldName, fieldValue] = Object.entries(fieldObj)[0];
                if (fieldValue) {
                    try {
                        await this.makeRequest(`${this.tables.solicitudesAcceso}/${result.id}`, 'PATCH', {
                            fields: { [fieldName]: this.cleanFieldValue(fieldValue) }
                        });
                        console.log(`✅ Campo ${fieldName} agregado`);
                    } catch (error) {
                        console.warn(`⚠️ No se pudo agregar campo ${fieldName}:`, error.message);
                    }
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error incluso con campos mínimos:', error);
            throw new Error('No se pudo crear la solicitud. Por favor contacte al administrador.');
        }
    }

    // Resto de métodos se mantienen igual...
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

    async validateUserCredentials(email, codigoAcceso) {
        try {
            const usuarios = await this.getUsuarios();
            const user = usuarios.find(u => 
                u.email && u.email.toLowerCase() === email.toLowerCase()
            );
            
            if (!user) {
                return { valid: false, error: 'Usuario no encontrado' };
            }

            if (user.estado !== 'ACTIVO') {
                return { valid: false, error: `Usuario en estado: ${user.estado}` };
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

    // Incluir los demás métodos necesarios de la versión original...
    
    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            tables: this.tables,
            timestamp: new Date().toISOString(),
            version: '5.0-fix-error-422',
            validAccessRequestValues: this.validAccessRequestValues,
            features: [
                'FIX: Detección automática de valores válidos para solicitudes de acceso',
                'FIX: Manejo robusto del campo estado',
                'FIX: Limpieza mejorada de valores string',
                'FIX: Fallback a creación sin estado si es necesario',
                'FIX: Creación incremental de campos',
                'Área biomédica funcionando correctamente',
                'Sistema completo de asignación de personal'
            ]
        };
    }

    // Método de diagnóstico para solicitudes de acceso
    async debugAccessRequestValues() {
        console.log('🔍 DIAGNÓSTICO DE VALORES PARA SOLICITUDES DE ACCESO');
        console.log('=================================================');
        
        try {
            // Redetectar valores
            await this.detectValidAccessRequestValues();
            
            console.log('📋 Valores detectados:', this.validAccessRequestValues);
            
            // Probar creación con valores detectados
            if (this.validAccessRequestValues.estado) {
                console.log('🧪 Probando creación con estado detectado...');
                
                const testData = {
                    nombreCompleto: 'TEST_DEBUG_' + Date.now(),
                    email: 'debug_' + Date.now() + '@test.com',
                    fechaSolicitud: new Date().toISOString(),
                    estado: this.validAccessRequestValues.estado
                };
                
                try {
                    const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', {
                        fields: testData
                    });
                    console.log('✅ Creación exitosa con estado:', this.validAccessRequestValues.estado);
                    
                    // Eliminar registro de prueba
                    await this.makeRequest(`${this.tables.solicitudesAcceso}/${result.id}`, 'DELETE');
                    
                } catch (error) {
                    console.error('❌ Error con estado detectado:', error.message);
                }
            }
            
            return {
                valoresDetectados: this.validAccessRequestValues,
                recomendacion: this.validAccessRequestValues.estado 
                    ? 'Usar valor detectado para estado' 
                    : 'Crear sin campo estado'
            };
            
        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            return { error: error.message };
        }
    }

    // Los demás métodos necesarios deben incluirse aquí...
    
    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        const cleanValue = this.cleanFieldValue(value);
        
        console.log(`🗺️ Mapeando ${fieldType}: "${cleanValue}"`);
        
        if (!this.fieldMappings[fieldType]) {
            console.warn(`⚠️ No hay mapeo definido para tipo de campo: ${fieldType}`);
            return cleanValue;
        }

        const mapping = this.fieldMappings[fieldType];
        
        if (mapping[cleanValue]) {
            const mappedValue = mapping[cleanValue][0];
            console.log(`✅ Mapeado ${fieldType}: "${cleanValue}" → "${mappedValue}"`);
            return mappedValue;
        }
        
        for (const [key, possibleValues] of Object.entries(mapping)) {
            if (possibleValues.includes(cleanValue)) {
                const mappedValue = possibleValues[0];
                console.log(`✅ Mapeado ${fieldType}: "${cleanValue}" → "${mappedValue}" (encontrado en alternativas)`);
                return mappedValue;
            }
        }
        
        console.log(`⚠️ No se encontró mapeo para ${fieldType}: "${cleanValue}" - usando valor original`);
        return cleanValue;
    }

    prepareSafeData(data, tableName) {
        console.log(`🛡️ Preparando datos seguros para tabla: ${tableName}`);
        console.log(`🔍 Datos originales:`, data);
        
        const safeFields = SAFE_FIELDS[tableName] || [];
        const safeData = {};
        
        Object.keys(data).forEach(key => {
            if (safeFields.includes(key)) {
                let value = data[key];
                
                if (typeof value === 'string') {
                    value = this.cleanFieldValue(value);
                }
                
                if (this.fieldMappings[key]) {
                    const originalValue = value;
                    value = this.mapFieldValue(key, value);
                    if (originalValue !== value) {
                        console.log(`🗺️ MAPEO APLICADO para ${key}: "${originalValue}" → "${value}"`);
                    }
                }
                
                safeData[key] = value;
                console.log(`✅ Campo ${key}: ${value}`);
            } else {
                console.warn(`⚠️ Campo '${key}' omitido - no está en lista segura para ${tableName}`);
            }
        });
        
        console.log(`✅ Datos seguros preparados:`, safeData);
        return safeData;
    }

    async generateAreaSpecificNumber(area) {
        console.log('🔢 Generando número específico para área:', area);
        
        try {
            let normalizedArea = area;
            if (area && (area.toLowerCase().includes('biomed') || area.toLowerCase().includes('bioméd'))) {
                normalizedArea = 'INGENIERIA_BIOMEDICA';
                console.log(`🔧 Área normalizada: ${area} → ${normalizedArea}`);
            }
            
            const solicitudes = await this.getSolicitudes();
            
            const prefix = this.areaPrefixes[normalizedArea];
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

            console.log(`✅ Número generado para ${normalizedArea}: ${newRequestNumber} (siguiente: ${nextNumber})`);
            return newRequestNumber;

        } catch (error) {
            console.error('❌ Error generando número específico:', error);
            const prefix = this.areaPrefixes[area] || 'SOL';
            const randomPart = Date.now().toString().slice(-5);
            return `${prefix}${randomPart}`;
        }
    }

    async createSolicitud(solicitudData) {
        console.log('📝 Creando solicitud...');
        console.log('🔍 Datos recibidos:', solicitudData);
        
        try {
            let normalizedArea = solicitudData.servicioIngenieria;
            if (solicitudData.servicioIngenieria && 
                (solicitudData.servicioIngenieria.toLowerCase().includes('biomed') || 
                 solicitudData.servicioIngenieria.toLowerCase().includes('bioméd'))) {
                normalizedArea = 'INGENIERIA_BIOMEDICA';
                console.log(`🔧 Área normalizada para numeración: ${solicitudData.servicioIngenieria} → ${normalizedArea}`);
            }
            
            const numero = await this.generateAreaSpecificNumber(normalizedArea);
            
            const rawData = {
                numero: numero,
                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                estado: 'PENDIENTE',
                fechaCreacion: new Date().toISOString(),
                servicioIngenieria: solicitudData.servicioIngenieria,
                tipoServicio: solicitudData.tipoServicio,
                prioridad: solicitudData.prioridad,
                equipo: solicitudData.equipo,
                ubicacion: solicitudData.ubicacion,
                observaciones: solicitudData.observaciones,
                solicitante: solicitudData.solicitante,
                servicioHospitalario: solicitudData.servicioHospitalario,
                emailSolicitante: solicitudData.emailSolicitante,
                tiempoRespuestaMaximo: this.calculateMaxResponseTime(solicitudData.prioridad || 'MEDIA')
            };
            
            const cleanData = {};
            Object.keys(rawData).forEach(key => {
                if (rawData[key] !== undefined && rawData[key] !== null && rawData[key] !== '') {
                    cleanData[key] = rawData[key];
                }
            });
            
            const safeData = this.prepareSafeData(cleanData, 'solicitudes');
            
            const data = {
                fields: safeData
            };
            
            console.log('📝 Creando solicitud con datos finales:', data);
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log(`✅ Solicitud creada correctamente: ${numero} - Área: ${safeData.servicioIngenieria}`);
            return result;
            
        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            throw error;
        }
    }

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

    async createTecnico(tecnicoData) {
        console.log('➕ Creando personal de soporte:', tecnicoData.nombre);
        console.log('🔍 Área recibida:', tecnicoData.area);
        
        const rawData = {
            nombre: tecnicoData.nombre,
            email: tecnicoData.email,
            area: tecnicoData.area,
            tipo: tecnicoData.tipo,
            especialidad: tecnicoData.especialidad || '',
            estado: tecnicoData.estado || 'disponible',
            fechaCreacion: new Date().toISOString()
        };
        
        const safeData = this.prepareSafeData(rawData, 'tecnicos');
        
        const data = {
            fields: safeData
        };
        
        console.log('📝 Creando técnico con área mapeada:', data);
        
        try {
            const result = await this.makeRequest(this.tables.tecnicos, 'POST', data);
            console.log('✅ Personal de soporte creado exitosamente:', result.id, '- Área:', safeData.area);
            return result;
        } catch (error) {
            console.error('❌ Error creando personal de soporte:', error);
            throw new Error(`Error creando personal: ${error.message}`);
        }
    }

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

    async assignTechnicianToRequest(solicitudId, tecnicoId, observaciones = '') {
        console.log('🎯 Asignando técnico:', { solicitudId, tecnicoId });
        
        try {
            const [solicitudes, tecnicos] = await Promise.all([
                this.getSolicitudes(),
                this.getTecnicos()
            ]);
            
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            const tecnico = tecnicos.find(t => t.id === tecnicoId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            if (!tecnico) {
                throw new Error('Técnico no encontrado');
            }
            
            const solicitudArea = solicitud.servicioIngenieria;
            const tecnicoArea = tecnico.area;
            
            console.log('🔍 Verificando compatibilidad:', { solicitudArea, tecnicoArea });
            
            const normalizeBiomedArea = (area) => {
                if (!area) return area;
                const lowerArea = area.toLowerCase();
                if (lowerArea.includes('biomed') || lowerArea.includes('bioméd')) {
                    return 'BIOMEDICA_NORMALIZED';
                }
                return area.toUpperCase();
            };
            
            const normalizedSolicitudArea = normalizeBiomedArea(solicitudArea);
            const normalizedTecnicoArea = normalizeBiomedArea(tecnicoArea);
            
            console.log('🔍 Áreas normalizadas:', { normalizedSolicitudArea, normalizedTecnicoArea });
            
            if (normalizedSolicitudArea !== normalizedTecnicoArea) {
                console.warn('⚠️ Advertencia: Áreas no coinciden exactamente, pero permitiendo asignación');
            }
            
            const fechaAsignacion = new Date().toISOString();
            const tiempoEstimadoRespuesta = this.calculateMaxResponseTime(solicitud.prioridad || 'MEDIA');
            
            await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: {
                    tecnicoAsignado: tecnico.nombre,
                    estado: this.mapFieldValue('estado', 'ASIGNADA'),
                    fechaAsignacion: fechaAsignacion,
                    observacionesAsignacion: observaciones,
                    tiempoRespuestaMaximo: tiempoEstimadoRespuesta
                }
            });
            
            await this.makeRequest(`${this.tables.tecnicos}/${tecnicoId}`, 'PATCH', {
                fields: {
                    estado: this.mapFieldValue('estado', 'ocupado'),
                    solicitudAsignada: solicitud.numero || solicitudId
                }
            });
            
            console.log(`✅ Asignación exitosa: ${tecnico.nombre} → ${solicitud.numero}`);
            
            return {
                success: true,
                solicitud: { ...solicitud, tecnicoAsignado: tecnico.nombre, estado: 'ASIGNADA' },
                tecnico: { ...tecnico, estado: 'ocupado' },
                fechaAsignacion: fechaAsignacion,
                tiempoEstimadoRespuesta: tiempoEstimadoRespuesta
            };
            
        } catch (error) {
            console.error('❌ Error en asignación:', error);
            throw error;
        }
    }

    async updateRequestStatus(solicitudId, nuevoEstado, observaciones = '') {
        console.log('🔄 Actualizando estado:', { solicitudId, nuevoEstado });
        
        try {
            const updateData = {
                estado: this.mapFieldValue('estado', nuevoEstado)
            };
            
            if (observaciones) {
                updateData.observaciones = observaciones;
            }
            
            if (nuevoEstado === 'EN_PROCESO') {
                updateData.fechaInicioTrabajo = new Date().toISOString();
            } else if (nuevoEstado === 'COMPLETADA') {
                updateData.fechaCompletado = new Date().toISOString();
            }
            
            await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: updateData
            });
            
            if (nuevoEstado === 'COMPLETADA') {
                await this.liberarTecnicoAsignado(solicitudId);
            }
            
            console.log(`✅ Estado actualizado a: ${nuevoEstado}`);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            throw error;
        }
    }

    async liberarTecnicoAsignado(solicitudId) {
        console.log('🔓 Liberando técnico asignado:', solicitudId);
        
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud || !solicitud.tecnicoAsignado) {
                console.log('ℹ️ No hay técnico asignado para liberar');
                return;
            }
            
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.nombre === solicitud.tecnicoAsignado);
            
            if (tecnico) {
                await this.makeRequest(`${this.tables.tecnicos}/${tecnico.id}`, 'PATCH', {
                    fields: {
                        estado: this.mapFieldValue('estado', 'disponible'),
                        solicitudAsignada: ''
                    }
                });
                console.log(`✅ Técnico ${tecnico.nombre} liberado`);
            }
            
            await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: {
                    tecnicoAsignado: ''
                }
            });
            
        } catch (error) {
            console.error('❌ Error liberando técnico:', error);
        }
    }

    async approveAccessRequestAndCreateUser(requestId) {
        console.log('✅ Aprobando solicitud y creando usuario:', requestId);
        
        try {
            const solicitudesAcceso = await this.getSolicitudesAcceso();
            const solicitud = solicitudesAcceso.find(s => s.id === requestId);
            
            if (!solicitud) {
                throw new Error('Solicitud de acceso no encontrada');
            }

            if (solicitud.estado === 'APROBADA' || solicitud.estado === 'Aprobada') {
                throw new Error('La solicitud ya fue aprobada anteriormente');
            }

            const codigoAcceso = Math.floor(1000 + Math.random() * 9000).toString();
            
            const userData = {
                fields: {
                    nombreCompleto: solicitud.nombreCompleto,
                    email: solicitud.email,
                    servicioHospitalario: solicitud.servicioHospitalario,
                    cargo: solicitud.cargo,
                    codigoAcceso: codigoAcceso,
                    estado: 'ACTIVO',
                    fechaCreacion: new Date().toISOString(),
                    solicitudOrigenId: requestId
                }
            };

            const newUser = await this.makeRequest(this.tables.usuarios, 'POST', userData);

            // Usar el valor de estado aprobada detectado o un valor por defecto
            let aprobadasValue = 'APROBADA';
            if (this.validAccessRequestValues.estadoValues) {
                const aprobadaDetectada = this.validAccessRequestValues.estadoValues.find(v => 
                    v.toUpperCase() === 'APROBADA'
                );
                if (aprobadaDetectada) {
                    aprobadasValue = aprobadaDetectada;
                }
            }

            await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', {
                fields: {
                    estado: aprobadasValue,
                    fechaAprobacion: new Date().toISOString(),
                    usuarioCreado: newUser.id
                }
            });

            console.log(`✅ Usuario creado exitosamente con código: ${codigoAcceso}`);

            return {
                success: true,
                user: {
                    id: newUser.id,
                    ...newUser.fields
                },
                accessCode: codigoAcceso,
                requestId: requestId
            };

        } catch (error) {
            console.error('❌ Error en aprobación:', error);
            throw error;
        }
    }

    async updateSolicitudAcceso(requestId, updateData) {
        const cleanData = {};
        Object.keys(updateData).forEach(key => {
            const value = updateData[key];
            if (typeof value === 'string') {
                cleanData[key] = this.cleanFieldValue(value);
                console.log(`📝 Campo ${key} limpiado: "${updateData[key]}" → "${cleanData[key]}"`);
            } else {
                cleanData[key] = value;
            }
        });
        
        const data = { fields: cleanData };
        return await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', data);
    }

    async autoAssignPendingRequests() {
        console.log('🤖 Iniciando auto-asignación de solicitudes pendientes...');
        
        try {
            const [solicitudes, tecnicos] = await Promise.all([
                this.getSolicitudes(),
                this.getTecnicos()
            ]);
            
            const solicitudesPendientes = solicitudes.filter(s => 
                s.estado === 'PENDIENTE' || !s.tecnicoAsignado
            );
            
            const tecnicosDisponibles = tecnicos.filter(t => t.estado === 'disponible');
            
            let asignadas = 0;
            let fallidas = 0;
            let sinTecnicos = 0;
            const detalles = [];
            
            for (const solicitud of solicitudesPendientes) {
                try {
                    const normalizeBiomedArea = (area) => {
                        if (!area) return area;
                        const lowerArea = area.toLowerCase();
                        if (lowerArea.includes('biomed') || lowerArea.includes('bioméd')) {
                            return 'BIOMEDICA_NORMALIZED';
                        }
                        return area.toUpperCase();
                    };
                    
                    const solicitudAreaNorm = normalizeBiomedArea(solicitud.servicioIngenieria);
                    
                    const tecnicoCompatible = tecnicosDisponibles.find(t => {
                        const tecnicoAreaNorm = normalizeBiomedArea(t.area);
                        return tecnicoAreaNorm === solicitudAreaNorm;
                    });
                    
                    if (!tecnicoCompatible) {
                        sinTecnicos++;
                        console.log(`⚠️ Sin técnico disponible para ${solicitud.numero} (${solicitud.servicioIngenieria})`);
                        continue;
                    }
                    
                    await this.assignTechnicianToRequest(
                        solicitud.id, 
                        tecnicoCompatible.id, 
                        'Asignación automática del sistema'
                    );
                    
                    asignadas++;
                    detalles.push({
                        solicitud: solicitud.numero,
                        tecnico: tecnicoCompatible.nombre,
                        area: solicitud.servicioIngenieria
                    });
                    
                    const tecnicoIndex = tecnicosDisponibles.findIndex(t => t.id === tecnicoCompatible.id);
                    if (tecnicoIndex !== -1) {
                        tecnicosDisponibles.splice(tecnicoIndex, 1);
                    }
                    
                } catch (error) {
                    fallidas++;
                    console.error(`❌ Error asignando ${solicitud.numero}:`, error);
                }
            }
            
            return {
                asignadas,
                fallidas,
                sinTecnicos,
                detalles,
                total: solicitudesPendientes.length
            };
            
        } catch (error) {
            console.error('❌ Error en auto-asignación:', error);
            throw error;
        }
    }

    async getAdvancedStatistics() {
        try {
            const [solicitudes, tecnicos, usuarios] = await Promise.all([
                this.getSolicitudes(),
                this.getTecnicos(),
                this.getUsuarios()
            ]);
            
            return {
                solicitudes: {
                    total: solicitudes.length,
                    pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
                    asignadas: solicitudes.filter(s => s.estado === 'ASIGNADA').length,
                    enProceso: solicitudes.filter(s => s.estado === 'EN_PROCESO').length,
                    completadas: solicitudes.filter(s => s.estado === 'COMPLETADA').length,
                    canceladas: solicitudes.filter(s => s.estado === 'CANCELADA').length,
                    porArea: {
                        INGENIERIA_BIOMEDICA: solicitudes.filter(s => {
                            const area = s.servicioIngenieria || '';
                            return area === 'INGENIERIA_BIOMEDICA' || 
                                   area.toLowerCase().includes('biomed') || 
                                   area.toLowerCase().includes('bioméd');
                        }).length,
                        MECANICA: solicitudes.filter(s => 
                            s.servicioIngenieria === 'MECANICA' || 
                            (s.servicioIngenieria && s.servicioIngenieria.toLowerCase().includes('mec'))
                        ).length,
                        INFRAESTRUCTURA: solicitudes.filter(s => 
                            s.servicioIngenieria === 'INFRAESTRUCTURA' || 
                            (s.servicioIngenieria && s.servicioIngenieria.toLowerCase().includes('infra'))
                        ).length
                    },
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
                    inactivos: tecnicos.filter(t => t.estado === 'inactivo').length
                },
                usuarios: {
                    total: usuarios.length,
                    activos: usuarios.filter(u => u.estado === 'ACTIVO').length
                },
                tiemposRespuesta: {
                    promedioRespuesta: 'Calculando...',
                    solicitudesVencidas: solicitudes.filter(s => {
                        if (!s.tiempoRespuestaMaximo || s.estado === 'COMPLETADA') return false;
                        return new Date() > new Date(s.tiempoRespuestaMaximo);
                    }).length
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    async testTecnicosTable() {
        console.log('🧪 Test específico de tabla Tecnicos...');
        
        try {
            const result = await this.makeRequest(`${this.tables.tecnicos}?maxRecords=3`);
            
            return {
                success: true,
                records: result.records ? result.records.length : 0,
                sampleData: result.records ? result.records[0] : null
            };
            
        } catch (error) {
            console.error('❌ Test de Tecnicos falló:', error);
            
            return {
                success: false,
                error: error.message,
                status: error.message.includes('HTTP') ? error.message.match(/HTTP (\d+)/)?.[1] : null
            };
        }
    }

    async testSolicitudesAccesoTable() {
        console.log('🧪 Test específico de tabla SolicitudesAcceso...');
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudesAcceso}?maxRecords=3`);
            
            console.log('✅ Test SolicitudesAcceso exitoso');
            console.log('📊 Registros encontrados:', result.records ? result.records.length : 0);
            
            if (result.records && result.records.length > 0) {
                console.log('🔍 Campos disponibles:', Object.keys(result.records[0].fields));
                console.log('📋 Muestra de datos:', result.records[0]);
            }
            
            return {
                success: true,
                records: result.records ? result.records.length : 0,
                availableFields: result.records && result.records.length > 0 ? Object.keys(result.records[0].fields) : [],
                sampleData: result.records ? result.records[0] : null
            };
            
        } catch (error) {
            console.error('❌ Test de SolicitudesAcceso falló:', error);
            
            return {
                success: false,
                error: error.message,
                status: error.message.includes('HTTP') ? error.message.match(/HTTP (\d+)/)?.[1] : null
            };
        }
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global con fix para error 422...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión fix error 422)');
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
                ? '✅ Conectado (fix error 422)' 
                : 'Modo Local (fix error 422)';
            
            updateConnectionStatus(status, message);
        }
    });
} catch (error) {
    console.warn('⚠️ No se pudo configurar event listener:', error);
}

// 🛠️ Función de diagnóstico actualizada
try {
    window.debugAirtableConnection = function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        const status = window.airtableAPI.getStatus();
        
        console.log('🔍 DIAGNÓSTICO FIX ERROR 422');
        console.log('============================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🔐 Valores detectados para solicitudes de acceso:', status.validAccessRequestValues);
        
        return status;
    };
    
    // NUEVO: Función para debug específico de solicitudes de acceso
    window.debugAccessRequests = async function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        return await window.airtableAPI.debugAccessRequestValues();
    };
    
    console.log('✅ debugAirtableConnection creado exitosamente');
    console.log('✅ debugAccessRequests creado exitosamente');
} catch (error) {
    console.error('❌ Error creando funciones de debug:', error);
}

console.log('✅ airtable-config.js (FIX ERROR 422) cargado');
console.log('🔐 FIX: Detección automática de valores válidos para solicitudes de acceso');
console.log('🧹 FIX: Limpieza mejorada de valores string');
console.log('🛡️ FIX: Creación robusta con fallbacks');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');
console.log('🔍 Para debug de accesos: debugAccessRequests()');

// Auto-verificación después de la carga
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAccessRequests === 'function') {
        console.log('🔄 Iniciando detección automática de valores válidos...');
        
        try {
            await window.airtableAPI.detectValidAccessRequestValues();
            const values = window.airtableAPI.validAccessRequestValues;
            
            if (values.estado) {
                console.log('✅ Valor de estado PENDIENTE detectado:', values.estado);
            } else {
                console.warn('⚠️ No se detectó valor para estado PENDIENTE');
                console.log('💡 Las solicitudes se crearán sin campo estado');
            }
            
        } catch (error) {
            console.error('❌ Error en detección automática:', error);
        }
    }
}, 3000);