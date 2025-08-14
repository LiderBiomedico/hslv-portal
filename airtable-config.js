// Agregar estas nuevas ubicaciones al objeto ubicacionesHospitalarias en airtable-config.js
// Busca la sección donde están definidas las ubicaciones y agrega estas nuevas:

// 🗺️ MAPEO ACTUALIZADO DE UBICACIONES HOSPITALARIAS
const ubicacionesHospitalarias = {
    // Urgencias
    'URGENCIAS_ADULTO': 'Urgencias Adulto',
    'URGENCIAS_PEDIATRIA': 'Urgencias Pediatría',
    'URGENCIAS_GINECOLOGIA': 'Urgencias Ginecología',
    // UCI
    'UCI_ADULTO': 'UCI Adulto',
    'UCI_INTERMEDIOS': 'UCI Intermedios',
    'UCI_NEONATAL': 'UCI Neonatal',
    'UCI_PEDIATRICA': 'UCI Pediátrica',
    // Hospitalización
    'HOSPITALIZACION_PEDIATRIA': 'Hospitalización Pediatría',
    // Cirugía
    'CIRUGIA_ADULTO': 'Cirugía Adulto',
    'CIRUGIA_PEDIATRICA': 'Cirugía Pediátrica',
    // Consulta
    'CONSULTA_EXTERNA': 'Consulta Externa',
    // Servicios especializados
    'SALA_PARTOS': 'Sala de Partos',
    'ENDOSCOPIA': 'Endoscopia',
    'IMAGENES_DIAGNOSTICAS': 'Imágenes Diagnósticas',
    // Laboratorio
    'LABORATORIO_CLINICO': 'Laboratorio Clínico',
    
    // ===== NUEVAS ÁREAS AGREGADAS =====
    // Servicios Farmacéuticos Ampliados
    'BODEGA_MEDICAMENTOS': 'Bodega de Medicamentos',
    'FARMACIA_CENTRAL': 'Farmacia Central',
    'FARMACIA_ADULTO': 'Farmacia Adulto',
    'FARMACIA_UMI': 'Farmacia UMI',
    'FARMACIA_CIRUGIA_UMI': 'Farmacia Cirugía UMI',
    'FARMACIA_CIRUGIA_ADULTO': 'Farmacia Cirugía Adulto',
    'FARMACIA_URGENCIAS': 'Farmacia Urgencias',
    'FARMACIA_UCI_ADULTOS': 'Farmacia UCI Adultos',
    'OFICINA_QUIMICOS_FARMACEUTICOS': 'Oficina Químicos Farmacéuticos',
    
    // Áreas de Gestión y Apoyo
    'SISTEMAS': 'Sistemas',
    'HUMANIZACION': 'Humanización',
    'SEGURIDAD_PACIENTE_SALUD': 'Seguridad del Paciente y Salud',
    'EPIDEMIOLOGIA': 'Epidemiología',
    'CIENCIA_DATO': 'Ciencia del Dato',
    'HOSPITAL': 'Hospital General',
    'SUMINISTROS': 'Suministros',
    // ===== FIN DE NUEVAS ÁREAS =====
    
    // Apoyo terapéutico
    'FISIOTERAPIA': 'Fisioterapia',
    'VACUNACION': 'Vacunación',
    // Transporte
    'TRANSPORTE_ASISTENCIAL': 'Transporte Asistencial',
    // Esterilización
    'CENTRAL_ESTERILIZACION_UMI': 'Central de Esterilización UMI',
    'CENTRAL_ESTERILIZACION_ADULTO': 'Central de Esterilización Adulto',
    // Tramos
    'TRAMO_1': 'Tramo 1',
    'TRAMO_2': 'Tramo 2',
    'TRAMO_3': 'Tramo 3',
    'TRAMO_4': 'Tramo 4',
    'TRAMO_5': 'Tramo 5',
    // Administrativo
    'TRAILER': 'Trailer'
};

