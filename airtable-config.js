// 🌐 CONFIGURACIÓN CORREGIDA DE AIRTABLE - VERSIÓN CON DETECCIÓN AUTOMÁTICA
// airtable-config.js - Solución Error 404

class AirtableAPI {
    constructor() {
        this.baseUrl = '/.netlify/functions/airtable-proxy';
        this.debugMode = true;
        this.connectionStatus = 'disconnected';
        this.lastError = null;
        this.requestCount = 0;
        this.isConnected = false;
        
        // 🔧 MAPEO DE TABLAS CON DETECCIÓN AUTOMÁTICA
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso' // POSIBLE CAUSA DEL ERROR 404
        };

        // 🔍 Variaciones comunes de nombres de tablas para auto-detección
        this.tableVariations = {
            solicitudesAcceso: [
                'SolicitudesAcceso',
                'Solicitudes_Acceso', 
                'solicitudes_acceso',
                'solicitudesacceso',
                'SolicitudAcceso',
                'AccessRequests',
                'access_requests',
                'Solicitudes de Acceso'
            ],
            solicitudes: [
                'Solicitudes',
                'solicitudes',
                'Requests',
                'requests'
            ],
            tecnicos: [
                'Tecnicos',
                'tecnicos',
                'Technicians', 
                'technicians',
                'Personal'
            ],
            usuarios: [
                'Usuarios',
                'usuarios',
                'Users',
                'users'
            ]
        };

        // Auto-detección al inicializar
        this.autoDetectTables();

