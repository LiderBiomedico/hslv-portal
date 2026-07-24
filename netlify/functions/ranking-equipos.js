/* ============================================================================
   MODULO: RANKING DE EQUIPOS Y SERVICIOS  -  Portal de Gestion HSLV
   Autor: Paul Eduardo Munoz R.
   Analiza que equipos y que ubicaciones/servicios generan mas solicitudes.
   Se integra como pestana "Equipos y Servicios" en Estadisticas Avanzadas.
   Comandos de consola: rkRenderizar() - rkDiagnosticoNombres() - rkExportarCSV()
   ============================================================================ */

// ---------------------------------------------------------------------------
// 1) NORMALIZACIÓN Y AGRUPACIÓN INTELIGENTE DE NOMBRES
// ---------------------------------------------------------------------------

function rkNormalizar(txt) {
    if (!txt) return '';
    return String(txt)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quita tildes/ñ
        .toUpperCase()
        .replace(/[_\-\/]/g, ' ')
        .replace(/[^A-Z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Catálogo canónico: agrupa variantes, typos y descripciones largas.
// El orden importa: se evalúa de patrón más largo a más corto.
// Catálogo canónico: agrupa variantes, typos y descripciones largas.
// El patrón MÁS LARGO que coincida gana, por eso el orden de la lista no afecta
// el resultado. Para añadir un equipo nuevo basta con agregar una línea.
const RK_CATALOGO_EQUIPOS = [

    // ── MONITOREO Y SIGNOS VITALES ──────────────────────────────────────────
    { canon: 'MONITOR DE SIGNOS VITALES', pat: ['MONITOR DE SIGNOS', 'MONITOR SIGNOS', 'MONITOR MULTIPARAMETRO', 'MONITOR DE PACIENTE', 'MONITOR DE TRANSPORTE'] },
    { canon: 'MONITOR FETAL',             pat: ['MONITOR FETAL', 'CARDIOTOCOGRAFO', 'MONITOREO FETAL'] },
    { canon: 'DOPPLER FETAL',             pat: ['DOPPLER'] },
    { canon: 'SATUROMETRO / PULSIOXIMETRO', pat: ['SATUROMETRO', 'SATURIMETRO', 'PULSIOXIMETRO', 'OXIMETRO', 'PULSOXIMETRO'] },
    { canon: 'TENSIOMETRO',               pat: ['TENSIOMETRO', 'ESFIGMOMANOMETRO', 'TOMA TENSION'] },
    { canon: 'ELECTROCARDIOGRAFO',        pat: ['ELECTROCARDIOGRAFO', 'EKG', 'ELECTROCARDIOGRAMA'] },
    { canon: 'ELECTROENCEFALOGRAFO',      pat: ['ELECTROENCEFALOGRAFO', 'ENCEFALOGRAFO', 'EEG'] },
    { canon: 'TERMOMETRO',                pat: ['TERMOMETRO', 'TERMOHIGROMETRO'] },
    { canon: 'GLUCOMETRO',                pat: ['GLUCOMETRO'] },

    // ── SOPORTE VITAL Y RESPIRATORIO ────────────────────────────────────────
    { canon: 'VENTILADOR MECANICO',       pat: ['VENTILADOR MECANICO', 'VENTILADOR PULMONAR', 'VENTILADOR'] },
    { canon: 'CPAP / BIPAP',              pat: ['CPAP', 'BIPAP', 'VENTILACION NO INVASIVA'] },
    { canon: 'MAQUINA DE ANESTESIA',      pat: ['MAQUINA DE ANESTESIA', 'MAQUINA ANESTESIA', 'ANESTESIA', 'VAPORIZADOR'] },
    { canon: 'DESFIBRILADOR',             pat: ['DESFIBRILADOR', 'DESFIBRILACION', 'CARDIODESFIBRILADOR'] },
    { canon: 'CARRO DE PARO',             pat: ['CARRO DE PARO', 'CARRO PARO'] },
    { canon: 'ASPIRADOR / SUCCIONADOR',   pat: ['ASPIRADOR', 'SUCCIONADOR', 'SUCCION', 'ASPIRACION'] },
    { canon: 'NEBULIZADOR',               pat: ['NEBULIZADOR', 'MICRONEBULIZADOR'] },
    { canon: 'CONCENTRADOR DE OXIGENO',   pat: ['CONCENTRADOR DE OXIGENO', 'CONCENTRADOR OXIGENO'] },
    { canon: 'FLUJOMETRO / REGULADOR',    pat: ['FLUJOMETRO', 'REGULADOR DE OXIGENO', 'MANOMETRO', 'VACUOMETRO'] },
    { canon: 'LARINGOSCOPIO',             pat: ['LARINGOSCOPIO'] },
    { canon: 'HUMIDIFICADOR',             pat: ['HUMIDIFICADOR', 'CALENTADOR HUMIDIFICADOR'] },

    // ── INFUSIÓN ────────────────────────────────────────────────────────────
    { canon: 'BOMBA DE INFUSION',         pat: ['BOMBA DE INFUSION', 'BOMBA INFUSION', 'INFUSOR', 'BOMBA VOLUMETRICA'] },
    { canon: 'BOMBA DE JERINGA',          pat: ['BOMBA DE JERINGA', 'JERINGA DE INFUSION', 'PERFUSOR'] },
    { canon: 'CALENTADOR DE FLUIDOS',     pat: ['CALENTADOR DE FLUIDOS', 'CALENTADOR DE SANGRE', 'MANTA TERMICA'] },

    // ── QUIRÓFANO ───────────────────────────────────────────────────────────
    { canon: 'MESA QUIRURGICA',           pat: ['MESA QUIRURGICA', 'MESA QUIRUGICA', 'MESA DE CIRUGIA', 'MESA DE MAYO'] },
    { canon: 'LAMPARA CIELITICA',         pat: ['CIELITICA', 'CIALITICA', 'SIALITICA', 'LAMPARA QUIRURGICA', 'LAMPARA DE CIRUGIA'] },
    { canon: 'ELECTROBISTURI',            pat: ['ELECTROBISTURI', 'ELECTRO BISTURI', 'UNIDAD ELECTROQUIRURGICA', 'BISTURI ELECTRICO'] },
    { canon: 'ASPIRADOR DE HUMO',         pat: ['ASPIRADOR DE HUMO', 'EVACUADOR DE HUMO'] },
    { canon: 'TORNIQUETE NEUMATICO',      pat: ['TORNIQUETE'] },
    { canon: 'MOTOR / SIERRA QUIRURGICA', pat: ['SIERRA QUIRURGICA', 'MOTOR QUIRURGICO', 'PERFORADOR OSEO', 'CRANEOTOMO', 'MICROMOTOR'] },
    { canon: 'TORRE DE LAPAROSCOPIA',     pat: ['LAPAROSCOPIA', 'LAPAROSCOPIO', 'TORRE DE VIDEO', 'VIDEOCAMARA QUIRURGICA'] },
    { canon: 'CRIOCAUTERIO',              pat: ['CRIOCAUTERIO', 'CRIOCIRUGIA', 'CRIOTERAPIA'] },

    // ── IMAGENOLOGÍA Y ENDOSCOPIA ───────────────────────────────────────────
    { canon: 'RAYOS X',                   pat: ['RAYOS X', 'RAYOS-X', 'RX PORTATIL', 'EQUIPO DE RX', 'RADIOLOGIA'] },
    { canon: 'RAYOS X DENTAL',            pat: ['RAYOS X DENTAL', 'RX DENTAL', 'PERIAPICAL', 'PANORAMICO'] },
    { canon: 'ARCO EN C',                 pat: ['ARCO EN C', 'ARCO C'] },
    { canon: 'FLUOROSCOPIO',              pat: ['FLUOROSCOPIO', 'FLUOROSCOPIA'] },
    { canon: 'ECOGRAFO',                  pat: ['ECOGRAFO', 'ECOGRAFIA', 'ULTRASONIDO', 'ULTRASONIDO DIAGNOSTICO', 'TRANSDUCTOR'] },
    { canon: 'MAMOGRAFO',                 pat: ['MAMOGRAFO', 'MAMOGRAFIA'] },
    { canon: 'TOMOGRAFO',                 pat: ['TOMOGRAFO', 'TOMOGRAFIA', 'ESCANOGRAFO'] },
    { canon: 'ENDOSCOPIO / COLONOSCOPIO', pat: ['ENDOSCOPIO', 'COLONOSCOPIO', 'GASTROSCOPIO', 'VIDEOENDOSCOPIO', 'FIBROBRONCOSCOPIO'] },
    { canon: 'NEGATOSCOPIO',              pat: ['NEGATOSCOPIO'] },
    { canon: 'REVELADORA / PROCESADORA',  pat: ['REVELADORA', 'PROCESADORA DE PLACAS', 'CHASIS'] },

    // ── ESTERILIZACIÓN ──────────────────────────────────────────────────────
    { canon: 'AUTOCLAVE',                 pat: ['AUTOCLAVE', 'ESTERILIZADOR A VAPOR', 'ESTERILIZADOR DE VAPOR'] },
    { canon: 'HORNO DE CALOR SECO',       pat: ['CALOR SECO', 'POUPINEL', 'PUPINEL', 'HORNO DE ESTERILIZACION'] },
    { canon: 'LAVADORA ULTRASONICA',      pat: ['LAVADORA ULTRASONICA', 'ULTRASONIDO DE LIMPIEZA', 'CUBA ULTRASONICA'] },
    { canon: 'SELLADORA',                 pat: ['SELLADORA', 'TERMOSELLADORA'] },
    { canon: 'ESTERILIZADOR DE PLASMA',   pat: ['PLASMA', 'PEROXIDO DE HIDROGENO', 'OXIDO DE ETILENO'] },

    // ── NEONATOLOGÍA Y PEDIATRÍA ────────────────────────────────────────────
    { canon: 'INCUBADORA',                pat: ['INCUBADORA'] },
    { canon: 'LAMPARA DE CALOR RADIANTE', pat: ['CALOR RADIANTE', 'LAMPARA DE CALOR', 'SERVOCUNA', 'CUNA TERMICA'] },
    { canon: 'FOTOTERAPIA',               pat: ['FOTOTERAPIA', 'LAMPARA DE FOTOTERAPIA'] },
    { canon: 'BILIRRUBINOMETRO',          pat: ['BILIRRUBINOMETRO', 'BILIRRUBINA'] },

    // ── LABORATORIO Y BANCO DE SANGRE ───────────────────────────────────────
    { canon: 'CENTRIFUGA',                pat: ['CENTRIFUGA', 'MICROCENTRIFUGA'] },
    { canon: 'MICROSCOPIO',               pat: ['MICROSCOPIO', 'ESTEREOSCOPIO'] },
    { canon: 'ANALIZADOR DE LABORATORIO', pat: ['ANALIZADOR', 'HEMATOLOGIA', 'QUIMICA SANGUINEA', 'COAGULOMETRO', 'GASES ARTERIALES', 'ELECTROLITOS'] },
    { canon: 'CABINA DE BIOSEGURIDAD',    pat: ['CABINA DE SEGURIDAD', 'CABINA DE BIOSEGURIDAD', 'FLUJO LAMINAR', 'CAMPANA EXTRACTORA'] },
    { canon: 'BAÑO SEROLOGICO',           pat: ['BANO SEROLOGICO', 'BANO MARIA', 'BANO TERMOSTATADO'] },
    { canon: 'INCUBADORA DE LABORATORIO', pat: ['INCUBADORA BACTERIOLOGICA', 'ESTUFA DE CULTIVO', 'HORNO DE SECADO'] },
    { canon: 'AGITADOR / ROTADOR',        pat: ['AGITADOR', 'VORTEX', 'ROTADOR', 'HOMOGENIZADOR'] },
    { canon: 'PIPETA / DISPENSADOR',      pat: ['PIPETA', 'DISPENSADOR DE REACTIVO'] },
    { canon: 'DESTILADOR DE AGUA',        pat: ['DESTILADOR', 'AGUA DESTILADA', 'OSMOSIS'] },

    // ── ODONTOLOGÍA ─────────────────────────────────────────────────────────
    { canon: 'UNIDAD ODONTOLOGICA',       pat: ['UNIDAD ODONTOLOGICA', 'SILLA ODONTOLOGICA', 'SILLON ODONTOLOGICO', 'ESCUPIDERA'] },
    { canon: 'LAMPARA DE FOTOCURADO',     pat: ['FOTOCURADO', 'LAMPARA DE LUZ HALOGENA'] },
    { canon: 'AMALGAMADOR',               pat: ['AMALGAMADOR', 'VIBRADOR DE AMALGAMA'] },
    { canon: 'CAVITRON / ULTRASONIDO DENTAL', pat: ['CAVITRON', 'ULTRASONIDO DENTAL', 'DESTARTARIZADOR'] },
    { canon: 'COMPRESOR ODONTOLOGICO',    pat: ['COMPRESOR ODONTOLOGICO', 'COMPRESOR DENTAL'] },

    // ── FISIOTERAPIA Y REHABILITACIÓN ───────────────────────────────────────
    { canon: 'ULTRASONIDO TERAPEUTICO',   pat: ['ULTRASONIDO TERAPEUTICO', 'ULTRASONIDO DE TERAPIA'] },
    { canon: 'ELECTROESTIMULADOR / TENS', pat: ['ELECTROESTIMULADOR', 'TENS', 'CORRIENTES INTERFERENCIALES', 'ELECTROTERAPIA'] },
    { canon: 'MAGNETOTERAPIA',            pat: ['MAGNETOTERAPIA', 'MAGNETO'] },
    { canon: 'LASER TERAPEUTICO',         pat: ['LASER TERAPEUTICO', 'LASER DE TERAPIA'] },
    { canon: 'COMPRESERO / PARAFINA',     pat: ['COMPRESERO', 'TANQUE DE PARAFINA', 'PARAFINERO', 'COMPRESAS'] },
    { canon: 'BICICLETA / TROTADORA',     pat: ['SPINING', 'SPINNING', 'BICICLETA', 'ELIPTICA', 'TROTADORA', 'CAMINADORA', 'BANDA SIN FIN'] },
    { canon: 'BARRAS PARALELAS / GIMNASIO', pat: ['PARALELAS', 'ESPALDERA', 'COLCHONETA', 'ESCALERILLA', 'POLEA'] },
    { canon: 'TANQUE DE HIDROTERAPIA',    pat: ['HIDROTERAPIA', 'TINA DE REMOLINO', 'TANQUE DE HUBBARD'] },

    // ── CONSULTA EXTERNA / ESPECIALIDADES ───────────────────────────────────
    { canon: 'LAMPARA DE HENDIDURA',      pat: ['LAMPARA DE HENDIDURA', 'BIOMICROSCOPIO'] },
    { canon: 'OFTALMOSCOPIO / OTOSCOPIO', pat: ['OFTALMOSCOPIO', 'OTOSCOPIO', 'RETINOSCOPIO', 'QUERATOMETRO'] },
    { canon: 'AUDIOMETRO',                pat: ['AUDIOMETRO', 'AUDIOMETRIA', 'IMPEDANCIOMETRO', 'CABINA SONOAMORTIGUADA'] },
    { canon: 'ESPIROMETRO',               pat: ['ESPIROMETRO', 'ESPIROMETRIA'] },
    { canon: 'FONENDOSCOPIO',             pat: ['FONENDOSCOPIO', 'ESTETOSCOPIO'] },
    { canon: 'LAMPARA DE EXAMEN / CUELLO DE CISNE', pat: ['CUELLO DE CISNE', 'LAMPARA DE EXAMEN'] },
    { canon: 'CAMILLA GINECOLOGICA',      pat: ['GINECOLOGICA', 'MESA DE EXAMEN'] },

    // ── MOBILIARIO CLÍNICO Y TRANSPORTE ─────────────────────────────────────
    { canon: 'CAMA HOSPITALARIA',         pat: ['CAMA'] },
    { canon: 'CAMILLA',                   pat: ['CAMILLA'] },
    { canon: 'SILLA DE RUEDAS',           pat: ['SILLA DE RUEDAS'] },
    { canon: 'ATRIL / PORTASUEROS',       pat: ['ATRIL', 'PORTASUERO', 'PORTA SUERO'] },
    { canon: 'BALANZA / BASCULA',         pat: ['BALANZA', 'BASCULA', 'PESABEBE', 'PESA BEBE', 'TALLIMETRO'] },
    { canon: 'NEVERA / REFRIGERADOR',     pat: ['NEVERA', 'REFRIGERADOR', 'CONGELADOR', 'REFRIGERACION DE VACUNAS'] },

    // ── GASES MEDICINALES ───────────────────────────────────────────────────
    { canon: 'RED DE GASES MEDICINALES',  pat: ['MAQUINA DE GASES', 'EQUIPO DE GASES', 'RED DE GASES', 'GASES MEDICINALES', 'MANIFOLD', 'TOMA DE OXIGENO', 'CENTRAL DE OXIGENO'] },
    { canon: 'BOMBA DE VACIO',            pat: ['BOMBA DE VACIO', 'VACIO MEDICINAL'] },

    // ── MECÁNICA / PLANTA FÍSICA ────────────────────────────────────────────
    { canon: 'AIRE ACONDICIONADO',        pat: ['AIRE ACONDICIONADO', 'SPLIT', 'CLIMATIZACION', 'MINISPLIT', 'MANEJADORA'] },
    { canon: 'CHILLER / TORRE DE ENFRIAMIENTO', pat: ['CHILLER', 'TORRE DE ENFRIAMIENTO', 'CONDENSADORA'] },
    { canon: 'EXTRACTOR / VENTILACION',   pat: ['EXTRACTOR', 'VENTILACION MECANICA', 'INYECTOR DE AIRE', 'DUCTO'] },
    { canon: 'CALDERA',                   pat: ['CALDERA', 'CALENTADOR DE AGUA', 'CALDERIN'] },
    { canon: 'PLANTA ELECTRICA',          pat: ['PLANTA ELECTRICA', 'GENERADOR', 'GRUPO ELECTROGENO'] },
    { canon: 'UPS / REGULADOR',           pat: ['UPS', 'REGULADOR DE VOLTAJE', 'ESTABILIZADOR'] },
    { canon: 'TRANSFORMADOR / SUBESTACION', pat: ['TRANSFORMADOR', 'SUBESTACION'] },
    { canon: 'ASCENSOR / MONTACARGAS',    pat: ['ASCENSOR', 'MONTACARGA', 'ELEVADOR'] },
    { canon: 'BOMBA DE AGUA',             pat: ['BOMBA DE AGUA', 'MOTOBOMBA', 'BOMBA HIDRAULICA', 'TANQUE DE AGUA', 'HIDROFLO'] },
    { canon: 'COMPRESOR DE AIRE',         pat: ['COMPRESOR', 'AIRE COMPRIMIDO', 'SECADOR DE AIRE'] },
    { canon: 'PLANTA DE TRATAMIENTO',     pat: ['PTAR', 'TRATAMIENTO DE AGUAS', 'TRAMPA DE GRASA'] },
    { canon: 'HIDROLAVADORA',             pat: ['HIDROLAVADORA'] },

    // ── LAVANDERÍA Y COCINA ─────────────────────────────────────────────────
    { canon: 'LAVADORA INDUSTRIAL',       pat: ['LAVADORA INDUSTRIAL', 'LAVADORA DE ROPA', 'LAVADORA'] },
    { canon: 'SECADORA INDUSTRIAL',       pat: ['SECADORA'] },
    { canon: 'PLANCHADORA / CALANDRA',    pat: ['PLANCHADORA', 'CALANDRA', 'PLANCHA INDUSTRIAL'] },
    { canon: 'MARMITA / ESTUFA INDUSTRIAL', pat: ['MARMITA', 'ESTUFA INDUSTRIAL', 'FOGON', 'HORNO INDUSTRIAL', 'FREIDORA'] },
    { canon: 'CUARTO FRIO',               pat: ['CUARTO FRIO', 'CAVA'] },
    { canon: 'CARRO TERMICO / BANDEJERO', pat: ['CARRO TERMICO', 'BANDEJERO', 'CARRO DE ALIMENTOS'] },
    { canon: 'LICUADORA / PROCESADOR',    pat: ['LICUADORA', 'PROCESADOR DE ALIMENTOS', 'PELADORA'] },

    // ── INFRAESTRUCTURA / OBRA ──────────────────────────────────────────────
    { canon: 'RED HIDRAULICA / SANITARIA', pat: ['LAVAMANOS', 'SANITARIO', 'INODORO', 'TUBERIA', 'GRIFO', 'GRIFERIA', 'LLAVE DE PASO', 'DUCHA', 'ORINAL', 'SIFON', 'DESAGUE', 'POCETA'] },
    { canon: 'RED ELECTRICA / ILUMINACION', pat: ['TOMACORRIENTE', 'ILUMINACION', 'LUMINARIA', 'BOMBILLO', 'TABLERO ELECTRICO', 'BREAKER', 'INTERRUPTOR', 'LAMPARA FLUORESCENTE', 'ACOMETIDA'] },
    { canon: 'OBRA CIVIL',                pat: ['PUERTA', 'VENTANA', 'MURO', 'PARED', 'TECHO', 'CIELO RASO', 'PISO', 'CERRADURA', 'ENCHAPE', 'PINTURA', 'GOTERA', 'FILTRACION', 'DIVISION'] },
    { canon: 'PUERTA AUTOMATICA',         pat: ['PUERTA AUTOMATICA', 'PUERTA CORREDIZA AUTOMATICA'] },
    { canon: 'MOBILIARIO',                pat: ['ESCRITORIO', 'SILLA', 'ARMARIO', 'ESTANTE', 'MESA DE NOCHE', 'ARCHIVADOR', 'CASILLERO', 'MESON'] },
    { canon: 'RED DE DATOS / TELEFONIA',  pat: ['PUNTO DE RED', 'RED DE DATOS', 'CITOFONO', 'TELEFONO', 'CABLEADO ESTRUCTURADO', 'SWITCH', 'ACCESS POINT'] },
    { canon: 'CCTV / SEGURIDAD',          pat: ['CAMARA DE SEGURIDAD', 'CCTV', 'CAMARA DE VIGILANCIA', 'ALARMA', 'CONTROL DE ACCESO'] },
    { canon: 'SISTEMA CONTRA INCENDIOS',  pat: ['EXTINTOR', 'DETECTOR DE HUMO', 'GABINETE CONTRA INCENDIO', 'ROCIADOR'] },
    { canon: 'ZONAS VERDES / EXTERIORES', pat: ['GUADANA', 'JARDIN', 'ZONA VERDE', 'PODA'] },

    // ── OFIMÁTICA / VARIOS ──────────────────────────────────────────────────
    { canon: 'COMPUTADOR / IMPRESORA',    pat: ['COMPUTADOR', 'IMPRESORA', 'COMPUTADOR PORTATIL', 'MONITOR DE COMPUTADOR', 'CPU', 'ESCANER'] },
    { canon: 'TELEVISOR / VIDEOBEAM',     pat: ['TELEVISOR', 'VIDEOBEAM', 'PROYECTOR', 'PANTALLA'] }
];

/**
 * Devuelve el nombre canónico del equipo.
 * @param {string} valor  texto crudo del campo `equipo`
 * @param {boolean} agrupar  true = agrupación inteligente, false = texto normalizado tal cual
 */
// Caché de expresiones regulares (coincidencia por PALABRA COMPLETA, para que
// "CAMA" no capture "CAMARA" ni "TENS" capture "EXTENSION").
const RK_REGEX_CACHE = {};
function rkRegexPatron(p) {
    if (!RK_REGEX_CACHE[p]) RK_REGEX_CACHE[p] = new RegExp('(?:^| )' + p + '(?: |$)');
    return RK_REGEX_CACHE[p];
}

/**
 * Busca el equipo canónico. Gana el patrón MÁS LARGO que coincida.
 * @returns {{canon:string, patron:string}|null}
 */
function rkBuscarCanon(norm) {
    let mejor = null;
    let mejorLargo = 0;
    for (const item of RK_CATALOGO_EQUIPOS) {
        for (const p of item.pat) {
            if (p.length > mejorLargo && rkRegexPatron(p).test(norm)) {
                mejor = { canon: item.canon, patron: p };
                mejorLargo = p.length;
            }
        }
    }
    return mejor;
}

function rkCanonizarEquipo(valor, agrupar = true) {
    const norm = rkNormalizar(valor);
    if (!norm) return 'SIN ESPECIFICAR';
    if (!agrupar) return norm;
    const m = rkBuscarCanon(norm);
    return m ? m.canon : norm;
}

function rkCanonizarUbicacion(valor) {
    const norm = rkNormalizar(valor);
    return norm || 'SIN ESPECIFICAR';
}

// ---------------------------------------------------------------------------
// 2) ESTADO DEL MÓDULO
// ---------------------------------------------------------------------------

let rkFiltros = {
    area: 'TODAS',        // TODAS | BIOMEDICA | MECANICA | INFRAESTRUCTURA
    meses: 12,            // 3 | 6 | 12 | 0 (histórico completo)
    agrupar: true,        // agrupación inteligente de nombres
    top: 15               // cuántos mostrar en cada ranking
};

// ---------------------------------------------------------------------------
// 3) CÁLCULO DEL RANKING
// ---------------------------------------------------------------------------

function rkCalcularRanking() {
    if (!solicitudesPorArea || Object.keys(solicitudesPorArea).length === 0) {
        clasificarSolicitudesPorArea();
    }

    // Base de solicitudes según filtro de área
    let base = [];
    if (rkFiltros.area === 'TODAS') {
        base = [
            ...(solicitudesPorArea.BIOMEDICA || []),
            ...(solicitudesPorArea.MECANICA || []),
            ...(solicitudesPorArea.INFRAESTRUCTURA || [])
        ];
    } else {
        base = solicitudesPorArea[rkFiltros.area] || [];
    }

    // Filtro temporal
    if (rkFiltros.meses > 0) {
        const limite = new Date();
        limite.setMonth(limite.getMonth() - rkFiltros.meses);
        base = base.filter(s => s.fechaCreacion && new Date(s.fechaCreacion) >= limite);
    }

    const crearNodo = (nombre) => ({
        nombre,
        total: 0,
        completadas: 0,
        pendientes: 0,
        criticas: 0,
        reparaciones: 0,
        inspecciones: 0,
        erroresUsuario: 0,
        sumaTiempoMs: 0,
        conTiempo: 0,
        relacionados: {}   // ubicaciones (para equipos) o equipos (para ubicaciones)
    });

    const equipos = {};
    const ubicaciones = {};
    const servicios = {};
    const combos = {};

    base.forEach(s => {
        const eq  = rkCanonizarEquipo(s.equipo, rkFiltros.agrupar);
        const ub  = rkCanonizarUbicacion(s.ubicacion);
        const srv = rkCanonizarUbicacion(s.servicioHospitalario || s.ubicacion);

        const estado   = rkNormalizar(s.estado);
        const tipo     = rkNormalizar(s.tipoServicio);
        const prio     = rkNormalizar(s.prioridad);
        const esComp   = estado === 'COMPLETADA';
        const esError  = tipo.includes('ERROR');
        const esCrit   = prio === 'CRITICA';

        let tiempoMs = null;
        if (s.fechaCreacion && s.fechaCompletado) {
            const d = new Date(s.fechaCompletado) - new Date(s.fechaCreacion);
            if (d > 0 && d < 1000 * 60 * 60 * 24 * 365) tiempoMs = d;
        }

        const acumular = (mapa, clave, relacionado) => {
            if (!mapa[clave]) mapa[clave] = crearNodo(clave);
            const n = mapa[clave];
            n.total++;
            if (esComp) n.completadas++; else n.pendientes++;
            if (esCrit) n.criticas++;
            if (tipo.includes('REPARACION')) n.reparaciones++;
            if (tipo.includes('INSPECCION')) n.inspecciones++;
            if (esError) n.erroresUsuario++;
            if (tiempoMs !== null) { n.sumaTiempoMs += tiempoMs; n.conTiempo++; }
            if (relacionado) n.relacionados[relacionado] = (n.relacionados[relacionado] || 0) + 1;
        };

        acumular(equipos, eq, ub);
        acumular(ubicaciones, ub, eq);
        acumular(servicios, srv, eq);

        const claveCombo = `${eq}|||${ub}`;
        if (!combos[claveCombo]) combos[claveCombo] = { equipo: eq, ubicacion: ub, total: 0, criticas: 0, reparaciones: 0 };
        combos[claveCombo].total++;
        if (esCrit) combos[claveCombo].criticas++;
        if (tipo.includes('REPARACION')) combos[claveCombo].reparaciones++;
    });

    const aLista = (mapa) => Object.values(mapa)
        .map(n => ({
            ...n,
            promedioHoras: n.conTiempo > 0 ? (n.sumaTiempoMs / n.conTiempo) / 3600000 : null,
            topRelacionado: Object.entries(n.relacionados).sort((a, b) => b[1] - a[1])[0] || null
        }))
        .sort((a, b) => b.total - a.total);

    return {
        totalAnalizado: base.length,
        equipos: aLista(equipos),
        ubicaciones: aLista(ubicaciones),
        servicios: aLista(servicios),
        combos: Object.values(combos).sort((a, b) => b.total - a.total)
    };
}

// ---------------------------------------------------------------------------
// 4) RENDERIZADO
// ---------------------------------------------------------------------------

const RK_COLORES = {
    TODAS: '#2563eb',
    BIOMEDICA: '#059669',
    MECANICA: '#f59e0b',
    INFRAESTRUCTURA: '#8b5cf6'
};

function rkBarra(valor, maximo, color) {
    const pct = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
    return `<div style="background:#f1f5f9;border-radius:999px;height:8px;overflow:hidden;min-width:60px;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:999px;"></div>
            </div>`;
}

function rkTablaRanking(titulo, icono, lista, color, tipoRelacion) {
    const top = lista.slice(0, rkFiltros.top);
    const maximo = top.length ? top[0].total : 0;
    const totalGlobal = lista.reduce((a, b) => a + b.total, 0);

    if (!top.length) {
        return `<div class="card"><div class="card-header"><h3 class="card-title">${icono} ${titulo}</h3></div>
                <div class="card-content"><p style="color:#6b7280;">Sin datos para los filtros seleccionados.</p></div></div>`;
    }

    const filas = top.map((n, i) => {
        const pct = totalGlobal > 0 ? ((n.total / totalGlobal) * 100).toFixed(1) : '0.0';
        const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="color:#9ca3af;">${i + 1}</span>`;
        const rel = n.topRelacionado ? `${n.topRelacionado[0]} (${n.topRelacionado[1]})` : '—';
        const horas = n.promedioHoras !== null ? `${n.promedioHoras.toFixed(1)} h` : '—';
        return `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:0.5rem 0.4rem;text-align:center;font-weight:600;">${medalla}</td>
                <td style="padding:0.5rem 0.4rem;font-weight:600;color:#1f2937;">${n.nombre}</td>
                <td style="padding:0.5rem 0.4rem;min-width:90px;">${rkBarra(n.total, maximo, color)}</td>
                <td style="padding:0.5rem 0.4rem;text-align:right;font-weight:700;color:${color};">${n.total}</td>
                <td style="padding:0.5rem 0.4rem;text-align:right;color:#6b7280;">${pct}%</td>
                <td style="padding:0.5rem 0.4rem;text-align:right;color:#dc2626;font-weight:600;">${n.criticas}</td>
                <td style="padding:0.5rem 0.4rem;text-align:right;color:#6b7280;">${horas}</td>
                <td style="padding:0.5rem 0.4rem;color:#6b7280;font-size:0.8rem;">${rel}</td>
            </tr>`;
    }).join('');

    return `
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="card-header">
                <h3 class="card-title">${icono} ${titulo}
                    <span style="font-weight:normal;color:#6b7280;font-size:0.8rem;">
                        (${lista.length} distintos · mostrando top ${top.length})
                    </span>
                </h3>
            </div>
            <div class="card-content" style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
                    <thead>
                        <tr style="border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:0.75rem;text-transform:uppercase;">
                            <th style="padding:0.5rem 0.4rem;">#</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">Nombre</th>
                            <th style="padding:0.5rem 0.4rem;"></th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Solic.</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">%</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Críticas</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">T. prom.</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">${tipoRelacion}</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        </div>`;
}

function rkTablaCombos(combos, color) {
    const top = combos.slice(0, 12);
    if (!top.length) return '';
    const filas = top.map((c, i) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:0.5rem 0.4rem;text-align:center;color:#9ca3af;">${i + 1}</td>
            <td style="padding:0.5rem 0.4rem;font-weight:600;color:#1f2937;">${c.equipo}</td>
            <td style="padding:0.5rem 0.4rem;color:#374151;">${c.ubicacion}</td>
            <td style="padding:0.5rem 0.4rem;text-align:right;font-weight:700;color:${color};">${c.total}</td>
            <td style="padding:0.5rem 0.4rem;text-align:right;color:#dc2626;font-weight:600;">${c.criticas}</td>
            <td style="padding:0.5rem 0.4rem;text-align:right;color:#6b7280;">${c.reparaciones}</td>
        </tr>`).join('');

    return `
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="card-header">
                <h3 class="card-title">🎯 Puntos críticos: Equipo × Ubicación</h3>
            </div>
            <div class="card-content" style="overflow-x:auto;">
                <p style="color:#6b7280;font-size:0.8rem;margin-bottom:0.75rem;">
                    Combinaciones con mayor carga de solicitudes. Útil para priorizar mantenimiento preventivo o reposición.
                </p>
                <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
                    <thead>
                        <tr style="border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:0.75rem;text-transform:uppercase;">
                            <th style="padding:0.5rem 0.4rem;">#</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">Equipo</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">Ubicación</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Solic.</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Críticas</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Reparac.</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        </div>`;
}

function rkRenderizar() {
    const cont = document.getElementById('ranking-equipos-container');
    if (!cont) return;

    const color = RK_COLORES[rkFiltros.area] || RK_COLORES.TODAS;
    const data = rkCalcularRanking();
    window.__rkUltimoResultado = data;

    const eqTop = data.equipos[0];
    const ubTop = data.ubicaciones[0];
    const periodoTxt = rkFiltros.meses === 0 ? 'histórico completo' : `últimos ${rkFiltros.meses} meses`;

    const btn = (label, activo, onclick) => `
        <button onclick="${onclick}"
            style="padding:0.4rem 0.85rem;border-radius:0.5rem;border:1px solid ${activo ? color : '#e5e7eb'};
                   background:${activo ? color : '#fff'};color:${activo ? '#fff' : '#374151'};
                   font-size:0.8rem;font-weight:600;cursor:pointer;">${label}</button>`;

    cont.innerHTML = `
        <!-- Controles -->
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:0.75rem;padding:1rem;margin-bottom:1.5rem;">
            <div style="display:flex;flex-wrap:wrap;gap:1.25rem;align-items:center;">
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Área</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('🌐 Todas', rkFiltros.area === 'TODAS', "rkSetFiltro('area','TODAS')")}
                        ${btn('🏥 Biomédica', rkFiltros.area === 'BIOMEDICA', "rkSetFiltro('area','BIOMEDICA')")}
                        ${btn('⚙️ Mecánica', rkFiltros.area === 'MECANICA', "rkSetFiltro('area','MECANICA')")}
                        ${btn('🏗️ Infraestructura', rkFiltros.area === 'INFRAESTRUCTURA', "rkSetFiltro('area','INFRAESTRUCTURA')")}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Periodo</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('3 m', rkFiltros.meses === 3, "rkSetFiltro('meses',3)")}
                        ${btn('6 m', rkFiltros.meses === 6, "rkSetFiltro('meses',6)")}
                        ${btn('12 m', rkFiltros.meses === 12, "rkSetFiltro('meses',12)")}
                        ${btn('Histórico', rkFiltros.meses === 0, "rkSetFiltro('meses',0)")}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Mostrar</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('Top 10', rkFiltros.top === 10, "rkSetFiltro('top',10)")}
                        ${btn('Top 15', rkFiltros.top === 15, "rkSetFiltro('top',15)")}
                        ${btn('Top 30', rkFiltros.top === 30, "rkSetFiltro('top',30)")}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Nombres</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('🧠 Agrupados', rkFiltros.agrupar, "rkSetFiltro('agrupar',true)")}
                        ${btn('📝 Literales', !rkFiltros.agrupar, "rkSetFiltro('agrupar',false)")}
                    </div>
                </div>
                <div style="margin-left:auto;">
                    <button class="btn btn-info btn-sm" onclick="rkExportarCSV()">📥 Exportar CSV</button>
                </div>
            </div>
            <p style="margin:0.85rem 0 0;color:#6b7280;font-size:0.78rem;">
                🧠 <strong>Agrupados</strong> unifica variantes de escritura (ej. "autoclave vapor", "AUTOCLAVE" y "Autoclave #2" → AUTOCLAVE).
                📝 <strong>Literales</strong> respeta el texto tal como fue digitado.
            </p>
        </div>

        <!-- KPIs -->
        <div class="stats-grid" style="margin-bottom:1.5rem;">
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">📋 Solicitudes analizadas</span></div>
                <div class="stat-card-value" style="color:${color};">${data.totalAnalizado}</div>
                <div class="stat-card-description">${rkFiltros.area === 'TODAS' ? 'Todas las áreas' : rkFiltros.area} · ${periodoTxt}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">🔧 Equipo más solicitado</span></div>
                <div class="stat-card-value" style="color:${color};font-size:1.15rem;line-height:1.3;">${eqTop ? eqTop.nombre : '—'}</div>
                <div class="stat-card-description">${eqTop ? `${eqTop.total} solicitudes · ${eqTop.criticas} críticas` : 'Sin datos'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">📍 Ubicación más solicitante</span></div>
                <div class="stat-card-value" style="color:${color};font-size:1.15rem;line-height:1.3;">${ubTop ? ubTop.nombre : '—'}</div>
                <div class="stat-card-description">${ubTop ? `${ubTop.total} solicitudes · ${ubTop.criticas} críticas` : 'Sin datos'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">🗂️ Variedad</span></div>
                <div class="stat-card-value" style="color:${color};">${data.equipos.length}</div>
                <div class="stat-card-description">tipos de equipo en ${data.ubicaciones.length} ubicaciones</div>
            </div>
        </div>

        ${rkTablaRanking('Ranking de equipos con más solicitudes', '🔧', data.equipos, color, 'Ubicación frecuente')}
        ${rkTablaRanking('Ranking de ubicaciones / servicios', '📍', data.ubicaciones, color, 'Equipo frecuente')}
        ${rkTablaCombos(data.combos, color)}
    `;
}

function rkSetFiltro(campo, valor) {
    rkFiltros[campo] = valor;
    rkRenderizar();
}

// ---------------------------------------------------------------------------
// 5) EXPORTACIÓN CSV
// ---------------------------------------------------------------------------

function rkExportarCSV() {
    try {
        const data = window.__rkUltimoResultado || rkCalcularRanking();
        const sep = ';';
        const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
        const lineas = [];

        lineas.push(esc('RANKING DE EQUIPOS Y SERVICIOS - HOSPITAL SUSANA LOPEZ DE VALENCIA'));
        lineas.push([esc('Area'), esc(rkFiltros.area)].join(sep));
        lineas.push([esc('Periodo'), esc(rkFiltros.meses === 0 ? 'Historico completo' : `Ultimos ${rkFiltros.meses} meses`)].join(sep));
        lineas.push([esc('Solicitudes analizadas'), esc(data.totalAnalizado)].join(sep));
        lineas.push([esc('Generado'), esc(new Date().toLocaleString('es-CO'))].join(sep));
        lineas.push('');

        const bloque = (titulo, lista, etiquetaRel) => {
            lineas.push(esc(titulo));
            lineas.push([esc('#'), esc('Nombre'), esc('Total'), esc('Completadas'), esc('Pendientes'),
                         esc('Criticas'), esc('Reparaciones'), esc('Inspecciones'),
                         esc('Tiempo prom. (h)'), esc(etiquetaRel)].join(sep));
            lista.forEach((n, i) => {
                lineas.push([
                    esc(i + 1), esc(n.nombre), esc(n.total), esc(n.completadas), esc(n.pendientes),
                    esc(n.criticas), esc(n.reparaciones), esc(n.inspecciones),
                    esc(n.promedioHoras !== null ? n.promedioHoras.toFixed(1) : ''),
                    esc(n.topRelacionado ? `${n.topRelacionado[0]} (${n.topRelacionado[1]})` : '')
                ].join(sep));
            });
            lineas.push('');
        };

        bloque('EQUIPOS CON MAS SOLICITUDES', data.equipos, 'Ubicacion frecuente');
        bloque('UBICACIONES / SERVICIOS CON MAS SOLICITUDES', data.ubicaciones, 'Equipo frecuente');

        lineas.push(esc('PUNTOS CRITICOS: EQUIPO x UBICACION'));
        lineas.push([esc('#'), esc('Equipo'), esc('Ubicacion'), esc('Total'), esc('Criticas'), esc('Reparaciones')].join(sep));
        data.combos.forEach((c, i) => {
            lineas.push([esc(i + 1), esc(c.equipo), esc(c.ubicacion), esc(c.total), esc(c.criticas), esc(c.reparaciones)].join(sep));
        });

        const blob = new Blob(['\ufeff' + lineas.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ranking_equipos_${rkFiltros.area}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (typeof showNotification === 'function') {
            showNotification('✅ Ranking exportado correctamente', 'success');
        }
    } catch (error) {
        console.error('❌ Error exportando ranking:', error);
        alert('No fue posible exportar el ranking: ' + error.message);
    }
}

// Exponer al ámbito global
window.rkSetFiltro = rkSetFiltro;
window.rkRenderizar = rkRenderizar;
window.rkExportarCSV = rkExportarCSV;
window.rkCalcularRanking = rkCalcularRanking;

// ---------------------------------------------------------------------------
// 6) 🔍 DIAGNÓSTICO DEL CATÁLOGO
//    Ejecuta rkDiagnosticoNombres() en la consola del navegador (F12) para ver
//    qué nombres reales de tu Airtable NO están siendo reconocidos por el
//    catálogo, y cuáles variantes se están agrupando en cada equipo canónico.
// ---------------------------------------------------------------------------

function rkDiagnosticoNombres(descargarCSV = false) {
    if (!solicitudesPorArea || Object.keys(solicitudesPorArea).length === 0) {
        clasificarSolicitudesPorArea();
    }

    const base = [
        ...(solicitudesPorArea.BIOMEDICA || []),
        ...(solicitudesPorArea.MECANICA || []),
        ...(solicitudesPorArea.INFRAESTRUCTURA || [])
    ];

    const sinReconocer = {};   // nombre normalizado -> conteo
    const agrupados = {};      // canon -> { total, variantes: {crudo: conteo} }

    base.forEach(s => {
        const crudo = rkNormalizar(s.equipo);
        if (!crudo) return;
        const m = rkBuscarCanon(crudo);

        if (!m) {
            // No coincidió con ningún patrón del catálogo
            sinReconocer[crudo] = (sinReconocer[crudo] || 0) + 1;
        } else {
            if (!agrupados[m.canon]) agrupados[m.canon] = { total: 0, variantes: {} };
            agrupados[m.canon].total++;
            agrupados[m.canon].variantes[crudo] = (agrupados[m.canon].variantes[crudo] || 0) + 1;
        }
    });

    const listaSin = Object.entries(sinReconocer).sort((a, b) => b[1] - a[1]);
    const listaAgr = Object.entries(agrupados).sort((a, b) => b[1].total - a[1].total);

    const totalSin = listaSin.reduce((a, b) => a + b[1], 0);
    const cobertura = base.length > 0 ? (((base.length - totalSin) / base.length) * 100).toFixed(1) : '0';

    console.log('%c🔍 DIAGNÓSTICO DEL CATÁLOGO DE EQUIPOS', 'font-size:14px;font-weight:bold;color:#2563eb');
    console.log(`Solicitudes revisadas: ${base.length}`);
    console.log(`Cobertura del catálogo: ${cobertura}%  (${totalSin} solicitudes con nombre no reconocido)`);
    console.log(`Nombres distintos SIN reconocer: ${listaSin.length}`);

    console.groupCollapsed('❌ Nombres NO reconocidos (ordenados por frecuencia)');
    console.table(listaSin.map(([n, c]) => ({ nombre: n, solicitudes: c })));
    console.groupEnd();

    console.groupCollapsed('✅ Agrupaciones aplicadas (verifica que ninguna esté mal unida)');
    listaAgr.forEach(([canon, info]) => {
        console.log(`${canon} → ${info.total} solicitudes | variantes:`,
            Object.entries(info.variantes).sort((a, b) => b[1] - a[1]).map(([v, c]) => `${v} (${c})`).join(' · '));
    });
    console.groupEnd();

    if (descargarCSV) {
        const sep = ';';
        const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
        const lineas = [
            esc('DIAGNOSTICO DEL CATALOGO DE EQUIPOS'),
            [esc('Solicitudes revisadas'), esc(base.length)].join(sep),
            [esc('Cobertura'), esc(cobertura + '%')].join(sep),
            '',
            esc('NOMBRES NO RECONOCIDOS'),
            [esc('Nombre'), esc('Solicitudes')].join(sep),
            ...listaSin.map(([n, c]) => [esc(n), esc(c)].join(sep)),
            '',
            esc('AGRUPACIONES APLICADAS'),
            [esc('Canonico'), esc('Total'), esc('Variantes detectadas')].join(sep),
            ...listaAgr.map(([canon, info]) => [
                esc(canon), esc(info.total),
                esc(Object.entries(info.variantes).sort((a, b) => b[1] - a[1]).map(([v, c]) => `${v} (${c})`).join(' | '))
            ].join(sep))
        ];
        const blob = new Blob(['\ufeff' + lineas.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostico_catalogo_equipos_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return { cobertura: Number(cobertura), sinReconocer: listaSin, agrupados: listaAgr };
}

window.rkDiagnosticoNombres = rkDiagnosticoNombres;

// ---------------------------------------------------------------------------
// 7) ⚙️ AUTO-INSTALADOR DE LA PESTAÑA
//    Crea la pestaña "Equipos y Servicios" automáticamente cada vez que se
//    abre el modal de estadísticas. NO requiere editar el HTML del portal.
// ---------------------------------------------------------------------------

function rkInstalarPestana() {
    // El contenedor de pestañas del modal de estadísticas
    const tabs = document.querySelector('#stats-modal-content .analysis-tabs');
    if (!tabs) return false;

    // Evitar duplicados si el modal se vuelve a renderizar
    if (tabs.querySelector('[data-analysis-type="equipos"]')) return true;

    // 1) Botón de la pestaña
    const btn = document.createElement('button');
    btn.className = 'analysis-tab';
    btn.setAttribute('data-analysis-type', 'equipos');
    btn.innerHTML = '🔧 Equipos y Servicios';
    btn.addEventListener('click', () => showAnalysisType('equipos'));
    tabs.appendChild(btn);

    // 2) Contenedor del contenido (hermano de analysis-general / analysis-temporal)
    const padre = tabs.parentNode;
    if (!document.getElementById('analysis-equipos')) {
        const cont = document.createElement('div');
        cont.id = 'analysis-equipos';
        cont.className = 'analysis-content';
        cont.style.display = 'none';
        cont.innerHTML = '<div id="ranking-equipos-container"></div>';
        padre.appendChild(cont);
    }

    console.log('✅ Pestaña "Equipos y Servicios" instalada');
    return true;
}

// Intenta instalar varias veces, porque el modal arma su HTML de forma asíncrona
function rkIntentarInstalar(intentos = 20) {
    if (rkInstalarPestana()) return;
    if (intentos > 0) setTimeout(() => rkIntentarInstalar(intentos - 1), 250);
}

(function rkEngancharModal() {
    // Envolver showAdvancedStatisticsModal para instalar la pestaña al abrirlo
    if (typeof window.showAdvancedStatisticsModal === 'function' && !window.__rkModalParcheado) {
        const original = window.showAdvancedStatisticsModal;
        window.showAdvancedStatisticsModal = async function (...args) {
            const r = await original.apply(this, args);
            rkIntentarInstalar();
            return r;
        };
        window.__rkModalParcheado = true;
    }

    // Envolver showAnalysisType para que dibuje el ranking al entrar a la pestaña
    if (typeof window.showAnalysisType === 'function' && !window.__rkTabParcheado) {
        const originalTab = window.showAnalysisType;
        window.showAnalysisType = function (type) {
            originalTab.apply(this, arguments);
            if (type === 'equipos') setTimeout(() => rkRenderizar(), 30);
        };
        window.__rkTabParcheado = true;
    }

    // Si el modal ya estaba abierto cuando se cargó este módulo
    rkIntentarInstalar(4);
})();

window.rkInstalarPestana = rkInstalarPestana;

console.log('🔧 Módulo Ranking de Equipos y Servicios cargado. ' +
            'Comandos: rkRenderizar() · rkDiagnosticoNombres() · rkExportarCSV()');