// También agregar al objeto serviciosHospitalarios si lo tienes definido
const serviciosHospitalarios = {
    'URGENCIAS': 'Urgencias',
    'URGENCIAS_ADULTO': 'Urgencias Adulto',
    'URGENCIAS_PEDIATRIA': 'Urgencias Pediatría',
    'URGENCIAS_GINECOLOGIA': 'Urgencias Ginecología',
    'UCI': 'UCI',
    'UCI_ADULTO': 'UCI Adulto',
    'UCI_INTERMEDIOS': 'UCI Intermedios',
    'UCI_NEONATAL': 'UCI Neonatal',
    'UCI_PEDIATRICA': 'UCI Pediátrica',
    'HOSPITALIZACION': 'Hospitalización',
    'HOSPITALIZACION_PEDIATRIA': 'Hospitalización Pediatría',
    'CIRUGIA': 'Cirugía',
    'CIRUGIA_ADULTO': 'Cirugía Adulto',
    'CIRUGIA_PEDIATRICA': 'Cirugía Pediátrica',
    'CONSULTA_EXTERNA': 'Consulta Externa',
    'SALA_PARTOS': 'Sala de Partos',
    'ENDOSCOPIA': 'Endoscopia',
    'IMAGENOLOGIA': 'Imagenología',
    'IMAGENES_DIAGNOSTICAS': 'Imágenes Diagnósticas',
    'LABORATORIO': 'Laboratorio',
    'LABORATORIO_CLINICO': 'Laboratorio Clínico',
    'FARMACIA': 'Farmacia',
    
    // ===== NUEVAS ÁREAS AGREGADAS =====
    'BODEGA_MEDICAMENTOS': 'Bodega de Medicamentos',
    'FARMACIA_CENTRAL': 'Farmacia Central',
    'FARMACIA_ADULTO': 'Farmacia Adulto',
    'FARMACIA_UMI': 'Farmacia UMI',
    'FARMACIA_CIRUGIA_UMI': 'Farmacia Cirugía UMI',
    'FARMACIA_CIRUGIA_ADULTO': 'Farmacia Cirugía Adulto',
    'FARMACIA_URGENCIAS': 'Farmacia Urgencias',
    'FARMACIA_UCI_ADULTOS': 'Farmacia UCI Adultos',
    'OFICINA_QUIMICOS_FARMACEUTICOS': 'Oficina Químicos Farmacéuticos',
    'SISTEMAS': 'Sistemas',
    'HUMANIZACION': 'Humanización',
    'SEGURIDAD_PACIENTE_SALUD': 'Seguridad del Paciente y Salud',
    'EPIDEMIOLOGIA': 'Epidemiología',
    'CIENCIA_DATO': 'Ciencia del Dato',
    'HOSPITAL': 'Hospital General',
    'SUMINISTROS': 'Suministros',
    // ===== FIN DE NUEVAS ÁREAS =====
    
    'FISIOTERAPIA': 'Fisioterapia',
    'VACUNACION': 'Vacunación',
    'TRANSPORTE_ASISTENCIAL': 'Transporte Asistencial',
    'CENTRAL_ESTERILIZACION_UMI': 'Central Esterilización UMI',
    'CENTRAL_ESTERILIZACION_ADULTO': 'Central Esterilización Adulto',
    'TRAMO_1': 'Tramo 1',
    'TRAMO_2': 'Tramo 2',
    'TRAMO_3': 'Tramo 3',
    'TRAMO_4': 'Tramo 4',
    'TRAMO_5': 'Tramo 5',
    'ADMINISTRATIVO': 'Administrativo',
    'MANTENIMIENTO': 'Mantenimiento',
    'TRAILER': 'Trailer'
};

