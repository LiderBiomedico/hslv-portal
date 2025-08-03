// 🛡️ Configuración COMPLETA de Airtable API - Con historial de asignaciones
// airtable-config.js - Versión con estadísticas por técnico mejoradas

console.log('🚀 Cargando airtable-config.js (VERSIÓN CON HISTORIAL DE ASIGNACIONES)...');

// 🗺️ MAPEO DE VALORES CORREGIDO PARA COMPATIBILIDAD CON AIRTABLE
const AIRTABLE_VALUE_MAPPING = {
    // Para campos de selección en Airtable se utilizan códigos internos como valores
    servicioIngenieria: {
        'INGENIERIA_BIOMEDICA': 'INGENIERIA_BIOMEDICA',
        'Ingeniería Biomédica': 'INGENIERIA_BIOMEDICA',
        'Ingenieria Biomedica': 'INGENIERIA_BIOMEDICA',
        'Ing. Biomédica': 'INGENIERIA_BIOMEDICA',
        'BIOMEDICA': 'INGENIERIA_BIOMEDICA',
        'MECANICA': 'MECANICA',
        'Mecánica': 'MECANICA',
        'Mecanica': 'MECANICA',
        'INFRAESTRUCTURA': 'INFRAESTRUCTURA',
        'Infraestructura': 'INFRAESTRUCTURA'
    },
    tipoServicio: {
        'MANTENIMIENTO_PREVENTIVO': 'MANTENIMIENTO_PREVENTIVO',
        'Mantenimiento Preventivo': 'MANTENIMIENTO_PREVENTIVO',
        'MANTENIMIENTO_CORRECTIVO': 'MANTENIMIENTO_CORRECTIVO',
        'Mantenimiento Correctivo': 'MANTENIMIENTO_CORRECTIVO',
        'REPARACION': 'REPARACION',
        'Reparación': 'REPARACION',
        'INSTALACION': 'INSTALACION',
        'Instalación': 'INSTALACION',
        'CALIBRACION': 'CALIBRACION',
        'Calibración': 'CALIBRACION',
        'INSPECCION': 'INSPECCION',
        'Inspección': 'INSPECCION',
        'ACTUALIZACION': 'ACTUALIZACION',
        'Actualización': 'ACTUALIZACION',
        'EMERGENCIA': 'EMERGENCIA',
        'Emergencia': 'EMERGENCIA',
        'ERROR_USUARIO': 'ERROR_USUARIO',
        'Error de Usuario': 'ERROR_USUARIO'
    },
    prioridad: {
        'CRITICA': 'CRITICA',
        'Crítica': 'CRITICA',
        'ALTA': 'ALTA',
        'Alta': 'ALTA',
        'MEDIA': 'MEDIA',
        'Media': 'MEDIA',
        'BAJA': 'BAJA',
        'Baja': 'BAJA'
    },
    estado: {
        'PENDIENTE': 'PENDIENTE',
        'Pendiente': 'PENDIENTE',
        'ASIGNADA': 'ASIGNADA',
        'Asignada': 'ASIGNADA',
        'EN_PROCESO': 'EN_PROCESO',
        'En Proceso': 'EN_PROCESO',
        'EN PROCESO': 'EN_PROCESO',
        'COMPLETADA': 'COMPLETADA',
        'Completada': 'COMPLETADA',
        'CANCELADA': 'CANCELADA',
        'Cancelada': 'CANCELADA'
    },
    area: {
        'INGENIERIA_BIOMEDICA': 'INGENIERIA_BIOMEDICA',
        'Ingeniería Biomédica': 'INGENIERIA_BIOMEDICA',
        'Ingenieria Biomedica': 'INGENIERIA_BIOMEDICA',
        'Ing. Biomédica': 'INGENIERIA_BIOMEDICA',
        'BIOMEDICA': 'INGENIERIA_BIOMEDICA',
        'MECANICA': 'MECANICA',
        'Mecánica': 'MECANICA',
        'Mecanica': 'MECANICA',
        'INFRAESTRUCTURA': 'INFRAESTRUCTURA',
        'Infraestructura': 'INFRAESTRUCTURA'
    },
    estadoSolicitudAcceso: {
        'PENDIENTE': 'Pendiente',
        'APROBADA': 'Aprobada',
        'RECHAZADA': 'Rechazada'
    },
    estadoUsuario: {
        'ACTIVO': 'Activo',
        'INACTIVO': 'Inactivo',
        'SUSPENDIDO': 'Suspendido'
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
        'tiempoRespuestaMaximo',
        'fechaInicioTrabajo',
        'fechaCompletado',
        'tiempoTotalRespuesta'
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
        console.log('🔧 Inicializando AirtableAPI con historial de asignaciones...');
        
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
        
        // Almacenar valores válidos detectados
        this.validAccessRequestValues = {
            estado: null,
            servicioHospitalario: [],
            cargo: [],
            availableFields: []
        };
        
        this.validUserValues = {
            estado: null,
            servicioHospitalario: [],
            cargo: []
        };
        
        this.validSolicitudValues = {
            servicioIngenieria: ['INGENIERIA_BIOMEDICA', 'MECANICA', 'INFRAESTRUCTURA'],
            tipoServicio: ['MANTENIMIENTO_PREVENTIVO', 'MANTENIMIENTO_CORRECTIVO', 'REPARACION', 'INSTALACION', 'CALIBRACION', 'INSPECCION', 'ACTUALIZACION', 'EMERGENCIA', 'ERROR_USUARIO'],
            prioridad: ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'],
            estado: ['PENDIENTE', 'ASIGNADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'],
            availableFields: []
        };
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🗺️ Mapeo de valores configurado');
        console.log('📋 Valores iniciales de solicitud:', this.validSolicitudValues);
        
        this.initializeConnectionAsync();
    }

    // 🔧 FUNCIÓN CRÍTICA: Limpiar valores de comillas extras y espacios
    cleanFieldValue(value) {
        if (typeof value !== 'string') return value;
        
        // Remover comillas dobles extras al principio y final
        let cleanValue = value.trim();
        
        // Remover múltiples comillas dobles consecutivas
        cleanValue = cleanValue.replace(/"+/g, '"');
        
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
                    
                    // CRÍTICO: Detectar valores válidos para todas las tablas
                    await this.detectValidAccessRequestValues();
                    await this.detectValidUserValues();
                    
                    // IMPORTANTE: Siempre intentar detectar valores de solicitudes
                    try {
                        await this.detectValidSolicitudValues();
                    } catch (error) {
                        console.warn('⚠️ No se pudieron detectar valores de solicitudes, usando valores por defecto conocidos');
                    }
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

    // 🔍 FUNCIÓN: Detectar valores válidos específicamente para solicitudes de acceso
    async detectValidAccessRequestValues() {
        console.log('🔍 Detectando valores y campos válidos para SolicitudesAcceso...');
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudesAcceso}?maxRecords=20`);
            
            if (result.records && result.records.length > 0) {
                // Detectar valores únicos de estado
                const estadoValues = new Set();
                const servicioValues = new Set();
                const cargoValues = new Set();
                const availableFields = new Set();
                
                result.records.forEach(record => {
                    if (record.fields) {
                        // Recopilar todos los campos disponibles
                        Object.keys(record.fields).forEach(field => {
                            availableFields.add(field);
                        });
                        
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
                
                console.log('📋 Campos disponibles en SolicitudesAcceso:', Array.from(availableFields));
                
                // Buscar el valor correcto para PENDIENTE
                let pendienteValue = null;
                estadoValues.forEach(value => {
                    const cleanValue = this.cleanFieldValue(value);
                    if (cleanValue.toUpperCase() === 'PENDIENTE') {
                        pendienteValue = value;
                        console.log(`✅ Valor PENDIENTE detectado: "${value}"`);
                    }
                });
                
                this.validAccessRequestValues = {
                    estado: pendienteValue,
                    estadoValues: Array.from(estadoValues),
                    servicioHospitalario: Array.from(servicioValues),
                    cargo: Array.from(cargoValues),
                    availableFields: Array.from(availableFields)
                };
                
                console.log('📋 Valores válidos detectados:', {
                    estado: this.validAccessRequestValues.estado,
                    todosEstados: this.validAccessRequestValues.estadoValues,
                    camposDisponibles: this.validAccessRequestValues.availableFields,
                    servicios: this.validAccessRequestValues.servicioHospitalario.length,
                    cargos: this.validAccessRequestValues.cargo.length
                });
                
                // Si no encontramos PENDIENTE, usar valor por defecto
                if (!pendienteValue) {
                    console.warn('⚠️ No se encontró valor PENDIENTE, usando valor por defecto');
                    this.validAccessRequestValues.estado = 'Pendiente';
                }
                
            } else {
                console.warn('⚠️ No hay registros en SolicitudesAcceso para detectar valores');
                // Usar valores por defecto
                this.validAccessRequestValues.estado = 'Pendiente';
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores válidos:', error);
            // Usar valores por defecto en caso de error
            this.validAccessRequestValues.estado = 'Pendiente';
        }
    }

    // 🔍 NUEVO: Detectar valores válidos para tabla de usuarios
    async detectValidUserValues() {
        console.log('🔍 Detectando valores válidos para tabla Usuarios...');
        
        try {
            const result = await this.makeRequest(`${this.tables.usuarios}?maxRecords=10`);
            
            if (result.records && result.records.length > 0) {
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
                
                // Buscar el valor correcto para ACTIVO
                let activoValue = null;
                estadoValues.forEach(value => {
                    const cleanValue = this.cleanFieldValue(value);
                    if (cleanValue.toUpperCase() === 'ACTIVO') {
                        activoValue = value;
                        console.log(`✅ Valor ACTIVO detectado para usuarios: "${value}"`);
                    }
                });
                
                // Si no encontramos ACTIVO, usar valor por defecto
                if (!activoValue && estadoValues.size > 0) {
                    activoValue = Array.from(estadoValues)[0];
                    console.warn(`⚠️ No se encontró valor ACTIVO, usando: "${activoValue}"`);
                } else if (!activoValue) {
                    activoValue = 'Activo';
                }
                
                this.validUserValues = {
                    estado: activoValue,
                    estadoValues: Array.from(estadoValues),
                    servicioHospitalario: Array.from(servicioValues),
                    cargo: Array.from(cargoValues)
                };
                
                console.log('📋 Valores válidos de usuarios detectados:', {
                    estado: this.validUserValues.estado,
                    todosEstados: this.validUserValues.estadoValues,
                    servicios: this.validUserValues.servicioHospitalario.length,
                    cargos: this.validUserValues.cargo.length
                });
                
            } else {
                console.warn('⚠️ No hay usuarios para detectar valores, usando valores por defecto');
                // Usar valores por defecto
                this.validUserValues.estado = 'Activo';
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores válidos de usuarios:', error);
            // Usar valores por defecto en caso de error
            this.validUserValues.estado = 'Activo';
        }
    }

    // 🔍 MEJORADO: Detectar valores válidos para tabla de Solicitudes
    async detectValidSolicitudValues() {
        console.log('🔍 Detectando valores válidos para tabla Solicitudes...');
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudes}?maxRecords=50`);
            
            if (result.records && result.records.length > 0) {
                const servicioValues = new Set();
                const tipoServicioValues = new Set();
                const prioridadValues = new Set();
                const estadoValues = new Set();
                const availableFields = new Set();
                
                result.records.forEach(record => {
                    if (record.fields) {
                        // Recopilar todos los campos disponibles
                        Object.keys(record.fields).forEach(field => {
                            availableFields.add(field);
                        });
                        
                        if (record.fields.servicioIngenieria) {
                            const mappedServicio = this.mapFieldValue('servicioIngenieria', record.fields.servicioIngenieria);
                            servicioValues.add(mappedServicio);
                            console.log(`📋 Área detectada: "${record.fields.servicioIngenieria}" → "${mappedServicio}"`);
                        }
                        if (record.fields.tipoServicio) {
                            const mappedTipo = this.mapFieldValue('tipoServicio', record.fields.tipoServicio);
                            tipoServicioValues.add(mappedTipo);
                        }
                        if (record.fields.prioridad) {
                            const mappedPrioridad = this.mapFieldValue('prioridad', record.fields.prioridad);
                            prioridadValues.add(mappedPrioridad);
                        }
                        if (record.fields.estado) {
                            const mappedEstado = this.mapFieldValue('estado', record.fields.estado);
                            estadoValues.add(mappedEstado);
                        }
                    }
                });
                
                // Si encontramos valores, usarlos
                if (servicioValues.size > 0) {
                    this.validSolicitudValues.servicioIngenieria = Array.from(servicioValues);
                }
                if (tipoServicioValues.size > 0) {
                    this.validSolicitudValues.tipoServicio = Array.from(tipoServicioValues);
                }
                if (prioridadValues.size > 0) {
                    this.validSolicitudValues.prioridad = Array.from(prioridadValues);
                }
                if (estadoValues.size > 0) {
                    this.validSolicitudValues.estado = Array.from(estadoValues);
                }
                
                this.validSolicitudValues.availableFields = Array.from(availableFields);
                
                console.log('📋 Valores válidos de solicitudes detectados:', {
                    servicios: this.validSolicitudValues.servicioIngenieria,
                    tipos: this.validSolicitudValues.tipoServicio,
                    prioridades: this.validSolicitudValues.prioridad,
                    estados: this.validSolicitudValues.estado,
                    campos: this.validSolicitudValues.availableFields
                });
                
            } else {
                console.warn('⚠️ No hay registros en Solicitudes para detectar valores');
                console.log('📋 Usando valores conocidos por defecto:', this.validSolicitudValues);
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores válidos de solicitudes:', error);
            console.log('📋 Manteniendo valores por defecto conocidos:', this.validSolicitudValues);
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
                                console.log('💡 Valores detectados:', this.validSolicitudValues);
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
            
            // CRÍTICO: Usar el valor de estado detectado o valor por defecto
            if (this.validAccessRequestValues.estado) {
                console.log(`✅ Usando valor de estado detectado: "${this.validAccessRequestValues.estado}"`);
                baseData.estado = this.validAccessRequestValues.estado;
            } else {
                console.log('📋 Usando valor de estado por defecto: "Pendiente"');
                baseData.estado = 'Pendiente';
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

    // 🔐 MÉTODO CORREGIDO: Aprobar solicitud y crear usuario (sin campos inexistentes)
    async approveAccessRequestAndCreateUser(requestId) {
        console.log('✅ Iniciando aprobación de solicitud:', requestId);
        
        try {
            // 1. Obtener la solicitud de acceso
            const solicitudesAcceso = await this.getSolicitudesAcceso();
            const solicitud = solicitudesAcceso.find(s => s.id === requestId);
            
            if (!solicitud) {
                throw new Error('Solicitud de acceso no encontrada');
            }

            if (solicitud.estado === 'APROBADA' || solicitud.estado === 'Aprobada') {
                throw new Error('La solicitud ya fue aprobada anteriormente');
            }

            // 2. Generar código de acceso
            const codigoAcceso = Math.floor(1000 + Math.random() * 9000).toString();
            console.log(`🔐 Código generado: ${codigoAcceso}`);

            // 3. Detectar valores válidos si no se han detectado
            if (!this.validUserValues.estado) {
                await this.detectValidUserValues();
            }

            // 4. Preparar datos del usuario con valores limpios
            const userData = {
                nombreCompleto: this.cleanFieldValue(solicitud.nombreCompleto || 'Sin nombre'),
                email: this.cleanFieldValue(solicitud.email || 'no-email@temp.com'),
                servicioHospitalario: this.cleanFieldValue(solicitud.servicioHospitalario || ''),
                cargo: this.cleanFieldValue(solicitud.cargo || ''),
                codigoAcceso: codigoAcceso,
                fechaCreacion: new Date().toISOString(),
                solicitudOrigenId: requestId  // ID de la solicitud de origen
            };

            // 5. Agregar estado si tenemos un valor válido
            if (this.validUserValues.estado) {
                userData.estado = this.validUserValues.estado;
            } else {
                userData.estado = 'Activo';
                console.warn('⚠️ Usando valor de estado por defecto: "Activo"');
            }

            console.log('📝 Datos del usuario a crear:', userData);

            // 6. Intentar crear el usuario
            let newUser;
            try {
                newUser = await this.makeRequest(this.tables.usuarios, 'POST', {
                    fields: userData
                });
                console.log('✅ Usuario creado exitosamente:', newUser.id);
                
            } catch (error) {
                if (error.message.includes('422')) {
                    console.warn('⚠️ Error 422 al crear usuario, reintentando con campos mínimos...');
                    
                    // Reintentar con campos absolutamente mínimos
                    const minimalUserData = {
                        nombreCompleto: userData.nombreCompleto,
                        email: userData.email,
                        codigoAcceso: userData.codigoAcceso,
                        fechaCreacion: userData.fechaCreacion
                    };
                    
                    newUser = await this.makeRequest(this.tables.usuarios, 'POST', {
                        fields: minimalUserData
                    });
                    
                    console.log('✅ Usuario creado con campos mínimos:', newUser.id);
                } else {
                    throw error;
                }
            }

            // 7. Actualizar SOLO el estado de la solicitud de acceso
            try {
                // Detectar el valor correcto para estado APROBADA
                let aprobadasValue = 'Aprobada';
                if (this.validAccessRequestValues.estadoValues) {
                    const aprobadaDetectada = this.validAccessRequestValues.estadoValues.find(v => 
                        v.toUpperCase().includes('APROBADA') || v.toUpperCase().includes('APROBADO')
                    );
                    if (aprobadaDetectada) {
                        aprobadasValue = aprobadaDetectada;
                        console.log(`✅ Usando valor de estado detectado: "${aprobadasValue}"`);
                    }
                }

                // IMPORTANTE: Solo actualizar campos que existan en Airtable
                const updateFields = {
                    estado: aprobadasValue
                };
                
                // Solo agregar usuarioCreado si sabemos que el campo existe
                if (this.validAccessRequestValues.availableFields.includes('usuarioCreado')) {
                    updateFields.usuarioCreado = newUser.id;
                }

                console.log('📝 Actualizando solicitud con campos:', updateFields);

                await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', {
                    fields: updateFields
                });
                
                console.log('✅ Solicitud de acceso actualizada');
                
            } catch (updateError) {
                console.error('❌ Error actualizando solicitud de acceso:', updateError);
                console.warn('⚠️ El usuario fue creado pero no se pudo actualizar completamente la solicitud');
            }

            // 8. Retornar resultado exitoso
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

            const estadoActivo = ['ACTIVO', 'Activo', 'activo'];
            if (!estadoActivo.includes(user.estado)) {
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

    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        const cleanValue = this.cleanFieldValue(value);
        
        console.log(`🗺️ Mapeando ${fieldType}: "${cleanValue}"`);
        
        // Si el valor ya es el esperado, devolverlo tal cual
        if (this.fieldMappings[fieldType]) {
            const mapping = this.fieldMappings[fieldType];
            
            // Si el valor es una clave directa del mapeo, devolver su valor mapeado
            if (mapping[cleanValue]) {
                const mappedValue = mapping[cleanValue];
                console.log(`✅ Mapeado ${fieldType}: "${cleanValue}" → "${mappedValue}"`);
                return mappedValue;
            }
            
            // Buscar si el valor es uno de los valores mapeados
            for (const [key, mappedValue] of Object.entries(mapping)) {
                if (mappedValue === cleanValue) {
                    console.log(`✅ Valor ya mapeado correctamente: "${cleanValue}"`);
                    return mappedValue;
                }
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

    // 📋 MÉTODO ACTUALIZADO Y MEJORADO: Crear solicitud
    async createSolicitud(solicitudData) {
        console.log('📝 Creando solicitud con mapeo y valores conocidos...');
        console.log('🔍 Datos recibidos:', solicitudData);
        console.log('🏥 ÁREA RECIBIDA:', solicitudData.servicioIngenieria);
        console.log('📋 Valores válidos conocidos:', this.validSolicitudValues);
        
        try {
            // CRÍTICO: Aplicar mapeo de valores
            const mappedData = { ...solicitudData };
            
            // Mapear servicioIngenieria
            if (mappedData.servicioIngenieria && this.fieldMappings.servicioIngenieria[mappedData.servicioIngenieria]) {
                const valorOriginal = mappedData.servicioIngenieria;
                mappedData.servicioIngenieria = this.fieldMappings.servicioIngenieria[mappedData.servicioIngenieria];
                console.log(`🗺️ ÁREA MAPEADA: ${valorOriginal} → ${mappedData.servicioIngenieria}`);
            }
            
            // Mapear tipoServicio
            if (mappedData.tipoServicio && this.fieldMappings.tipoServicio[mappedData.tipoServicio]) {
                const valorOriginal = mappedData.tipoServicio;
                mappedData.tipoServicio = this.fieldMappings.tipoServicio[mappedData.tipoServicio];
                console.log(`🗺️ TIPO SERVICIO MAPEADO: ${valorOriginal} → ${mappedData.tipoServicio}`);
            }
            
            // Mapear prioridad
            if (mappedData.prioridad && this.fieldMappings.prioridad[mappedData.prioridad]) {
                const valorOriginal = mappedData.prioridad;
                mappedData.prioridad = this.fieldMappings.prioridad[mappedData.prioridad];
                console.log(`🗺️ PRIORIDAD MAPEADA: ${valorOriginal} → ${mappedData.prioridad}`);
            }
            
            // VERIFICAR QUE EL VALOR MAPEADO SEA VÁLIDO
            if (mappedData.servicioIngenieria && 
                this.validSolicitudValues.servicioIngenieria.length > 0 &&
                !this.validSolicitudValues.servicioIngenieria.includes(mappedData.servicioIngenieria)) {
                console.warn(`⚠️ Valor mapeado ${mappedData.servicioIngenieria} no está en la lista de valores válidos`);
                console.log('📋 Valores válidos detectados:', this.validSolicitudValues.servicioIngenieria);
                
                // Intentar encontrar un valor similar
                const valorSimilar = this.validSolicitudValues.servicioIngenieria.find(v => 
                    v.toLowerCase().includes('biom') && mappedData.servicioIngenieria.toLowerCase().includes('biom') ||
                    v.toLowerCase().includes('mec') && mappedData.servicioIngenieria.toLowerCase().includes('mec') ||
                    v.toLowerCase().includes('infra') && mappedData.servicioIngenieria.toLowerCase().includes('infra')
                );
                
                if (valorSimilar) {
                    console.log(`✅ Usando valor válido similar: ${valorSimilar}`);
                    mappedData.servicioIngenieria = valorSimilar;
                }
            }
            
            // Generar número específico del área
            const numero = await this.generateAreaSpecificNumber(solicitudData.servicioIngenieria);
            
            // Preparar datos con valores mapeados
            const rawData = {
                numero: numero,
                descripcion: mappedData.descripcion || 'Solicitud de mantenimiento',
                estado: 'Pendiente', // Usar valor que sabemos que funciona
                fechaCreacion: new Date().toISOString(),
                servicioIngenieria: mappedData.servicioIngenieria,
                tipoServicio: mappedData.tipoServicio,
                prioridad: mappedData.prioridad,
                equipo: mappedData.equipo,
                ubicacion: mappedData.ubicacion,
                observaciones: mappedData.observaciones,
                solicitante: mappedData.solicitante,
                servicioHospitalario: mappedData.servicioHospitalario,
                emailSolicitante: mappedData.emailSolicitante,
                tiempoRespuestaMaximo: this.calculateMaxResponseTime(mappedData.prioridad || 'Media')
            };
            
            // CRÍTICO: Verificar que el área no sea undefined o null
            if (!rawData.servicioIngenieria) {
                console.error('❌ ERROR CRÍTICO: servicioIngenieria es undefined o null');
                console.error('Datos originales:', solicitudData);
                throw new Error('El área de ingeniería es requerida');
            }
            
            // Limpiar campos undefined o null
            const cleanData = {};
            Object.keys(rawData).forEach(key => {
                if (rawData[key] !== undefined && rawData[key] !== null && rawData[key] !== '') {
                    cleanData[key] = rawData[key];
                }
            });
            
            const data = {
                fields: cleanData
            };
            
            console.log('📝 Datos finales a enviar (con valores mapeados):', JSON.stringify(data, null, 2));
            console.log('🏥 ÁREA FINAL A GUARDAR:', data.fields.servicioIngenieria);
            
            try {
                const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
                console.log(`✅ Solicitud creada correctamente: ${numero}`);
                console.log(`🏥 Área guardada: ${data.fields.servicioIngenieria}`);
                
                // Verificar que el área se guardó
                if (result.fields && result.fields.servicioIngenieria) {
                    console.log(`✅ ÁREA CONFIRMADA EN RESPUESTA: ${result.fields.servicioIngenieria}`);
                } else {
                    console.warn(`⚠️ ÁREA NO CONFIRMADA EN RESPUESTA`);
                    console.log('Respuesta completa:', result);
                }
                
                return result;
                
            } catch (error) {
                if (error.message.includes('422')) {
                    console.error('🚨 ERROR 422 - Valores inválidos');
                    console.error('📋 Valores detectados disponibles:', this.validSolicitudValues);
                    console.error('📝 Datos que se intentaron enviar:', data);
                    
                    // Proporcionar información más específica del error
                    let mensajeError = 'No se pudo crear la solicitud. ';
                    
                    try {
                        // Intentar extraer información específica del error
                        if (error.message.includes('servicioIngenieria')) {
                            mensajeError += `El valor "${mappedData.servicioIngenieria}" no es válido para el área. `;
                            mensajeError += `Valores válidos: ${this.validSolicitudValues.servicioIngenieria.join(', ')}`;
                        } else if (error.message.includes('tipoServicio')) {
                            mensajeError += `El tipo de servicio "${mappedData.tipoServicio}" no es válido. `;
                        } else if (error.message.includes('prioridad')) {
                            mensajeError += `La prioridad "${mappedData.prioridad}" no es válida. `;
                        } else {
                            mensajeError += 'Verifique la configuración de campos en Airtable.';
                        }
                    } catch (e) {
                        mensajeError += 'Verifique la configuración de campos en Airtable.';
                    }
                    
                    throw new Error(mensajeError);
                }
                
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            throw error;
        }
    }

    calculateMaxResponseTime(prioridad) {
        const tiemposRespuesta = {
            'Crítica': 2,  // 2 horas
            'Alta': 8,     // 8 horas
            'Media': 24,   // 24 horas
            'Baja': 72,    // 72 horas
            'CRITICA': 2,
            'ALTA': 8,
            'MEDIA': 24,
            'BAJA': 72
        };
        
        const horas = tiemposRespuesta[prioridad] || 24;
        const fechaMaxima = new Date();
        fechaMaxima.setHours(fechaMaxima.getHours() + horas);
        
        return fechaMaxima.toISOString();
    }

    // 📊 FUNCIÓN PARA CALCULAR TIEMPO DE RESPUESTA
    calculateResponseTime(solicitud) {
        if (!solicitud.fechaCreacion) return null;
        
        const fechaCreacion = new Date(solicitud.fechaCreacion);
        let fechaFin = new Date();
        
        if (solicitud.fechaCompletado) {
            fechaFin = new Date(solicitud.fechaCompletado);
        } else if (solicitud.estado === 'CANCELADA' || solicitud.estado === 'Cancelada') {
            // Si está cancelada, usar la fecha actual como fin
            fechaFin = new Date();
        }
        
        const tiempoMs = fechaFin - fechaCreacion;
        const horas = Math.floor(tiempoMs / (1000 * 60 * 60));
        const minutos = Math.floor((tiempoMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            totalMs: tiempoMs,
            horas: horas,
            minutos: minutos,
            formato: `${horas}h ${minutos}m`,
            diasDecimales: (tiempoMs / (1000 * 60 * 60 * 24)).toFixed(2)
        };
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

    // 🔄 MÉTODO ACTUALIZADO: Actualizar estado de solicitud (SIN BORRAR tecnicoAsignado)
    async updateRequestStatus(solicitudId, nuevoEstado, observaciones = '') {
        console.log('🔄 Actualizando estado de solicitud:', { solicitudId, nuevoEstado });
        
        try {
            // Obtener la solicitud actual para validar
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            console.log('📋 Estado actual:', solicitud.estado);
            console.log('🔄 Nuevo estado solicitado:', nuevoEstado);
            
            // Mapear el nuevo estado
            const estadoMapeado = this.mapFieldValue('estado', nuevoEstado);
            console.log('🗺️ Estado mapeado:', estadoMapeado);
            
            // Preparar campos a actualizar
            const updateData = {
                estado: estadoMapeado
            };
            
            // Agregar observaciones si se proporcionan
            if (observaciones) {
                updateData.observaciones = (solicitud.observaciones || '') + '\n[' + new Date().toLocaleString('es-CO') + '] ' + observaciones;
            }
            
            // Lógica específica según el estado
            if (nuevoEstado === 'EN_PROCESO' || nuevoEstado === 'EN PROCESO') {
                updateData.fechaInicioTrabajo = new Date().toISOString();
                console.log('📅 Registrando fecha de inicio de trabajo');
                
            } else if (nuevoEstado === 'COMPLETADA') {
                const fechaCompletado = new Date();
                updateData.fechaCompletado = fechaCompletado.toISOString();
                
                // Calcular tiempo total de respuesta
                if (solicitud.fechaCreacion) {
                    const fechaCreacion = new Date(solicitud.fechaCreacion);
                    const tiempoTotalMs = fechaCompletado - fechaCreacion;
                    const horas = Math.floor(tiempoTotalMs / (1000 * 60 * 60));
                    const minutos = Math.floor((tiempoTotalMs % (1000 * 60 * 60)) / (1000 * 60));
                    updateData.tiempoTotalRespuesta = `${horas}h ${minutos}m`;
                    
                    console.log('⏱️ Tiempo total calculado:', updateData.tiempoTotalRespuesta);
                }
            }
            
            console.log('📝 Datos a actualizar:', updateData);
            
            // Realizar la actualización
            try {
                const result = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                    fields: updateData
                });
                
                console.log('✅ Estado actualizado exitosamente');
                
                // 🔄 CAMBIO CRÍTICO: Si se completó la solicitud, liberar el técnico PERO NO BORRAR LA ASIGNACIÓN
                if (nuevoEstado === 'COMPLETADA' && solicitud.tecnicoAsignado) {
                    console.log('🔓 Liberando técnico asignado MANTENIENDO HISTORIAL...');
                    await this.liberarTecnicoMantenidoHistorial(solicitudId);
                }
                
                return { 
                    success: true, 
                    solicitud: { ...solicitud, ...updateData },
                    mensaje: `Estado cambiado a ${nuevoEstado}`
                };
                
            } catch (updateError) {
                console.error('❌ Error actualizando estado:', updateError);
                
                // Si el error es 422, intentar con valores alternativos
                if (updateError.message.includes('422')) {
                    console.warn('⚠️ Error 422 detectado, intentando con valores alternativos...');
                    
                    // Intentar con diferentes variaciones del estado
                    const estadoAlternativas = {
                        'EN_PROCESO': ['En Proceso', 'EN PROCESO', 'en_proceso'],
                        'COMPLETADA': ['Completada', 'completada'],
                        'ASIGNADA': ['Asignada', 'asignada'],
                        'PENDIENTE': ['Pendiente', 'pendiente'],
                        'CANCELADA': ['Cancelada', 'cancelada']
                    };
                    
                    const alternativas = estadoAlternativas[nuevoEstado] || [];
                    
                    for (const estadoAlt of alternativas) {
                        try {
                            console.log(`🔄 Intentando con estado alternativo: ${estadoAlt}`);
                            updateData.estado = estadoAlt;
                            
                            const result = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                                fields: updateData
                            });
                            
                            console.log(`✅ Estado actualizado con valor alternativo: ${estadoAlt}`);
                            
                            // Si se completó la solicitud, liberar el técnico
                            if (nuevoEstado === 'COMPLETADA' && solicitud.tecnicoAsignado) {
                                await this.liberarTecnicoMantenidoHistorial(solicitudId);
                            }
                            
                            return { 
                                success: true, 
                                solicitud: { ...solicitud, ...updateData },
                                mensaje: `Estado cambiado a ${nuevoEstado} (usando ${estadoAlt})`
                            };
                            
                        } catch (altError) {
                            console.warn(`❌ Falló con ${estadoAlt}:`, altError.message);
                            continue;
                        }
                    }
                }
                
                throw updateError;
            }
            
        } catch (error) {
            console.error('❌ Error en updateRequestStatus:', error);
            throw new Error(`Error actualizando estado: ${error.message}`);
        }
    }

    // 🔓 NUEVO MÉTODO: Liberar técnico manteniendo el historial de asignación
    async liberarTecnicoMantenidoHistorial(solicitudId) {
        console.log('🔓 Liberando técnico MANTENIENDO HISTORIAL para solicitud:', solicitudId);
        
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud || !solicitud.tecnicoAsignado) {
                console.log('ℹ️ No hay técnico asignado para liberar');
                return { success: true, mensaje: 'No había técnico asignado' };
            }
            
            console.log('👤 Técnico a liberar:', solicitud.tecnicoAsignado);
            
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.nombre === solicitud.tecnicoAsignado);
            
            if (tecnico) {
                console.log('🔄 Actualizando estado del técnico a disponible...');
                
                try {
                    // IMPORTANTE: Solo actualizar estado y quitar solicitudAsignada
                    // NO modificar el campo tecnicoAsignado de la solicitud
                    await this.makeRequest(`${this.tables.tecnicos}/${tecnico.id}`, 'PATCH', {
                        fields: {
                            estado: 'disponible',
                            solicitudAsignada: ''  // Limpiar asignación actual
                        }
                    });
                    
                    console.log(`✅ Técnico ${tecnico.nombre} liberado exitosamente (historial mantenido)`);
                    
                } catch (tecnicoError) {
                    console.error('❌ Error actualizando técnico:', tecnicoError);
                    // Continuar aunque falle la actualización del técnico
                }
            } else {
                console.warn('⚠️ No se encontró el técnico en la base de datos');
            }
            
            // NO actualizar la solicitud para quitar el técnico asignado
            // Esto mantiene el historial de quién trabajó en la solicitud
            
            return { 
                success: true, 
                mensaje: `Técnico ${solicitud.tecnicoAsignado} liberado (historial mantenido)`,
                tecnico: tecnico
            };
            
        } catch (error) {
            console.error('❌ Error liberando técnico:', error);
            // No lanzar error para no interrumpir el flujo principal
            return { 
                success: false, 
                mensaje: 'Error liberando técnico',
                error: error.message 
            };
        }
    }

    // 🔓 MÉTODO ANTIGUO: Mantener para compatibilidad
    async liberarTecnicoAsignado(solicitudId) {
        console.log('⚠️ DEPRECATED: Usar liberarTecnicoMantenidoHistorial en su lugar');
        return await this.liberarTecnicoMantenidoHistorial(solicitudId);
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
                s.estado === 'PENDIENTE' || s.estado === 'Pendiente' || !s.tecnicoAsignado
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

    // 📊 NUEVO MÉTODO: Obtener historial completo de un técnico
    async getTechnicianHistory(tecnicoNombre) {
        console.log('📊 Obteniendo historial de técnico:', tecnicoNombre);
        
        try {
            const solicitudes = await this.getSolicitudes();
            
            // Filtrar todas las solicitudes asignadas a este técnico
            const solicitudesTecnico = solicitudes.filter(s => 
                s.tecnicoAsignado === tecnicoNombre
            );
            
            // Calcular estadísticas
            const completadas = solicitudesTecnico.filter(s => 
                s.estado === 'COMPLETADA' || s.estado === 'Completada'
            );
            
            const enProceso = solicitudesTecnico.filter(s => 
                s.estado === 'EN_PROCESO' || s.estado === 'En Proceso' || 
                s.estado === 'ASIGNADA' || s.estado === 'Asignada'
            );
            
            const erroresUsuario = solicitudesTecnico.filter(s => 
                s.tipoServicio === 'ERROR_USUARIO' || s.tipoServicio === 'Error de Usuario'
            );
            
            // Calcular tiempos promedio de las solicitudes completadas
            let tiempoTotalMs = 0;
            let solicitudesConTiempo = 0;
            
            completadas.forEach(solicitud => {
                const tiempoRespuesta = this.calculateResponseTime(solicitud);
                if (tiempoRespuesta) {
                    tiempoTotalMs += tiempoRespuesta.totalMs;
                    solicitudesConTiempo++;
                }
            });
            
            const tiempoPromedioMs = solicitudesConTiempo > 0 ? tiempoTotalMs / solicitudesConTiempo : 0;
            const horasPromedio = Math.floor(tiempoPromedioMs / (1000 * 60 * 60));
            const minutosPromedio = Math.floor((tiempoPromedioMs % (1000 * 60 * 60)) / (1000 * 60));
            
            return {
                tecnico: tecnicoNombre,
                totalAsignaciones: solicitudesTecnico.length,
                completadas: completadas.length,
                enProceso: enProceso.length,
                erroresUsuarioResueltos: erroresUsuario.length,
                tiempoPromedioRespuesta: `${horasPromedio}h ${minutosPromedio}m`,
                tasaCompletado: solicitudesTecnico.length > 0 ? 
                    ((completadas.length / solicitudesTecnico.length) * 100).toFixed(1) : 0,
                solicitudes: solicitudesTecnico
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo historial de técnico:', error);
            throw error;
        }
    }

    // 📊 NUEVO MÉTODO: Estadísticas mensuales por técnico
    async getMonthlyTechnicianStats(mes, año) {
        console.log(`📊 Obteniendo estadísticas mensuales: ${mes}/${año}`);
        
        try {
            const solicitudes = await this.getSolicitudes();
            const tecnicos = await this.getTecnicos();
            
            // Filtrar solicitudes del mes específico
            const solicitudesMes = solicitudes.filter(s => {
                if (!s.fechaCreacion) return false;
                const fecha = new Date(s.fechaCreacion);
                return fecha.getMonth() === mes - 1 && fecha.getFullYear() === año;
            });
            
            // Estadísticas por técnico
            const statsPorTecnico = {};
            
            tecnicos.forEach(tecnico => {
                const solicitudesTecnico = solicitudesMes.filter(s => 
                    s.tecnicoAsignado === tecnico.nombre
                );
                
                const completadas = solicitudesTecnico.filter(s => 
                    s.estado === 'COMPLETADA' || s.estado === 'Completada'
                );
                
                // Calcular tiempo promedio
                let tiempoTotalMs = 0;
                let solicitudesConTiempo = 0;
                
                completadas.forEach(solicitud => {
                    const tiempoRespuesta = this.calculateResponseTime(solicitud);
                    if (tiempoRespuesta) {
                        tiempoTotalMs += tiempoRespuesta.totalMs;
                        solicitudesConTiempo++;
                    }
                });
                
                const tiempoPromedioMs = solicitudesConTiempo > 0 ? tiempoTotalMs / solicitudesConTiempo : 0;
                const horasPromedio = Math.floor(tiempoPromedioMs / (1000 * 60 * 60));
                const minutosPromedio = Math.floor((tiempoPromedioMs % (1000 * 60 * 60)) / (1000 * 60));
                
                statsPorTecnico[tecnico.nombre] = {
                    area: tecnico.area,
                    totalAsignaciones: solicitudesTecnico.length,
                    completadas: completadas.length,
                    tiempoPromedio: solicitudesConTiempo > 0 ? `${horasPromedio}h ${minutosPromedio}m` : 'N/A',
                    tasaCompletado: solicitudesTecnico.length > 0 ? 
                        ((completadas.length / solicitudesTecnico.length) * 100).toFixed(1) : 0
                };
            });
            
            // Ordenar por total de asignaciones
            const ranking = Object.entries(statsPorTecnico)
                .filter(([_, stats]) => stats.totalAsignaciones > 0)
                .sort((a, b) => b[1].totalAsignaciones - a[1].totalAsignaciones);
            
            return {
                mes: mes,
                año: año,
                totalSolicitudesMes: solicitudesMes.length,
                tecnicosActivos: ranking.length,
                statsPorTecnico: statsPorTecnico,
                ranking: ranking
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas mensuales:', error);
            throw error;
        }
    }

    // 📊 MÉTODO MEJORADO: Estadísticas avanzadas con historial de técnicos
    async getAdvancedStatistics() {
        try {
            const [solicitudes, tecnicos, usuarios] = await Promise.all([
                this.getSolicitudes(),
                this.getTecnicos(),
                this.getUsuarios()
            ]);
            
            // Estadísticas básicas existentes
            const totalSolicitudes = solicitudes.length;
            const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'Pendiente').length;
            const asignadas = solicitudes.filter(s => s.estado === 'ASIGNADA' || s.estado === 'Asignada').length;
            const enProceso = solicitudes.filter(s => s.estado === 'EN_PROCESO' || s.estado === 'En Proceso').length;
            const completadas = solicitudes.filter(s => s.estado === 'COMPLETADA' || s.estado === 'Completada').length;
            const canceladas = solicitudes.filter(s => s.estado === 'CANCELADA' || s.estado === 'Cancelada').length;
            
            // 1. PORCENTAJE DE GESTIÓN DE SOLICITUDES COMPLETADAS
            const porcentajeCompletadas = totalSolicitudes > 0 
                ? ((completadas / totalSolicitudes) * 100).toFixed(2) 
                : 0;
            
            // 2. PORCENTAJE DE MANTENIMIENTOS CORRECTIVOS
            const mantenimientosCorrectivos = solicitudes.filter(s => 
                s.tipoServicio === 'MANTENIMIENTO_CORRECTIVO' || 
                s.tipoServicio === 'Mantenimiento Correctivo'
            ).length;
            const porcentajeCorrectivos = totalSolicitudes > 0 
                ? ((mantenimientosCorrectivos / totalSolicitudes) * 100).toFixed(2) 
                : 0;
            
            // 3. PORCENTAJE DE ERRORES DE USUARIO
            const erroresUsuario = solicitudes.filter(s => 
                s.tipoServicio === 'ERROR_USUARIO' || 
                s.tipoServicio === 'Error de Usuario' ||
                (s.observaciones && s.observaciones.toLowerCase().includes('error de usuario')) ||
                (s.descripcion && s.descripcion.toLowerCase().includes('error de usuario'))
            ).length;
            const porcentajeErroresUsuario = totalSolicitudes > 0 
                ? ((erroresUsuario / totalSolicitudes) * 100).toFixed(2) 
                : 0;
            
            // 4. TIEMPO DE RESPUESTA DE CADA SOLICITUD
            const tiemposRespuesta = [];
            let totalTiempoRespuestaMs = 0;
            let solicitudesConTiempo = 0;
            
            solicitudes.forEach(solicitud => {
                const tiempoRespuesta = this.calculateResponseTime(solicitud);
                if (tiempoRespuesta) {
                    tiemposRespuesta.push({
                        numero: solicitud.numero,
                        estado: solicitud.estado,
                        tiempoFormato: tiempoRespuesta.formato,
                        horas: tiempoRespuesta.horas,
                        minutos: tiempoRespuesta.minutos,
                        diasDecimales: tiempoRespuesta.diasDecimales
                    });
                    
                    // Solo contar solicitudes completadas o canceladas para el promedio
                    if (solicitud.estado === 'COMPLETADA' || solicitud.estado === 'Completada' || 
                        solicitud.estado === 'CANCELADA' || solicitud.estado === 'Cancelada') {
                        totalTiempoRespuestaMs += tiempoRespuesta.totalMs;
                        solicitudesConTiempo++;
                    }
                }
            });
            
            // Calcular promedio de tiempo de respuesta
            const promedioTiempoRespuestaMs = solicitudesConTiempo > 0 
                ? totalTiempoRespuestaMs / solicitudesConTiempo 
                : 0;
            const promedioHoras = Math.floor(promedioTiempoRespuestaMs / (1000 * 60 * 60));
            const promedioMinutos = Math.floor((promedioTiempoRespuestaMs % (1000 * 60 * 60)) / (1000 * 60));
            
            // Ordenar tiempos de respuesta por duración (mayor a menor)
            tiemposRespuesta.sort((a, b) => b.horas - a.horas);
            
            // Estadísticas por tipo de servicio
            const estadisticasPorTipo = {};
            this.validSolicitudValues.tipoServicio.forEach(tipo => {
                const solicitudesTipo = solicitudes.filter(s => s.tipoServicio === tipo);
                estadisticasPorTipo[tipo] = {
                    total: solicitudesTipo.length,
                    completadas: solicitudesTipo.filter(s => s.estado === 'COMPLETADA' || s.estado === 'Completada').length,
                    porcentaje: totalSolicitudes > 0 ? ((solicitudesTipo.length / totalSolicitudes) * 100).toFixed(2) : 0
                };
            });
            
            // NUEVO: Estadísticas por técnico
            const estadisticasPorTecnico = {};
            tecnicos.forEach(tecnico => {
                const solicitudesTecnico = solicitudes.filter(s => s.tecnicoAsignado === tecnico.nombre);
                const completadasTecnico = solicitudesTecnico.filter(s => 
                    s.estado === 'COMPLETADA' || s.estado === 'Completada'
                );
                
                // Calcular tiempo promedio del técnico
                let tiempoTotalTecnicoMs = 0;
                let solicitudesConTiempoTecnico = 0;
                
                completadasTecnico.forEach(solicitud => {
                    const tiempoRespuesta = this.calculateResponseTime(solicitud);
                    if (tiempoRespuesta) {
                        tiempoTotalTecnicoMs += tiempoRespuesta.totalMs;
                        solicitudesConTiempoTecnico++;
                    }
                });
                
                const tiempoPromedioTecnicoMs = solicitudesConTiempoTecnico > 0 
                    ? tiempoTotalTecnicoMs / solicitudesConTiempoTecnico 
                    : 0;
                const horasTecnico = Math.floor(tiempoPromedioTecnicoMs / (1000 * 60 * 60));
                const minutosTecnico = Math.floor((tiempoPromedioTecnicoMs % (1000 * 60 * 60)) / (1000 * 60));
                
                estadisticasPorTecnico[tecnico.nombre] = {
                    area: tecnico.area,
                    totalAsignaciones: solicitudesTecnico.length,
                    completadas: completadasTecnico.length,
                    enProceso: solicitudesTecnico.filter(s => 
                        s.estado === 'EN_PROCESO' || s.estado === 'En Proceso' || 
                        s.estado === 'ASIGNADA' || s.estado === 'Asignada'
                    ).length,
                    tiempoPromedio: solicitudesConTiempoTecnico > 0 ? `${horasTecnico}h ${minutosTecnico}m` : 'N/A',
                    tasaCompletado: solicitudesTecnico.length > 0 
                        ? ((completadasTecnico.length / solicitudesTecnico.length) * 100).toFixed(1) 
                        : 0,
                    estado: tecnico.estado
                };
            });
            
            return {
                solicitudes: {
                    total: totalSolicitudes,
                    pendientes: pendientes,
                    asignadas: asignadas,
                    enProceso: enProceso,
                    completadas: completadas,
                    canceladas: canceladas,
                    porArea: {
                        INGENIERIA_BIOMEDICA: solicitudes.filter(s => {
                            const area = s.servicioIngenieria || '';
                            return area === 'INGENIERIA_BIOMEDICA' || 
                                   area === 'Ingeniería Biomédica' ||
                                   area.toLowerCase().includes('biomed') || 
                                   area.toLowerCase().includes('bioméd');
                        }).length,
                        MECANICA: solicitudes.filter(s => {
                            const area = s.servicioIngenieria || '';
                            return area === 'MECANICA' || 
                                   area === 'Mecánica' ||
                                   area.toLowerCase().includes('mec');
                        }).length,
                        INFRAESTRUCTURA: solicitudes.filter(s => {
                            const area = s.servicioIngenieria || '';
                            return area === 'INFRAESTRUCTURA' || 
                                   area === 'Infraestructura' ||
                                   area.toLowerCase().includes('infra');
                        }).length
                    },
                    porPrioridad: {
                        CRITICA: solicitudes.filter(s => s.prioridad === 'CRITICA' || s.prioridad === 'Crítica').length,
                        ALTA: solicitudes.filter(s => s.prioridad === 'ALTA' || s.prioridad === 'Alta').length,
                        MEDIA: solicitudes.filter(s => s.prioridad === 'MEDIA' || s.prioridad === 'Media').length,
                        BAJA: solicitudes.filter(s => s.prioridad === 'BAJA' || s.prioridad === 'Baja').length
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
                    activos: usuarios.filter(u => u.estado === 'ACTIVO' || u.estado === 'Activo').length
                },
                tiemposRespuesta: {
                    promedioRespuesta: `${promedioHoras}h ${promedioMinutos}m`,
                    solicitudesVencidas: solicitudes.filter(s => {
                        if (!s.tiempoRespuestaMaximo || 
                            s.estado === 'COMPLETADA' || s.estado === 'Completada' ||
                            s.estado === 'CANCELADA' || s.estado === 'Cancelada') return false;
                        return new Date() > new Date(s.tiempoRespuestaMaximo);
                    }).length,
                    detalleTiempos: tiemposRespuesta.slice(0, 10), // Top 10 tiempos más largos
                    totalConTiempoRegistrado: solicitudesConTiempo
                },
                // NUEVOS INDICADORES
                indicadoresGestion: {
                    porcentajeCompletadas: parseFloat(porcentajeCompletadas),
                    porcentajeMantenimientosCorrectivos: parseFloat(porcentajeCorrectivos),
                    porcentajeErroresUsuario: parseFloat(porcentajeErroresUsuario),
                    efectividad: {
                        solicitudesGestionadas: completadas + canceladas,
                        porcentajeGestion: totalSolicitudes > 0 
                            ? (((completadas + canceladas) / totalSolicitudes) * 100).toFixed(2)
                            : 0
                    }
                },
                estadisticasPorTipo: estadisticasPorTipo,
                // NUEVO: Estadísticas por técnico
                estadisticasPorTecnico: estadisticasPorTecnico,
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

    // 🔧 NUEVO: Método de diagnóstico para valores de solicitudes
    async diagnosticSolicitudValues() {
        console.log('🔍 DIAGNÓSTICO COMPLETO DE VALORES DE SOLICITUDES');
        console.log('==============================================');
        
        try {
            // 1. Mostrar valores actuales
            console.log('\n📋 VALORES ACTUALES:');
            console.log('Servicios de Ingeniería:', this.validSolicitudValues.servicioIngenieria);
            console.log('Tipos de Servicio:', this.validSolicitudValues.tipoServicio);
            console.log('Prioridades:', this.validSolicitudValues.prioridad);
            console.log('Estados:', this.validSolicitudValues.estado);
            
            // 2. Intentar detectar valores
            console.log('\n🔍 DETECTANDO VALORES EN AIRTABLE...');
            await this.detectValidSolicitudValues();
            
            // 3. Probar creación con cada área
            console.log('\n🧪 PROBANDO CREACIÓN CON CADA ÁREA:');
            const areas = ['INGENIERIA_BIOMEDICA', 'MECANICA', 'INFRAESTRUCTURA'];
            const resultados = {};
            
            for (const area of areas) {
                try {
                    // Aplicar mapeo
                    const areaMapeada = this.mapFieldValue('servicioIngenieria', area);
                    console.log(`\nProbando ${area} → ${areaMapeada}`);
                    
                    const testData = {
                        fields: {
                            numero: 'TEST_' + Date.now(),
                            descripcion: 'Test de área',
                            servicioIngenieria: areaMapeada,
                            fechaCreacion: new Date().toISOString(),
                            estado: 'Pendiente'
                        }
                    };
                    
                    const result = await this.makeRequest(this.tables.solicitudes, 'POST', testData);
                    
                    if (result && result.id) {
                        console.log(`✅ ${area} → ${areaMapeada} - VÁLIDO`);
                        resultados[area] = { 
                            valido: true, 
                            valorMapeado: areaMapeada,
                            valorGuardado: result.fields?.servicioIngenieria 
                        };
                        
                        // Eliminar registro de prueba
                        try {
                            await this.makeRequest(`${this.tables.solicitudes}/${result.id}`, 'DELETE');
                        } catch (deleteError) {
                            console.warn('⚠️ No se pudo eliminar registro de prueba');
                        }
                    }
                    
                } catch (error) {
                    console.log(`❌ ${area} - INVÁLIDO: ${error.message}`);
                    resultados[area] = { valido: false, error: error.message };
                }
            }
            
            return {
                valoresActuales: this.validSolicitudValues,
                mapeoConfigurado: this.fieldMappings.servicioIngenieria,
                resultadosPruebas: resultados,
                recomendaciones: [
                    'Verificar que los valores en Airtable coincidan con el mapeo',
                    'Usar los valores mapeados al crear solicitudes',
                    'Si persiste el error, verificar permisos del campo en Airtable'
                ]
            };
            
        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            return { error: error.message };
        }
    }

    // 🔧 NUEVO: Método de diagnóstico para cambios de estado
    async diagnosticEstadoChange(solicitudId) {
        console.log('🔍 DIAGNÓSTICO DE CAMBIO DE ESTADO');
        console.log('===================================');
        
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                return { error: 'Solicitud no encontrada' };
            }
            
            console.log('\n📋 SOLICITUD ACTUAL:');
            console.log('ID:', solicitud.id);
            console.log('Número:', solicitud.numero);
            console.log('Estado actual:', solicitud.estado);
            console.log('Técnico asignado:', solicitud.tecnicoAsignado);
            
            console.log('\n🧪 PROBANDO CAMBIOS DE ESTADO:');
            const estadosPrueba = ['EN_PROCESO', 'COMPLETADA'];
            const resultados = {};
            
            for (const nuevoEstado of estadosPrueba) {
                console.log(`\nProbando cambio a: ${nuevoEstado}`);
                
                try {
                    // Intentar con el valor mapeado
                    const estadoMapeado = this.mapFieldValue('estado', nuevoEstado);
                    console.log(`Estado mapeado: ${estadoMapeado}`);
                    
                    // Simular la actualización sin ejecutarla
                    const updateData = {
                        estado: estadoMapeado
                    };
                    
                    if (nuevoEstado === 'EN_PROCESO') {
                        updateData.fechaInicioTrabajo = new Date().toISOString();
                    } else if (nuevoEstado === 'COMPLETADA') {
                        updateData.fechaCompletado = new Date().toISOString();
                    }
                    
                    console.log('Datos que se enviarían:', updateData);
                    
                    // Verificar si el valor está en la lista de valores válidos
                    if (this.validSolicitudValues.estado.includes(estadoMapeado)) {
                        resultados[nuevoEstado] = {
                            valido: true,
                            valorMapeado: estadoMapeado,
                            mensaje: 'El valor está en la lista de valores válidos'
                        };
                    } else {
                        resultados[nuevoEstado] = {
                            valido: false,
                            valorMapeado: estadoMapeado,
                            mensaje: 'El valor NO está en la lista de valores válidos',
                            valoresValidos: this.validSolicitudValues.estado
                        };
                    }
                    
                } catch (error) {
                    resultados[nuevoEstado] = {
                        error: error.message
                    };
                }
            }
            
            return {
                solicitud: {
                    id: solicitud.id,
                    numero: solicitud.numero,
                    estadoActual: solicitud.estado,
                    tecnicoAsignado: solicitud.tecnicoAsignado
                },
                valoresValidosDetectados: this.validSolicitudValues.estado,
                resultadosPruebas: resultados,
                recomendaciones: [
                    'Verificar que los valores de estado en Airtable coincidan con el mapeo',
                    'Revisar la configuración del campo "estado" en Airtable',
                    'Si usa valores personalizados, agregarlos al mapeo en AIRTABLE_VALUE_MAPPING'
                ]
            };
            
        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            return { error: error.message };
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
            version: '10.0-historial-asignaciones',
            validAccessRequestValues: this.validAccessRequestValues,
            validUserValues: this.validUserValues,
            validSolicitudValues: this.validSolicitudValues,
            features: [
                'NUEVO: Historial de asignaciones mantenido al completar',
                'NUEVO: Técnico liberado pero historial preservado',
                'NUEVO: Método getTechnicianHistory para estadísticas',
                'NUEVO: Método getMonthlyTechnicianStats para análisis mensual',
                'NUEVO: Estadísticas por técnico en getAdvancedStatistics',
                'FIX: Cambio de estado mejorado con múltiples intentos',
                'FIX: Liberación de técnico sin borrar historial',
                'NUEVO: Diagnóstico específico para cambios de estado',
                'NUEVO: Indicadores avanzados de gestión',
                'Sistema completo con historial de asignaciones'
            ]
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global con historial de asignaciones...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión con historial)');
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
                ? '✅ Conectado (historial asignaciones)' 
                : 'Modo Local (historial asignaciones)';
            
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
        
        console.log('🔍 DIAGNÓSTICO HISTORIAL ASIGNACIONES');
        console.log('====================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🔐 Valores de solicitudes de acceso:', status.validAccessRequestValues);
        console.log('👤 Valores de usuarios:', status.validUserValues);
        console.log('📋 Valores de solicitudes:', status.validSolicitudValues);
        console.log('📊 Nuevas características:', status.features.filter(f => f.startsWith('NUEVO') || f.startsWith('FIX')));
        
        return status;
    };
    
    // Función para debug específico de solicitudes de acceso
    window.debugAccessRequests = async function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        return await window.airtableAPI.detectValidAccessRequestValues();
    };
    
    // Función para diagnóstico completo de solicitudes
    window.debugSolicitudValues = async function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        return await window.airtableAPI.diagnosticSolicitudValues();
    };
    
    // NUEVA: Función para diagnóstico de cambio de estado
    window.debugEstadoChange = async function(solicitudId) {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        if (!solicitudId) {
            console.error('❌ Debe proporcionar un ID de solicitud');
            return { error: 'ID de solicitud requerido' };
        }
        
        return await window.airtableAPI.diagnosticEstadoChange(solicitudId);
    };
    
    // Función para ver estadísticas avanzadas
    window.debugAdvancedStats = async function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        console.log('📊 Obteniendo estadísticas avanzadas con historial de técnicos...');
        const stats = await window.airtableAPI.getAdvancedStatistics();
        
        console.log('📊 ESTADÍSTICAS AVANZADAS');
        console.log('========================');
        console.log('📈 Indicadores de Gestión:');
        console.log(`  • Completadas: ${stats.indicadoresGestion.porcentajeCompletadas}%`);
        console.log(`  • Mantenimientos Correctivos: ${stats.indicadoresGestion.porcentajeMantenimientosCorrectivos}%`);
        console.log(`  • Errores de Usuario: ${stats.indicadoresGestion.porcentajeErroresUsuario}%`);
        console.log(`  • Efectividad Total: ${stats.indicadoresGestion.efectividad.porcentajeGestion}%`);
        console.log('\n⏱️ Tiempos de Respuesta:');
        console.log(`  • Promedio: ${stats.tiemposRespuesta.promedioRespuesta}`);
        console.log(`  • Vencidas: ${stats.tiemposRespuesta.solicitudesVencidas}`);
        console.log('\n📋 Por Tipo de Servicio:');
        Object.entries(stats.estadisticasPorTipo).forEach(([tipo, data]) => {
            console.log(`  • ${tipo}: ${data.total} (${data.porcentaje}%)`);
        });
        console.log('\n👨‍🔧 Por Técnico:');
        Object.entries(stats.estadisticasPorTecnico)
            .filter(([_, data]) => data.totalAsignaciones > 0)
            .sort((a, b) => b[1].totalAsignaciones - a[1].totalAsignaciones)
            .forEach(([tecnico, data]) => {
                console.log(`  • ${tecnico}: ${data.totalAsignaciones} asignaciones (${data.completadas} completadas, ${data.tiempoPromedio} promedio)`);
            });
        
        return stats;
    };
    
    // NUEVA: Función para ver historial de un técnico
    window.debugTechnicianHistory = async function(nombreTecnico) {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        if (!nombreTecnico) {
            console.error('❌ Debe proporcionar el nombre del técnico');
            return { error: 'Nombre del técnico requerido' };
        }
        
        const historial = await window.airtableAPI.getTechnicianHistory(nombreTecnico);
        
        console.log(`📊 HISTORIAL DE ${nombreTecnico}`);
        console.log('===============================');
        console.log(`Total asignaciones: ${historial.totalAsignaciones}`);
        console.log(`Completadas: ${historial.completadas}`);
        console.log(`En proceso: ${historial.enProceso}`);
        console.log(`Errores de usuario resueltos: ${historial.erroresUsuarioResueltos}`);
        console.log(`Tiempo promedio: ${historial.tiempoPromedioRespuesta}`);
        console.log(`Tasa de completado: ${historial.tasaCompletado}%`);
        
        return historial;
    };
    
    // NUEVA: Función para estadísticas mensuales
    window.debugMonthlyStats = async function(mes, año) {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        mes = mes || new Date().getMonth() + 1;
        año = año || new Date().getFullYear();
        
        const stats = await window.airtableAPI.getMonthlyTechnicianStats(mes, año);
        
        console.log(`📊 ESTADÍSTICAS MENSUALES ${mes}/${año}`);
        console.log('=====================================');
        console.log(`Total solicitudes del mes: ${stats.totalSolicitudesMes}`);
        console.log(`Técnicos activos: ${stats.tecnicosActivos}`);
        console.log('\nRANKING:');
        stats.ranking.forEach(([tecnico, data], index) => {
            console.log(`${index + 1}. ${tecnico}: ${data.totalAsignaciones} asignaciones (${data.completadas} completadas)`);
        });
        
        return stats;
    };
    
    console.log('✅ Funciones de debug creadas exitosamente');
} catch (error) {
    console.error('❌ Error creando funciones de debug:', error);
}

console.log('✅ airtable-config.js (HISTORIAL ASIGNACIONES) cargado');
console.log('🔄 NUEVO: Historial de técnicos mantenido al completar');
console.log('📊 NUEVO: Estadísticas por técnico disponibles');
console.log('👨‍🔧 Para ver historial de técnico: debugTechnicianHistory("Nombre del Técnico")');
console.log('📅 Para estadísticas mensuales: debugMonthlyStats(mes, año)');
console.log('📊 Para estadísticas avanzadas: debugAdvancedStats()');
console.log('🧪 Para diagnóstico cambio estado: debugEstadoChange("ID_SOLICITUD")');
console.log('🔍 Para diagnóstico completo: debugSolicitudValues()');
console.log('🛠️ Para estado general: debugAirtableConnection()');

// Auto-verificación después de la carga
setTimeout(async () => {
    if (window.airtableAPI) {
        console.log('🔄 Iniciando detección automática de valores válidos...');
        
        try {
            // Siempre detectar valores de acceso y usuarios
            await window.airtableAPI.detectValidAccessRequestValues();
            await window.airtableAPI.detectValidUserValues();
            
            // Intentar detectar valores de solicitudes, pero no fallar si no hay registros
            try {
                await window.airtableAPI.detectValidSolicitudValues();
            } catch (error) {
                console.log('📋 Usando valores por defecto para solicitudes');
            }
            
            const solicitudValues = window.airtableAPI.validSolicitudValues;
            
            console.log('✅ Detección completada');
            console.log('📋 Valores de solicitudes disponibles:', {
                áreas: solicitudValues.servicioIngenieria,
                tipos: solicitudValues.tipoServicio.length,
                prioridades: solicitudValues.prioridad.length,
                estados: solicitudValues.estado.length
            });
            console.log('📊 Sistema listo con historial de asignaciones');
            
        } catch (error) {
            console.error('❌ Error en detección automática:', error);
        }
    }
}, 3000);