// config/supabase.js
// Configuración de Supabase para Hospital Susana López de Valencia

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 🔑 CONFIGURACIÓN DE SUPABASE
// ⚠️ IMPORTANTE: Reemplaza con tus credenciales reales de Supabase
const supabaseUrl = 'https://sqvridmkottbxxvajqkc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdnJpZG1rb3R0Ynh4dmFqcWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDIyOTIsImV4cCI6MjA2NzA3ODI5Mn0.HqXyhLamlf1jYjgSlik3P32iTBjxQcVQIY-Mv_UaHlE'

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

// ===== UTILIDADES DE SUPABASE =====

const supabaseUtils = {
  // Verificar conexión
  async isConnected() {
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id')
        .limit(1)
      
      return !error
    } catch (error) {
      console.error('Error verificando conexión Supabase:', error)
      return false
    }
  },

  // Obtener estadísticas de conexión
  async getConnectionStats() {
    try {
      const solicitudesCount = await supabase
        .from('solicitudes')
        .select('id', { count: 'exact' })
      
      const technicosCount = await supabase
        .from('technicians')
        .select('id', { count: 'exact' })
      
      const usuariosCount = await supabase
        .from('usuarios_aprobados')
        .select('id', { count: 'exact' })

      return {
        solicitudes: solicitudesCount.count || 0,
        tecnicos: technicosCount.count || 0,
        usuarios: usuariosCount.count || 0,
        conectado: true
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return {
        solicitudes: 0,
        tecnicos: 0,
        usuarios: 0,
        conectado: false
      }
    }
  }
}

// ===== COMPATIBILIDAD CON FIREBASE =====
// Para mantener compatibilidad con el código existente

