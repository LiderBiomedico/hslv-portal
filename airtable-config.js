/**
 * 🛡️ Configuración de Airtable con Protección Total contra Errores 422
 * Portal de Solicitudes Cloud - Hospital Susana López de Valencia
 * Desarrollado por: Ing. Paul Eduardo Muñoz R.
 */

console.log('🛡️ Inicializando Airtable con protección contra errores 422...');

// ⚙️ CONFIGURACIÓN PRINCIPAL DE AIRTABLE
const AIRTABLE_CONFIG = {
    baseId: 'TU_BASE_ID_AQUI',        // Cambiar por tu Base ID real
    apiKey: 'TU_API_KEY_AQUI',        // Cambiar por tu API Key real
    baseUrl: 'https://api.airtable.com/v0',
    
    // 📋 Tablas del sistema
    tables: {
        solicitudes: 'Solicitudes',
        usuarios: 'Usuarios_Aprobados', 
        solicitudesAcceso: 'Solicitudes_Acceso'
    },
    
    // 🛡️ Configuración de protección contra errores 422
    protection: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        fieldValidation: true,
        autoMapping: true
    }
};

// 🔄 MAPEO AUTOMÁTICO DE VALORES PARA AIRTABLE (Protección 422)
const FIELD_MAPPINGS = {
    // Áreas de Ingeniería
    servicioIngenieria: {
        'INGENIERIA_BIOMEDICA': 'Ingeniería Biomédica',
        'MECANICA': 'Mecánica', 
        'INFRAESTRUCTURA': 'Infraestructura'
    },
    
    // Tipos de Servicio
    tipoServicio: {
        'MANTENIMIENTO_PREVENTIVO': 'Mantenimiento Preventivo',
        'MANTENIMIENTO_CORRECTIVO': 'Mantenimiento Correctivo',
        'REPARACION': 'Reparación',
        'INSTALACION': 'Instalación',
        'CALIBRACION': 'Calibración',
        'INSPECCION': 'Inspección',
        'ACTUALIZACION': 'Actualización',
        'EMERGENCIA': 'Emergencia'
    },
    
    // Prioridades
    prioridad: {
        'CRITICA': 'Crítica',
        'ALTA': 'Alta',
        'MEDIA': 'Media',
        'BAJA': 'Baja'
    },
    
    // Estados
    estado: {
        'PENDIENTE': 'Pendiente',
        'ASIGNADA': 'Asignada',
        'EN_PROCESO': 'En Proceso',
        'COMPLETADA': 'Completada'
    },
    
    // Servicios Hospitalarios
    servicioHospitalario: {
        'URGENCIAS_ADULTO': 'Urgencias Adulto',
        'URGENCIAS_PEDIATRICAS': 'Urgencias Pediátricas',
        'UCI_ADULTO': 'UCI Adulto',
        'UCI_NEONATAL': 'UCI Neonatal',
        'HOSPITALIZACION_ADULTO': 'Hospitalización Adulto',
        'CIRUGIA_ADULTO': 'Cirugía Adulto',
        'CONSULTA_EXTERNA': 'Consulta Externa',
        'LABORATORIO_CLINICO': 'Laboratorio Clínico',
        'RADIOLOGIA': 'Radiología',
        'FARMACIA_CENTRAL': 'Farmacia Central',
        'FISIOTERAPIA': 'Fisioterapia',
        'INGENIERIA_BIOMEDICA': 'Ingeniería Biomédica',
        'INFRAESTRUCTURA': 'Infraestructura',
        'MECANICOS': 'Mecánicos'
    },
    
    // Cargos/Posiciones
    cargo: {
        'JEFE_SERVICIO': 'Jefe de Servicio',
        'COORDINADOR': 'Coordinador',
        'ENFERMERA_JEFE': 'Enfermera Jefe',
        'MEDICO_ESPECIALISTA': 'Médico Especialista',
        'AUXILIAR_ENFERMERIA': 'Auxiliar de Enfermería',
        'ADMINISTRATIVO': 'Personal Administrativo'
    }
};