        console.log('🚀 AirtableAPI CORREGIDO iniciado con auto-detección de tablas');
    }

    // 🔍 AUTO-DETECCIÓN DE TABLAS CORREGIDA
    async autoDetectTables() {
        console.log('🔍 Iniciando auto-detección de tablas...');
        
        try {
            // Esperar un poco para que las funciones estén listas
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const corrections = {};
            
            for (const [tableKey, variations] of Object.entries(this.tableVariations)) {
                console.log(`🔍 Detectando tabla para: ${tableKey}`);
                
                for (const variation of variations) {
                    try {
                        const response = await fetch(`${this.baseUrl}/${encodeURIComponent(variation)}?maxRecords=1`);
                        
                        if (response.ok) {
                            console.log(`✅ Tabla encontrada: ${tableKey} -> ${variation}`);
                            corrections[tableKey] = variation;
                            break;
                        }
                    } catch (error) {
                        // Continuar con la siguiente variación
                    }
                }
                
                if (!corrections[tableKey]) {
                    console.warn(`⚠️ No se encontró tabla para: ${tableKey}`);
                }
            }
            
            // Aplicar correcciones
            Object.assign(this.tables, corrections);
            
            console.log('🎯 Tablas auto-detectadas:', this.tables);
            
            // Guardar configuración para debug
            if (typeof window !== 'undefined') {
                window.airtableTableMapping = this.tables;
            }
            
        } catch (error) {
            console.warn('⚠️ Auto-detección falló, usando nombres por defecto:', error.message);
        }
    }

    // 📊 MÉTODO GETSTATUS CORREGIDO
    getStatus() {
        return {
            isConnected: this.isConnected,
            connectionStatus: this.connectionStatus,
            lastError: this.lastError,
            requestCount: this.requestCount,
            tableMapping: this.tables,
            timestamp: new Date().toISOString()
        };
    }

    // 📝 Logging mejorado
    log(message, data = null) {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString('es-CO');
        console.log(`[${timestamp}] AirtableAPI: ${message}`, data || '');
        
        // Event para logging externo
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

    // 🔗 FUNCIÓN BASE CORREGIDA CON MEJOR MANEJO DE ERRORES
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
                this.log('📝 Data enviada:', data);
            }

            const response = await fetch(url, options);
            const responseText = await response.text();
            
            this.log('📨 Response status:', response.status);

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
                    method,
                    endpoint,
                    timestamp: new Date().toISOString()
                };
                
                this.connectionStatus = 'error';
                this.isConnected = false;
                
                // 🔧 MANEJO ESPECIAL PARA ERROR 404 DE TABLAS
                if (response.status === 404 && endpoint.includes('/')) {
                    const tableName = endpoint.split('?')[0]; // Remover query params
                    console.error(`❌ ERROR 404: Tabla "${tableName}" no encontrada`);
                    console.log('💡 Tablas disponibles:', this.tables);
                    console.log('🔍 Iniciando re-detección automática...');
                    
                    // Intentar re-detectar tablas
                    await this.autoDetectTables();
                    
                    throw new Error(`Tabla "${tableName}" no encontrada. Verifica que exista en Airtable. Mapeo actual: ${JSON.stringify(this.tables)}`);
                }
                
                throw new Error(errorData.message || `Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
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
                timestamp: new Date().toISOString(),
                endpoint: endpoint
            };
            
            this.log(`❌ Error en makeRequest para "${endpoint}": ${error.message}`);
            throw error;
        }
    }

    // ✅ TEST DE CONEXIÓN MEJORADO
    async testConnection() {
        this.log('🧪 Iniciando test de conexión...');
        
        try {
            // Test funciones Netlify primero
            const helloResponse = await fetch('/.netlify/functions/hello');
            if (!helloResponse.ok) {
                throw new Error(`Funciones Netlify no disponibles: ${helloResponse.status}`);
            }
            
            this.log('✅ Funciones Netlify operativas');
            
            // Test cada tabla para verificar existencia
            for (const [tableKey, tableName] of Object.entries(this.tables)) {
                try {
                    await this.makeRequest(tableName + '?maxRecords=1');
                    this.log(`✅ Tabla ${tableKey} (${tableName}) accesible`);
                } catch (error) {
                    this.log(`⚠️ Tabla ${tableKey} (${tableName}) no accesible: ${error.message}`);
                }
            }
            
            this.isConnected = true;
            this.connectionStatus = 'connected';
            this.log('✅ Test de conexión completado');
            
            return true;
            
        } catch (error) {
            this.isConnected = false;
            this.connectionStatus = 'error';
            this.log(`❌ Test de conexión falló: ${error.message}`);
            return false;
        }
    }

    // 📋 CREAR SOLICITUD DE ACCESO CORREGIDA
    async createSolicitudAcceso(solicitudData) {
        try {
            this.log('📋 Creando solicitud de acceso...');
            
            const data = {
                fields: solicitudData
            };
            
            // 🔧 USAR TABLA AUTO-DETECTADA
            const tableName = this.tables.solicitudesAcceso;
            this.log(`📊 Usando tabla: ${tableName}`);
            
            const result = await this.makeRequest(tableName, 'POST', data);
            
            this.log('✅ Solicitud de acceso creada exitosamente');
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error creando solicitud de acceso: ${error.message}`);
            
            // 🔧 SUGERENCIA AUTOMÁTICA SI FALLA
            if (error.message.includes('404') || error.message.includes('not found')) {
                const suggestion = `
❌ TABLA DE SOLICITUDES DE ACCESO NO ENCONTRADA

🔍 Posibles soluciones:
1. Verificar que existe la tabla en Airtable
2. Crear tabla "SolicitudesAcceso" con estos campos:
   • nombreCompleto (Single line text)
   • email (Email)
   • telefono (Phone number)
   • servicioHospitalario (Single select)
   • cargo (Single select)
   • justificacion (Long text)
   • estado (Single select: PENDIENTE, APROBADA, RECHAZADA)
   • fechaSolicitud (Date)

🎯 Tablas encontradas: ${JSON.stringify(this.tables, null, 2)}

💡 Usa la herramienta de diagnóstico para más detalles.
                `;
                console.error(suggestion);
            }
            
            throw error;
        }
    }

    // 🔄 ACTUALIZAR SOLICITUD DE ACCESO CORREGIDA
    async updateSolicitudAcceso(solicitudId, updateData) {
        try {
            this.log(`🔄 Actualizando solicitud de acceso: ${solicitudId}`);
            
            if (!solicitudId) {
                throw new Error('ID de solicitud requerido');
            }
            
            // 🔧 USAR TABLA AUTO-DETECTADA
            const tableName = this.tables.solicitudesAcceso;
            this.log(`📊 Usando tabla: ${tableName}`);
            
            const result = await this.makeRequest(
                `${tableName}/${solicitudId}`, 
                'PATCH', 
                { fields: updateData }
            );
            
            this.log('✅ Solicitud de acceso actualizada exitosamente');
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error actualizando solicitud de acceso: ${error.message}`);
            throw error;
        }
    }

    // 📋 OBTENER SOLICITUDES DE ACCESO CORREGIDA
    async getSolicitudesAcceso() {
        try {
            this.log('📋 Obteniendo solicitudes de acceso...');
            
            // 🔧 USAR TABLA AUTO-DETECTADA
            const tableName = this.tables.solicitudesAcceso;
            this.log(`📊 Usando tabla: ${tableName}`);
            
            const result = await this.makeRequest(tableName);
            
            const solicitudes = result.records.map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            this.log(`✅ ${solicitudes.length} solicitudes de acceso obtenidas`);
            return solicitudes;
            
        } catch (error) {
            this.log(`❌ Error obteniendo solicitudes de acceso: ${error.message}`);
            
            // 🔧 RETORNO SEGURO EN CASO DE ERROR
            if (error.message.includes('404')) {
                console.warn('⚠️ Tabla de solicitudes de acceso no encontrada, retornando array vacío');
                return [];
            }
            
            throw error;
        }
    }

    // 🔢 Generar número de solicitud por área
    async generateSolicitudNumber(area) {
        try {
            this.log(`🔢 Generando número para área: ${area}`);
            
            const solicitudes = await this.getSolicitudes();
            
            const prefijos = {
                'INGENIERIA_BIOMEDICA': 'SOLBIO',
                'MECANICA': 'SOLMEC', 
                'INFRAESTRUCTURA': 'SOLINFRA'
            };
            
            const prefijo = prefijos[area];
            if (!prefijo) {
                this.log(`⚠️ Área no reconocida: ${area}, usando SOL genérico`);
                return `SOL${Date.now()}`;
            }
            
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
            const timestamp = Date.now().toString().slice(-5);
            return `SOL${timestamp}`;
        }
    }

    // ⏰ Calcular fecha límite según prioridad
    calcularFechaLimite(prioridad) {
        const ahora = new Date();
        let horasLimite;
        
        switch (prioridad) {
            case 'CRITICA':
                horasLimite = 2;
                break;
            case 'ALTA':
                horasLimite = 8;
                break;
            case 'MEDIA':
                horasLimite = 24;
                break;
            case 'BAJA':
                horasLimite = 72;
                break;
            default:
                horasLimite = 24;
        }
        
        const fechaLimite = new Date(ahora.getTime() + (horasLimite * 60 * 60 * 1000));
        return fechaLimite.toISOString();
    }

    // 📋 Crear solicitud con numeración automática
    async createSolicitud(solicitudData) {
        try {
            this.log('📋 Creando solicitud con numeración automática...');
            
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
                    
                    // Datos del solicitante
                    solicitante: solicitudData.solicitante || 'Usuario sistema',
                    servicioHospitalario: solicitudData.servicioHospitalario || 'NO_ESPECIFICADO',
                    emailSolicitante: solicitudData.emailSolicitante || '',
                    
                    // Datos de gestión
                    estado: 'PENDIENTE',
                    fechaCreacion: new Date().toISOString(),
                    fechaLimiteRespuesta: this.calcularFechaLimite(solicitudData.prioridad),
                    
                    // Campos de asignación
                    tecnicoAsignado: '',
                    fechaAsignacion: '',
                    fechaInicio: '',
                    fechaCompletado: '',
                    
                    // Campos de tiempo
                    tiempoRespuestaHoras: 0,
                    tiempoResolucionHoras: 0,
                    estadoTiempo: 'EN_TIEMPO'
                }
            };
            
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            this.log(`✅ Solicitud creada con número: ${numeroSolicitud}`);
            
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

    // 🔄 Actualizar técnico
    async updateTecnico(tecnicoId, updateData) {
        try {
            const result = await this.makeRequest(
                `${this.tables.tecnicos}/${tecnicoId}`, 
                'PATCH', 
                { fields: updateData }
            );
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error actualizando técnico: ${error.message}`);
            throw error;
        }
    }

    // 🎯 Asignar técnico con gestión de tiempos
    async asignarTecnicoConTiempos(solicitudId, tecnicoId, observacionesAsignacion = '') {
        try {
            this.log('🎯 Asignando técnico con gestión de tiempos...');
            
            // Obtener datos
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.id === tecnicoId);
            
            if (!tecnico) {
                throw new Error('Técnico no encontrado');
            }
            
            if (tecnico.estado !== 'disponible') {
                throw new Error(`Técnico no disponible. Estado actual: ${tecnico.estado}`);
            }
            
            // Calcular tiempo de respuesta
            const ahora = new Date();
            const fechaCreacion = new Date(solicitud.fechaCreacion);
            const tiempoRespuestaMs = ahora.getTime() - fechaCreacion.getTime();
            const tiempoRespuestaHoras = Math.round((tiempoRespuestaMs / (1000 * 60 * 60)) * 100) / 100;
            
            // Determinar estado del tiempo
            const fechaLimite = new Date(solicitud.fechaLimiteRespuesta);
            const estadoTiempo = ahora <= fechaLimite ? 'EN_TIEMPO' : 'FUERA_TIEMPO';
            
            // Actualizar solicitud
            const solicitudUpdate = {
                estado: 'ASIGNADA',
                tecnicoAsignado: tecnico.nombre,
                tecnicoAsignadoId: tecnicoId,
                fechaAsignacion: ahora.toISOString(),
                tiempoRespuestaHoras: tiempoRespuestaHoras,
                estadoTiempo: estadoTiempo,
                observacionesAsignacion: observacionesAsignacion
            };
            
            await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: solicitudUpdate
            });
            
            // Actualizar estado del técnico
            await this.updateTecnico(tecnicoId, { 
                estado: 'ocupado',
                ultimaAsignacion: ahora.toISOString(),
                solicitudActual: solicitudId
            });
            
            this.log('✅ Asignación completada exitosamente');
            
            return {
                success: true,
                solicitud: {
                    id: solicitudId,
                    numero: solicitud.numero,
                    estado: 'ASIGNADA',
                    tecnicoAsignado: tecnico.nombre,
                    fechaAsignacion: ahora.toISOString(),
                    tiempoRespuestaHoras: tiempoRespuestaHoras,
                    estadoTiempo: estadoTiempo
                },
                tecnico: {
                    id: tecnicoId,
                    nombre: tecnico.nombre,
                    area: tecnico.area,
                    estadoAnterior: tecnico.estado,
                    estadoNuevo: 'ocupado'
                },
                tiempos: {
                    fechaCreacion: solicitud.fechaCreacion,
                    fechaAsignacion: ahora.toISOString(),
                    fechaLimite: solicitud.fechaLimiteRespuesta,
                    tiempoRespuestaHoras: tiempoRespuestaHoras,
                    estadoTiempo: estadoTiempo
                }
            };
            
        } catch (error) {
            this.log(`❌ Error en asignación: ${error.message}`);
            throw error;
        }
    }

    // ✅ Completar solicitud
    async completarSolicitud(solicitudId, observacionesCompletado = '', requiereAprobacion = false) {
        try {
            this.log('✅ Completando solicitud...');
            
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            if (solicitud.estado !== 'ASIGNADA' && solicitud.estado !== 'EN_PROCESO') {
                throw new Error(`No se puede completar solicitud en estado: ${solicitud.estado}`);
            }
            
            // Calcular tiempos
            const ahora = new Date();
            const fechaCreacion = new Date(solicitud.fechaCreacion);
            const fechaAsignacion = solicitud.fechaAsignacion ? new Date(solicitud.fechaAsignacion) : fechaCreacion;
            
            const tiempoResolucionMs = ahora.getTime() - fechaAsignacion.getTime();
            const tiempoResolucionHoras = Math.round((tiempoResolucionMs / (1000 * 60 * 60)) * 100) / 100;
            
            const tiempoTotalMs = ahora.getTime() - fechaCreacion.getTime();
            const tiempoTotalHoras = Math.round((tiempoTotalMs / (1000 * 60 * 60)) * 100) / 100;
            
            // Actualizar solicitud
            const estadoFinal = requiereAprobacion ? 'PENDIENTE_APROBACION' : 'COMPLETADA';
            
            const solicitudUpdate = {
                estado: estadoFinal,
                fechaCompletado: ahora.toISOString(),
                tiempoResolucionHoras: tiempoResolucionHoras,
                tiempoTotalHoras: tiempoTotalHoras,
                observacionesCompletado: observacionesCompletado,
                requiereAprobacion: requiereAprobacion
            };
            
            await this.makeRequest(`${this.tables.solicitudes}/${solicitudId}`, 'PATCH', {
                fields: solicitudUpdate
            });
            
            // Liberar técnico si está completada
            if (!requiereAprobacion && solicitud.tecnicoAsignadoId) {
                await this.updateTecnico(solicitud.tecnicoAsignadoId, { 
                    estado: 'disponible',
                    solicitudActual: '',
                    ultimaCompletada: ahora.toISOString()
                });
            }
            
            this.log('✅ Solicitud completada exitosamente');
            
            return {
                success: true,
                solicitud: {
                    id: solicitudId,
                    numero: solicitud.numero,
                    estado: estadoFinal,
                    fechaCompletado: ahora.toISOString(),
                    tiempoResolucionHoras: tiempoResolucionHoras,
                    tiempoTotalHoras: tiempoTotalHoras
                },
                tiempos: {
                    fechaCreacion: solicitud.fechaCreacion,
                    fechaAsignacion: solicitud.fechaAsignacion,
                    fechaCompletado: ahora.toISOString(),
                    tiempoResolucionHoras: tiempoResolucionHoras,
                    tiempoTotalHoras: tiempoTotalHoras
                }
            };
            
        } catch (error) {
            this.log(`❌ Error completando solicitud: ${error.message}`);
            throw error;
        }
    }

    // 🤖 Auto-asignación inteligente
    async autoAsignarSolicitudesPendientes() {
        try {
            this.log('🤖 Iniciando auto-asignación...');
            
            const solicitudes = await this.getSolicitudes();
            const solicitudesPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE');
            
            if (solicitudesPendientes.length === 0) {
                return {
                    success: true,
                    message: 'No hay solicitudes pendientes para asignar',
                    asignaciones: 0
                };
            }
            
            const tecnicos = await this.getTecnicos();
            const tecnicosDisponibles = tecnicos.filter(t => t.estado === 'disponible');
            
            if (tecnicosDisponibles.length === 0) {
                return {
                    success: false,
                    message: 'No hay técnicos disponibles para asignación',
                    asignaciones: 0
                };
            }
            
            const resultados = [];
            
            // Asignar por prioridad
            const solicitudesOrdenadas = solicitudesPendientes.sort((a, b) => {
                const prioridades = { 'CRITICA': 4, 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
                return (prioridades[b.prioridad] || 0) - (prioridades[a.prioridad] || 0);
            });
            
            for (const solicitud of solicitudesOrdenadas) {
                try {
                    // Buscar técnico del área correspondiente
                    let tecnicoSeleccionado = tecnicosDisponibles.find(t => 
                        t.area === solicitud.servicioIngenieria && t.estado === 'disponible'
                    );
                    
                    // Si no hay técnico del área, buscar cualquier disponible
                    if (!tecnicoSeleccionado) {
                        tecnicoSeleccionado = tecnicosDisponibles.find(t => t.estado === 'disponible');
                    }
                    
                    if (tecnicoSeleccionado) {
                        const resultado = await this.asignarTecnicoConTiempos(
                            solicitud.id, 
                            tecnicoSeleccionado.id,
                            'Asignación automática del sistema'
                        );
                        
                        if (resultado.success) {
                            resultados.push({
                                solicitud: solicitud.numero,
                                tecnico: tecnicoSeleccionado.nombre,
                                area: solicitud.servicioIngenieria,
                                prioridad: solicitud.prioridad,
                                compatibilidad: tecnicoSeleccionado.area === solicitud.servicioIngenieria ? 'AREA_EXACTA' : 'AREA_DIFERENTE'
                            });
                            
                            // Marcar técnico como ocupado
                            tecnicoSeleccionado.estado = 'ocupado';
                        }
                    }
                    
                } catch (error) {
                    this.log(`❌ Error asignando solicitud ${solicitud.numero}: ${error.message}`);
                }
            }
            
            this.log(`✅ Auto-asignación completada: ${resultados.length} asignaciones`);
            
            return {
                success: true,
                message: `Se asignaron ${resultados.length} solicitudes automáticamente`,
                asignaciones: resultados.length,
                detalles: resultados,
                solicitudesPendientes: solicitudesPendientes.length,
                tecnicosDisponibles: tecnicosDisponibles.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.log(`❌ Error en auto-asignación: ${error.message}`);
            return {
                success: false,
                error: error.message,
                asignaciones: 0
            };
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

    // 🔄 Actualizar usuario
    async updateUsuario(userId, updateData) {
        try {
            const result = await this.makeRequest(
                `${this.tables.usuarios}/${userId}`, 
                'PATCH', 
                { fields: updateData }
            );
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            this.log(`❌ Error actualizando usuario: ${error.message}`);
            throw error;
        }
    }

    // ✅ Validar credenciales de usuario
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

    // 📊 Obtener estadísticas de tiempos
    async getEstadisticasTiempos() {
        try {
            this.log('📊 Calculando estadísticas de tiempos...');
            
            const solicitudes = await this.getSolicitudes();
            const ahora = new Date();
            
            const stats = {
                total: solicitudes.length,
                pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
                asignadas: solicitudes.filter(s => s.estado === 'ASIGNADA').length,
                completadas: solicitudes.filter(s => s.estado === 'COMPLETADA').length,
                tiemposRespuesta: {
                    promedio: 0,
                    enTiempo: 0,
                    fueraTiempo: 0,
                    porcentajeEnTiempo: 0
                },
                timestamp: ahora.toISOString()
            };
            
            // Calcular estadísticas de tiempo
            const solicitudesConTiempo = solicitudes.filter(s => s.tiempoRespuestaHoras);
            
            if (solicitudesConTiempo.length > 0) {
                const tiemposRespuesta = solicitudesConTiempo.map(s => s.tiempoRespuestaHoras);
                stats.tiemposRespuesta.promedio = tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length;
                stats.tiemposRespuesta.enTiempo = solicitudes.filter(s => s.estadoTiempo === 'EN_TIEMPO').length;
                stats.tiemposRespuesta.fueraTiempo = solicitudes.filter(s => s.estadoTiempo === 'FUERA_TIEMPO').length;
                stats.tiemposRespuesta.porcentajeEnTiempo = Math.round((stats.tiemposRespuesta.enTiempo / solicitudesConTiempo.length) * 100);
            }
            
            this.log('✅ Estadísticas calculadas');
            return stats;
            
        } catch (error) {
            this.log(`❌ Error calculando estadísticas: ${error.message}`);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 📊 Estadísticas del sistema (alias para compatibilidad)
    getSystemStats() {
        return this.getStatus();
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

console.log('✅ AirtableAPI CORREGIDO iniciado con auto-detección de tablas y manejo de errores 404');
console.log('🔍 Métodos disponibles:', Object.getOwnPropertyNames(AirtableAPI.prototype).filter(name => name !== 'constructor'));
console.log('📊 Estado inicial:', window.airtableAPI.getStatus());