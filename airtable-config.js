// Depuración: window.HSLV_DEBUG = true en la consola para ver el detalle
window.HSLV_DEBUG = window.HSLV_DEBUG || false;

// 🛡️ Configuración COMPLETA de Airtable API - Con cambio de tipo de servicio al completar
// airtable-config.js - Versión con actualización de tipo de servicio

console.log('🚀 Cargando airtable-config.js (VERSIÓN CON CAMBIO DE TIPO DE SERVICIO)...');

// 🗺️ MAPEO DE VALORES CORREGIDO PARA COMPATIBILIDAD CON AIRTABLE
const AIRTABLE_VALUE_MAPPING = {
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
        'Infraestructura': 'INFRAESTRUCTURA',
        'SISTEMAS': 'SISTEMAS',
        'Sistemas': 'SISTEMAS',
        'Ingeniería de Sistemas': 'SISTEMAS',
        'Ingenieria de Sistemas': 'SISTEMAS'
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
        'DESINSTALACION': 'DESINSTALACION',
        'Desinstalación': 'DESINSTALACION',
        'CALIBRACION': 'CALIBRACION',
        'Calibración': 'CALIBRACION',
        'INSPECCION': 'INSPECCION',
        'Inspección': 'INSPECCION',
		'CAPACITACION': 'CAPACITACION',
        'Capacitación': 'CAPACITACION',
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
        'Infraestructura': 'INFRAESTRUCTURA',
        'SISTEMAS': 'SISTEMAS',
        'Sistemas': 'SISTEMAS',
        'Ingeniería de Sistemas': 'SISTEMAS',
        'Ingenieria de Sistemas': 'SISTEMAS'
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
        // 'codigoAcceso' eliminado: el navegador ya no envía ni recibe códigos
        'estado',
        'fechaCreacion',
        'solicitudOrigenId'
    ]
};

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI con cambio de tipo de servicio...');
        
        this.hostname = window.location.hostname;
        this.isLocalDevelopment = this.hostname === 'localhost' || 
                                 this.hostname === '127.0.0.1' ||
                                 this.hostname.startsWith('localhost:') ||
                                 this.hostname.startsWith('127.0.0.1:');
        
        console.log('🔍 Hostname:', this.hostname);
        console.log('🏠 Es desarrollo local:', this.isLocalDevelopment);
        
        // Siempre por el proxy, también en local: usar `netlify dev`, que levanta
        // las funciones con las variables de entorno. El navegador nunca habla
        // directo con Airtable ni conoce el BASE_ID.
        this.useProxy = true;
        this.baseUrl = '/.netlify/functions/airtable-proxy';
        this.directApiKey = null;
        
        // 📋 Tablas confirmadas
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };

        // 🗺️ Mapeo de valores actualizado
        this.fieldMappings = AIRTABLE_VALUE_MAPPING;

        // 📢 CONTADORES PARA NUMERACIÓN ESPECÍFICA
        this.areaCounters = {
            'INGENIERIA_BIOMEDICA': 0,
            'MECANICA': 0,
            'INFRAESTRUCTURA': 0,
            'SISTEMAS': 0
        };

        // 🎯 PREFIJOS POR ÁREA
        this.areaPrefixes = {
            'INGENIERIA_BIOMEDICA': 'SOLBIO',
            'MECANICA': 'SOLMEC',
            'INFRAESTRUCTURA': 'SOLINFRA',
            'SISTEMAS': 'SOLSIS'
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
        
        // Inicializar valores válidos de solicitud
        this.validSolicitudValues = {
            servicioIngenieria: ['INGENIERIA_BIOMEDICA', 'MECANICA', 'INFRAESTRUCTURA', 'SISTEMAS'],
            tipoServicio: ['MANTENIMIENTO_PREVENTIVO', 'MANTENIMIENTO_CORRECTIVO', 'REPARACION', 'INSTALACION', 'DESINSTALACION', 'CALIBRACION', 'INSPECCION', 'ACTUALIZACION', 'EMERGENCIA', 'CAPACITACION','ERROR_USUARIO'],
            prioridad: ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'],
            estado: ['PENDIENTE', 'ASIGNADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'],
            availableFields: []
        };
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🗺️ Mapeo de valores configurado');
        console.log('📋 Valores iniciales de solicitud:', this.validSolicitudValues);
        console.log('✨ NUEVO: Cambio de tipo de servicio al completar');
        
        this.initializeConnectionAsync();
    }

    // 🔧 FUNCIÓN CRÍTICA: Limpiar valores de comillas extras y espacios
    cleanFieldValue(value) {
        if (typeof value !== 'string') return value;
        
        let cleanValue = value.trim();
        cleanValue = cleanValue.replace(/"+/g, '"');
        
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.slice(1, -1);
        }
        
        cleanValue = cleanValue.replace(/\\"/g, '');
        
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.slice(1, -1);
        }
        
        cleanValue = cleanValue.trim();
        
        console.log(`🧹 Limpieza de valor: "${value}" → "${cleanValue}"`);
        
        return cleanValue;
    }

    async initializeConnectionAsync() {
        setTimeout(() => {
            // En producción el proxy exige sesión: antes del login no se consulta nada.
            // Antes se probaba igual, recibía 401 y el portal quedaba en "Modo local"
            // para siempre, porque nunca se volvía a probar después de iniciar sesión.
            if (this.useProxy && !this.getSessionToken()) {
                this.connectionStatus = 'sin-sesion';
                this.notifyConnectionStatus(false);
                console.log('🔒 Esperando inicio de sesión para conectar con Airtable');
                return;
            }
            this.reconectar();
        }, 500);
    }

    // 🔄 Prueba la conexión y carga valores válidos. Se ejecuta al cargar (si hay
    // token) y automáticamente cada vez que se guarda un token nuevo.
    async reconectar() {
        if (this._reconectando) return this._reconectando;
        this._reconectando = (async () => {
            try {
                const isConnected = await this.testConnection();
                this.connectionStatus = isConnected ? 'connected' : 'disconnected';
                this.notifyConnectionStatus(isConnected);
                if (isConnected) {
                    console.log('✅ Conectado exitosamente a Airtable');
                    await this.detectValidAccessRequestValues();
                    await this.detectValidUserValues();
                    try {
                        await this.detectValidSolicitudValues();
                    } catch (error) {
                        console.warn('⚠️ Usando valores por defecto conocidos para solicitudes');
                    }
                } else {
                    console.warn('⚠️ Sin conexión con Airtable');
                }
                return isConnected;
            } catch (error) {
                console.error('❌ Error en reconexión:', error);
                this.connectionStatus = 'disconnected';
                this.notifyConnectionStatus(false);
                return false;
            } finally {
                this._reconectando = null;
            }
        })();
        return this._reconectando;
    }

    // 🔍 FUNCIÓN: Detectar valores válidos para solicitudes de acceso
    async detectValidAccessRequestValues() {
        // SolicitudesAcceso solo admite GET para administradores en el proxy
        if (this.useProxy) {
            this.validAccessRequestValues.estado = this.validAccessRequestValues.estado || 'Pendiente';
            return;
        }
        console.log('🔍 Detectando valores y campos válidos para SolicitudesAcceso...');
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudesAcceso}?maxRecords=20`);
            
            if (result.records && result.records.length > 0) {
                const estadoValues = new Set();
                const servicioValues = new Set();
                const cargoValues = new Set();
                const availableFields = new Set();
                
                result.records.forEach(record => {
                    if (record.fields) {
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
                
                if (!pendienteValue) {
                    console.warn('⚠️ No se encontró valor PENDIENTE, usando valor por defecto');
                    this.validAccessRequestValues.estado = 'Pendiente';
                }
                
            } else {
                console.warn('⚠️ No hay registros en SolicitudesAcceso para detectar valores');
                this.validAccessRequestValues.estado = 'Pendiente';
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores válidos:', error);
            this.validAccessRequestValues.estado = 'Pendiente';
        }
    }

    // 🔍 Detectar valores válidos para tabla de usuarios
    async detectValidUserValues() {
        // La tabla Usuarios está bloqueada en el proxy a propósito (user-management.js)
        if (this.useProxy) {
            this.validUserValues.estado = this.validUserValues.estado || 'Activo';
            return;
        }
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
                
                let activoValue = null;
                estadoValues.forEach(value => {
                    const cleanValue = this.cleanFieldValue(value);
                    if (cleanValue.toUpperCase() === 'ACTIVO') {
                        activoValue = value;
                        console.log(`✅ Valor ACTIVO detectado para usuarios: "${value}"`);
                    }
                });
                
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
                this.validUserValues.estado = 'Activo';
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores válidos de usuarios:', error);
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
                
                if (servicioValues.size > 0) {
                    this.validSolicitudValues.servicioIngenieria = Array.from(servicioValues);
                }
                if (tipoServicioValues.size > 0) {
                    const tiposDetectados = Array.from(tipoServicioValues);
                    // Asegurar que todos los tipos estén incluidos
                    const tiposCompletos = new Set([...tiposDetectados, 'ERROR_USUARIO', 'DESINSTALACION', 'CALIBRACION', 'ACTUALIZACION', 'EMERGENCIA', 'INSPECCION']);
                    this.validSolicitudValues.tipoServicio = Array.from(tiposCompletos);
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
    if (window.HSLV_DEBUG) console.log('📡 Request:', method, endpoint);
    
    try {
        let url, options;
        
        if (this.useProxy) {
            // IMPORTANTE: Para el proxy, necesitamos enviar el endpoint completo
            // Verificar si el endpoint ya incluye parámetros
            if (endpoint.includes('?')) {
                // Si tiene parámetros, usarlos tal cual
                url = `${this.baseUrl}/${endpoint}`;
            } else {
                url = `${this.baseUrl}/${endpoint}`;
            }
            
            // Para debugging
            if (window.HSLV_DEBUG) console.log('🔗 URL completa al proxy:', url);
            
            const sessionToken = this.getSessionToken();

            options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    // Agregar el endpoint como header personalizado para el proxy
                    'X-Airtable-Endpoint': endpoint,
                    // El proxy exige sesión válida para todo lo que no sea el formulario público
                    ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
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

            if (response.status === 401) {
                if (this.useProxy && options.headers && options.headers.Authorization) {
                    this.setSessionToken(null);
                    this.connectionStatus = 'sin-sesion';
                    this.notifyConnectionStatus(false);
                    window.dispatchEvent(new CustomEvent('hslvSesionExpirada'));
                    throw new Error('Sesión expirada. Vuelva a iniciar sesión.');
                }
                throw new Error('Se requiere iniciar sesión.');
            }

            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Verificar si el resultado tiene offset para debugging
        if (result.offset) {
            console.log('📍 Offset recibido en respuesta:', result.offset);
        }
        
        console.log('✅ Request exitoso, registros:', result.records?.length || 0);
        
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

    // 🔍 MÉTODO: Crear solicitud de acceso
    async createSolicitudAcceso(solicitudData) {
        console.log('🔍 Creando solicitud de acceso con detección automática de valores...');
        console.log('🔍 Datos recibidos:', solicitudData);
        
        try {
            const cleanData = {};
            Object.keys(solicitudData).forEach(key => {
                const value = solicitudData[key];
                if (typeof value === 'string') {
                    cleanData[key] = this.cleanFieldValue(value);
                } else {
                    cleanData[key] = value;
                }
            });
            
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
            
            console.log('🔍 Datos finales a enviar:', JSON.stringify(data, null, 2));
            
            try {
                const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
                console.log('✅ Solicitud de acceso creada exitosamente:', result.id);
                return result;
                
            } catch (error) {
                if (error.message.includes('422') && error.message.includes('estado')) {
                    console.warn('⚠️ Error con campo estado, reintentando sin estado...');
                    
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
            
            console.log('🔍 Datos mínimos:', data);
            const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
            
            console.log('✅ Solicitud creada con campos mínimos:', result.id);
            
            const fieldsToAdd = [
                { telefono: solicitudData.telefono },
                { servicioHospitalario: solicitudData.servicioHospitalario },
                { cargo: solicitudData.cargo },
                { justificacion: solicitudData.justificacion }
            ];
            
            // Un solo PATCH con todos los campos: antes se hacía una petición por campo
            // de forma secuencial (4 llamadas a Airtable en vez de 1).
            const camposAdicionales = {};
            fieldsToAdd.forEach(fieldObj => {
                const [fieldName, fieldValue] = Object.entries(fieldObj)[0];
                if (fieldValue) {
                    camposAdicionales[fieldName] = this.cleanFieldValue(fieldValue);
                }
            });

            if (Object.keys(camposAdicionales).length > 0) {
                try {
                    await this.makeRequest(`${this.tables.solicitudesAcceso}/${result.id}`, 'PATCH', {
                        fields: camposAdicionales
                    });
                    console.log(`✅ Campos agregados: ${Object.keys(camposAdicionales).join(', ')}`);
                } catch (error) {
                    console.warn('⚠️ No se pudieron agregar los campos adicionales:', error.message);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error incluso con campos mínimos:', error);
            throw new Error('No se pudo crear la solicitud. Por favor contacte al administrador.');
        }
    }

    // 👤 Los usuarios se piden a la función de gestión (requiere sesión de administrador).
    // La tabla Usuarios ya NO es accesible por el proxy desde el navegador.
    async getUsuarios() {
        console.log('👤 Obteniendo usuarios (sin códigos de acceso)...');

        try {
            const token = this.getSessionToken();
            const response = await fetch('/.netlify/functions/user-management?operation=list', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn('⚠️ Sin permisos para listar usuarios');
                    return [];
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Total de usuarios obtenidos: ${data.users?.length || 0}`);
            return data.users || [];

        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return [];
        }
    }

    async getSolicitudesAcceso() {
        console.log('🔐 Obteniendo TODAS las solicitudes de acceso con paginación...');
        
        try {
            let allRecords = [];
            let offset = null;
            let pageCount = 0;
            
            do {
                let endpoint = this.tables.solicitudesAcceso;
                if (offset) {
                    endpoint += `?offset=${offset}`;
                }
                
                const result = await this.makeRequest(endpoint);
                
                if (result.records && result.records.length > 0) {
                    const pageRecords = result.records.map(record => ({
                        id: record.id,
                        ...record.fields
                    }));
                    allRecords = allRecords.concat(pageRecords);
                }
                
                offset = result.offset || null;
                pageCount++;
                
                if (pageCount > 20) break;
                
            } while (offset);
            
            console.log(`✅ Total de solicitudes de acceso obtenidas: ${allRecords.length}`);
            return allRecords;
            
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes de acceso:', error);
            return [];
        }
    }

    // ✅ La aprobación y la generación del código ocurren en el servidor.
    // Antes el código se generaba en el navegador con Math.random() y se escribía
    // directamente en Airtable; ambas cosas eran inseguras.
    async approveAccessRequestAndCreateUser(requestId) {
        console.log('✅ Solicitando aprobación al servidor:', requestId);

        const token = this.getSessionToken();

        const response = await fetch(
            `/.netlify/functions/user-management?operation=approve-request&requestId=${encodeURIComponent(requestId)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({})
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(data.error || `No se pudo aprobar la solicitud (HTTP ${response.status})`);
        }

        // accessCode viene UNA sola vez, para mostrarlo al administrador
        // y que lo entregue al usuario. No queda almacenado en el navegador.
        return {
            success: true,
            user: data.user,
            accessCode: data.accessCode,
            requestId: requestId
        };
    }

async getSolicitudes(opciones = {}) {
    // ───────────────────────────────────────────────────────────────────
    // Carga progresiva y con selección de campos.
    //
    //   onPagina(registros, info)  se llama al terminar CADA página, para
    //                              que la interfaz pinte sin esperar el resto
    //   maxPaginas                 corta la carga (fase inicial rápida)
    //   desde                      offset de Airtable para continuar después
    //   completo                   true = trae todos los campos
    // ───────────────────────────────────────────────────────────────────
    const { onPagina = null, maxPaginas = Infinity, desde = null, completo = false } = opciones;

    const allRecordsMap = new Map();
    let offset = desde;
    let pageCount = 0;
    let continuar = true;

    const PAGE_SIZE = 100;                 // máximo que permite Airtable
    const INTERVALO_MINIMO_MS = 210;       // 5 peticiones/segundo permitidas

    // Solo los campos que el portal realmente usa. Se excluyen Attachments,
    // evidencias y observacionesCompletado: pesan mucho y no se muestran.
    const CAMPOS = [
        'numero', 'servicioIngenieria', 'tipoServicio', 'prioridad', 'equipo',
        'ubicacion', 'descripcion', 'observaciones', 'solicitante',
        'servicioHospitalario', 'fechaCreacion', 'estado', 'tecnicoAsignado',
        'fechaAsignacion', 'fechaInicio', 'fechaCompletado',
        'observacionesAsignacion', 'tiempoRespuestaMaximo', 'area',
        'fechaInicioTrabajo'
    ];
    const parametrosCampos = completo
        ? ''
        : '&' + CAMPOS.map(c => `fields%5B%5D=${encodeURIComponent(c)}`).join('&');

    try {
        while (continuar && pageCount < maxPaginas) {
            const inicioPeticion = Date.now();
            pageCount++;

            try {
                // Más recientes primero: la fase inicial trae lo que se ve en pantalla
                let endpoint = `${this.tables.solicitudes}?pageSize=${PAGE_SIZE}`
                    + '&sort%5B0%5D%5Bfield%5D=fechaCreacion'
                    + '&sort%5B0%5D%5Bdirection%5D=desc'
                    + parametrosCampos;

                if (offset) endpoint += `&offset=${encodeURIComponent(offset)}`;

                const result = await this.makeRequest(endpoint);

                if (!result.records || result.records.length === 0) {
                    continuar = false;
                    break;
                }

                const nuevos = [];
                result.records.forEach(record => {
                    if (!allRecordsMap.has(record.id)) {
                        const item = { id: record.id, ...record.fields };
                        allRecordsMap.set(record.id, item);
                        nuevos.push(item);
                    }
                });

                offset = result.offset || null;
                continuar = Boolean(offset);

                if (onPagina) {
                    onPagina(nuevos, {
                        pagina: pageCount,
                        acumulado: allRecordsMap.size,
                        hayMas: continuar,
                        offset: offset
                    });
                }

                // Espera solo lo que falte para respetar el límite de Airtable.
                // Antes se dormían 200 ms fijos por página aunque la petición
                // ya hubiera tardado más: con 53 páginas eran ~10 s regalados.
                if (continuar && pageCount < maxPaginas) {
                    const transcurrido = Date.now() - inicioPeticion;
                    const espera = INTERVALO_MINIMO_MS - transcurrido;
                    if (espera > 0) await new Promise(r => setTimeout(r, espera));
                }

            } catch (pageError) {
                console.error(`Error en página ${pageCount}:`, pageError.message);

                if (pageError.message && pageError.message.includes('fetch')) {
                    await new Promise(r => setTimeout(r, 1000));
                    pageCount--;      // se reintenta la misma página
                    continue;
                }
                continuar = false;
            }
        }

        const finalRecords = Array.from(allRecordsMap.values());
        console.log(`✅ ${finalRecords.length} solicitudes en ${pageCount} página(s)`);

        // Se devuelve el offset para poder continuar la carga en segundo plano
        finalRecords.offsetSiguiente = offset;
        return finalRecords;

    } catch (error) {
        console.error('❌ Error obteniendo solicitudes:', error);
        throw error;
    }
}

    // ───────────────────────────────────────────────────────────────────
    // Solo las solicitudes que pueden haber cambiado: las que no están
    // cerradas, más las creadas en los últimos días. Es lo que necesita el
    // auto-refresh — de 5.239 registros a unas pocas decenas, en 1 petición.
    // ───────────────────────────────────────────────────────────────────
    async getSolicitudesActivas(diasRecientes = 7) {
        const formula = `OR(
            NOT(OR({estado}='COMPLETADA', {estado}='CANCELADA')),
            IS_AFTER({fechaCreacion}, DATEADD(TODAY(), -${diasRecientes}, 'days'))
        )`.replace(/\s+/g, ' ');

        const endpoint = `${this.tables.solicitudes}`
            + `?pageSize=100&filterByFormula=${encodeURIComponent(formula)}`
            + '&sort%5B0%5D%5Bfield%5D=fechaCreacion&sort%5B0%5D%5Bdirection%5D=desc';

        const result = await this.makeRequest(endpoint);
        return (result.records || []).map(r => ({ id: r.id, ...r.fields }));
    }

    // Agregar este método auxiliar después del método getSolicitudes
    analizarSolicitudesPorArea(records) {
        const porArea = {};
        const porEstado = {};
        
        records.forEach(r => {
            // Por área
            const area = r.servicioIngenieria || 'SIN_AREA';
            porArea[area] = (porArea[area] || 0) + 1;
            
            // Por estado
            const estado = r.estado || 'SIN_ESTADO';
            porEstado[estado] = (porEstado[estado] || 0) + 1;
        });
        
        console.log('╔══════════════════════════════════════════╗');
        console.log('║   ANÁLISIS DETALLADO POR ÁREA           ║');
        console.log('╠══════════════════════════════════════════╣');
        
        // Análisis específico de áreas principales
        let totalBiomedica = 0;
        let totalMecanica = 0;
        let totalInfraestructura = 0;
        let totalSistemas = 0;
        let sinArea = 0;
        
        Object.entries(porArea).forEach(([area, count]) => {
            const areaLower = area.toLowerCase();
            
            if (area === 'INGENIERIA_BIOMEDICA' || 
                area === 'Ingeniería Biomédica' ||
                areaLower.includes('biomed') || 
                areaLower.includes('bioméd')) {
                totalBiomedica += count;
                console.log(`║ 🏥 ${area}: ${count}`);
            } else if (area === 'MECANICA' || 
                       area === 'Mecánica' ||
                       areaLower.includes('mecán') ||
                       areaLower.includes('mecan')) {
                totalMecanica += count;
                console.log(`║ ⚙️ ${area}: ${count}`);
            } else if (area === 'INFRAESTRUCTURA' || 
                       area === 'Infraestructura' ||
                       areaLower.includes('infra')) {
                totalInfraestructura += count;
                console.log(`║ 🏗️ ${area}: ${count}`);
            } else if (area === 'SISTEMAS' || 
                       area === 'Sistemas' ||
                       areaLower.includes('sistema')) {
                totalSistemas += count;
                console.log(`║ 💻 ${area}: ${count}`);
            } else if (area === 'SIN_AREA') {
                sinArea = count;
                console.log(`║ ❓ Sin área definida: ${count}`);
            } else {
                console.log(`║ 📋 ${area}: ${count}`);
            }
        });
        
        console.log('╠══════════════════════════════════════════╣');
        console.log('║   TOTALES POR CATEGORÍA                 ║');
        console.log('╠══════════════════════════════════════════╣');
        console.log(`║ 🏥 BIOMÉDICA TOTAL: ${totalBiomedica}`);
        console.log(`║ ⚙️ MECÁNICA TOTAL: ${totalMecanica}`);
        console.log(`║ 🏗️ INFRAESTRUCTURA TOTAL: ${totalInfraestructura}`);
        console.log(`║ 💻 SISTEMAS TOTAL: ${totalSistemas}`);
        if (sinArea > 0) {
            console.log(`║ ❓ SIN ÁREA: ${sinArea}`);
        }
        console.log(`║ 📊 GRAN TOTAL: ${records.length}`);
        console.log('╚══════════════════════════════════════════╝');
        
        // Análisis por estado (top 5)
        console.log('\n📊 TOP 5 ESTADOS:');
        Object.entries(porEstado)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([estado, count]) => {
                console.log(`   ${estado}: ${count}`);
            });
    }

    async getTecnicos() {
        console.log('👥 Obteniendo TODOS los técnicos con paginación...');
        
        try {
            let allRecords = [];
            let offset = null;
            let pageCount = 0;
            
            do {
                let endpoint = `${this.tables.tecnicos}?pageSize=100`;
                if (offset) {
                    endpoint += `&offset=${offset}`;
                }
                
                const result = await this.makeRequest(endpoint);
                
                if (result.records && result.records.length > 0) {
                    const pageRecords = result.records.map(record => ({
                        id: record.id,
                        ...record.fields
                    }));
                    allRecords = allRecords.concat(pageRecords);
                }
                
                offset = result.offset || null;
                pageCount++;
                
                if (pageCount > 50) break;
                
            } while (offset);
            
            console.log(`✅ Total de técnicos obtenidos: ${allRecords.length}`);
            return allRecords;
            
        } catch (error) {
            console.error('❌ Error obteniendo técnicos:', error);
            return [];
        }
    }

    // 🔐 La validación ocurre EN EL SERVIDOR (netlify/functions/auth-login.js).
    // El navegador nunca recibe ni compara el código de acceso de ningún usuario.
    async validateUserCredentials(email, codigoAcceso) {
        try {
            const response = await fetch('/.netlify/functions/auth-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigoAcceso })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.valid) {
                return { valid: false, error: data.error || 'Credenciales inválidas' };
            }

            // Token de sesión firmado por el servidor, válido 8 h
            this.setSessionToken(data.token);

            return { valid: true, user: data.user };

        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            return { valid: false, error: 'Error de sistema' };
        }
    }

    // 🎟️ Manejo del token de sesión
    setSessionToken(token) {
        this.sessionToken = token || null;
        try {
            if (token) sessionStorage.setItem('hslv_session', token);
            else sessionStorage.removeItem('hslv_session');
        } catch (e) {
            console.warn('⚠️ sessionStorage no disponible; el token vive solo en memoria');
        }
        // Con un token nuevo se reintenta la conexión (antes quedaba en Modo local)
        if (token) this.reconectar();
    }

    getSessionToken() {
        if (this.sessionToken) return this.sessionToken;
        try {
            this.sessionToken = sessionStorage.getItem('hslv_session');
        } catch (e) {
            this.sessionToken = null;
        }
        return this.sessionToken;
    }

    logout() {
        this.setSessionToken(null);
    }

    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        const cleanValue = this.cleanFieldValue(value);
        
        console.log(`🗺️ Mapeando ${fieldType}: "${cleanValue}"`);
        
        if (this.fieldMappings[fieldType]) {
            const mapping = this.fieldMappings[fieldType];
            
            if (mapping[cleanValue]) {
                const mappedValue = mapping[cleanValue];
                console.log(`✅ Mapeado ${fieldType}: "${cleanValue}" → "${mappedValue}"`);
                return mappedValue;
            }
            
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
        
        // Set: búsqueda en tiempo constante en lugar de recorrer el array en cada vuelta
        const safeFields = new Set(SAFE_FIELDS[tableName] || []);
        const safeData = {};
        
        Object.keys(data).forEach(key => {
            if (safeFields.has(key)) {
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
        console.log('📢 Generando número específico para área:', area);
        
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

    // 📋 MÉTODO: Crear solicitud
    async createSolicitud(solicitudData) {
        console.log('📍 Creando solicitud con mapeo y valores conocidos...');
        console.log('🔍 Datos recibidos:', solicitudData);
        console.log('🏥 ÁREA RECIBIDA:', solicitudData.servicioIngenieria);
        console.log('📋 Valores válidos conocidos:', this.validSolicitudValues);
        
        try {
            const mappedData = { ...solicitudData };
            
            if (mappedData.servicioIngenieria && this.fieldMappings.servicioIngenieria[mappedData.servicioIngenieria]) {
                const valorOriginal = mappedData.servicioIngenieria;
                mappedData.servicioIngenieria = this.fieldMappings.servicioIngenieria[mappedData.servicioIngenieria];
                console.log(`🗺️ ÁREA MAPEADA: ${valorOriginal} → ${mappedData.servicioIngenieria}`);
            }
            
            if (mappedData.tipoServicio && this.fieldMappings.tipoServicio[mappedData.tipoServicio]) {
                const valorOriginal = mappedData.tipoServicio;
                mappedData.tipoServicio = this.fieldMappings.tipoServicio[mappedData.tipoServicio];
                console.log(`🗺️ TIPO SERVICIO MAPEADO: ${valorOriginal} → ${mappedData.tipoServicio}`);
            }
            
            if (mappedData.prioridad && this.fieldMappings.prioridad[mappedData.prioridad]) {
                const valorOriginal = mappedData.prioridad;
                mappedData.prioridad = this.fieldMappings.prioridad[mappedData.prioridad];
                console.log(`🗺️ PRIORIDAD MAPEADA: ${valorOriginal} → ${mappedData.prioridad}`);
            }
            
            if (mappedData.servicioIngenieria && 
                this.validSolicitudValues.servicioIngenieria.length > 0 &&
                !this.validSolicitudValues.servicioIngenieria.includes(mappedData.servicioIngenieria)) {
                console.warn(`⚠️ Valor mapeado ${mappedData.servicioIngenieria} no está en la lista de valores válidos`);
                console.log('📋 Valores válidos detectados:', this.validSolicitudValues.servicioIngenieria);
                
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
            
            const numero = await this.generateAreaSpecificNumber(solicitudData.servicioIngenieria);
            
            const rawData = {
                numero: numero,
                descripcion: mappedData.descripcion || 'Solicitud de mantenimiento',
                estado: 'Pendiente',
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
            
            if (!rawData.servicioIngenieria) {
                console.error('❌ ERROR CRÍTICO: servicioIngenieria es undefined o null');
                console.error('Datos originales:', solicitudData);
                throw new Error('El área de ingeniería es requerida');
            }
            
            const cleanData = {};
            Object.keys(rawData).forEach(key => {
                if (rawData[key] !== undefined && rawData[key] !== null && rawData[key] !== '') {
                    cleanData[key] = rawData[key];
                }
            });
            
            const data = {
                fields: cleanData
            };
            
            console.log('🔍 Datos finales a enviar (con valores mapeados):', JSON.stringify(data, null, 2));
            console.log('🏥 ÁREA FINAL A GUARDAR:', data.fields.servicioIngenieria);
            console.log('🔧 TIPO SERVICIO FINAL:', data.fields.tipoServicio);
            
            try {
                const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
                console.log(`✅ Solicitud creada correctamente: ${numero}`);
                console.log(`🏥 Área guardada: ${data.fields.servicioIngenieria}`);
                console.log(`🔧 Tipo servicio guardado: ${data.fields.tipoServicio}`);
                
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
                    console.error('🔍 Datos que se intentaron enviar:', data);
                    
                    let mensajeError = 'No se pudo crear la solicitud. ';
                    
                    try {
                        if (error.message.includes('servicioIngenieria')) {
                            mensajeError += `El valor "${mappedData.servicioIngenieria}" no es válido para el área. `;
                            mensajeError += `Valores válidos: ${this.validSolicitudValues.servicioIngenieria.join(', ')}`;
                        } else if (error.message.includes('tipoServicio')) {
                            mensajeError += `El tipo de servicio "${mappedData.tipoServicio}" no es válido. `;
                            mensajeError += `Valores válidos: ${this.validSolicitudValues.tipoServicio.join(', ')}`;
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
            'Crítica': 2,
            'Alta': 8,
            'Media': 24,
            'Baja': 72,
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
        
        console.log('🔍 Creando técnico con área mapeada:', data);
        
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

    // 🔄 MÉTODO ORIGINAL: Actualizar estado de solicitud (sin cambio de tipo de servicio)
    async updateRequestStatus(solicitudId, nuevoEstado, observaciones = '') {
        console.log('🔄 Actualizando estado de solicitud:', { solicitudId, nuevoEstado });
        
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            console.log('📋 Estado actual:', solicitud.estado);
            console.log('🔄 Nuevo estado solicitado:', nuevoEstado);
            
            const estadoMapeado = this.mapFieldValue('estado', nuevoEstado);
            console.log('🗺️ Estado mapeado:', estadoMapeado);
            
            const updateData = {
                estado: estadoMapeado
            };
            
            if (observaciones) {
                updateData.observaciones = (solicitud.observaciones || '') + '\n[' + new Date().toLocaleString('es-CO') + '] ' + observaciones;
            }
            
            if (nuevoEstado === 'EN_PROCESO' || nuevoEstado === 'EN PROCESO') {
                updateData.fechaInicioTrabajo = new Date().toISOString();
                console.log('📅 Registrando fecha de inicio de trabajo');
                
            } else if (nuevoEstado === 'COMPLETADA') {
                const fechaCompletado = new Date();
                updateData.fechaCompletado = fechaCompletado.toISOString();
                
                if (solicitud.fechaCreacion) {
                    const fechaCreacion = new Date(solicitud.fechaCreacion);
                    const tiempoTotalMs = fechaCompletado - fechaCreacion;
                    const horas = Math.floor(tiempoTotalMs / (1000 * 60 * 60));
                    const minutos = Math.floor((tiempoTotalMs % (1000 * 60 * 60)) / (1000 * 60));
                    updateData.tiempoTotalRespuesta = `${horas}h ${minutos}m`;
                    
                    console.log('⏱️ Tiempo total calculado:', updateData.tiempoTotalRespuesta);
                }
            }
            
            console.log('🔍 Datos a actualizar:', updateData);
            
            try {
                const result = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                    fields: updateData
                });
                
                console.log('✅ Estado actualizado exitosamente');
                
                if (nuevoEstado === 'COMPLETADA' && solicitud.tecnicoAsignado) {
                    console.log('🔓 Liberando técnico asignado...');
                    await this.liberarTecnicoAsignado(solicitudId);
                }
                
                return { 
                    success: true, 
                    solicitud: { ...solicitud, ...updateData },
                    mensaje: `Estado cambiado a ${nuevoEstado}`
                };
                
            } catch (updateError) {
                console.error('❌ Error actualizando estado:', updateError);
                
                if (updateError.message.includes('422')) {
                    console.warn('⚠️ Error 422 detectado, intentando con valores alternativos...');
                    
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
                            
                            if (nuevoEstado === 'COMPLETADA' && solicitud.tecnicoAsignado) {
                                await this.liberarTecnicoAsignado(solicitudId);
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

    // 🆕 NUEVO MÉTODO: Actualizar estado con cambio de tipo de servicio
    async updateRequestStatusWithServiceType(solicitudId, nuevoEstado, nuevoTipoServicio = null, observaciones = '') {
        console.log('🔄 Actualizando estado y tipo de servicio de solicitud:', { solicitudId, nuevoEstado, nuevoTipoServicio });
        
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            console.log('📋 Estado actual:', solicitud.estado);
            console.log('🔨 Tipo de servicio actual:', solicitud.tipoServicio);
            console.log('🔄 Nuevo estado solicitado:', nuevoEstado);
            if (nuevoTipoServicio) {
                console.log('🔨 Nuevo tipo de servicio solicitado:', nuevoTipoServicio);
            }
            
            const estadoMapeado = this.mapFieldValue('estado', nuevoEstado);
            console.log('🗺️ Estado mapeado:', estadoMapeado);
            
            const updateData = {
                estado: estadoMapeado
            };
            
            // Si se proporciona un nuevo tipo de servicio, mapearlo y agregarlo
            if (nuevoTipoServicio) {
                const tipoServicioMapeado = this.mapFieldValue('tipoServicio', nuevoTipoServicio);
                updateData.tipoServicio = tipoServicioMapeado;
                console.log('🗺️ Tipo de servicio mapeado:', tipoServicioMapeado);
                
                // Agregar una observación indicando el cambio de tipo de servicio
                const tipoAnterior = solicitud.tipoServicio || 'No especificado';
                const cambioTipoMsg = `\n[${new Date().toLocaleString('es-CO')}] Tipo de servicio actualizado de "${tipoAnterior}" a "${nuevoTipoServicio}"`;
                observaciones = observaciones ? observaciones + cambioTipoMsg : cambioTipoMsg;
            }
            
            if (observaciones) {
                updateData.observaciones = (solicitud.observaciones || '') + '\n[' + new Date().toLocaleString('es-CO') + '] ' + observaciones;
            }
            
            if (nuevoEstado === 'EN_PROCESO' || nuevoEstado === 'EN PROCESO') {
                updateData.fechaInicioTrabajo = new Date().toISOString();
                console.log('📅 Registrando fecha de inicio de trabajo');
                
            } else if (nuevoEstado === 'COMPLETADA') {
                const fechaCompletado = new Date();
                updateData.fechaCompletado = fechaCompletado.toISOString();
                
                if (solicitud.fechaCreacion) {
                    const fechaCreacion = new Date(solicitud.fechaCreacion);
                    const tiempoTotalMs = fechaCompletado - fechaCreacion;
                    const horas = Math.floor(tiempoTotalMs / (1000 * 60 * 60));
                    const minutos = Math.floor((tiempoTotalMs % (1000 * 60 * 60)) / (1000 * 60));
                    updateData.tiempoTotalRespuesta = `${horas}h ${minutos}m`;
                    
                    console.log('⏱️ Tiempo total calculado:', updateData.tiempoTotalRespuesta);
                }
                
                // Si se detectó que era error de usuario, registrarlo
                if (nuevoTipoServicio === 'ERROR_USUARIO') {
                    console.log('⚠️ Solicitud marcada como ERROR DE USUARIO');
                }
            }
            
            console.log('🔍 Datos a actualizar:', updateData);
            
            try {
                const result = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                    fields: updateData
                });
                
                console.log('✅ Estado y tipo de servicio actualizados exitosamente');
                
                if (nuevoEstado === 'COMPLETADA' && solicitud.tecnicoAsignado) {
                    console.log('🔓 Liberando técnico asignado...');
                    await this.liberarTecnicoAsignado(solicitudId);
                }
                
                return { 
                    success: true, 
                    solicitud: { ...solicitud, ...updateData },
                    mensaje: `Estado cambiado a ${nuevoEstado}${nuevoTipoServicio ? ` y tipo de servicio a ${nuevoTipoServicio}` : ''}`
                };
                
            } catch (updateError) {
                console.error('❌ Error actualizando:', updateError);
                
                if (updateError.message.includes('422')) {
                    console.warn('⚠️ Error 422 detectado, intentando con valores alternativos...');
                    
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
                            
                            console.log(`✅ Actualizado con valor alternativo: ${estadoAlt}`);
                            
                            if (nuevoEstado === 'COMPLETADA' && solicitud.tecnicoAsignado) {
                                await this.liberarTecnicoAsignado(solicitudId);
                            }
                            
                            return { 
                                success: true, 
                                solicitud: { ...solicitud, ...updateData },
                                mensaje: `Estado cambiado a ${nuevoEstado}${nuevoTipoServicio ? ` y tipo de servicio a ${nuevoTipoServicio}` : ''}`
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
            console.error('❌ Error en updateRequestStatusWithServiceType:', error);
            throw new Error(`Error actualizando: ${error.message}`);
        }
    }

    // 🔄 MÉTODO: Actualizar área de una solicitud (redirección)
    async updateRequestArea(solicitudId, nuevaArea, motivo, areaAnterior = '') {
        console.log('🔄 Actualizando área de solicitud:', { solicitudId, nuevaArea, motivo });
        
        try {
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            console.log('📋 Solicitud actual:', solicitud);
            console.log('🏥 Área actual:', solicitud.servicioIngenieria);
            console.log('🔄 Nueva área solicitada:', nuevaArea);
            
            // Mapear el área nueva
            const areaMapeada = this.mapFieldValue('servicioIngenieria', nuevaArea);
            console.log('🗺️ Área mapeada:', areaMapeada);
            
            // Generar nuevo número para el área
            const nuevoNumero = await this.generateAreaSpecificNumber(nuevaArea);
            console.log('📋 Nuevo número generado:', nuevoNumero);
            
            // Preparar datos de actualización
            const updateData = {
                servicioIngenieria: areaMapeada,
                numero: nuevoNumero,
                estado: 'PENDIENTE', // Resetear a pendiente
                tecnicoAsignado: '', // Limpiar asignación
                fechaAsignacion: null,
                observacionesAsignacion: ''
            };
            
            // Agregar al historial de observaciones
            const fechaActual = new Date().toLocaleString('es-CO');
            const observacionRedireccion = `[${fechaActual}] REDIRECCIÓN DE ÁREA:\n` +
                `- Área anterior: ${areaAnterior || solicitud.servicioIngenieria}\n` +
                `- Nueva área: ${nuevaArea}\n` +
                `- Motivo: ${motivo}\n` +
                `- Número anterior: ${solicitud.numero}\n` +
                `- Nuevo número: ${nuevoNumero}`;
            
            updateData.observaciones = (solicitud.observaciones || '') + '\n\n' + observacionRedireccion;
            
            console.log('🔍 Datos a actualizar:', updateData);
            
            // Hacer la actualización
            const result = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: updateData
            });
            
            console.log('✅ Área actualizada exitosamente');
            
            return {
                success: true,
                solicitud: { ...solicitud, ...updateData },
                nuevoNumero: nuevoNumero,
                areaAnterior: solicitud.servicioIngenieria,
                nuevaArea: nuevaArea,
                mensaje: `Solicitud redirigida de ${solicitud.servicioIngenieria} a ${nuevaArea}`
            };
            
        } catch (error) {
            console.error('❌ Error actualizando área:', error);
            throw new Error(`Error al redirigir solicitud: ${error.message}`);
        }
    }

    // 🔓 MÉTODO: Liberar técnico asignado
    async liberarTecnicoAsignado(solicitudId) {
        console.log('🔓 Liberando técnico asignado para solicitud:', solicitudId);
        
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
                    await this.makeRequest(`${this.tables.tecnicos}/${tecnico.id}`, 'PATCH', {
                        fields: {
                            estado: 'disponible',
                            solicitudAsignada: ''
                        }
                    });
                    
                    console.log(`✅ Técnico ${tecnico.nombre} liberado exitosamente`);
                    
                } catch (tecnicoError) {
                    console.error('❌ Error actualizando técnico:', tecnicoError);
                }
            } else {
                console.warn('⚠️ No se encontró el técnico en la base de datos');
            }
            
            // 🔴 CAMBIO IMPORTANTE: NO borrar el técnico de la solicitud si está COMPLETADA
            const estadoUpper = (solicitud.estado || '').toUpperCase();
            if (estadoUpper !== 'COMPLETADA') {
                try {
                    await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                        fields: {
                            tecnicoAsignado: ''
                        }
                    });
                    console.log('✅ Técnico removido de la solicitud');
                } catch (solicitudError) {
                    console.error('❌ Error actualizando solicitud:', solicitudError);
                }
            } else {
                console.log('✅ Manteniendo nombre del técnico en solicitud completada');
            }
            
            return { 
                success: true, 
                mensaje: `Técnico ${solicitud.tecnicoAsignado} liberado`,
                tecnico: tecnico
            };
            
        } catch (error) {
            console.error('❌ Error liberando técnico:', error);
            return { 
                success: false, 
                mensaje: 'Error liberando técnico',
                error: error.message 
            };
        }
    }

    async updateSolicitudAcceso(requestId, updateData) {
        const cleanData = {};
        Object.keys(updateData).forEach(key => {
            const value = updateData[key];
            if (typeof value === 'string') {
                cleanData[key] = this.cleanFieldValue(value);
                console.log(`🔍 Campo ${key} limpiado: "${updateData[key]}" → "${cleanData[key]}"`);
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

    // 📊 MÉTODO: Estadísticas avanzadas
    async getAdvancedStatistics() {
        try {
            const [solicitudes, tecnicos, usuarios] = await Promise.all([
                this.getSolicitudes(),
                this.getTecnicos(),
                this.getUsuarios()
            ]);
            
            const totalSolicitudes = solicitudes.length;
            const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'Pendiente').length;
            const asignadas = solicitudes.filter(s => s.estado === 'ASIGNADA' || s.estado === 'Asignada').length;
            const enProceso = solicitudes.filter(s => s.estado === 'EN_PROCESO' || s.estado === 'En Proceso').length;
            const completadas = solicitudes.filter(s => s.estado === 'COMPLETADA' || s.estado === 'Completada').length;
            const canceladas = solicitudes.filter(s => s.estado === 'CANCELADA' || s.estado === 'Cancelada').length;
            
            const porcentajeCompletadas = totalSolicitudes > 0 
                ? ((completadas / totalSolicitudes) * 100).toFixed(2) 
                : 0;
            
            const mantenimientosCorrectivos = solicitudes.filter(s => 
                s.tipoServicio === 'MANTENIMIENTO_CORRECTIVO' || 
                s.tipoServicio === 'Mantenimiento Correctivo'
            ).length;
            const porcentajeCorrectivos = totalSolicitudes > 0 
                ? ((mantenimientosCorrectivos / totalSolicitudes) * 100).toFixed(2) 
                : 0;
            
            const erroresUsuario = solicitudes.filter(s => 
                s.tipoServicio === 'ERROR_USUARIO' || 
                s.tipoServicio === 'Error de Usuario' ||
                (s.observaciones && s.observaciones.toLowerCase().includes('error de usuario')) ||
                (s.descripcion && s.descripcion.toLowerCase().includes('error de usuario'))
            ).length;
            const porcentajeErroresUsuario = totalSolicitudes > 0 
                ? ((erroresUsuario / totalSolicitudes) * 100).toFixed(2) 
                : 0;
            
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
                    
                    if (solicitud.estado === 'COMPLETADA' || solicitud.estado === 'Completada' || 
                        solicitud.estado === 'CANCELADA' || solicitud.estado === 'Cancelada') {
                        totalTiempoRespuestaMs += tiempoRespuesta.totalMs;
                        solicitudesConTiempo++;
                    }
                }
            });
            
            const promedioTiempoRespuestaMs = solicitudesConTiempo > 0 
                ? totalTiempoRespuestaMs / solicitudesConTiempo 
                : 0;
            const promedioHoras = Math.floor(promedioTiempoRespuestaMs / (1000 * 60 * 60));
            const promedioMinutos = Math.floor((promedioTiempoRespuestaMs % (1000 * 60 * 60)) / (1000 * 60));
            
            tiemposRespuesta.sort((a, b) => b.horas - a.horas);
            
            const estadisticasPorTipo = {};
            this.validSolicitudValues.tipoServicio.forEach(tipo => {
                const solicitudesTipo = solicitudes.filter(s => s.tipoServicio === tipo);
                estadisticasPorTipo[tipo] = {
                    total: solicitudesTipo.length,
                    completadas: solicitudesTipo.filter(s => s.estado === 'COMPLETADA' || s.estado === 'Completada').length,
                    porcentaje: totalSolicitudes > 0 ? ((solicitudesTipo.length / totalSolicitudes) * 100).toFixed(2) : 0
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
                    detalleTiempos: tiemposRespuesta.slice(0, 10),
                    totalConTiempoRegistrado: solicitudesConTiempo
                },
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

    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            tables: this.tables,
            timestamp: new Date().toISOString(),
            version: '10.0-cambio-tipo-servicio',
            validAccessRequestValues: this.validAccessRequestValues,
            validUserValues: this.validUserValues,
            validSolicitudValues: this.validSolicitudValues,
            features: [
                '✨ NUEVO: Cambio de tipo de servicio al marcar como completada',
                '✨ NUEVO: Método updateRequestStatusWithServiceType agregado',
                '✨ NUEVO: Detección de errores de usuario al completar',
                'FIX: Cambio de estado mejorado con múltiples intentos',
                'FIX: Liberación de técnico al completar solicitud',
                'NUEVO: Indicadores avanzados de gestión',
                'NUEVO: Porcentaje de solicitudes completadas',
                'NUEVO: Porcentaje de mantenimientos correctivos',
                'NUEVO: Porcentaje de errores de usuario',
                'NUEVO: Cálculo de tiempos de respuesta detallados',
                'Sistema completo funcionando con cambio de tipo de servicio'
            ]
        };
    }
}

// 🌐 Crear instancia global
try {
    console.log('🔧 Creando instancia global con cambio de tipo de servicio...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión con cambio de tipo de servicio)');
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
                ? '✅ Conectado (con cambio tipo servicio)' 
                : 'Modo Local (con cambio tipo servicio)';
            
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
        
        console.log('🔍 DIAGNÓSTICO CON CAMBIO DE TIPO DE SERVICIO');
        console.log('==============================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔌 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('✨ NUEVO: Cambio de tipo de servicio al completar habilitado');
        console.log('📊 Nuevas características:', status.features.filter(f => f.startsWith('✨') || f.startsWith('NUEVO') || f.startsWith('FIX')));
        
        return status;
    };
    
    console.log('✅ Funciones de debug creadas exitosamente');
} catch (error) {
    console.error('❌ Error creando funciones de debug:', error);
}

// Funciones globales de diagnóstico
window.diagnosticarSolicitudes = async function() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE SOLICITUDES');
    console.log('╚══════════════════════════════════════╝');
    
    try {
        console.log('📡 Obteniendo datos frescos de Airtable...');
        
        const solicitudes = await window.airtableAPI.getSolicitudes();
        
        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`   Total obtenido: ${solicitudes.length} solicitudes`);
        console.log(`   Esperado: 233 solicitudes`);
        console.log(`   Diferencia: ${233 - solicitudes.length}`);
        
        if (solicitudes.length < 233) {
            console.warn('⚠️ FALTAN SOLICITUDES - Verificar paginación');
            console.log('💡 Ejecuta window.forzarRecargaCompleta() para intentar otra vez');
        } else if (solicitudes.length === 233) {
            console.log('✅ TODAS LAS SOLICITUDES CARGADAS CORRECTAMENTE');
        } else if (solicitudes.length > 233) {
            console.log('📈 Se encontraron MÁS solicitudes de las esperadas');
        }
        
        return {
            total: solicitudes.length,
            esperado: 233,
            diferencia: 233 - solicitudes.length,
            solicitudes: solicitudes
        };
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return null;
    }
};

// Función para forzar recarga completa
window.forzarRecargaCompleta = async function() {
    console.log('🔄 FORZANDO RECARGA COMPLETA DE DATOS...');
    
    try {
        // Limpiar datos en memoria
        if (window.airtableAPI) {
            console.log('🧹 Limpiando caché...');
            
            // Obtener nuevos datos
            const solicitudes = await window.airtableAPI.getSolicitudes();
            
            console.log(`✅ Recarga completa exitosa`);
            console.log(`📊 Total de solicitudes: ${solicitudes.length}`);
            
            // Si estás en el portal de gestión, actualizar la interfaz
            if (typeof loadAllDataFromCloud === 'function') {
                console.log('🔄 Actualizando interfaz...');
                await loadAllDataFromCloud();
            }
            
            return solicitudes.length;
        }
    } catch (error) {
        console.error('❌ Error en recarga:', error);
        return null;
    }
};

console.log('✅ airtable-config.js (CON CAMBIO DE TIPO DE SERVICIO) cargado');
console.log('✨ NUEVO: Método updateRequestStatusWithServiceType disponible');
console.log('✨ NUEVO: Cambio de tipo de servicio al marcar como completada');
console.log('📊 Para estadísticas avanzadas: window.airtableAPI.getAdvancedStatistics()');
console.log('🛠️ Para estado general: debugAirtableConnection()');

// La detección de valores la hace reconectar() cuando existe una sesión válida.