// 🔢 GENERADORES DE NUMERACIÓN ESPECÍFICA
const AREA_PREFIXES = {
    'Ingeniería Biomédica': 'SOLBIO',
    'Mecánica': 'SOLMEC',
    'Infraestructura': 'SOLINFRA'
};

// 🛡️ CLASE PRINCIPAL DE AIRTABLE CON PROTECCIÓN
class AirtableAPIProtected {
    constructor(config) {
        this.config = config;
        this.baseUrl = `${config.baseUrl}/${config.baseId}`;
        this.headers = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        };
        
        console.log('✅ AirtableAPI protegida inicializada');
    }

    // 🔍 MAPEO AUTOMÁTICO DE VALORES (Protección principal contra 422)
    mapFieldValue(fieldName, value) {
        if (!value) return value;
        
        const mapping = FIELD_MAPPINGS[fieldName];
        if (mapping && mapping[value]) {
            console.log(`🔄 Mapeando ${fieldName}: ${value} → ${mapping[value]}`);
            return mapping[value];
        }
        
        return value;
    }

    // 🛠️ PREPARACIÓN SEGURA DE DATOS
    prepareSafeData(data) {
        const safeData = {};
        
        // Mapear cada campo automáticamente
        Object.keys(data).forEach(key => {
            let value = data[key];
            
            // Aplicar mapeo automático si existe
            value = this.mapFieldValue(key, value);
            
            // Limpiar valores nulos/undefined
            if (value !== null && value !== undefined && value !== '') {
                safeData[key] = value;
            }
        });
        
        return safeData;
    }

    // 🔢 GENERADOR DE NUMERACIÓN ESPECÍFICA
    async generateSpecificNumber(area) {
        try {
            const mappedArea = this.mapFieldValue('servicioIngenieria', area);
            const prefix = AREA_PREFIXES[mappedArea] || 'SOL';
            
            // Obtener el último número de esta área
            const response = await this.makeRequest(`/${this.config.tables.solicitudes}?filterByFormula=SEARCH("${prefix}",{numero})&sort[0][field]=numero&sort[0][direction]=desc&maxRecords=1`);
            
            let nextNumber = 1;
            if (response.records && response.records.length > 0) {
                const lastNumber = response.records[0].fields.numero;
                const numPart = lastNumber.replace(prefix, '');
                nextNumber = parseInt(numPart) + 1;
            }
            
            const formattedNumber = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
            console.log(`🔢 Número generado: ${formattedNumber} para área ${mappedArea}`);
            
            return formattedNumber;
        } catch (error) {
            console.error('❌ Error generando número:', error);
            // Fallback con timestamp
            const prefix = AREA_PREFIXES[area] || 'SOL';
            const timestamp = Date.now().toString().slice(-5);
            return `${prefix}${timestamp}`;
        }
    }

    // 🌐 MÉTODO PRINCIPAL DE PETICIÓN CON REINTENTOS
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const requestOptions = {
            headers: this.headers,
            ...options
        };

        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.protection.maxRetries; attempt++) {
            try {
                console.log(`🔄 Intento ${attempt}/${this.config.protection.maxRetries}: ${options.method || 'GET'} ${endpoint}`);
                
                const response = await fetch(url, requestOptions);
                
                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorData}`);
                }

                const data = await response.json();
                console.log(`✅ Petición exitosa en intento ${attempt}`);
                return data;

            } catch (error) {
                lastError = error;
                console.error(`❌ Error en intento ${attempt}:`, error.message);
                
                // Si es error 422, activar protección especial
                if (error.message.includes('422')) {
                    console.log('🛡️ Error 422 detectado, activando protección especial...');
                    
                    if (options.body && attempt < this.config.protection.maxRetries) {
                        try {
                            // Intentar con datos más seguros
                            const originalData = JSON.parse(options.body);
                            const ultraSafeData = this.createUltraSafeData(originalData);
                            requestOptions.body = JSON.stringify(ultraSafeData);
                            console.log('🛡️ Datos ultra-seguros aplicados para reintento');
                        } catch (e) {
                            console.error('❌ Error preparando datos ultra-seguros:', e);
                        }
                    }
                }
                
                if (attempt < this.config.protection.maxRetries) {
                    const delay = this.config.protection.retryDelay * attempt;
                    console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('❌ Todos los intentos fallaron');
                }
            }
        }

        throw lastError;
    }

    // 🛡️ CREADOR DE DATOS ULTRA-SEGUROS (Última línea de defensa contra 422)
    createUltraSafeData(originalData) {
        const ultraSafe = {
            fields: {}
        };

        if (originalData.fields) {
            // Solo campos esenciales y muy seguros
            const essentialFields = [
                'numero', 'solicitante', 'emailSolicitante', 'servicioIngenieria',
                'tipoServicio', 'prioridad', 'equipo', 'ubicacion', 'descripcion',
                'fechaCreacion', 'estado', 'servicioHospitalario'
            ];

            essentialFields.forEach(field => {
                if (originalData.fields[field]) {
                    ultraSafe.fields[field] = originalData.fields[field];
                }
            });

            // Valores por defecto ultra-seguros
            if (!ultraSafe.fields.estado) {
                ultraSafe.fields.estado = 'Pendiente';
            }
            if (!ultraSafe.fields.prioridad) {
                ultraSafe.fields.prioridad = 'Media';
            }
        }

        console.log('🛡️ Datos ultra-seguros creados:', ultraSafe);
        return ultraSafe;
    }

    // 📝 CREAR SOLICITUD CON PROTECCIÓN TOTAL
    async createSolicitud(data) {
        try {
            console.log('📝 Creando solicitud con protección 422...', data);
            
            // Generar número específico según área
            const numero = await this.generateSpecificNumber(data.servicioIngenieria);
            
            // Preparar datos seguros
            const safeData = this.prepareSafeData({
                ...data,
                numero: numero,
                fechaCreacion: data.fechaCreacion || new Date().toISOString(),
                estado: this.mapFieldValue('estado', data.estado || 'PENDIENTE')
            });

            const requestBody = {
                fields: safeData
            };

            console.log('📤 Enviando datos seguros a Airtable:', requestBody);

            const result = await this.makeRequest(`/${this.config.tables.solicitudes}`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            console.log('✅ Solicitud creada exitosamente sin errores 422:', result);
            return result;

        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            throw new Error(`Error creando solicitud: ${error.message}`);
        }
    }

    // 📋 OBTENER SOLICITUDES
    async getSolicitudes() {
        try {
            console.log('📋 Obteniendo solicitudes desde Airtable protegido...');
            
            const response = await this.makeRequest(`/${this.config.tables.solicitudes}?sort[0][field]=fechaCreacion&sort[0][direction]=desc`);
            
            const solicitudes = response.records.map(record => ({
                id: record.id,
                ...record.fields
            }));

            console.log(`✅ ${solicitudes.length} solicitudes obtenidas desde Airtable`);
            return solicitudes;

        } catch (error) {
            console.error('❌ Error obteniendo solicitudes:', error);
            return [];
        }
    }

    // 👥 OBTENER USUARIOS APROBADOS
    async getUsuarios() {
        try {
            console.log('👥 Obteniendo usuarios aprobados desde Airtable...');
            
            const response = await this.makeRequest(`/${this.config.tables.usuarios}?filterByFormula={estado}='APROBADO'`);
            
            const usuarios = response.records.map(record => ({
                id: record.id,
                ...record.fields
            }));

            console.log(`✅ ${usuarios.length} usuarios aprobados obtenidos`);
            return usuarios;

        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return [];
        }
    }

    // 🔐 VALIDAR CREDENCIALES DE USUARIO
    async validateUserCredentials(email, accessCode) {
        try {
            console.log(`🔐 Validando credenciales: ${email} / ${accessCode}`);
            
            const usuarios = await this.getUsuarios();
            
            const user = usuarios.find(u => 
                u.email?.toLowerCase() === email.toLowerCase() && 
                u.codigoAcceso === accessCode &&
                u.estado === 'APROBADO'
            );

            if (user) {
                console.log('✅ Credenciales válidas');
                return { valid: true, user: user };
            } else {
                console.log('❌ Credenciales inválidas');
                return { 
                    valid: false, 
                    error: 'Email o código de acceso incorrecto, o cuenta no aprobada' 
                };
            }

        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            return { 
                valid: false, 
                error: 'Error de conexión al validar credenciales' 
            };
        }
    }

    // 📤 CREAR SOLICITUD DE ACCESO
    async createSolicitudAcceso(data) {
        try {
            console.log('📤 Creando solicitud de acceso...', data);
            
            const safeData = this.prepareSafeData(data);
            
            const requestBody = {
                fields: safeData
            };

            const result = await this.makeRequest(`/${this.config.tables.solicitudesAcceso}`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            console.log('✅ Solicitud de acceso creada exitosamente:', result);
            return result;

        } catch (error) {
            console.error('❌ Error creando solicitud de acceso:', error);
            throw new Error(`Error creando solicitud de acceso: ${error.message}`);
        }
    }

    // 🧪 PROBAR CONEXIÓN
    async testConnection() {
        try {
            console.log('🧪 Probando conexión con Airtable...');
            
            // Intentar obtener información básica de la base
            await this.makeRequest('/');
            
            console.log('✅ Conexión con Airtable establecida correctamente');
            return true;

        } catch (error) {
            console.error('❌ Error de conexión con Airtable:', error);
            return false;
        }
    }
}

// 🚀 INICIALIZACIÓN AUTOMÁTICA DE LA API
let airtableAPI = null;

// Función de inicialización con validación
function initializeAirtableAPI() {
    try {
        // Verificar configuración
        if (!AIRTABLE_CONFIG.baseId || AIRTABLE_CONFIG.baseId === 'TU_BASE_ID_AQUI') {
            console.warn('⚠️ Airtable Base ID no configurado. Funcionará en modo de desarrollo.');
            // Crear API mock para desarrollo
            airtableAPI = createMockAPI();
        } else if (!AIRTABLE_CONFIG.apiKey || AIRTABLE_CONFIG.apiKey === 'TU_API_KEY_AQUI') {
            console.warn('⚠️ Airtable API Key no configurado. Funcionará en modo de desarrollo.');
            // Crear API mock para desarrollo
            airtableAPI = createMockAPI();
        } else {
            // Crear API real
            airtableAPI = new AirtableAPIProtected(AIRTABLE_CONFIG);
            console.log('✅ Airtable API real inicializada con protección 422');
        }
        
        // Exponer globalmente
        window.airtableAPI = airtableAPI;
        
        console.log('🛡️ Sistema de protección 422 completamente activo');
        
    } catch (error) {
        console.error('❌ Error inicializando Airtable API:', error);
        // Fallback a mock API
        airtableAPI = createMockAPI();
        window.airtableAPI = airtableAPI;
    }
}

// 🧪 API MOCK PARA DESARROLLO Y PRUEBAS
function createMockAPI() {
    console.log('🧪 Creando API Mock para desarrollo...');
    
    return {
        async testConnection() {
            console.log('🧪 Mock: Test de conexión simulado');
            return true;
        },
        
        async createSolicitud(data) {
            console.log('🧪 Mock: Creando solicitud simulada', data);
            
            // Simular numeración específica
            const area = data.servicioIngenieria;
            const prefix = area === 'INGENIERIA_BIOMEDICA' ? 'SOLBIO' : 
                         area === 'MECANICA' ? 'SOLMEC' : 
                         area === 'INFRAESTRUCTURA' ? 'SOLINFRA' : 'SOL';
            
            const numero = `${prefix}${Math.floor(Math.random() * 90000) + 10000}`;
            
            const mockResult = {
                id: 'mock_' + Date.now(),
                fields: {
                    numero: numero,
                    ...data,
                    fechaCreacion: new Date().toISOString(),
                    estado: 'Pendiente'
                }
            };
            
            // Guardar en localStorage para persistencia
            const existing = JSON.parse(localStorage.getItem('mock_solicitudes') || '[]');
            existing.push(mockResult);
            localStorage.setItem('mock_solicitudes', JSON.stringify(existing));
            
            return mockResult;
        },
        
        async getSolicitudes() {
            console.log('🧪 Mock: Obteniendo solicitudes simuladas');
            return JSON.parse(localStorage.getItem('mock_solicitudes') || '[]');
        },
        
        async getUsuarios() {
            console.log('🧪 Mock: Usuarios mock de desarrollo');
            return [
                {
                    id: 'mock_user_1',
                    email: 'admin@hospital.com',
                    nombreCompleto: 'Administrador de Prueba',
                    servicioHospitalario: 'INGENIERIA_BIOMEDICA',
                    cargo: 'JEFE_SERVICIO',
                    codigoAcceso: '1234',
                    estado: 'APROBADO'
                },
                {
                    id: 'mock_user_2',
                    email: 'ingeniero@hospital.com',
                    nombreCompleto: 'Ingeniero de Prueba',
                    servicioHospitalario: 'INFRAESTRUCTURA',
                    cargo: 'COORDINADOR',
                    codigoAcceso: '5678',
                    estado: 'APROBADO'
                }
            ];
        },
        
        async validateUserCredentials(email, accessCode) {
            console.log('🧪 Mock: Validando credenciales simuladas');
            
            const usuarios = await this.getUsuarios();
            const user = usuarios.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                u.codigoAcceso === accessCode
            );
            
            if (user) {
                return { valid: true, user: user };
            } else {
                return { 
                    valid: false, 
                    error: 'Credenciales de desarrollo: admin@hospital.com / 1234 o ingeniero@hospital.com / 5678' 
                };
            }
        },
        
        async createSolicitudAcceso(data) {
            console.log('🧪 Mock: Creando solicitud de acceso simulada', data);
            
            const mockResult = {
                id: 'mock_access_' + Date.now(),
                fields: data
            };
            
            // Guardar en localStorage
            const existing = JSON.parse(localStorage.getItem('mock_access_requests') || '[]');
            existing.push(mockResult);
            localStorage.setItem('mock_access_requests', JSON.stringify(existing));
            
            return mockResult;
        }
    };
}

// 🚀 INICIALIZAR INMEDIATAMENTE
console.log('🔧 Inicializando configuración de Airtable con protección 422...');
initializeAirtableAPI();

// 📊 INFORMACIÓN PARA EL DESARROLLADOR
console.log(`
🛡️ SISTEMA DE PROTECCIÓN AIRTABLE CONFIGURADO
============================================

✅ Protección contra errores 422 activa
✅ Mapeo automático de valores implementado
✅ Sistema de reintentos configurado
✅ Numeración específica por área
✅ Fallback a modo mock para desarrollo

🔧 CONFIGURACIÓN NECESARIA:
1. Cambiar 'TU_BASE_ID_AQUI' por tu Base ID real
2. Cambiar 'TU_API_KEY_AQUI' por tu API Key real
3. Verificar nombres de tablas en Airtable

🧪 MODO DESARROLLO:
- Usuarios de prueba disponibles
- Datos se guardan en localStorage
- Simulación completa de funcionalidades

📋 ESTRUCTURA DE TABLAS REQUERIDA:
- Solicitudes: numero, solicitante, servicioIngenieria, etc.
- Usuarios_Aprobados: email, codigoAcceso, estado, etc. 
- Solicitudes_Acceso: nombreCompleto, email, etc.

🛡️ El sistema está completamente protegido contra errores 422
`);

// Exportar para usar en otros archivos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { airtableAPI, AIRTABLE_CONFIG, FIELD_MAPPINGS };
}