// Si necesitas agregar mapeo para compatibilidad con Airtable, agrega esto en AIRTABLE_VALUE_MAPPING:
const AIRTABLE_VALUE_MAPPING = {
    // ... otros mapeos existentes ...
    
    ubicacion: {
        // Mapeo existente...
        'URGENCIAS_ADULTO': 'URGENCIAS_ADULTO',
        'URGENCIAS_PEDIATRIA': 'URGENCIAS_PEDIATRIA',
        'URGENCIAS_GINECOLOGIA': 'URGENCIAS_GINECOLOGIA',
        'UCI_ADULTO': 'UCI_ADULTO',
        'UCI_INTERMEDIOS': 'UCI_INTERMEDIOS',
        'UCI_NEONATAL': 'UCI_NEONATAL',
        'UCI_PEDIATRICA': 'UCI_PEDIATRICA',
        'HOSPITALIZACION_PEDIATRIA': 'HOSPITALIZACION_PEDIATRIA',
        'CIRUGIA_ADULTO': 'CIRUGIA_ADULTO',
        'CIRUGIA_PEDIATRICA': 'CIRUGIA_PEDIATRICA',
        'CONSULTA_EXTERNA': 'CONSULTA_EXTERNA',
        'SALA_PARTOS': 'SALA_PARTOS',
        'ENDOSCOPIA': 'ENDOSCOPIA',
        'IMAGENES_DIAGNOSTICAS': 'IMAGENES_DIAGNOSTICAS',
        'LABORATORIO_CLINICO': 'LABORATORIO_CLINICO',
        
        // NUEVAS UBICACIONES PARA MAPEO
        'BODEGA_MEDICAMENTOS': 'BODEGA_MEDICAMENTOS',
        'Bodega de Medicamentos': 'BODEGA_MEDICAMENTOS',
        'FARMACIA_CENTRAL': 'FARMACIA_CENTRAL',
        'Farmacia Central': 'FARMACIA_CENTRAL',
        'FARMACIA_ADULTO': 'FARMACIA_ADULTO',
        'Farmacia Adulto': 'FARMACIA_ADULTO',
        'FARMACIA_UMI': 'FARMACIA_UMI',
        'Farmacia UMI': 'FARMACIA_UMI',
        'FARMACIA_CIRUGIA_UMI': 'FARMACIA_CIRUGIA_UMI',
        'Farmacia Cirugía UMI': 'FARMACIA_CIRUGIA_UMI',
        'Farmacia Cirugia UMI': 'FARMACIA_CIRUGIA_UMI',
        'FARMACIA_CIRUGIA_ADULTO': 'FARMACIA_CIRUGIA_ADULTO',
        'Farmacia Cirugía Adulto': 'FARMACIA_CIRUGIA_ADULTO',
        'Farmacia Cirugia Adulto': 'FARMACIA_CIRUGIA_ADULTO',
        'FARMACIA_URGENCIAS': 'FARMACIA_URGENCIAS',
        'Farmacia Urgencias': 'FARMACIA_URGENCIAS',
        'FARMACIA_UCI_ADULTOS': 'FARMACIA_UCI_ADULTOS',
        'Farmacia UCI Adultos': 'FARMACIA_UCI_ADULTOS',
        'OFICINA_QUIMICOS_FARMACEUTICOS': 'OFICINA_QUIMICOS_FARMACEUTICOS',
        'Oficina Químicos Farmacéuticos': 'OFICINA_QUIMICOS_FARMACEUTICOS',
        'Oficina Quimicos Farmaceuticos': 'OFICINA_QUIMICOS_FARMACEUTICOS',
        'SISTEMAS': 'SISTEMAS',
        'Sistemas': 'SISTEMAS',
        'HUMANIZACION': 'HUMANIZACION',
        'Humanización': 'HUMANIZACION',
        'Humanizacion': 'HUMANIZACION',
        'SEGURIDAD_PACIENTE_SALUD': 'SEGURIDAD_PACIENTE_SALUD',
        'Seguridad del Paciente y Salud': 'SEGURIDAD_PACIENTE_SALUD',
        'Seguridad Paciente y Salud': 'SEGURIDAD_PACIENTE_SALUD',
        'EPIDEMIOLOGIA': 'EPIDEMIOLOGIA',
        'Epidemiología': 'EPIDEMIOLOGIA',
        'Epidemiologia': 'EPIDEMIOLOGIA',
        'CIENCIA_DATO': 'CIENCIA_DATO',
        'Ciencia del Dato': 'CIENCIA_DATO',
        'Ciencia Dato': 'CIENCIA_DATO',
        'HOSPITAL': 'HOSPITAL',
        'Hospital General': 'HOSPITAL',
        'Hospital': 'HOSPITAL',
        'SUMINISTROS': 'SUMINISTROS',
        'Suministros': 'SUMINISTROS',
        
        // Otras ubicaciones existentes...
        'FISIOTERAPIA': 'FISIOTERAPIA',
        'VACUNACION': 'VACUNACION',
        'TRANSPORTE_ASISTENCIAL': 'TRANSPORTE_ASISTENCIAL',
        'CENTRAL_ESTERILIZACION_UMI': 'CENTRAL_ESTERILIZACION_UMI',
        'CENTRAL_ESTERILIZACION_ADULTO': 'CENTRAL_ESTERILIZACION_ADULTO',
        'TRAMO_1': 'TRAMO_1',
        'TRAMO_2': 'TRAMO_2',
        'TRAMO_3': 'TRAMO_3',
        'TRAMO_4': 'TRAMO_4',
        'TRAMO_5': 'TRAMO_5',
        'TRAILER': 'TRAILER'
    }
    
    // ... resto del mapeo ...
};