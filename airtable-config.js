// 🛡️ Configuración MEJORADA de Airtable API - CON NUMERACIÓN AUTOMÁTICA Y ASIGNACIÓN
// airtable-config.js - Versión con sistema de numeración y tracking de tiempos

console.log('🚀 Cargando airtable-config.js (VERSIÓN MEJORADA CON NUMERACIÓN)...');

class AirtableAPI {
    constructor() {
        console.log('🔧 Inicializando AirtableAPI Mejorada...');
        
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

        // 🔢 SISTEMA DE NUMERACIÓN AUTOMÁTICA
        this.numerationSystem = {
            counters: {
                'INGENIERIA_BIOMEDICA': { prefix: 'SOLBIO', current: 0 },
                'MECANICA': { prefix: 'SOLMEC', current: 0 },
                'INFRAESTRUCTURA': { prefix: 'SOLINFRA', current: 0 }
            },
            
            async loadCounters() {
                console.log('🔢 Cargando contadores de numeración desde Airtable...');
                
                try {
                    const solicitudes = await this.parent.getSolicitudes();
                    
                    // Analizar números existentes por área
                    Object.keys(this.counters).forEach(area => {
                        const prefix = this.counters[area].prefix;
                        const solicitudesArea = solicitudes.filter(s => 
                            s.servicioIngenieria === area && 
                            s.numero && 
                            s.numero.startsWith(prefix)
                        );
                        
                        if (solicitudesArea.length > 0) {
                            // Extraer números y encontrar el máximo
                            const numeros = solicitudesArea
                                .map(s => {
                                    const match = s.numero.match(new RegExp(`${prefix}(\\d+)`));
                                    return match ? parseInt(match[1]) : 0;
                                })
                                .filter(n => n > 0);
                            
                            this.counters[area].current = numeros.length > 0 ? Math.max(...numeros) : 0;
                        }
                        
                        console.log(`📊 ${area}: Siguiente número será ${this.counters[area].prefix}${String(this.counters[area].current + 1).padStart(5, '0')}`);
                    });
                    
                } catch (error) {
                    console.error('❌ Error cargando contadores:', error);
                }
            },

            generateNumber(area) {
                if (!this.counters[area]) {
                    console.error('❌ Área no válida para numeración:', area);
                    return `SOL${Date.now()}`;
                }
                
                this.counters[area].current++;
                const numero = `${this.counters[area].prefix}${String(this.counters[area].current).padStart(5, '0')}`;
                
                console.log(`🔢 Número generado para ${area}: ${numero}`);
                return numero;
            },

            getNextNumber(area) {
                if (!this.counters[area]) return 'SOL00001';
                return `${this.counters[area].prefix}${String(this.counters[area].current + 1).padStart(5, '0')}`;
            }
        };

        // Establecer referencia parent para el sistema de numeración
        this.numerationSystem.parent = this;

        // ⏱️ SISTEMA DE TIEMPO DE RESPUESTA
        this.timeTracker = {
            limitesTiempo: {
                'CRITICA': 2 * 60 * 60 * 1000, // 2 horas
                'ALTA': 4 * 60 * 60 * 1000,    // 4 horas
                'MEDIA': 24 * 60 * 60 * 1000,  // 24 horas
                'BAJA': 72 * 60 * 60 * 1000    // 72 horas
            },

            calcularTiempoRespuesta(fechaCreacion, fechaAsignacion = null) {
                const inicio = new Date(fechaCreacion);
                const fin = fechaAsignacion ? new Date(fechaAsignacion) : new Date();
                return fin - inicio;
            },

            formatearTiempo(milliseconds) {
                const horas = Math.floor(milliseconds / (1000 * 60 * 60));
                const minutos = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
                
                if (horas > 0) {
                    return `${horas}h ${minutos}m`;
                } else {
                    return `${minutos}m`;
                }
            },

            evaluarTiempo(milliseconds, prioridad) {
                const limite = this.limitesTiempo[prioridad] || this.limitesTiempo['MEDIA'];
                
                if (milliseconds > limite) {
                    return { status: 'urgente', mensaje: 'Tiempo excedido' };
                } else if (milliseconds > limite * 0.8) {
                    return { status: 'normal', mensaje: 'Próximo a vencer' };
                } else {
                    return { status: 'rapido', mensaje: 'Dentro del tiempo' };
                }
            },

            async actualizarTiemposSolicitud(solicitudId, evento, timestamp = null) {
                console.log(`⏱️ Actualizando tiempo para solicitud ${solicitudId}: ${evento}`);
                
                const fechaActual = timestamp || new Date().toISOString();
                const updateData = {};

                switch (evento) {
                    case 'asignacion':
                        updateData.fechaAsignacion = fechaActual;
                        break;
                    case 'inicio':
                        updateData.fechaInicio = fechaActual;
                        break;
                    case 'completado':
                        updateData.fechaCompletado = fechaActual;
                        break;
                }

                try {
                    await this.parent.updateSolicitud(solicitudId, updateData);
                    console.log(`✅ Tiempo actualizado para ${evento}`);
                } catch (error) {
                    console.error(`❌ Error actualizando tiempo:`, error);
                }
            }
        };

        // Establecer referencia parent para el time tracker
        this.timeTracker.parent = this;

        // 🗺️ MAPEO DE VALORES PARA AIRTABLE
        this.fieldMappings = {
            area: {
                'INGENIERIA_BIOMEDICA': ['Ingeniería Biomédica', 'INGENIERIA_BIOMEDICA', 'Biomedica', 'Biomédica'],
                'MECANICA': ['Mecánica', 'MECANICA', 'Mecanica'],
                'INFRAESTRUCTURA': ['Infraestructura', 'INFRAESTRUCTURA']
            },
            tipo: {
                'ingeniero': ['Ingeniero', 'ingeniero', 'INGENIERO'],
                'tecnico': ['Técnico', 'tecnico', 'TECNICO', 'Tecnico'],
                'auxiliar': ['Auxiliar', 'auxiliar', 'AUXILIAR']
            },
            estado: {
                'disponible': ['Disponible', 'disponible', 'DISPONIBLE'],
                'ocupado': ['Ocupado', 'ocupado', 'OCUPADO'],
                'inactivo': ['Inactivo', 'inactivo', 'INACTIVO']
            }
        };
        
        this.connectionStatus = 'connecting';
        
        console.log('📡 URL base:', this.baseUrl);
        console.log('🛡️ Usando proxy:', this.useProxy);
        console.log('✅ Tablas configuradas:', Object.keys(this.tables));
        console.log('🔢 Sistema de numeración automática configurado');
        console.log('⏱️ Sistema de tiempo de respuesta configurado');
        
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

    async initializeConnectionAsync() {
        setTimeout(async () => {
            try {
                const isConnected = await this.testConnection();
                
                if (isConnected) {
                    this.connectionStatus = 'connected';
                    this.notifyConnectionStatus(true);
                    console.log('✅ Conectado exitosamente a Airtable');
                    
                    // Cargar contadores de numeración
                    await this.numerationSystem.loadCounters();
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
            if (data) console.log('📝 Data:', JSON.stringify(data, null, 2));
            
            const response = await fetch(url, options);
            
            console.log('📨 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Request exitoso');
            
            if (this.connectionStatus !== 'connected') {
                this.connectionStatus = 'connected';
                this.notifyConnectionStatus(true);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Request falló:', error);
            
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                if (this.connectionStatus !== 'disconnected') {
                    this.connectionStatus = 'disconnected';
                    this.notifyConnectionStatus(false);
                }
                
                if (method === 'GET') {
                    console.warn('⚠️ Usando localStorage fallback');
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
            
            console.log('✅ Test exitoso');
            return true;
            
        } catch (error) {
            console.error('❌ Test falló:', error.message);
            return false;
        }
    }

    // 📋 MÉTODOS DE SOLICITUDES - CON NUMERACIÓN AUTOMÁTICA
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
        console.log('📝 Creando solicitud con numeración automática...');
        
        // 🔢 GENERAR NÚMERO AUTOMÁTICO SEGÚN EL ÁREA
        let numero = solicitudData.numero;
        if (!numero && solicitudData.servicioIngenieria) {
            numero = this.numerationSystem.generateNumber(solicitudData.servicioIngenieria);
        } else if (!numero) {
            numero = `SOL${Date.now()}`;
        }

        // Preparar datos con numeración automática y timestamps
        const data = {
            fields: {
                numero: numero,
                descripcion: solicitudData.descripcion || 'Solicitud de mantenimiento',
                estado: solicitudData.estado || 'PENDIENTE',
                fechaCreacion: new Date().toISOString(),
                // Campos opcionales
                ...(solicitudData.servicioIngenieria && { servicioIngenieria: solicitudData.servicioIngenieria }),
                ...(solicitudData.tipoServicio && { tipoServicio: solicitudData.tipoServicio }),
                ...(solicitudData.prioridad && { prioridad: solicitudData.prioridad }),
                ...(solicitudData.equipo && { equipo: solicitudData.equipo }),
                ...(solicitudData.ubicacion && { ubicacion: solicitudData.ubicacion }),
                ...(solicitudData.solicitante && { solicitante: solicitudData.solicitante }),
                ...(solicitudData.emailSolicitante && { emailSolicitante: solicitudData.emailSolicitante }),
                ...(solicitudData.servicioHospitalario && { servicioHospitalario: solicitudData.servicioHospitalario }),
                ...(solicitudData.observaciones && { observaciones: solicitudData.observaciones })
            }
        };
        
        console.log(`🔢 Solicitud creada con número: ${numero}`);
        console.log('📝 Datos completos:', data);
        
        return await this.makeRequest(this.tables.solicitudes, 'POST', data);
    }

    async updateSolicitud(solicitudId, updateData) {
        console.log('🔄 Actualizando solicitud:', solicitudId);
        
        const data = {
            fields: updateData
        };
        
        try {
            const result = await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', data);
            console.log('✅ Solicitud actualizada exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error actualizando solicitud:', error);
            throw error;
        }
    }

    async findSolicitudByNumero(numero) {
        try {
            const solicitudes = await this.getSolicitudes();
            return solicitudes.find(s => s.numero === numero);
        } catch (error) {
            console.error('❌ Error buscando solicitud por número:', error);
            return null;
        }
    }

    // 👥 MÉTODOS DE TÉCNICOS/PERSONAL DE SOPORTE - CON SISTEMA DE ASIGNACIÓN
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
            throw new Error(`Error creando personal: ${error.message}`);
        }
    }

    async updateTecnico(tecnicoId, updateData) {
        console.log('🔄 Actualizando personal de soporte:', tecnicoId);
        
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
            console.error('❌ Error actualizando personal:', error);
            throw error;
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

    async getTecnicosDisponibles(area = null) {
        try {
            const tecnicos = await this.getTecnicos();
            let disponibles = tecnicos.filter(tecnico => tecnico.estado === 'disponible');
            
            if (area) {
                disponibles = disponibles.filter(tecnico => tecnico.area === area);
            }
            
            return disponibles;
        } catch (error) {
            console.error('❌ Error obteniendo técnicos disponibles:', error);
            return [];
        }
    }

    // 🎯 MÉTODO PRINCIPAL DE ASIGNACIÓN - CON TRACKING COMPLETO
    async asignarTecnicoASolicitud(solicitudId, tecnicoId) {
        console.log('🎯 Iniciando asignación con tracking completo...');
        console.log(`📋 Solicitud: ${solicitudId}`);
        console.log(`👨‍🔧 Técnico: ${tecnicoId}`);
        
        try {
            // 1. Verificar que el técnico existe y está disponible
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.id === tecnicoId);
            
            if (!tecnico) {
                throw new Error('Técnico no encontrado');
            }
            
            if (tecnico.estado !== 'disponible') {
                throw new Error(`Técnico no disponible (Estado: ${tecnico.estado})`);
            }
            
            console.log(`✅ Técnico verificado: ${tecnico.nombre} (${tecnico.area})`);
            
            // 2. Verificar que la solicitud existe
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            console.log(`✅ Solicitud verificada: ${solicitud.numero}`);
            
            // 3. Verificar compatibilidad de área (opcional, pero recomendado)
            if (tecnico.area && solicitud.servicioIngenieria && tecnico.area !== solicitud.servicioIngenieria) {
                console.warn(`⚠️ Asignación fuera de área: Técnico (${tecnico.area}) - Solicitud (${solicitud.servicioIngenieria})`);
            }
            
            const fechaAsignacion = new Date().toISOString();
            
            // 4. Actualizar solicitud con asignación y tiempo
            console.log('🔄 Actualizando solicitud...');
            const solicitudResult = await this.updateSolicitud(solicitudId, {
                tecnicoAsignado: tecnico.nombre,
                tecnicoAsignadoId: tecnicoId,
                estado: 'ASIGNADA',
                fechaAsignacion: fechaAsignacion,
                tiempoRespuesta: this.timeTracker.calcularTiempoRespuesta(solicitud.fechaCreacion, fechaAsignacion)
            });
            
            // 5. Actualizar estado del técnico
            console.log('🔄 Actualizando estado del técnico...');
            await this.updateTecnico(tecnicoId, { 
                estado: 'ocupado',
                ultimaAsignacion: fechaAsignacion,
                solicitudActual: solicitudId
            });
            
            // 6. Preparar resultado detallado
            const resultado = {
                success: true,
                solicitud: {
                    id: solicitudId,
                    numero: solicitud.numero,
                    estado: 'ASIGNADA',
                    fechaAsignacion: fechaAsignacion
                },
                tecnico: {
                    id: tecnicoId,
                    nombre: tecnico.nombre,
                    area: tecnico.area,
                    tipo: tecnico.tipo,
                    email: tecnico.email
                },
                tiempos: {
                    fechaCreacion: solicitud.fechaCreacion,
                    fechaAsignacion: fechaAsignacion,
                    tiempoRespuesta: this.timeTracker.formatearTiempo(
                        this.timeTracker.calcularTiempoRespuesta(solicitud.fechaCreacion, fechaAsignacion)
                    )
                },
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ Asignación completada exitosamente');
            console.log('📊 Resultado:', resultado);
            
            return resultado;
            
        } catch (error) {
            console.error('❌ Error en asignación:', error);
            
            // Resultado de error detallado
            return {
                success: false,
                error: error.message,
                solicitudId: solicitudId,
                tecnicoId: tecnicoId,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 🔄 MÉTODO PARA LIBERAR TÉCNICO
    async liberarTecnico(tecnicoId, solicitudId = null) {
        console.log('🔓 Liberando técnico:', tecnicoId);
        
        try {
            const updateData = {
                estado: 'disponible',
                fechaLiberacion: new Date().toISOString()
            };
            
            // Limpiar solicitud actual si se especifica
            if (solicitudId) {
                updateData.solicitudAnterior = solicitudId;
                updateData.solicitudActual = null;
            }
            
            await this.updateTecnico(tecnicoId, updateData);
            
            console.log('✅ Técnico liberado exitosamente');
            
            return {
                success: true,
                tecnicoId: tecnicoId,
                nuevoEstado: 'disponible',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error liberando técnico:', error);
            throw error;
        }
    }

    // 🤖 AUTO-ASIGNACIÓN INTELIGENTE
    async autoAsignarSolicitudesPendientes() {
        console.log('🤖 Iniciando auto-asignación inteligente...');
        
        try {
            // Obtener solicitudes pendientes
            const solicitudes = await this.getSolicitudes();
            const pendientes = solicitudes.filter(s => 
                s.estado === 'PENDIENTE' || !s.tecnicoAsignado
            );
            
            if (pendientes.length === 0) {
                console.log('✅ No hay solicitudes pendientes');
                return { success: true, asignaciones: 0, mensaje: 'No hay solicitudes pendientes' };
            }
            
            console.log(`📋 ${pendientes.length} solicitudes pendientes encontradas`);
            
            // Obtener técnicos disponibles
            const tecnicos = await this.getTecnicos();
            const disponibles = tecnicos.filter(t => t.estado === 'disponible');
            
            if (disponibles.length === 0) {
                console.log('⚠️ No hay técnicos disponibles');
                return { success: false, error: 'No hay técnicos disponibles' };
            }
            
            console.log(`👨‍🔧 ${disponibles.length} técnicos disponibles`);
            
            let asignacionesExitosas = 0;
            let asignacionesFallidas = 0;
            const resultados = [];
            
            // Procesar solicitudes por prioridad
            const solicitudesPriorizadas = pendientes.sort((a, b) => {
                const prioridades = { 'CRITICA': 4, 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
                return (prioridades[b.prioridad] || 2) - (prioridades[a.prioridad] || 2);
            });
            
            for (const solicitud of solicitudesPriorizadas) {
                try {
                    // Buscar técnico compatible por área
                    const tecnicoCompatible = disponibles.find(t => 
                        t.area === solicitud.servicioIngenieria && t.estado === 'disponible'
                    );
                    
                    if (tecnicoCompatible) {
                        console.log(`🎯 Asignando ${solicitud.numero} → ${tecnicoCompatible.nombre}`);
                        
                        const resultado = await this.asignarTecnicoASolicitud(solicitud.id, tecnicoCompatible.id);
                        
                        if (resultado.success) {
                            asignacionesExitosas++;
                            
                            // Marcar técnico como no disponible para próximas asignaciones
                            const index = disponibles.findIndex(t => t.id === tecnicoCompatible.id);
                            if (index !== -1) {
                                disponibles[index].estado = 'ocupado';
                            }
                            
                            resultados.push({
                                solicitud: solicitud.numero,
                                tecnico: tecnicoCompatible.nombre,
                                status: 'exitosa'
                            });
                        } else {
                            asignacionesFallidas++;
                            resultados.push({
                                solicitud: solicitud.numero,
                                error: resultado.error,
                                status: 'fallida'
                            });
                        }
                    } else {
                        console.log(`⚠️ Sin técnico compatible para ${solicitud.numero} (${solicitud.servicioIngenieria})`);
                        resultados.push({
                            solicitud: solicitud.numero,
                            error: 'Sin técnico compatible disponible',
                            status: 'sin_tecnico'
                        });
                    }
                    
                } catch (error) {
                    asignacionesFallidas++;
                    console.error(`❌ Error asignando ${solicitud.numero}:`, error);
                    resultados.push({
                        solicitud: solicitud.numero,
                        error: error.message,
                        status: 'error'
                    });
                }
            }
            
            const resumen = {
                success: true,
                asignacionesExitosas,
                asignacionesFallidas,
                totalProcesadas: pendientes.length,
                resultados: resultados,
                timestamp: new Date().toISOString()
            };
            
            console.log('🤖 Auto-asignación completada:', resumen);
            
            return resumen;
            
        } catch (error) {
            console.error('❌ Error en auto-asignación:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📊 ESTADÍSTICAS AVANZADAS
    async getTecnicosStatistics() {
        try {
            const tecnicos = await this.getTecnicos();
            const solicitudes = await this.getSolicitudes();
            
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
                cargaTrabajo: {},
                tiemposPromedio: {},
                timestamp: new Date().toISOString()
            };

            // Calcular carga de trabajo por técnico
            tecnicos.forEach(tecnico => {
                const solicitudesAsignadas = solicitudes.filter(s => 
                    s.tecnicoAsignadoId === tecnico.id || 
                    s.tecnicoAsignado === tecnico.nombre
                );
                
                stats.cargaTrabajo[tecnico.nombre] = {
                    total: solicitudesAsignadas.length,
                    activas: solicitudesAsignadas.filter(s => 
                        s.estado !== 'COMPLETADA'
                    ).length,
                    completadas: solicitudesAsignadas.filter(s => 
                        s.estado === 'COMPLETADA'
                    ).length
                };
            });
            
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
            console.error('❌ Error actualizando usuario:', error);
            throw error;
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
            console.error('❌ Error actualizando solicitud:', error);
            throw error;
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

            const solicitudesAcceso = await this.getSolicitudesAcceso();
            const request = solicitudesAcceso.find(s => s.id === requestId);
            
            if (!request) {
                throw new Error('Solicitud no encontrada');
            }

            if (request.estado !== 'PENDIENTE') {
                throw new Error(`Solicitud en estado: ${request.estado}`);
            }

            const existingUser = await this.findUserByEmail(request.email);
            const accessCode = await this.generateUniqueAccessCode();

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
                    userResult = await this.updateUsuario(existingUser.id, userData);
                    userData.id = existingUser.id;
                } else {
                    userResult = await this.createUsuario(userData);
                    userData.id = userResult.id;
                }
            } catch (userError) {
                throw new Error(`Error procesando usuario: ${userError.message}`);
            }

            try {
                await this.updateSolicitudAcceso(requestId, {
                    estado: 'APROBADA',
                    fechaAprobacion: new Date().toISOString(),
                    usuarioCreado: userData.id
                });
            } catch (updateError) {
                console.warn('⚠️ No se pudo actualizar estado de solicitud:', updateError);
            }

            return {
                success: true,
                user: userData,
                accessCode: accessCode,
                requestId: requestId,
                action: existingUser ? 'updated' : 'created'
            };

        } catch (error) {
            console.error('❌ Error en aprobación:', error);
            throw error;
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
            version: '4.0-numeracion-asignacion',
            features: [
                '🔢 Numeración automática por área (SOLBIO, SOLMEC, SOLINFRA)',
                '🎯 Sistema de asignación inteligente de personal',
                '⏱️ Tracking completo de tiempos de respuesta',
                '🤖 Auto-asignación por área de especialización',
                '📊 Estadísticas avanzadas de personal y tiempos',
                '🔄 Gestión de estados de técnicos automática',
                '🗺️ Mapeo automático de valores de campos'
            ],
            numerationSystem: {
                counters: this.numerationSystem.counters,
                nextNumbers: {
                    INGENIERIA_BIOMEDICA: this.numerationSystem.getNextNumber('INGENIERIA_BIOMEDICA'),
                    MECANICA: this.numerationSystem.getNextNumber('MECANICA'),
                    INFRAESTRUCTURA: this.numerationSystem.getNextNumber('INFRAESTRUCTURA')
                }
            }
        };
    }
}

// 🌍 Crear instancia global
try {
    console.log('🔧 Creando instancia global mejorada...');
    window.airtableAPI = new AirtableAPI();
    console.log('✅ window.airtableAPI creado exitosamente (versión con numeración y asignación)');
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
                ? '✅ Conectado (versión mejorada)' 
                : 'Modo Local (versión mejorada)';
            
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
        
        console.log('🔍 DIAGNÓSTICO VERSIÓN MEJORADA CON NUMERACIÓN Y ASIGNACIÓN');
        console.log('=========================================================');
        console.log('🌐 Hostname:', status.hostname);
        console.log('🏠 Entorno:', status.environment);
        console.log('🛡️ Proxy:', status.useProxy ? 'HABILITADO' : 'DESHABILITADO');
        console.log('📡 URL base:', status.baseUrl);
        console.log('🔍 Estado:', status.isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO');
        console.log('📋 Versión:', status.version);
        console.log('🚀 Nuevas funcionalidades:');
        status.features.forEach(feature => console.log(`  • ${feature}`));
        console.log('🔢 Sistema de numeración:');
        console.log('  Próximos números:');
        Object.entries(status.numerationSystem.nextNumbers).forEach(([area, numero]) => {
            console.log(`    ${area}: ${numero}`);
        });
        
        return status;
    };
    
    console.log('✅ debugAirtableConnection (versión mejorada) creado exitosamente');
} catch (error) {
    console.error('❌ Error creando debugAirtableConnection:', error);
}

console.log('✅ airtable-config.js (VERSIÓN MEJORADA) cargado completamente');
console.log('🔢 Sistema de numeración automática: SOLBIO, SOLMEC, SOLINFRA');
console.log('🎯 Sistema de asignación inteligente de personal');
console.log('⏱️ Tracking completo de tiempos de respuesta');
console.log('🛠️ Para diagnóstico: debugAirtableConnection()');

// Auto-verificación con nuevas funciones
setTimeout(async () => {
    if (window.airtableAPI && typeof window.debugAirtableConnection === 'function') {
        console.log('🔄 Sistema mejorado cargado correctamente');
        console.log('🔢 Numeración automática por área activada');
        console.log('🎯 Sistema de asignación inteligente activado');
        console.log('⏱️ Tracking de tiempos activado');
        
        // Verificar métodos críticos
        const criticalMethods = [
            'createSolicitud', 'asignarTecnicoASolicitud', 'autoAsignarSolicitudesPendientes',
            'getTecnicosDisponibles', 'liberarTecnico', 'updateSolicitud'
        ];
        
        criticalMethods.forEach(method => {
            if (typeof window.airtableAPI[method] === 'function') {
                console.log(`✅ ${method} correctamente implementado`);
            } else {
                console.error(`❌ ${method} no está disponible`);
            }
        });
        
        // Mostrar próximos números
        console.log('🔢 Próximos números a generar:');
        console.log(`  • Biomédica: ${window.airtableAPI.numerationSystem.getNextNumber('INGENIERIA_BIOMEDICA')}`);
        console.log(`  • Mecánica: ${window.airtableAPI.numerationSystem.getNextNumber('MECANICA')}`);
        console.log(`  • Infraestructura: ${window.airtableAPI.numerationSystem.getNextNumber('INFRAESTRUCTURA')}`);
        
    } else {
        console.warn('⚠️ Algunos componentes no se cargaron correctamente');
    }
}, 3000);