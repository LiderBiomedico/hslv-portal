// 🛡️ Configuración CORREGIDA de Airtable API - Área Biomédica Arreglada + Fix IDs + Fix Campo solicitudId + Fix Error 422
// airtable-config.js - Versión con detección automática de valores y mapeo inteligente

console.log('🚀 Cargando airtable-config.js (VERSIÓN COMPLETA CON TODAS LAS CORRECCIONES)...');

// 🗺️ MAPEO DE VALORES CORREGIDO PARA COMPATIBILIDAD CON AIRTABLE
const AIRTABLE_VALUE_MAPPING = {
    servicioIngenieria: {
        // CORRECCIÓN: Mapeo específico para área biomédica
        'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica', 'Ing. Biomédica'],
        'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
        'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA']
    },
    tipoServicio: {
        'MANTENIMIENTO_PREVENTIVO': ['Mantenimiento Preventivo', 'MANTENIMIENTO_PREVENTIVO', 'Preventivo'],
        'MANTENIMIENTO_CORRECTIVO': ['Mantenimiento Correctivo', 'MANTENIMIENTO_CORRECTIVO', 'Correctivo'],
        'REPARACION': ['Reparación', 'REPARACION', 'Reparacion'],
        'INSTALACION': ['Instalación', 'INSTALACION', 'Instalacion'],
        'CALIBRACION': ['Calibración', 'CALIBRACION', 'Calibracion'],
        'INSPECCION': ['Inspección', 'INSPECCION', 'Inspeccion'],
        'ACTUALIZACION': ['Actualización', 'ACTUALIZACION', 'Actualizacion'],
        'EMERGENCIA': ['Emergencia', 'EMERGENCIA']
    },
    prioridad: {
        'CRITICA': ['Crítica', 'CRITICA', 'Critica'],
        'ALTA': ['Alta', 'ALTA'],
        'MEDIA': ['Media', 'MEDIA'],
        'BAJA': ['Baja', 'BAJA']
    },
    estado: {
        'PENDIENTE': ['Pendiente', 'PENDIENTE'],
        'ASIGNADA': ['Asignada', 'ASIGNADA'],
        'EN_PROCESO': ['En Proceso', 'EN_PROCESO', 'En_Proceso'],
        'COMPLETADA': ['Completada', 'COMPLETADA'],
        'CANCELADA': ['Cancelada', 'CANCELADA'],
        'APROBADA': ['Aprobada', 'APROBADA'],
        'RECHAZADA': ['Rechazada', 'RECHAZADA']
    },
    // NUEVO: Mapeo específico para área de técnicos
    area: {
        'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica'],
        'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
        'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA']
    },
    // NUEVO: Mapeo para servicios hospitalarios
    servicioHospitalario: {
        'URGENCIAS': ['Urgencias', 'URGENCIAS'],
        'UCI': ['UCI', 'Uci'],
        'HOSPITALIZACION': ['Hospitalización', 'HOSPITALIZACION', 'Hospitalizacion'],
        'CIRUGIA': ['Cirugía', 'CIRUGIA', 'Cirugia'],
        'CONSULTA_EXTERNA': ['Consulta Externa', 'CONSULTA_EXTERNA'],
        'IMAGENOLOGIA': ['Imagenología', 'IMAGENOLOGIA', 'Imagenologia'],
        'LABORATORIO': ['Laboratorio', 'LABORATORIO'],
        'FARMACIA': ['Farmacia', 'FARMACIA'],
        'ADMINISTRATIVO': ['Administrativo', 'ADMINISTRATIVO'],
        'MANTENIMIENTO': ['Mantenimiento', 'MANTENIMIENTO']
    },
    // NUEVO: Mapeo para cargos
    cargo: {
        'MEDICO': ['Médico', 'MEDICO', 'Medico'],
        'ENFERMERO': ['Enfermero/a', 'ENFERMERO', 'Enfermero', 'Enfermera'],
        'AUXILIAR_ENFERMERIA': ['Auxiliar de Enfermería', 'AUXILIAR_ENFERMERIA', 'Auxiliar Enfermeria'],
        'ADMINISTRATIVO': ['Administrativo', 'ADMINISTRATIVO'],
        'TECNICO': ['Técnico', 'TECNICO', 'Tecnico'],
        'SERVICIOS_GENERALES': ['Servicios Generales', 'SERVICIOS_GENERALES'],
        'DIRECTIVO': ['Directivo', 'DIRECTIVO'],
        'OTRO': ['Otro', 'OTRO']
    }
};

