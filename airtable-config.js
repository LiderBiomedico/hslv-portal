// 🌐 CONFIGURACIÓN COMPLETA DE AIRTABLE - Sistema Hospital
// airtable-config.js - Versión con numeración automática y asignación inteligente

class AirtableAPI {
    constructor() {
        this.baseUrl = '/.netlify/functions/airtable-proxy';
        
        // Mapeo de tablas
        this.tables = {
            solicitudes: 'Solicitudes',
            tecnicos: 'Tecnicos', 
            usuarios: 'Usuarios',
            solicitudesAcceso: 'SolicitudesAcceso'
        };

        console.log('🚀 AirtableAPI iniciado con proxy Netlify');
    }

    // 🔗 Función base para hacer requests
    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const url = `${this.baseUrl}/${endpoint}`;
            console.log(`📡 ${method} ${url}`);

            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data && (method === 'POST' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
                console.log('📝 Data enviada:', data);
            }

            const response = await fetch(url, options);
            const responseText = await response.text();
            
            console.log('📨 Response status:', response.status);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = { message: responseText };
                }
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            return JSON.parse(responseText);

        } catch (error) {
            console.error('❌ Error en makeRequest:', error);
            throw error;
        }
    }

    // ✅ Test de conexión
    async testConnection() {
        try {
            const result = await this.makeRequest(this.tables.solicitudes + '?maxRecords=1');
            console.log('✅ Conexión exitosa con Airtable');
            return true;
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
    }

    // 🔢 GENERAR NÚMERO DE SOLICITUD POR ÁREA
    async generateSolicitudNumber(area) {
        try {
            console.log(`🔢 Generando número para área: ${area}`);
            
            // Obtener todas las solicitudes del área
            const solicitudes = await this.getSolicitudes();
            
            // Definir prefijos por área
            const prefijos = {
                'INGENIERIA_BIOMEDICA': 'SOLBIO',
                'MECANICA': 'SOLMEC', 
                'INFRAESTRUCTURA': 'SOLINFRA'
            };
            
            const prefijo = prefijos[area];
            if (!prefijo) {
                console.warn(`⚠️ Área no reconocida: ${area}, usando SOL genérico`);
                return `SOL${Date.now()}`;
            }
            
            // Filtrar solicitudes del área y extraer números
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
            
            // Generar siguiente número
            const siguienteNumero = maxNumber + 1;
            const numeroFormateado = siguienteNumero.toString().padStart(5, '0');
            const numeroCompleto = `${prefijo}${numeroFormateado}`;
            
            console.log(`✅ Número generado: ${numeroCompleto}`);
            return numeroCompleto;
            
        } catch (error) {
            console.error('❌ Error generando número de solicitud:', error);
            // Fallback con timestamp
            const timestamp = Date.now().toString().slice(-5);
            return `SOL${timestamp}`;
        }
    }

    // ⏰ CALCULAR FECHA LÍMITE SEGÚN PRIORIDAD
    calcularFechaLimite(prioridad) {
        const ahora = new Date();
        let horasLimite;
        
        switch (prioridad) {
            case 'CRITICA':
                horasLimite = 2; // 2 horas
                break;
            case 'ALTA':
                horasLimite = 8; // 8 horas
                break;
            case 'MEDIA':
                horasLimite = 24; // 24 horas
                break;
            case 'BAJA':
                horasLimite = 72; // 72 horas
                break;
            default:
                horasLimite = 24;
        }
        
        const fechaLimite = new Date(ahora.getTime() + (horasLimite * 60 * 60 * 1000));
        return fechaLimite.toISOString();
    }

    // 📋 CREAR SOLICITUD CON NUMERACIÓN AUTOMÁTICA
    async createSolicitud(solicitudData) {
        try {
            console.log('📋 Creando solicitud con numeración automática...');
            
            // Generar número automáticamente según el área
            const numeroSolicitud = await this.generateSolicitudNumber(solicitudData.servicioIngenieria);
            
            // Preparar datos con número generado
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
                    
                    // Campos de asignación (inicialmente vacíos)
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
            
            console.log('📤 Datos preparados para envío:', data);
            
            const result = await this.makeRequest(this.tables.solicitudes, 'POST', data);
            
            console.log('✅ Solicitud creada con número:', numeroSolicitud);
            
            // Devolver con formato consistente
            return {
                id: result.id,
                numero: numeroSolicitud,
                ...result.fields
            };
            
        } catch (error) {
            console.error('❌ Error creando solicitud con numeración:', error);
            throw error;
        }
    }

    // 📋 OBTENER SOLICITUDES
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

    // 👨‍🔧 OBTENER TÉCNICOS
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

    // 🔄 ACTUALIZAR TÉCNICO
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
            console.error('❌ Error actualizando técnico:', error);
            throw error;
        }
    }

    // 🎯 ASIGNAR TÉCNICO CON GESTIÓN DE TIEMPOS
    async asignarTecnicoConTiempos(solicitudId, tecnicoId, observacionesAsignacion = '') {
        try {
            console.log('🎯 Asignando técnico con gestión de tiempos:', { solicitudId, tecnicoId });
            
            // 1. Obtener datos de la solicitud
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            // 2. Obtener datos del técnico
            const tecnicos = await this.getTecnicos();
            const tecnico = tecnicos.find(t => t.id === tecnicoId);
            
            if (!tecnico) {
                throw new Error('Técnico no encontrado');
            }
            
            // 3. Verificar que el técnico esté disponible
            if (tecnico.estado !== 'disponible') {
                throw new Error(`Técnico no disponible. Estado actual: ${tecnico.estado}`);
            }
            
            // 4. Verificar compatibilidad de área
            if (tecnico.area !== solicitud.servicioIngenieria) {
                console.warn(`⚠️ Asignando técnico de ${tecnico.area} a solicitud de ${solicitud.servicioIngenieria}`);
            }
            
            // 5. Calcular tiempo de respuesta
            const ahora = new Date();
            const fechaCreacion = new Date(solicitud.fechaCreacion);
            const tiempoRespuestaMs = ahora.getTime() - fechaCreacion.getTime();
            const tiempoRespuestaHoras = Math.round((tiempoRespuestaMs / (1000 * 60 * 60)) * 100) / 100;
            
            // 6. Determinar estado del tiempo
            const fechaLimite = new Date(solicitud.fechaLimiteRespuesta);
            const estadoTiempo = ahora <= fechaLimite ? 'EN_TIEMPO' : 'FUERA_TIEMPO';
            
            // 7. Actualizar solicitud
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
            
            // 8. Actualizar estado del técnico
            await this.updateTecnico(tecnicoId, { 
                estado: 'ocupado',
                ultimaAsignacion: ahora.toISOString(),
                solicitudActual: solicitudId
            });
            
            console.log('✅ Asignación completada exitosamente');
            console.log(`⏰ Tiempo de respuesta: ${tiempoRespuestaHoras} horas`);
            console.log(`📊 Estado tiempo: ${estadoTiempo}`);
            
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
            console.error('❌ Error en asignación con tiempos:', error);
            throw error;
        }
    }

    // ✅ COMPLETAR SOLICITUD
    async completarSolicitud(solicitudId, observacionesCompletado = '', requiereAprobacion = false) {
        try {
            console.log('✅ Completando solicitud:', solicitudId);
            
            // 1. Obtener solicitud actual
            const solicitudes = await this.getSolicitudes();
            const solicitud = solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            if (solicitud.estado !== 'ASIGNADA' && solicitud.estado !== 'EN_PROCESO') {
                throw new Error(`No se puede completar solicitud en estado: ${solicitud.estado}`);
            }
            
            // 2. Calcular tiempos
            const ahora = new Date();
            const fechaCreacion = new Date(solicitud.fechaCreacion);
            const fechaAsignacion = solicitud.fechaAsignacion ? new Date(solicitud.fechaAsignacion) : fechaCreacion;
            
            const tiempoResolucionMs = ahora.getTime() - fechaAsignacion.getTime();
            const tiempoResolucionHoras = Math.round((tiempoResolucionMs / (1000 * 60 * 60)) * 100) / 100;
            
            const tiempoTotalMs = ahora.getTime() - fechaCreacion.getTime();
            const tiempoTotalHoras = Math.round((tiempoTotalMs / (1000 * 60 * 60)) * 100) / 100;
            
            // 3. Actualizar solicitud
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
            
            // 4. Liberar técnico si está completada
            if (!requiereAprobacion && solicitud.tecnicoAsignadoId) {
                await this.updateTecnico(solicitud.tecnicoAsignadoId, { 
                    estado: 'disponible',
                    solicitudActual: '',
                    ultimaCompletada: ahora.toISOString()
                });
            }
            
            console.log('✅ Solicitud completada exitosamente');
            console.log(`⏰ Tiempo resolución: ${tiempoResolucionHoras} horas`);
            console.log(`📊 Tiempo total: ${tiempoTotalHoras} horas`);
            
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
            console.error('❌ Error completando solicitud:', error);
            throw error;
        }
    }

    // 🤖 AUTO-ASIGNACIÓN INTELIGENTE
    async autoAsignarSolicitudesPendientes(criterio = 'carga_trabajo') {
        try {
            console.log('🤖 Iniciando auto-asignación de solicitudes pendientes...');
            
            // 1. Obtener solicitudes pendientes
            const solicitudes = await this.getSolicitudes();
            const solicitudesPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE');
            
            if (solicitudesPendientes.length === 0) {
                return {
                    success: true,
                    message: 'No hay solicitudes pendientes para asignar',
                    asignaciones: 0
                };
            }
            
            // 2. Obtener técnicos disponibles
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
            
            // 3. Asignar por prioridad (críticas primero)
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
                        // Asignar solicitud
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
                            
                            // Marcar técnico como ocupado para siguientes iteraciones
                            tecnicoSeleccionado.estado = 'ocupado';
                        }
                    }
                    
                } catch (error) {
                    console.error(`❌ Error asignando solicitud ${solicitud.numero}:`, error);
                }
            }
            
            console.log(`✅ Auto-asignación completada: ${resultados.length} asignaciones`);
            
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
            console.error('❌ Error en auto-asignación:', error);
            return {
                success: false,
                error: error.message,
                asignaciones: 0
            };
        }
    }

    // 📊 OBTENER ESTADÍSTICAS DE TIEMPOS
    async getEstadisticasTiempos() {
        try {
            console.log('📊 Calculando estadísticas de tiempos...');
            
            const solicitudes = await this.getSolicitudes();
            const ahora = new Date();
            
            const stats = {
                // Totales generales
                total: solicitudes.length,
                pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
                asignadas: solicitudes.filter(s => s.estado === 'ASIGNADA').length,
                completadas: solicitudes.filter(s => s.estado === 'COMPLETADA').length,
                
                // Tiempos de respuesta
                tiemposRespuesta: {
                    promedio: 0,
                    enTiempo: 0,
                    fueraTiempo: 0,
                    porcentajeEnTiempo: 0
                },
                
                // Tiempos de resolución
                tiemposResolucion: {
                    promedio: 0,
                    minimo: 0,
                    maximo: 0
                },
                
                // Por área
                porArea: {},
                
                // Por prioridad
                porPrioridad: {},
                
                // Solicitudes atrasadas
                atrasadas: [],
                
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
            
            // Calcular estadísticas de resolución
            const solicitudesResueltas = solicitudes.filter(s => s.tiempoResolucionHoras);
            
            if (solicitudesResueltas.length > 0) {
                const tiemposResolucion = solicitudesResueltas.map(s => s.tiempoResolucionHoras);
                stats.tiemposResolucion.promedio = tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length;
                stats.tiemposResolucion.minimo = Math.min(...tiemposResolucion);
                stats.tiemposResolucion.maximo = Math.max(...tiemposResolucion);
            }
            
            // Estadísticas por área
            ['INGENIERIA_BIOMEDICA', 'MECANICA', 'INFRAESTRUCTURA'].forEach(area => {
                const solicitudesArea = solicitudes.filter(s => s.servicioIngenieria === area);
                stats.porArea[area] = {
                    total: solicitudesArea.length,
                    pendientes: solicitudesArea.filter(s => s.estado === 'PENDIENTE').length,
                    completadas: solicitudesArea.filter(s => s.estado === 'COMPLETADA').length,
                    enTiempo: solicitudesArea.filter(s => s.estadoTiempo === 'EN_TIEMPO').length
                };
            });
            
            // Estadísticas por prioridad
            ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].forEach(prioridad => {
                const solicitudesPrioridad = solicitudes.filter(s => s.prioridad === prioridad);
                stats.porPrioridad[prioridad] = {
                    total: solicitudesPrioridad.length,
                    pendientes: solicitudesPrioridad.filter(s => s.estado === 'PENDIENTE').length,
                    enTiempo: solicitudesPrioridad.filter(s => s.estadoTiempo === 'EN_TIEMPO').length
                };
            });
            
            // Identificar solicitudes atrasadas
            stats.atrasadas = solicitudes
                .filter(s => {
                    if (s.estado === 'COMPLETADA') return false;
                    if (!s.fechaLimiteRespuesta) return false;
                    
                    const fechaLimite = new Date(s.fechaLimiteRespuesta);
                    return ahora > fechaLimite;
                })
                .map(s => ({
                    id: s.id,
                    numero: s.numero,
                    area: s.servicioIngenieria,
                    prioridad: s.prioridad,
                    fechaCreacion: s.fechaCreacion,
                    fechaLimite: s.fechaLimiteRespuesta,
                    horasAtrasado: Math.round((ahora.getTime() - new Date(s.fechaLimiteRespuesta).getTime()) / (1000 * 60 * 60))
                }));
            
            console.log('✅ Estadísticas de tiempos calculadas');
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error calculando estadísticas de tiempos:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // === FUNCIONES PARA USUARIOS ===

    // 👤 OBTENER USUARIOS
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

    // ➕ CREAR USUARIO
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
            console.error('❌ Error creando usuario:', error);
            throw error;
        }
    }

    // 🎲 GENERAR CÓDIGO DE ACCESO ÚNICO
    async generateUniqueAccessCode() {
        try {
            const usuarios = await this.getUsuarios();
            const codigosExistentes = usuarios.map(u => u.codigoAcceso).filter(c => c);
            
            let codigo;
            let intentos = 0;
            const maxIntentos = 100;

            do {
                codigo = Math.floor(1000 + Math.random() * 9000).toString();
                intentos++;
                
                if (intentos > maxIntentos) {
                    throw new Error('No se pudo generar código único');
                }
            } while (codigosExistentes.includes(codigo));

            return codigo;
            
        } catch (error) {
            console.error('❌ Error generando código único:', error);
            throw error;
        }
    }

    // ✅ VALIDAR CREDENCIALES DE USUARIO
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
            console.error('❌ Error validando credenciales:', error);
            return {
                valid: false,
                error: 'Error interno del sistema'
            };
        }
    }

    // === FUNCIONES PARA SOLICITUDES DE ACCESO ===

    // 📝 OBTENER SOLICITUDES DE ACCESO
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

    // ➕ CREAR SOLICITUD DE ACCESO
    async createSolicitudAcceso(solicitudData) {
        try {
            const data = {
                fields: solicitudData
            };
            
            const result = await this.makeRequest(this.tables.solicitudesAcceso, 'POST', data);
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            console.error('❌ Error creando solicitud de acceso:', error);
            throw error;
        }
    }

    // 🔄 ACTUALIZAR SOLICITUD DE ACCESO
    async updateSolicitudAcceso(solicitudId, updateData) {
        try {
            const result = await this.makeRequest(
                `${this.tables.solicitudesAcceso}/${solicitudId}`, 
                'PATCH', 
                { fields: updateData }
            );
            
            return {
                id: result.id,
                ...result.fields
            };
            
        } catch (error) {
            console.error('❌ Error actualizando solicitud de acceso:', error);
            throw error;
        }
    }
}

// 🚀 Inicializar API Global
window.airtableAPI = new AirtableAPI();

console.log('✅ AirtableAPI configurado con todas las funciones de numeración y asignación');