const firebaseCompat = {
  // Guardar solicitud (compatible con Firebase)
  async saveRequestToFirebase(requestData) {
    try {
      console.log('🔄 Guardando solicitud en Supabase...')
      
      const { data, error } = await supabase
        .from('solicitudes')
        .insert([{
          numero: requestData.numero,
          servicio_ingenieria: requestData.servicioIngenieria,
          tipo_servicio: requestData.tipoServicio,
          prioridad: requestData.prioridad,
          equipo: requestData.equipo,
          ubicacion: requestData.ubicacion,
          descripcion: requestData.descripcion,
          observaciones: requestData.observaciones,
          solicitante: requestData.solicitante,
          servicio_hospitalario: requestData.servicioHospitalario,
          servicio_solicitante: requestData.servicioSolicitante,
          email_solicitante: requestData.emailSolicitante,
          fecha_creacion: requestData.fechaCreacion,
          fecha_creacion_iso: requestData.fechaCreacionISO,
          estado: requestData.estado || 'PENDIENTE',
          estado_gestion: requestData.estadoGestion || 'PENDIENTE',
          tecnico_asignado: requestData.tecnicoAsignado,
          fecha_asignacion: requestData.fechaAsignacion,
          sincronizado: true,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('❌ Error Supabase:', error)
        return false
      }

      console.log('✅ Solicitud guardada en Supabase:', data)
      return true

    } catch (error) {
      console.error('❌ Error guardando en Supabase:', error)
      return false
    }
  },

  // Cargar solicitudes (compatible con Firebase)
  async loadRequestsFromFirebase() {
    try {
      console.log('📥 Cargando solicitudes desde Supabase...')
      
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error cargando desde Supabase:', error)
        return []
      }

      // Convertir formato Supabase a formato esperado
      const solicitudes = data.map(item => ({
        id: item.id,
        numero: item.numero,
        servicioIngenieria: item.servicio_ingenieria,
        tipoServicio: item.tipo_servicio,
        prioridad: item.prioridad,
        equipo: item.equipo,
        ubicacion: item.ubicacion,
        descripcion: item.descripcion,
        observaciones: item.observaciones,
        solicitante: item.solicitante,
        servicioHospitalario: item.servicio_hospitalario,
        servicioSolicitante: item.servicio_solicitante,
        emailSolicitante: item.email_solicitante,
        fechaCreacion: item.fecha_creacion,
        fechaCreacionISO: item.fecha_creacion_iso,
        estado: item.estado,
        estadoGestion: item.estado_gestion,
        tecnicoAsignado: item.tecnico_asignado,
        fechaAsignacion: item.fecha_asignacion,
        sincronizado: item.sincronizado
      }))

      console.log(`✅ ${solicitudes.length} solicitudes cargadas desde Supabase`)
      return solicitudes

    } catch (error) {
      console.error('❌ Error cargando desde Supabase:', error)
      return []
    }
  },

  // Guardar solicitud de acceso
  async saveAccessRequestToFirebase(accessData) {
    try {
      console.log('🔐 Guardando solicitud de acceso en Supabase...')
      
      const { data, error } = await supabase
        .from('solicitudes_acceso')
        .insert([{
          access_id: accessData.id,
          nombre_completo: accessData.nombreCompleto,
          email: accessData.email,
          telefono: accessData.telefono,
          servicio_hospitalario: accessData.servicioHospitalario,
          cargo: accessData.cargo,
          justificacion: accessData.justificacion,
          fecha_solicitud: accessData.fechaSolicitud,
          estado: accessData.estado || 'PENDIENTE',
          es_urgente: accessData.esUrgente || false,
          numero_documento: accessData.numeroDocumento,
          jefe_supervisor: accessData.jefeSupervisor,
          sincronizado: true,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('❌ Error guardando acceso en Supabase:', error)
        return false
      }

      console.log('✅ Solicitud de acceso guardada en Supabase')
      return true

    } catch (error) {
      console.error('❌ Error guardando solicitud de acceso:', error)
      return false
    }
  },

  // Obtener usuarios aprobados
  async getApprovedUsersFromFirebase() {
    try {
      console.log('👥 Cargando usuarios aprobados desde Supabase...')
      
      const { data, error } = await supabase
        .from('usuarios_aprobados')
        .select('*')
        .eq('estado', 'ACTIVO')

      if (error) {
        console.error('❌ Error cargando usuarios desde Supabase:', error)
        return []
      }

      console.log(`✅ ${data.length} usuarios aprobados cargados desde Supabase`)
      return data

    } catch (error) {
      console.error('❌ Error cargando usuarios aprobados:', error)
      return []
    }
  },

  // Guardar técnico
  async saveTechnicianToFirebase(technicianData) {
    try {
      console.log('👨‍🔧 Guardando técnico en Supabase...')
      
      const { data, error } = await supabase
        .from('technicians')
        .insert([{
          nombre: technicianData.nombre,
          tipo: technicianData.tipo,
          area: technicianData.area,
          especialidad: technicianData.especialidad,
          telefono: technicianData.telefono,
          email: technicianData.email,
          estado: technicianData.estado,
          disponible: technicianData.disponible,
          fecha_creacion: technicianData.fechaCreacion,
          fecha_creacion_local: technicianData.fechaCreacionLocal,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('❌ Error guardando técnico en Supabase:', error)
        return false
      }

      console.log('✅ Técnico guardado en Supabase')
      return true

    } catch (error) {
      console.error('❌ Error guardando técnico:', error)
      return false
    }
  },

  // Configurar listeners en tiempo real
  setupRealtimeListeners() {
    console.log('👂 Configurando listeners de Supabase en tiempo real...')
    
    try {
      // Listener para solicitudes
      const solicitudesSubscription = supabase
        .channel('solicitudes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'solicitudes' },
          (payload) => {
            console.log('🔄 Cambio en solicitudes:', payload)
            
            // Disparar evento personalizado para actualizar UI
            document.dispatchEvent(new CustomEvent('supabaseSync', {
              detail: { 
                type: 'solicitudes', 
                event: payload.eventType,
                data: payload.new || payload.old 
              }
            }))
          }
        )
        .subscribe()

      // Listener para técnicos
      const technicosSubscription = supabase
        .channel('technicians_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'technicians' },
          (payload) => {
            console.log('👥 Cambio en técnicos:', payload)
            
            document.dispatchEvent(new CustomEvent('supabaseSync', {
              detail: { 
                type: 'technicians', 
                event: payload.eventType,
                data: payload.new || payload.old 
              }
            }))
          }
        )
        .subscribe()

      // Listener para usuarios
      const usuariosSubscription = supabase
        .channel('users_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'usuarios_aprobados' },
          (payload) => {
            console.log('🔐 Cambio en usuarios:', payload)
            
            document.dispatchEvent(new CustomEvent('supabaseSync', {
              detail: { 
                type: 'users', 
                event: payload.eventType,
                data: payload.new || payload.old 
              }
            }))
          }
        )
        .subscribe()

      console.log('✅ Listeners de Supabase configurados')
      return { solicitudesSubscription, technicosSubscription, usuariosSubscription }

    } catch (error) {
      console.error('❌ Error configurando listeners:', error)
      return null
    }
  }
}

// ===== FUNCIONES DE DIAGNÓSTICO =====

window.testSupabaseConnection = async function() {
  console.log('🧪 Probando conexión a Supabase...')
  
  try {
    const stats = await supabaseUtils.getConnectionStats()
    
    if (stats.conectado) {
      alert(`✅ SUPABASE CONECTADO EXITOSAMENTE

📊 ESTADÍSTICAS:
• Solicitudes: ${stats.solicitudes}
• Técnicos: ${stats.tecnicos}  
• Usuarios: ${stats.usuarios}
• URL: ${supabaseUrl}

🔄 Sistema funcionando correctamente`)
    } else {
      alert(`❌ ERROR DE CONEXIÓN SUPABASE

🔧 VERIFICAR:
• URL del proyecto Supabase
• Anon key correcta
• Reglas RLS configuradas
• Tablas creadas`)
    }
  } catch (error) {
    alert(`❌ ERROR: ${error.message}`)
  }
}

// Exportar todo
export { 
  supabase, 
  supabaseUtils, 
  firebaseCompat 
}

// También disponible globalmente para compatibilidad
window.supabase = supabase
window.supabaseUtils = supabaseUtils
window.firebaseCompat = firebaseCompat

console.log('🚀 Configuración Supabase cargada correctamente')
console.log('🔑 URL:', supabaseUrl)
console.log('📋 Funciones disponibles: supabase, supabaseUtils, firebaseCompat')