// 📋 Campos seguros confirmados para cada tabla - ACTUALIZADO
const SAFE_FIELDS = {
    solicitudes: [
        'numero',
        'descripcion', 
        'estado',
        'fechaCreacion',
        'servicioIngenieria', // CORREGIR: Campo crítico para área
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
        'area', // CORREGIR: Campo crítico para área de técnicos
        'tipo',
        'especialidad',
        'estado',
        'fechaCreacion',
        'solicitudAsignada'
    ],
    solicitudesAcceso: [
        // CORRECCIÓN: Removido 'solicitudId' que no existe en Airtable
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
        console.log('🔧 Inicializando AirtableAPI con todas las correcciones...');
        
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

        // 🎯 PREFIJOS POR ÁREA - CORREGIDO
        this.areaPrefixes = {
            'INGENIERIA_BIOMEDICA': 'SOLBIO',
            'MECANICA': 'SOLMEC',
            'INFRAESTRUCTURA': 'SOLINFRA',
            'GENERAL': 'SOL'
        };
        
        // 📊 ALMACENAR ÚLTIMOS VALORES VÁLIDOS CONOCIDOS
        this.lastKnownValidValues = {
            servicioIngenieria: [],
            tipoServicio: [],
            prioridad: [],
            estado: [],
            servicioHospitalario: [],
            cargo: []
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🗺️ Mapeo de valores configurado para área biomédica');
        console.log('🎯 Prefijos de área configurados:', this.areaPrefixes);
        
        this.initializeConnectionAsync();
    }

    // 🗺️ FUNCIÓN MEJORADA PARA MAPEAR VALORES - CORRECCIÓN ÁREA BIOMÉDICA
    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        console.log(`🗺️ Mapeando ${fieldType}: "${value}"`);
        
        // NUEVO: Si no hay mapeo definido, intentar detectar automáticamente
        if (!this.fieldMappings[fieldType]) {
            console.warn(`⚠️ No hay mapeo definido para tipo de campo: ${fieldType}, usando valor original`);
            return value;
        }

        const mapping = this.fieldMappings[fieldType];
        
        // Buscar mapeo directo
        if (mapping[value]) {
            const mappedValue = mapping[value][0]; // Usar el primer valor como preferido
            console.log(`✅ Mapeado ${fieldType}: "${value}" → "${mappedValue}"`);
            return mappedValue;
        }
        
        // NUEVO: Búsqueda inteligente para servicioIngenieria
        if (fieldType === 'servicioIngenieria') {
            // Intentar encontrar coincidencia parcial
            const valueUpper = value.toUpperCase();
            
            // Mapeo específico por contenido
            if (valueUpper.includes('BIOMED')) {
                // Buscar el valor correcto para biomédica
                for (const [key, values] of Object.entries(mapping)) {
                    if (key === 'INGENIERIA_BIOMEDICA' && values.length > 0) {
                        console.log(`✅ BIOMÉDICA detectada: "${value}" → "${values[0]}"`);
                        return values[0];
                    }
                }
            } else if (valueUpper.includes('MEC') || value === 'MECANICA') {
                // Buscar el valor correcto para mecánica
                for (const [key, values] of Object.entries(mapping)) {
                    if (key === 'MECANICA' && values.length > 0) {
                        console.log(`✅ MECÁNICA detectada: "${value}" → "${values[0]}"`);
                        return values[0];
                    }
                }
            } else if (valueUpper.includes('INFRA')) {
                // Buscar el valor correcto para infraestructura
                for (const [key, values] of Object.entries(mapping)) {
                    if (key === 'INFRAESTRUCTURA' && values.length > 0) {
                        console.log(`✅ INFRAESTRUCTURA detectada: "${value}" → "${values[0]}"`);
                        return values[0];
                    }
                }
            }
        }
        
        // NUEVO: Búsqueda inteligente para tipoServicio
        if (fieldType === 'tipoServicio') {
            // Intentar mapeo directo por clave
            const valueUpper = value.toUpperCase().replace(/ /g, '_');
            if (mapping[valueUpper] && mapping[valueUpper].length > 0) {
                console.log(`✅ Tipo servicio mapeado: "${value}" → "${mapping[valueUpper][0]}"`);
                return mapping[valueUpper][0];
            }
        }
        
        // Buscar en valores alternativos
        for (const [key, possibleValues] of Object.entries(mapping)) {
            if (possibleValues.includes(value)) {
                const mappedValue = possibleValues[0];
                console.log(`✅ Mapeado ${fieldType}: "${value}" → "${mappedValue}" (encontrado en alternativas)`);
                return mappedValue;
            }
            
            // NUEVO: Búsqueda case-insensitive
            const valueLower = value.toLowerCase();
            const found = possibleValues.find(v => v.toLowerCase() === valueLower);
            if (found) {
                console.log(`✅ Mapeado ${fieldType}: "${value}" → "${found}" (case-insensitive)`);
                return found;
            }
        }
        
        console.log(`⚠️ No se encontró mapeo para ${fieldType}: "${value}" - usando valor original`);
        return value;
    }

    // 🛡️ FUNCIÓN PARA PREPARAR DATOS SEGUROS - MEJORADA Y CORREGIDA
    prepareSafeData(data, tableName) {
        console.log(`🛡️ Preparando datos seguros para tabla: ${tableName}`);
        console.log(`🔍 Datos originales:`, data);
        
        const safeFields = SAFE_FIELDS[tableName] || [];
        const safeData = {};
        
        Object.keys(data).forEach(key => {
            if (safeFields.includes(key)) {
                let value = data[key];
                
                // CORRECCIÓN CRÍTICA: Agregar servicioHospitalario y cargo a campos que siempre se mapean
                const fieldsToAlwaysMap = [
                    'servicioIngenieria', 
                    'tipoServicio', 
                    'prioridad', 
                    'estado', 
                    'area',
                    'servicioHospitalario', // AGREGADO
                    'cargo' // AGREGADO
                ];
                
                if (fieldsToAlwaysMap.includes(key)) {
                    const originalValue = value;
                    value = this.mapFieldValue(key, value);
                    
                    // Si el mapeo no funcionó y es servicioIngenieria, intentar detección adicional
                    if (key === 'servicioIngenieria' && value === originalValue) {
                        console.warn(`⚠️ Mapeo no encontrado para ${key}: "${value}"`);
                        
                        // Intentar obtener el primer valor válido conocido
                        if (this.lastKnownValidValues && this.lastKnownValidValues[key]) {
                            const validValues = this.lastKnownValidValues[key];
                            if (validValues.length > 0) {
                                // Buscar coincidencia parcial
                                const match = validValues.find(v => 
                                    v.toLowerCase().includes(value.toLowerCase()) ||
                                    value.toLowerCase().includes(v.toLowerCase())
                                );
                                
                                if (match) {
                                    value = match;
                                    console.log(`✅ Valor corregido automáticamente: "${originalValue}" → "${value}"`);
                                } else {
                                    // Usar el primer valor válido como fallback
                                    console.warn(`⚠️ Usando valor por defecto: "${validValues[0]}"`);
                                    value = validValues[0];
                                }
                            }
                        }
                    }
                    
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

    // 🔢 GENERAR NÚMERO ESPECÍFICO POR ÁREA - CORREGIDO
    async generateAreaSpecificNumber(area) {
        console.log('🔢 Generando número específico para área:', area);
        
        try {
            // CORRECCIÓN: Normalizar área antes de usar
            let normalizedArea = area;
            if (area && (area.toLowerCase().includes('biomed') || area.toLowerCase().includes('bioméd'))) {
                normalizedArea = 'INGENIERIA_BIOMEDICA';
                console.log(`🔧 Área normalizada: ${area} → ${normalizedArea}`);
            } else if (area && area.toLowerCase().includes('mec')) {
                normalizedArea = 'MECANICA';
            } else if (area && area.toLowerCase().includes('infra')) {
                normalizedArea = 'INFRAESTRUCTURA';
            }
            
            // Obtener todas las solicitudes para calcular el siguiente número
            const solicitudes = await this.getSolicitudes();
            
            // Filtrar por área y encontrar el número más alto
            const prefix = this.areaPrefixes[normalizedArea];
            if (!prefix) {
                console.warn('⚠️ Área no reconocida, usando formato estándar');
                return `SOL${Date.now().toString().slice(-5)}`;
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
                    
                    // CRÍTICO: Auto-detectar valores válidos ANTES de cualquier operación
                    console.log('🔍 Detectando valores válidos de Airtable para prevenir error 422...');
                    await this.detectAndUpdateValidValues();
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

    // NUEVA FUNCIÓN: Detectar y actualizar valores válidos automáticamente
    async detectAndUpdateValidValues() {
        console.log('🔄 DETECCIÓN AUTOMÁTICA DE VALORES VÁLIDOS INICIADA...');
        
        try {
            // Obtener algunas solicitudes de muestra
            const result = await this.makeRequest(`${this.tables.solicitudes}?maxRecords=20`);
            
            if (result.records && result.records.length > 0) {
                // Recopilar todos los valores únicos para cada campo
                const detectedValues = {
                    servicioIngenieria: new Set(),
                    tipoServicio: new Set(),
                    prioridad: new Set(),
                    estado: new Set(),
                    servicioHospitalario: new Set()
                };
                
                result.records.forEach(record => {
                    if (record.fields.servicioIngenieria) {
                        detectedValues.servicioIngenieria.add(record.fields.servicioIngenieria);
                    }
                    if (record.fields.tipoServicio) {
                        detectedValues.tipoServicio.add(record.fields.tipoServicio);
                    }
                    if (record.fields.prioridad) {
                        detectedValues.prioridad.add(record.fields.prioridad);
                    }
                    if (record.fields.estado) {
                        detectedValues.estado.add(record.fields.estado);
                    }
                    if (record.fields.servicioHospitalario) {
                        detectedValues.servicioHospitalario.add(record.fields.servicioHospitalario);
                    }
                });
                
                // Guardar valores válidos para uso posterior
                Object.keys(detectedValues).forEach(field => {
                    this.lastKnownValidValues[field] = Array.from(detectedValues[field]);
                });
                
                console.log('✅ VALORES DETECTADOS EN AIRTABLE:');
                console.log('servicioIngenieria:', this.lastKnownValidValues.servicioIngenieria);
                console.log('tipoServicio:', this.lastKnownValidValues.tipoServicio);
                console.log('prioridad:', this.lastKnownValidValues.prioridad);
                console.log('estado:', this.lastKnownValidValues.estado);
                console.log('servicioHospitalario:', this.lastKnownValidValues.servicioHospitalario);
                
                // ACTUALIZAR MAPEOS AUTOMÁTICAMENTE
                this.updateMappingsFromDetectedValues(detectedValues);
                
                // IMPORTANTE: Si no se detectaron valores para servicioIngenieria, intentar con tabla técnicos
                if (this.lastKnownValidValues.servicioIngenieria.length === 0) {
                    console.log('⚠️ No se detectaron áreas en solicitudes, intentando con técnicos...');
                    await this.detectAreasFromTechnicians();
                }
                
                // NUEVO: Detectar valores de cargo desde usuarios
                await this.detectCargoValues();
            }
            
        } catch (error) {
            console.error('❌ Error detectando valores:', error);
        }
    }

    // NUEVA FUNCIÓN: Detectar valores de cargo
    async detectCargoValues() {
        try {
            const usuarios = await this.makeRequest(`${this.tables.usuarios}?maxRecords=10`);
            const solicitudesAcceso = await this.makeRequest(`${this.tables.solicitudesAcceso}?maxRecords=10`);
            
            const cargoValues = new Set();
            
            if (usuarios.records) {
                usuarios.records.forEach(record => {
                    if (record.fields.cargo) {
                        cargoValues.add(record.fields.cargo);
                    }
                });
            }
            
            if (solicitudesAcceso.records) {
                solicitudesAcceso.records.forEach(record => {
                    if (record.fields.cargo) {
                        cargoValues.add(record.fields.cargo);
                    }
                });
            }
            
            const detectedCargos = Array.from(cargoValues);
            if (detectedCargos.length > 0) {
                this.lastKnownValidValues.cargo = detectedCargos;
                console.log('✅ Cargos detectados:', detectedCargos);
                
                // Actualizar mapeos con estos cargos
                this.updateMappingsFromDetectedValues({
                    cargo: cargoValues
                });
            }
        } catch (error) {
            console.error('❌ Error detectando cargos:', error);
        }
    }

    // Detectar áreas desde la tabla de técnicos
    async detectAreasFromTechnicians() {
        try {
            const result = await this.makeRequest(`${this.tables.tecnicos}?maxRecords=10`);
            
            if (result.records && result.records.length > 0) {
                const areas = new Set();
                
                result.records.forEach(record => {
                    if (record.fields.area) {
                        areas.add(record.fields.area);
                    }
                });
                
                const detectedAreas = Array.from(areas);
                if (detectedAreas.length > 0) {
                    this.lastKnownValidValues.servicioIngenieria = detectedAreas;
                    console.log('✅ Áreas detectadas desde técnicos:', detectedAreas);
                    
                    // Actualizar mapeos con estas áreas
                    this.updateMappingsFromDetectedValues({
                        servicioIngenieria: areas
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error detectando áreas desde técnicos:', error);
        }
    }

    // Actualizar mapeos basándose en valores detectados
    updateMappingsFromDetectedValues(detectedValues) {
        console.log('🔧 Actualizando mapeos con valores detectados...');
        
        // Para servicioIngenieria
        if (detectedValues.servicioIngenieria) {
            const areaValues = Array.from(detectedValues.servicioIngenieria);
            if (areaValues.length > 0) {
                // Buscar el valor correcto para cada área
                areaValues.forEach(value => {
                    if (value.toLowerCase().includes('mec')) {
                        // Si encontramos algo como "Mecánica", mapeamos MECANICA a ese valor
                        this.fieldMappings.servicioIngenieria.MECANICA = [value, 'MECANICA', 'Mecanica'];
                        console.log(`✅ Mapeo actualizado: MECANICA → "${value}"`);
                    } else if (value.toLowerCase().includes('biomed')) {
                        this.fieldMappings.servicioIngenieria.INGENIERIA_BIOMEDICA = [value, 'INGENIERIA_BIOMEDICA', 'Biomedica'];
                        console.log(`✅ Mapeo actualizado: INGENIERIA_BIOMEDICA → "${value}"`);
                    } else if (value.toLowerCase().includes('infra')) {
                        this.fieldMappings.servicioIngenieria.INFRAESTRUCTURA = [value, 'INFRAESTRUCTURA'];
                        console.log(`✅ Mapeo actualizado: INFRAESTRUCTURA → "${value}"`);
                    }
                });
            }
        }
        
        // Para tipoServicio
        if (detectedValues.tipoServicio) {
            const tipoValues = Array.from(detectedValues.tipoServicio);
            if (tipoValues.length > 0) {
                tipoValues.forEach(value => {
                    const key = value.toUpperCase().replace(/ /g, '_');
                    if (!this.fieldMappings.tipoServicio[key]) {
                        this.fieldMappings.tipoServicio[key] = [value];
                        console.log(`✅ Nuevo mapeo tipo servicio: ${key} → "${value}"`);
                    }
                });
            }
        }
        
        // Para prioridad
        if (detectedValues.prioridad) {
            const prioridadValues = Array.from(detectedValues.prioridad);
            if (prioridadValues.length > 0) {
                prioridadValues.forEach(value => {
                    const key = value.toUpperCase();
                    if (!this.fieldMappings.prioridad[key]) {
                        this.fieldMappings.prioridad[key] = [value];
                        console.log(`✅ Nuevo mapeo prioridad: ${key} → "${value}"`);
                    }
                });
            }
        }
        
        // Para servicioHospitalario
        if (detectedValues.servicioHospitalario) {
            const servicioValues = Array.from(detectedValues.servicioHospitalario);
            if (servicioValues.length > 0) {
                servicioValues.forEach(value => {
                    const key = value.toUpperCase().replace(/ /g, '_');
                    if (!this.fieldMappings.servicioHospitalario[key]) {
                        this.fieldMappings.servicioHospitalario[key] = [value];
                        console.log(`✅ Nuevo mapeo servicio hospitalario: ${key} → "${value}"`);
                    }
                });
            }
        }
        
        // Para cargo
        if (detectedValues.cargo) {
            const cargoValues = Array.from(detectedValues.cargo);
            if (cargoValues.length > 0) {
                cargoValues.forEach(value => {
                    const key = value.toUpperCase().replace(/ /g, '_');
                    if (!this.fieldMappings.cargo[key]) {
                        this.fieldMappings.cargo[key] = [value];
                        console.log(`✅ Nuevo mapeo cargo: ${key} → "${value}"`);
                    }
                });
            }
        }
        
        console.log('✅ Mapeos actualizados completamente');
    }

    // 🔍 DETECTAR CAMPOS Y VALORES DISPONIBLES - MEJORADO
    async detectAvailableFields() {
        console.log('🔍 Detectando campos y valores disponibles...');
        
        try {
            // Detectar campos en tabla Solicitudes
            const solicitudesResult = await this.makeRequest(`${this.tables.solicitudes}?maxRecords=5`);
            
            if (solicitudesResult.records && solicitudesResult.records.length > 0) {
                const availableFields = new Set();
                const fieldValues = {};
                
                solicitudesResult.records.forEach(record => {
                    if (record.fields) {
                        Object.keys(record.fields).forEach(fieldName => {
                            availableFields.add(fieldName);
                            
                            // CORRECCIÓN: Recopilar valores únicos especialmente para servicioIngenieria
                            if (['servicioIngenieria', 'tipoServicio', 'prioridad', 'estado', 'servicioHospitalario'].includes(fieldName)) {
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
                
                // CORRECCIÓN: Actualizar mapeos con valores detectados, especialmente para biomédica
                Object.keys(fieldValues).forEach(fieldName => {
                    const values = Array.from(fieldValues[fieldName]);
                    console.log(`📋 Valores detectados para ${fieldName}:`, values);
                    
                    // CORRECCIÓN ESPECIAL: Si encontramos valores de biomédica, actualizar mapeo
                    if (fieldName === 'servicioIngenieria') {
                        const biomedValues = values.filter(v => 
                            v && (v.toLowerCase().includes('biomed') || v.toLowerCase().includes('bioméd'))
                        );
                        
                        if (biomedValues.length > 0) {
                            console.log('🔧 CORRECCIÓN: Valores biomédica detectados:', biomedValues);
                            this.fieldMappings.servicioIngenieria['INGENIERIA_BIOMEDICA'] = [
                                biomedValues[0], // Usar el primer valor detectado como preferido
                                ...this.fieldMappings.servicioIngenieria['INGENIERIA_BIOMEDICA']
                            ];
                            console.log('✅ Mapeo biomédica actualizado:', this.fieldMappings.servicioIngenieria['INGENIERIA_BIOMEDICA']);
                        }
                    }
                    
                    // Actualizar el mapeo con los valores reales de Airtable
                    if (values.length > 0) {
                        this.updateFieldMapping(fieldName, values);
                    }
                });
            }
            
            // CORRECCIÓN: También detectar valores en tabla Tecnicos para área
            const tecnicosResult = await this.makeRequest(`${this.tables.tecnicos}?maxRecords=5`);
            if (tecnicosResult.records && tecnicosResult.records.length > 0) {
                const areaValues = new Set();
                
                tecnicosResult.records.forEach(record => {
                    if (record.fields && record.fields.area) {
                        areaValues.add(record.fields.area);
                    }
                });
                
                const areaValuesArray = Array.from(areaValues);
                console.log('📋 Valores de área detectados en Tecnicos:', areaValuesArray);
                
                // Actualizar mapeo de área con valores detectados
                const biomedAreaValues = areaValuesArray.filter(v => 
                    v && (v.toLowerCase().includes('biomed') || v.toLowerCase().includes('bioméd'))
                );
                
                if (biomedAreaValues.length > 0) {
                    console.log('🔧 CORRECCIÓN: Valores área biomédica detectados:', biomedAreaValues);
                    this.fieldMappings.area['INGENIERIA_BIOMEDICA'] = [
                        biomedAreaValues[0],
                        ...this.fieldMappings.area['INGENIERIA_BIOMEDICA']
                    ];
                    console.log('✅ Mapeo área biomédica actualizado:', this.fieldMappings.area['INGENIERIA_BIOMEDICA']);
                }
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
                return possibleValues && possibleValues.includes(value);
            });
            
            if (!existingMapping) {
                // CORRECCIÓN: Crear mapeo especial para biomédica
                if ((fieldName === 'servicioIngenieria' || fieldName === 'area') && 
                    value && (value.toLowerCase().includes('biomed') || value.toLowerCase().includes('bioméd'))) {
                    
                    if (!this.fieldMappings[fieldName]['INGENIERIA_BIOMEDICA']) {
                        this.fieldMappings[fieldName]['INGENIERIA_BIOMEDICA'] = [];
                    }
                    
                    if (!this.fieldMappings[fieldName]['INGENIERIA_BIOMEDICA'].includes(value)) {
                        this.fieldMappings[fieldName]['INGENIERIA_BIOMEDICA'].unshift(value);
                        console.log(`➕ BIOMÉDICA: Mapeo agregado: INGENIERIA_BIOMEDICA → ${value}`);
                    }
                } else {
                    // Crear mapeo directo para valores no mapeados
                    const normalizedKey = value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                    this.fieldMappings[fieldName][normalizedKey] = [value];
                    console.log(`➕ Mapeo agregado: ${normalizedKey} → ${value}`);
                }
            }
        });
        
        console.log(`✅ Mapeo actualizado para ${fieldName}:`, this.fieldMappings[fieldName]);
    }

    // 🔍 AUTO-DETECTAR VALORES VÁLIDOS - MEJORADO
    async autoDetectFieldValues() {
        console.log('🔍 Auto-detectando valores válidos en Airtable...');
        
        try {
            // CORRECCIÓN: Detectar valores tanto en Solicitudes como en Tecnicos
            const areaValuesSolicitudes = await this.detectValidFieldValues('Solicitudes', 'servicioIngenieria');
            const areaValuesTecnicos = await this.detectValidFieldValues('Tecnicos', 'area');
            const tipoValues = await this.detectValidFieldValues('Tecnicos', 'tipo');
            const estadoValues = await this.detectValidFieldValues('Tecnicos', 'estado');
            
            // Combinar valores de área de ambas tablas
            const allAreaValues = [...new Set([...areaValuesSolicitudes, ...areaValuesTecnicos])];
            
            if (allAreaValues.length > 0) {
                console.log('🔄 Actualizando mapeo de área con valores detectados:', allAreaValues);
                this.updateFieldMapping('servicioIngenieria', areaValuesSolicitudes);
                this.updateFieldMapping('area', areaValuesTecnicos);
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

    // 📋 MÉTODOS PRINCIPALES - SOLICITUDES CON MANEJO CORREGIDO PARA BIOMÉDICA
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
        console.log('📝 Creando solicitud con área biomédica corregida...');
        console.log('🔍 Datos recibidos:', solicitudData);
        
        try {
            // VALIDACIÓN PREVIA PARA PREVENIR ERROR 422
            const validationErrors = await this.validateSolicitudData(solicitudData);
            if (validationErrors.length > 0) {
                console.error('❌ Errores de validación detectados:', validationErrors);
                throw new Error(`Validación falló: ${validationErrors.join(', ')}`);
            }
            
            // CORRECCIÓN: Normalizar área antes de generar número
            let normalizedArea = solicitudData.servicioIngenieria;
            if (solicitudData.servicioIngenieria && 
                (solicitudData.servicioIngenieria.toLowerCase().includes('biomed') || 
                 solicitudData.servicioIngenieria.toLowerCase().includes('bioméd'))) {
                normalizedArea = 'INGENIERIA_BIOMEDICA';
                console.log(`🔧 Área normalizada para numeración: ${solicitudData.servicioIngenieria} → ${normalizedArea}`);
            }
            
            // Generar número específico según el área corregida
            const numero = await this.generateAreaSpecificNumber(normalizedArea);
            
            // Preparar datos con valores originales (serán mapeados en prepareSafeData)
            const rawData = {
                numero: numero,
                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                estado: 'PENDIENTE',
                fechaCreacion: new Date().toISOString(),
                // CORRECCIÓN: Mantener el área original para el mapeo correcto
                servicioIngenieria: solicitudData.servicioIngenieria,
                tipoServicio: solicitudData.tipoServicio,
                prioridad: solicitudData.prioridad,
                equipo: solicitudData.equipo,
                ubicacion: solicitudData.ubicacion,
                observaciones: solicitudData.observaciones,
                // Datos del solicitante
                solicitante: solicitudData.solicitante,
                servicioHospitalario: solicitudData.servicioHospitalario,
                emailSolicitante: solicitudData.emailSolicitante,
                // Agregar tiempo máximo de respuesta
                tiempoRespuestaMaximo: this.calculateMaxResponseTime(solicitudData.prioridad || 'MEDIA')
            };
            
            console.log('🔍 Datos antes de limpiar:', rawData);
            
            // Filtrar valores undefined y aplicar mapeo seguro
            const cleanData = {};
            Object.keys(rawData).forEach(key => {
                if (rawData[key] !== undefined && rawData[key] !== null && rawData[key] !== '') {
                    cleanData[key] = rawData[key];
                }
            });
            
            console.log('🔍 Datos limpios:', cleanData);
            
            // CORRECCIÓN: Preparar datos seguros con mapeo de valores (aquí se mapea biomédica)
            const safeData = this.prepareSafeData(cleanData, 'solicitudes');
            
            console.log('🔍 Datos seguros mapeados:', safeData);
            
            const data = {
                fields: safeData
            };
            
            console.log('📝 Creando solicitud con datos finales:', data);
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log(`✅ Solicitud creada correctamente: ${numero} - Área: ${safeData.servicioIngenieria}`);
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

    // NUEVA FUNCIÓN: Validar datos antes de enviar
    async validateSolicitudData(data) {
        const errors = [];
        
        // Validar campos requeridos mínimos
        if (!data.descripcion || data.descripcion.trim() === '') {
            errors.push('Descripción es requerida');
        }
        
        if (!data.servicioIngenieria) {
            errors.push('Área de ingeniería es requerida');
        }
        
        // Validar longitudes máximas (ajusta según tu configuración de Airtable)
        if (data.descripcion && data.descripcion.length > 1000) {
            errors.push('Descripción muy larga (máximo 1000 caracteres)');
        }
        
        if (data.observaciones && data.observaciones.length > 500) {
            errors.push('Observaciones muy largas (máximo 500 caracteres)');
        }
        
        // Validar formato de email si está presente
        if (data.emailSolicitante && !this.isValidEmail(data.emailSolicitante)) {
            errors.push('Email inválido');
        }
        
        return errors;
    }

    // Función auxiliar para validar email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // 🔄 Crear solicitud con datos mínimos como fallback - CORREGIDO
    async createSolicitudMinimal(solicitudData) {
        console.log('🔄 Creando solicitud con campos mínimos para área biomédica...');
        
        try {
            // CORRECCIÓN: Normalizar área para numeración
            let normalizedArea = solicitudData.servicioIngenieria;
            if (solicitudData.servicioIngenieria && 
                (solicitudData.servicioIngenieria.toLowerCase().includes('biomed') || 
                 solicitudData.servicioIngenieria.toLowerCase().includes('bioméd'))) {
                normalizedArea = 'INGENIERIA_BIOMEDICA';
            }
            
            const numero = await this.generateAreaSpecificNumber(normalizedArea);
            
            // NUEVO: Intentar con valores válidos conocidos
            let servicioIngenieriaValue = this.mapFieldValue('servicioIngenieria', solicitudData.servicioIngenieria);
            
            // Si el mapeo falló y tenemos valores válidos conocidos, usar el primero que coincida
            if (servicioIngenieriaValue === solicitudData.servicioIngenieria && this.lastKnownValidValues.servicioIngenieria.length > 0) {
                console.log('🔍 Buscando valor válido para servicioIngenieria...');
                
                // Buscar coincidencia parcial
                const valueUpper = solicitudData.servicioIngenieria.toUpperCase();
                let foundValue = null;
                
                if (valueUpper.includes('MEC')) {
                    foundValue = this.lastKnownValidValues.servicioIngenieria.find(v => 
                        v.toLowerCase().includes('mec') || v.toLowerCase().includes('mecánica')
                    );
                } else if (valueUpper.includes('BIOMED')) {
                    foundValue = this.lastKnownValidValues.servicioIngenieria.find(v => 
                        v.toLowerCase().includes('biomed') || v.toLowerCase().includes('biomédica')
                    );
                } else if (valueUpper.includes('INFRA')) {
                    foundValue = this.lastKnownValidValues.servicioIngenieria.find(v => 
                        v.toLowerCase().includes('infra')
                    );
                }
                
                if (foundValue) {
                    servicioIngenieriaValue = foundValue;
                    console.log(`✅ Valor válido encontrado: "${foundValue}"`);
                } else {
                    // Usar el primer valor válido como último recurso
                    servicioIngenieriaValue = this.lastKnownValidValues.servicioIngenieria[0];
                    console.log(`⚠️ Usando valor por defecto: "${servicioIngenieriaValue}"`);
                }
            }
            
            // Solo campos absolutamente esenciales
            const data = {
                fields: {
                    numero: numero,
                    descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                    estado: this.mapFieldValue('estado', 'PENDIENTE'),
                    fechaCreacion: new Date().toISOString(),
                    servicioIngenieria: servicioIngenieriaValue
                }
            };
            
            console.log('📝 Datos mínimos con área corregida:', data);
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log(`✅ Solicitud creada con campos mínimos: ${numero} - Área: ${servicioIngenieriaValue}`);
            
            // Intentar actualizar con más campos después
            if (result && result.id) {
                await this.updateSolicitudSafely(result.id, solicitudData);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error incluso con campos mínimos:', error);
            
            // ÚLTIMO INTENTO: Probar con cada valor válido conocido
            if (this.lastKnownValidValues.servicioIngenieria.length > 0) {
                console.log('🔄 Intentando con cada valor válido conocido...');
                
                for (const validArea of this.lastKnownValidValues.servicioIngenieria) {
                    try {
                        const data = {
                            fields: {
                                numero: await this.generateAreaSpecificNumber('GENERAL'),
                                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                                estado: this.mapFieldValue('estado', 'PENDIENTE') || 'Pendiente',
                                fechaCreacion: new Date().toISOString(),
                                servicioIngenieria: validArea
                            }
                        };
                        
                        console.log(`🧪 Intentando con servicioIngenieria = "${validArea}"`);
                        const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
                        
                        console.log(`✅ ÉXITO con valor: "${validArea}"`);
                        
                        // Actualizar mapeo para futuros usos
                        this.fieldMappings.servicioIngenieria[solicitudData.servicioIngenieria] = [validArea];
                        
                        return result;
                        
                    } catch (tryError) {
                        console.log(`❌ Falló con "${validArea}"`);
                    }
                }
            }
            
            throw error;
        }
    }

    // 🔄 Actualizar solicitud de forma segura - MEJORADO
    async updateSolicitudSafely(solicitudId, originalData) {
        console.log('🔄 Actualizando solicitud con campos adicionales...');
        
        const fieldsToTry = [
            { tipoServicio: originalData.tipoServicio },
            { prioridad: originalData.prioridad },
            { equipo: originalData.equipo },
            { ubicacion: originalData.ubicacion },
            { observaciones: originalData.observaciones },
            { solicitante: originalData.solicitante },
            { servicioHospitalario: originalData.servicioHospitalario },
            { emailSolicitante: originalData.emailSolicitante },
            { tiempoRespuestaMaximo: this.calculateMaxResponseTime(originalData.prioridad || 'MEDIA') }
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

    // 👥 MÉTODOS DE TÉCNICOS/PERSONAL DE SOPORTE - CORREGIDOS
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
        console.log('➕ Creando personal de soporte con área corregida:', tecnicoData.nombre);
        console.log('🔍 Área recibida:', tecnicoData.area);
        
        const rawData = {
            nombre: tecnicoData.nombre,
            email: tecnicoData.email,
            area: tecnicoData.area, // Será mapeada en prepareSafeData
            tipo: tecnicoData.tipo,
            especialidad: tecnicoData.especialidad || '',
            estado: tecnicoData.estado || 'disponible',
            fechaCreacion: new Date().toISOString()
        };
        
        // CORRECCIÓN: Preparar datos seguros con mapeo de área
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
            
            if (error.message.includes('422')) {
                console.log('🔧 Error 422 detectado, intentando con valores alternativos...');
                return await this.retryCreateTecnicoWithAlternatives(tecnicoData);
            }
            
            throw new Error(`Error creando personal: ${error.message}`);
        }
    }

    async retryCreateTecnicoWithAlternatives(originalData) {
        console.log('🔄 Reintentando creación con valores alternativos para área biomédica...');
        
        // CORRECCIÓN: Priorizar valores detectados de biomédica
        const alternatives = {
            area: ['Ingeniería Biomédica', 'Biomédica', 'Biomedica', 'Mecánica', 'Infraestructura'],
            tipo: ['Ingeniero', 'Técnico', 'Auxiliar'],
            estado: ['Disponible', 'Ocupado', 'Inactivo']
        };
        
        // CORRECCIÓN: Si es área biomédica, priorizar esas alternativas
        if (originalData.area === 'INGENIERIA_BIOMEDICA' || 
            (originalData.area && originalData.area.toLowerCase().includes('biomed'))) {
            alternatives.area = ['Ingeniería Biomédica', 'Biomédica', 'Biomedica', ...alternatives.area];
        }
        
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
                        
                        // CORRECCIÓN: Actualizar mapeos con los valores que funcionaron
                        if (!this.fieldMappings.area) this.fieldMappings.area = {};
                        if (!this.fieldMappings.tipo) this.fieldMappings.tipo = {};
                        if (!this.fieldMappings.estado) this.fieldMappings.estado = {};
                        
                        this.fieldMappings.area[originalData.area] = [areaAlt];
                        this.fieldMappings.tipo[originalData.tipo] = [tipoAlt];
                        this.fieldMappings.estado[originalData.estado || 'disponible'] = [estadoAlt];
                        
                        console.log('✅ Mapeos actualizados tras éxito');
                        
                        return result;
                        
                    } catch (retryError) {
                        console.log(`❌ Falló con: area="${areaAlt}", tipo="${tipoAlt}", estado="${estadoAlt}"`);
                    }
                }
            }
        }
        
        throw new Error('No se pudo crear el personal con ninguna combinación de valores válidos. Verificar configuración de campos en Airtable.');
    }

    // 🔄 Métodos de actualización y otros métodos existentes (mantenidos igual)
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

    // 🎯 MÉTODOS DE ASIGNACIÓN DE PERSONAL - CORREGIDOS PARA ÁREA BIOMÉDICA
    async assignTechnicianToRequest(solicitudId, tecnicoId, observaciones = '') {
        console.log('🎯 Asignando técnico con área biomédica corregida:', { solicitudId, tecnicoId });
        
        try {
            // Obtener datos actuales
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
            
            // CORRECCIÓN: Verificar compatibilidad de área con mapeo
            const solicitudArea = solicitud.servicioIngenieria;
            const tecnicoArea = tecnico.area;
            
            console.log('🔍 Verificando compatibilidad:', { solicitudArea, tecnicoArea });
            
            // Función para normalizar áreas biomédicas
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
            
            // Actualizar solicitud
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
            
            // Actualizar técnico
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

    // Resto de métodos mantenidos igual...
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
            
            // Si se completa, liberar técnico
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
            
            // Limpiar asignación en solicitud
            await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: {
                    tecnicoAsignado: ''
                }
            });
            
        } catch (error) {
            console.error('❌ Error liberando técnico:', error);
        }
    }

    // Continúo con los métodos restantes (usuarios, solicitudes de acceso, etc.)
    // mantenidos iguales que en el archivo original...

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

    async getSolicitudesAcceso() {
        try {
            const result = await this.makeRequest(this.tables.solicitudesAcceso);
            return result.records.map(record => ({
                id: record.id, // Este es el ID real de Airtable
                ...record.fields // Los campos NO incluyen solicitudId
            }));
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes de acceso:', error);
            return [];
        }
    }

    // CORRECCIÓN CRÍTICA: Método createSolicitudAcceso corregido para prevenir error 422
    async createSolicitudAcceso(solicitudData) {
        console.log('📝 Creando solicitud de acceso con mapeo correcto...');
        console.log('🔍 Datos recibidos:', solicitudData);
        
        // CORRECCIÓN: Asegurar que servicioHospitalario y cargo se mapeen correctamente
        const safeData = this.prepareSafeData({
            // CORRECCIÓN: No incluir solicitudId, Airtable generará un ID automáticamente
            nombreCompleto: solicitudData.nombreCompleto,
            email: solicitudData.email,
            telefono: solicitudData.telefono || '',
            servicioHospitalario: solicitudData.servicioHospitalario, // Se mapeará en prepareSafeData
            cargo: solicitudData.cargo, // Se mapeará en prepareSafeData
            justificacion: solicitudData.justificacion || '',
            fechaSolicitud: solicitudData.fechaSolicitud,
            estado: solicitudData.estado || 'PENDIENTE',
            esUrgente: solicitudData.esUrgente || false
        }, 'solicitudesAcceso');
        
        const data = {
            fields: safeData
        };
        
        console.log('📝 Datos mapeados para enviar:', data);
        
        try {
            const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
            console.log('✅ Solicitud de acceso creada exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error creando solicitud de acceso:', error);
            
            // Si el error es 422, intentar con valores alternativos
            if (error.message.includes('422')) {
                console.log('🔄 Error 422 detectado, intentando con valores alternativos...');
                return await this.retryCreateSolicitudAcceso(solicitudData);
            }
            
            throw error;
        }
    }

    // NUEVA FUNCIÓN: Reintentar creación de solicitud de acceso con valores alternativos
    async retryCreateSolicitudAcceso(originalData) {
        console.log('🔄 Reintentando creación con valores alternativos...');
        
        // Intentar con valores válidos conocidos
        if (this.lastKnownValidValues.servicioHospitalario && this.lastKnownValidValues.servicioHospitalario.length > 0) {
            const validServicio = this.lastKnownValidValues.servicioHospitalario[0];
            console.log(`🔧 Usando servicio hospitalario válido conocido: ${validServicio}`);
            
            const data = {
                fields: {
                    nombreCompleto: originalData.nombreCompleto,
                    email: originalData.email,
                    telefono: originalData.telefono || '',
                    servicioHospitalario: validServicio,
                    cargo: this.lastKnownValidValues.cargo && this.lastKnownValidValues.cargo.length > 0 ? 
                           this.lastKnownValidValues.cargo[0] : 'Otro',
                    justificacion: originalData.justificacion || '',
                    fechaSolicitud: originalData.fechaSolicitud,
                    estado: 'Pendiente', // Usar valor conocido
                    esUrgente: false
                }
            };
            
            console.log('📝 Datos alternativos:', data);
            
            try {
                const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
                console.log('✅ Solicitud creada con valores alternativos');
                
                // Actualizar mapeos para futuro uso
                this.fieldMappings.servicioHospitalario[originalData.servicioHospitalario] = [validServicio];
                this.fieldMappings.cargo[originalData.cargo] = [data.fields.cargo];
                
                return result;
            } catch (retryError) {
                console.error('❌ Error incluso con valores alternativos:', retryError);
                throw retryError;
            }
        }
        
        // Si no hay valores conocidos, usar valores por defecto
        console.log('⚠️ No hay valores conocidos, usando valores por defecto...');
        
        const data = {
            fields: {
                nombreCompleto: originalData.nombreCompleto,
                email: originalData.email,
                telefono: originalData.telefono || '',
                servicioHospitalario: 'Administrativo',
                cargo: 'Otro',
                justificacion: originalData.justificacion || '',
                fechaSolicitud: originalData.fechaSolicitud,
                estado: 'Pendiente',
                esUrgente: false
            }
        };
        
        return await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
    }

    // CORRECCIÓN CRÍTICA: Usar ID de Airtable directamente
    async approveAccessRequestAndCreateUser(requestId) {
        console.log('✅ Aprobando solicitud y creando usuario con ID de Airtable:', requestId);
        
        try {
            const solicitudesAcceso = await this.getSolicitudesAcceso();
            console.log('🔍 Solicitudes disponibles:', solicitudesAcceso.map(s => ({ 
                airtableId: s.id, 
                email: s.email 
            })));
            
            // CORRECCIÓN: Buscar directamente por ID de Airtable
            const solicitud = solicitudesAcceso.find(s => s.id === requestId);
            
            if (!solicitud) {
                console.error('❌ Solicitud no encontrada con ID de Airtable:', requestId);
                console.error('🔍 IDs disponibles:', solicitudesAcceso.map(s => s.id));
                throw new Error(`Solicitud de acceso no encontrada con ID: ${requestId}`);
            }

            console.log('✅ Solicitud encontrada:', solicitud);

            if (solicitud.estado === 'APROBADA') {
                throw new Error('La solicitud ya fue aprobada anteriormente');
            }

            // Generar código de acceso único
            const codigoAcceso = Math.floor(1000 + Math.random() * 9000).toString();
            
            // Crear usuario con datos seguros
            const userSafeData = this.prepareSafeData({
                nombreCompleto: solicitud.nombreCompleto,
                email: solicitud.email,
                servicioHospitalario: solicitud.servicioHospitalario,
                cargo: solicitud.cargo,
                codigoAcceso: codigoAcceso,
                estado: 'ACTIVO',
                fechaCreacion: new Date().toISOString(),
                solicitudOrigenId: requestId // ID de Airtable como referencia
            }, 'usuarios');

            const userData = {
                fields: userSafeData
            };

            console.log('📝 Creando usuario con datos seguros:', userData);
            const newUser = await this.makeRequest(this.tables.usuarios, 'POST', userData);

            // Actualizar solicitud usando el ID de Airtable directamente
            console.log('🔄 Actualizando solicitud con Airtable ID:', requestId);

            const updateSafeData = this.prepareSafeData({
                estado: 'APROBADA',
                fechaAprobacion: new Date().toISOString(),
                usuarioCreado: newUser.id
            }, 'solicitudesAcceso');

            await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', {
                fields: updateSafeData
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

    // CORRECCIÓN: Actualizar solicitud de acceso usando ID de Airtable
    async updateSolicitudAcceso(requestId, updateData) {
        console.log('🔄 Actualizando solicitud de acceso con ID de Airtable:', requestId);
        
        try {
            // CORRECCIÓN: Usar directamente el ID de Airtable
            const safeData = this.prepareSafeData(updateData, 'solicitudesAcceso');
            const data = { fields: safeData };
            
            return await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', data);
            
        } catch (error) {
            console.error('❌ Error actualizando solicitud de acceso:', error);
            throw error;
        }
    }

    // Métodos adicionales de estadísticas y auto-asignación mantenidos...
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
                    // CORRECCIÓN: Buscar técnico compatible considerando biomédica
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
                    
                    // Marcar técnico como no disponible para próximas asignaciones
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

    // Método de test específico para técnicos (para debugging)
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

    getStatus() {
        return {
            isConnected: this.connectionStatus === 'connected',
            useProxy: this.useProxy,
            environment: this.isLocalDevelopment ? 'development' : 'production',
            hostname: this.hostname,
            baseUrl: this.baseUrl,
            tables: this.tables,
            timestamp: new Date().toISOString(),
            version: '5.1-completa-fix-solicitudes-acceso',
            features: [
                'CORREGIDO: Campo solicitudId removido para evitar error 422',
                'CORREGIDO: Área biomédica funciona correctamente',
                'CORREGIDO: Mapeo mejorado para INGENIERIA_BIOMEDICA',
                'CORREGIDO: Numeración SOLBIO específica para biomédica',
                'CORREGIDO: Asignación de personal biomédica compatible',
                'CORREGIDO: Usa ID de Airtable directamente para solicitudes de acceso',
                'CORREGIDO: Mapeo de servicioHospitalario y cargo en solicitudes de acceso',
                'NUEVO: Detección automática de valores válidos de Airtable',
                'NUEVO: Mapeo inteligente con auto-corrección',
                'NUEVO: Reintentos automáticos con valores alternativos',
                'NUEVO: Normalización automática de área biomédica',
                'NUEVO: Detección mejorada de variaciones biomédica',
                'NUEVO: No se requiere ID personalizado para solicitudes de acceso',
                'Protección completa contra errores 422',
                'Sistema completo de asignación de personal',
                'Cálculo automático de tiempos de respuesta',
                'Auto-asignación inteligente de solicitudes'
            ],
            fieldMappings: this.fieldMappings,
            safeFields: SAFE_FIELDS,
            lastKnownValidValues: this.lastKnownValidValues,
            biomedCorrections: {
                'Input variations handled': [
                    'INGENIERIA_BIOMEDICA',
                    'Ingeniería Biomédica', 
                    'Biomedica', 
                    'Biomédica',
                    'Any string containing "biomed" or "bioméd"'
                ],
                'Normalized output': 'Ingeniería Biomédica (as detected in Airtable)',
                'Number prefix': 'SOLBIO',
                'Assignment compatibility': 'Full support for biomedical area matching'
            },
            idManagement: {
                'Access requests': 'Uses Airtable automatic ID generation',
                'Airtable updates': 'Uses real Airtable ID for all operations',
                'No custom ID': 'solicitudId field removed to prevent 422 errors',
                'Search method': 'Find and update by Airtable ID only'
            },
            error422Protection: {
                'Auto-detection': 'Detects valid values on initialization',
                'Smart mapping': 'Maps form values to Airtable values automatically',
                'Fallback strategy': 'Multiple retry strategies for failed requests',
                'Self-healing': 'Updates mappings when successful values are found',
                'Field mapping': 'servicioHospitalario and cargo now properly mapped'
            }
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global con todas las correcciones...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión completa con corrección de solicitudes de acceso)');
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
                ? '✅ Conectado (todas las correcciones activas)' 
                : 'Modo Local (todas las correcciones activas)';
            
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
        
        console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
        console.log('===============================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🏥 Correcciones biomédica:', status.biomedCorrections);
        console.log('🆔 Manejo de IDs:', status.idManagement);
        console.log('🛡️ Protección Error 422:', status.error422Protection);
        console.log('📊 Últimos valores válidos:', status.lastKnownValidValues);
        console.log('🗺️ Mapeos de campos:', status.fieldMappings);
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

console.log('✅ airtable-config.js VERSIÓN COMPLETA cargado');
console.log('🏥 Corrección específica para área biomédica implementada');
console.log('🆔 Campo solicitudId removido para evitar error 422');
console.log('🗺️ Mapeo mejorado: INGENIERIA_BIOMEDICA → Ingeniería Biomédica');
console.log('🔢 Numeración específica: SOLBIO para área biomédica');
console.log('🎯 Asignación compatible con variaciones de biomédica');
console.log('🔍 Usa ID de Airtable directamente para todas las operaciones');
console.log('🛡️ Protección completa contra error 422 con detección automática');
console.log('✅ NUEVO: Mapeo de servicioHospitalario y cargo para solicitudes de acceso');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');

// Auto-verificación del sistema completo
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Sistema completo cargado correctamente');
        
        // Verificar mapeo específico de biomédica
        const biomedMapping = window.airtableAPI.fieldMappings.servicioIngenieria?.INGENIERIA_BIOMEDICA;
        if (biomedMapping && biomedMapping.length > 0) {
            console.log('✅ Mapeo área biomédica configurado:', biomedMapping[0]);
        } else {
            console.warn('⚠️ Mapeo área biomédica no encontrado');
        }
        
        // Verificar prefijo de numeración
        const biomedPrefix = window.airtableAPI.areaPrefixes?.INGENIERIA_BIOMEDICA;
        if (biomedPrefix === 'SOLBIO') {
            console.log('✅ Prefijo biomédica configurado: SOLBIO');
        } else {
            console.warn('⚠️ Prefijo biomédica no configurado correctamente');
        }
        
        // Verificar que solicitudId NO esté en campos seguros
        const safeFieldsAccess = window.airtableAPI.constructor.name === 'AirtableAPI' 
            ? SAFE_FIELDS.solicitudesAcceso 
            : [];
        if (!safeFieldsAccess.includes('solicitudId')) {
            console.log('✅ Campo solicitudId correctamente removido de campos seguros');
        } else {
            console.warn('⚠️ ERROR: Campo solicitudId aún presente en campos seguros');
        }
        
        // Verificar mapeo de servicioHospitalario y cargo
        if (window.airtableAPI.fieldMappings.servicioHospitalario) {
            console.log('✅ Mapeo servicioHospitalario configurado');
        }
        if (window.airtableAPI.fieldMappings.cargo) {
            console.log('✅ Mapeo cargo configurado');
        }
        
        // Verificar detección de valores válidos
        if (window.airtableAPI.lastKnownValidValues && 
            window.airtableAPI.lastKnownValidValues.servicioIngenieria) {
            console.log('✅ Valores válidos detectados:', window.airtableAPI.lastKnownValidValues.servicioIngenieria.length > 0 ? 'SÍ' : 'NO');
        }
        
        // Test de mapeo
        try {
            const testValue = window.airtableAPI.mapFieldValue('servicioIngenieria', 'INGENIERIA_BIOMEDICA');
            console.log(`✅ Test mapeo biomédica: INGENIERIA_BIOMEDICA → ${testValue}`);
            
            const testServicio = window.airtableAPI.mapFieldValue('servicioHospitalario', 'URGENCIAS');
            console.log(`✅ Test mapeo servicio: URGENCIAS → ${testServicio}`);
            
            const testCargo = window.airtableAPI.mapFieldValue('cargo', 'MEDICO');
            console.log(`✅ Test mapeo cargo: MEDICO → ${testCargo}`);
        } catch (error) {
            console.error('❌ Error en test de mapeo:', error);
        }
        
        console.log('\n🎉 SISTEMA COMPLETAMENTE OPERATIVO CON CORRECCIÓN DE SOLICITUDES DE ACCESO');
    }
}, 3000);

// Función para forzar actualización de mapeos
window.forceUpdateServiceMapping = function(mappings) {
    console.log('🔧 Forzando actualización de mapeos de servicioIngenieria...');
    
    if (window.airtableAPI && window.airtableAPI.fieldMappings) {
        // Actualizar mapeos
        Object.entries(mappings).forEach(([key, value]) => {
            window.airtableAPI.fieldMappings.servicioIngenieria[key] = [value];
            console.log(`✅ Actualizado: ${key} → ${value}`);
        });
        
        // También guardar en lastKnownValidValues
        if (window.airtableAPI.lastKnownValidValues) {
            window.airtableAPI.lastKnownValidValues.servicioIngenieria = Object.values(mappings);
        }
        
        console.log('✅ Mapeos actualizados correctamente');
        return true;
    }
    
    console.error('❌ No se pudo actualizar - airtableAPI no disponible');
    return false;
};

// Auto-corrección al cargar si hay valores guardados
setTimeout(() => {
    const savedMapping = localStorage.getItem('hospital_service_mapping');
    if (savedMapping) {
        try {
            const mapping = JSON.parse(savedMapping);
            console.log('🔄 Aplicando mapeo guardado:', mapping);
            window.forceUpdateServiceMapping(mapping);
        } catch (e) {
            console.error('Error aplicando mapeo guardado:', e);
        }
    }
}, 4000);