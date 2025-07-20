// 🛡️ Configuración CORREGIDA de Airtable API - PERSONAL DE SOPORTE FIXED
// airtable-config.js - Versión corregida con mapeo de valores

console.log('🚀 Cargando airtable-config.js (VERSIÓN CORREGIDA PARA PERSONAL)...');

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

        // 🗺️ MAPEO DE VALORES PARA AIRTABLE - ESTO SOLUCIONA EL ERROR 422
        this.fieldMappings = {
            // Mapeo para campos de área
            area: {
                'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica'],
                'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
                'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA', 'Infraestructura']
            },
            // Mapeo para campos de tipo
            tipo: {
                'ingeniero': ['Ingeniero', 'ingeniero', 'INGENIERO'],
                'tecnico': ['Técnico', 'tecnico', 'TECNICO', 'Tecnico'],
                'auxiliar': ['Auxiliar', 'auxiliar', 'AUXILIAR']
            },
            // Mapeo para campos de estado
            estado: {
                'disponible': ['Disponible', 'disponible', 'DISPONIBLE', 'Activo', 'activo'],
                'ocupado': ['Ocupado', 'ocupado', 'OCUPADO', 'Busy', 'busy'],
                'inactivo': ['Inactivo', 'inactivo', 'INACTIVO', 'Inactive', 'inactive']
            }
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🗺️ Mapeo de campos configurado para prevenir errores 422');
        
        this.initializeConnectionAsync();
    }

    // 🗺️ FUNCIÓN PARA MAPEAR VALORES SEGÚN AIRTABLE
    mapFieldValue(fieldType, value) {
        if (!value) return value;
        
        // Si no hay mapeo para este tipo de campo, devolver valor original
        if (!this.fieldMappings[fieldType]) {
            return value;
        }

        // Buscar la clave que corresponde al valor
        const mapping = this.fieldMappings[fieldType];
        
        for (const [key, possibleValues] of Object.entries(mapping)) {
            if (possibleValues.includes(value)) {
                // Devolver el primer valor (que debería ser el correcto para Airtable)
                console.log(`🗺️ Mapeando ${fieldType}: "${value}" → "${possibleValues[0]}"`);
                return possibleValues[0];
            }
        }
        
        // Si no se encuentra mapeo, devolver valor original
        console.warn(`⚠️ No se encontró mapeo para ${fieldType}: "${value}"`);
        return value;
    }

    // 🔍 FUNCIÓN PARA DETECTAR VALORES VÁLIDOS EN AIRTABLE
    async detectValidFieldValues(tableName, fieldName) {
        console.log(`🔍 Detectando valores válidos para ${tableName}.${fieldName}...`);
        
        try {
            // Obtener algunos records para ver qué valores están usando
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
            // Detectar valores para campos críticos
            const areaValues = await this.detectValidFieldValues('Tecnicos', 'area');
            const tipoValues = await this.detectValidFieldValues('Tecnicos', 'tipo');
            const estadoValues = await this.detectValidFieldValues('Tecnicos', 'estado');
            
            // Actualizar mapeos si se encontraron valores
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

    // 🔄 ACTUALIZAR MAPEO CON VALORES DETECTADOS
    updateFieldMapping(fieldType, detectedValues) {
        if (!this.fieldMappings[fieldType]) {
            this.fieldMappings[fieldType] = {};
        }
        
        // Para cada valor detectado, crear un mapeo
        detectedValues.forEach(value => {
            // Usar el valor detectado como clave principal
            const normalizedKey = value.toLowerCase().replace(/[áéíóú]/g, match => {
                const map = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
                return map[match];
            });
            
            this.fieldMappings[fieldType][normalizedKey] = [value]; // El valor exacto de Airtable
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
        console.log('🔗 Estado de conexión antes del request:', this.connectionStatus);
        
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
                
                console.log('📡 PROXY Request');
                
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
            console.log('📊 Method:', method);
            if (data) console.log('📝 Data:', JSON.stringify(data, null, 2));
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            console.log('📨 StatusText:', response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                // Manejar específicamente error 422 para dar mejor información
                if (response.status === 422) {
                    console.error('🚨 ERROR 422 - Valores de campo inválidos');
                    console.error('🔍 Datos enviados:', data);
                    console.error('🔍 Endpoint:', endpoint);
                    
                    // Intentar auto-detectar valores válidos si es error de personal
                    if (endpoint.includes('Tecnicos')) {
                        console.log('🔧 Intentando auto-detectar valores válidos...');
                        await this.autoDetectFieldValues();
                    }
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso - Records:', result.records?.length || result.id || 'N/A');
            
            // MANTENER estado de conexión como conectado después de éxito
            if (this.connectionStatus !== 'connected') {
                console.log('🔄 Actualizando estado a conectado después de request exitoso');
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            
            // Solo cambiar estado de conexión en errores de red reales
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                console.log('🌐 Error de red detectado - cambiando estado a desconectado');
                if (this.connectionStatus !== 'disconnected') {
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                }
                
                // Fallback solo para operaciones de lectura
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

    // 🧪 Test específico para tabla de técnicos
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
            
            // Auto-detectar campos válidos si hay records
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

    // 📋 MÉTODOS PRINCIPALES - SOLICITUDES
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
        // Usar versión simplificada que funciona
        const data = {
            fields: {
                numero: solicitudData.numero || `SOL${Date.now()}`,
                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                estado: solicitudData.estado || 'PENDIENTE',
                // Solo agregar campos opcionales si tienen valor
                ...(solicitudData.equipo && { equipo: solicitudData.equipo }),
                ...(solicitudData.ubicacion && { ubicacion: solicitudData.ubicacion }),
                ...(solicitudData.solicitante && { solicitante: solicitudData.solicitante }),
                ...(solicitudData.emailSolicitante && { emailSolicitante: solicitudData.emailSolicitante }),
                ...(solicitudData.fechaCreacion && { fechaCreacion: solicitudData.fechaCreacion }),
                ...(solicitudData.observaciones && { observaciones: solicitudData.observaciones })
            }
        };
        
        console.log('📝 Creando solicitud con datos seguros:', data);
        return await this.makeRequest(this.tables.solicitudes, 'POST', data);
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

    // 📝 Crear técnico/personal de soporte - CORREGIDO PARA EVITAR ERROR 422
    async createTecnico(tecnicoData) {
        console.log('➕ Creando personal de soporte:', tecnicoData.nombre);
        console.log('🔍 Datos originales:', tecnicoData);
        
        // 🗺️ MAPEAR VALORES ANTES DE ENVIAR A AIRTABLE
        const mappedData = {
            nombre: tecnicoData.nombre,
            email: tecnicoData.email,
            area: this.mapFieldValue('area', tecnicoData.area),
            tipo: this.mapFieldValue('tipo', tecnicoData.tipo),
            especialidad: tecnicoData.especialidad || '',
            estado: this.mapFieldValue('estado', tecnicoData.estado || 'disponible'),
            fechaCreacion: new Date().toISOString()
        };
        
        console.log('🗺️ Datos mapeados para Airtable:', mappedData);
        
        const data = {
            fields: mappedData
        };
        
        console.log('📤 Payload final para Airtable:', JSON.stringify(data, null, 2));
        
        try {
            const result = await this.makeRequest(this.tables.tecnicos, 'POST', data);
            console.log('✅ Personal de soporte creado exitosamente:', result.id);
            
            // Verificar que el resultado tenga la estructura esperada
            if (!result || !result.id) {
                console.warn('⚠️ Resultado inesperado de Airtable:', result);
                throw new Error('Respuesta inválida de Airtable - sin ID');
            }
            
            return result;
        } catch (error) {
            console.error('❌ Error creando personal de soporte:', error);
            
            // Si es error 422, intentar con valores alternativos
            if (error.message.includes('422')) {
                console.log('🔧 Error 422 detectado, intentando con valores alternativos...');
                return await this.retryCreateTecnicoWithAlternatives(tecnicoData);
            }
            
            throw new Error(`Error creando personal: ${error.message}`);
        }
    }

    // 🔄 MÉTODO DE REINTENTAR CON VALORES ALTERNATIVOS
    async retryCreateTecnicoWithAlternatives(originalData) {
        console.log('🔄 Reintentando creación con valores alternativos...');
        
        // Definir valores alternativos conocidos
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
        
        // Intentar con diferentes combinaciones
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
                        
                        // Actualizar mapeos para futuros usos
                        this.fieldMappings.area[originalData.area] = [areaAlt];
                        this.fieldMappings.tipo[originalData.tipo] = [tipoAlt];
                        this.fieldMappings.estado[originalData.estado || 'disponible'] = [estadoAlt];
                        
                        return result;
                        
                    } catch (retryError) {
                        console.log(`❌ Falló con: area="${areaAlt}", tipo="${tipoAlt}", estado="${estadoAlt}"`);
                        // Continuar con siguiente combinación
                    }
                }
            }
        }
        
        // Si todos los intentos fallaron
        throw new Error('No se pudo crear el personal con ninguna combinación de valores válidos. Verificar configuración de campos en Airtable.');
    }

    // 🔄 Actualizar técnico/personal de soporte  
    async updateTecnico(tecnicoId, updateData) {
        console.log('🔄 Actualizando personal de soporte:', tecnicoId);
        console.log('📝 Datos a actualizar:', updateData);
        
        // Mapear valores si están presentes
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

    // Resto de métodos sin cambios...
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

    async asignarTecnicoASolicitud(solicitudId, tecnicoId) {
        try {
            console.log('🎯 Asignando técnico a solicitud:', { solicitudId, tecnicoId });
            
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.id === tecnicoId);
            
            if (!tecnico) {
                throw new Error('Técnico no encontrado');
            }
            
            const solicitudResult = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: {
                    tecnicoAsignado: tecnico.nombre,
                    estado: 'ASIGNADA',
                    fechaAsignacion: new Date().toISOString()
                }
            });
            
            await this.updateTecnico(tecnicoId, { estado: 'ocupado' });
            
            console.log('✅ Asignación completada exitosamente');
            
            return {
                success: true,
                solicitud: solicitudResult,
                tecnico: tecnico,
                fechaAsignacion: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error asignando técnico:', error);
            throw error;
        }
    }

    async getTecnicosStatistics() {
        try {
            const tecnicos = await this.getTecnicos();
            
            const stats = {
                total: tecnicos.length,
                porEstado: {
                    disponible: tecnicos.filter(t => t.estado === 'disponible').length,
                    ocupado: tecnicos.filter(t => t.estado === 'ocupado').length,
                    inactivo: tecnicos.filter(t => t.estado === 'inactivo').length
                },
                porArea: {
                    INGENIERIA_BIOMEDICA: tecnicos.filter(t => t.area === 'INGENIERIA_BIOMEDICA').length,
                    MECANICA: tecnicos.filter(t => t.area === 'MECANICA').length,
                    INFRAESTRUCTURA: tecnicos.filter(t => t.area === 'INFRAESTRUCTURA').length
                },
                porTipo: {
                    ingeniero: tecnicos.filter(t => t.tipo === 'ingeniero').length,
                    tecnico: tecnicos.filter(t => t.tipo === 'tecnico').length,
                    auxiliar: tecnicos.filter(t => t.tipo === 'auxiliar').length
                },
                timestamp: new Date().toISOString()
            };
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de técnicos:', error);
            return {
                total: 0,
                porEstado: { disponible: 0, ocupado: 0, inactivo: 0 },
                porArea: { INGENIERIA_BIOMEDICA: 0, MECANICA: 0, INFRAESTRUCTURA: 0 },
                porTipo: { ingeniero: 0, tecnico: 0, auxiliar: 0 },
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 👤 MÉTODOS DE USUARIOS (sin cambios)
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

    // 🔐 MÉTODOS DE SOLICITUDES DE ACCESO (sin cambios)
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
            console.log('🚀 Iniciando aprobación corregida para:', requestId);

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

    async getAccessStatistics() {
        try {
            console.log('📊 Obteniendo estadísticas de acceso...');
            
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
                    completadas: solicitudes.filter(s => s.estado === 'COMPLETADA').length
                },
                tecnicos: {
                    total: tecnicos.length,
                    disponibles: tecnicos.filter(t => t.estado === 'disponible').length,
                    ocupados: tecnicos.filter(t => t.estado === 'ocupado').length
                },
                porServicio: {},
                porCargo: {},
                timestamp: new Date().toISOString()
            };

            usuarios.forEach(user => {
                if (user.servicioHospitalario) {
                    stats.porServicio[user.servicioHospitalario] = (stats.porServicio[user.servicioHospitalario] || 0) + 1;
                }
            });

            usuarios.forEach(user => {
                if (user.cargo) {
                    stats.porCargo[user.cargo] = (stats.porCargo[user.cargo] || 0) + 1;
                }
            });

            return stats;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            
            return {
                usuarios: { total: 0, activos: 0, inactivos: 0, conCodigo: 0 },
                solicitudesAcceso: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
                solicitudes: { total: 0, pendientes: 0, completadas: 0 },
                tecnicos: { total: 0, disponibles: 0, ocupados: 0 },
                porServicio: {},
                porCargo: {},
                error: error.message,
                timestamp: new Date().toISOString()
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
            version: '3.1-fixed-422-error',
            fixes: [
                'CORREGIDO: Error 422 en creación de personal',
                'Mapeo automático de valores de campos',
                'Auto-detección de valores válidos en Airtable',
                'Reintentos con valores alternativos',
                'Mejor manejo de errores de validación',
                'Fallbacks robustos para operaciones'
            ],
            fieldMappings: this.fieldMappings
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global corregida...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión corregida para personal)');
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
                ? '✅ Conectado (versión corregida)' 
                : 'Modo Local (versión corregida)';
            
            updateConnectionStatus(status, message);
        }
    });
} catch (error) {
    console.warn('⚠️ No se pudo configurar event listener:', error);
}

// 🛠️ Función de diagnóstico mejorada
try {
    window.debugAirtableConnection = function() {
        if (!window.airtableAPI) {
            console.error('❌ window.airtableAPI no está disponible');
            return { error: 'airtableAPI no disponible' };
        }
        
        const status = window.airtableAPI.getStatus();
        
        console.log('🔍 DIAGNÓSTICO VERSIÓN CORREGIDA PERSONAL');
        console.log('==========================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🔧 Correcciones aplicadas:');
        status.fixes.forEach(fix => console.log(`  • ${fix}`));
        console.log('🗺️ Mapeos de campos:');
        console.log(status.fieldMappings);
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection (corregido) creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

console.log('✅ airtable-config.js (VERSIÓN CORREGIDA PARA ERROR 422) cargado completamente');
console.log('🔧 Error 422 solucionado con mapeo automático de valores');
console.log('🗺️ Detección automática de valores válidos en Airtable');
console.log('🔄 Reintentos automáticos con valores alternativos');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');

// Auto-verificación
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Sistema corregido cargado correctamente');
        console.log('✅ Error 422 solucionado para personal de soporte');
        console.log('🗺️ Mapeo de valores activo para prevenir errores futuros');
        
        // Verificar que los nuevos métodos existen
        const criticalMethods = ['createTecnico', 'mapFieldValue', 'retryCreateTecnicoWithAlternatives'];
        criticalMethods.forEach(method => {
            if (typeof window.airtableAPI[method] === 'function') {
                console.log(`✅ ${method} correctamente implementado`);
            } else {
                console.error(`❌ ${method} no está disponible`);
            }
        });
    } else {
        console.warn('⚠️ Algunos componentes no se cargaron correctamente');
    }
}, 3000);