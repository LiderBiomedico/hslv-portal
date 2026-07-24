/* ============================================================================
   📦 MÓDULO: RANKING DE EQUIPOS Y SERVICIOS  —  Portal de Gestión HSLV
   Autor: Paul Eduardo Muñoz R.
   Pegar este bloque DENTRO del <script> de portal-gestion.html,
   justo ANTES de la etiqueta </script> final.
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
const RK_CATALOGO_EQUIPOS = [
    { canon: 'MONITOR DE SIGNOS VITALES', pat: ['MONITOR DE SIGNOS', 'MONITOR SIGNOS', 'MONITOR MULTIPARAMETRO'] },
    { canon: 'MAQUINA DE ANESTESIA',      pat: ['MAQUINA DE ANESTESIA', 'MAQUINA ANESTESIA', 'ANESTESIA'] },
    { canon: 'LAMPARA DE CALOR RADIANTE', pat: ['CALOR RADIANTE', 'LAMPARA DE CALOR'] },
    { canon: 'LAMPARA CIELITICA',         pat: ['CIELITICA', 'CIALITICA', 'LAMPARA QUIRURGICA'] },
    { canon: 'MESA QUIRURGICA',           pat: ['MESA QUIRURGICA', 'MESA QUIRUGICA', 'MESA DE CIRUGIA'] },
    { canon: 'EQUIPO DE GASES',           pat: ['MAQUINA DE GASES', 'EQUIPO DE GASES', 'RED DE GASES', 'GASES MEDICINALES'] },
    { canon: 'BOMBA DE INFUSION',         pat: ['BOMBA DE INFUSION', 'BOMBA INFUSION', 'INFUSOR'] },
    { canon: 'VENTILADOR MECANICO',       pat: ['VENTILADOR MECANICO', 'VENTILADOR'] },
    { canon: 'DESFIBRILADOR',             pat: ['DESFIBRILADOR', 'DEA'] },
    { canon: 'ELECTROBISTURI',            pat: ['ELECTROBISTURI', 'ELECTRO BISTURI', 'UNIDAD ELECTROQUIRURGICA'] },
    { canon: 'AUTOCLAVE',                 pat: ['AUTOCLAVE'] },
    { canon: 'ARCO EN C',                 pat: ['ARCO EN C', 'ARCO C'] },
    { canon: 'RAYOS X',                   pat: ['RAYOS X', 'RX PORTATIL', 'EQUIPO DE RX'] },
    { canon: 'FLUOROSCOPIO',              pat: ['FLUOROSCOPIO'] },
    { canon: 'ECOGRAFO',                  pat: ['ECOGRAFO', 'ULTRASONIDO', 'ECOGRAFIA'] },
    { canon: 'CRIOCAUTERIO',              pat: ['CRIOCAUTERIO', 'CRIOCIRUGIA'] },
    { canon: 'SATUROMETRO',               pat: ['SATUROMETRO', 'PULSIOXIMETRO', 'OXIMETRO'] },
    { canon: 'TENSIOMETRO',               pat: ['TENSIOMETRO', 'ESFIGMOMANOMETRO'] },
    { canon: 'ASPIRADOR / SUCCIONADOR',   pat: ['ASPIRADOR', 'SUCCIONADOR', 'SUCCION'] },
    { canon: 'INCUBADORA',                pat: ['INCUBADORA'] },
    { canon: 'FOTOTERAPIA',               pat: ['FOTOTERAPIA'] },
    { canon: 'DOPPLER FETAL',             pat: ['DOPPLER'] },
    { canon: 'MONITOR FETAL',             pat: ['MONITOR FETAL', 'CARDIOTOCOGRAFO'] },
    { canon: 'ELECTROCARDIOGRAFO',        pat: ['ELECTROCARDIOGRAFO', 'EKG', 'ECG'] },
    { canon: 'CENTRIFUGA',                pat: ['CENTRIFUGA'] },
    { canon: 'MICROSCOPIO',               pat: ['MICROSCOPIO'] },
    { canon: 'NEVERA / REFRIGERADOR',     pat: ['NEVERA', 'REFRIGERADOR', 'CONGELADOR'] },
    { canon: 'CAMILLA',                   pat: ['CAMILLA'] },
    { canon: 'CAMA HOSPITALARIA',         pat: ['CAMA'] },
    { canon: 'SILLA DE RUEDAS',           pat: ['SILLA DE RUEDAS'] },
    { canon: 'BICICLETA / SPINNING',      pat: ['SPINING', 'SPINNING', 'BICICLETA', 'ELIPTICA', 'TROTADORA', 'CAMINADORA'] },
    { canon: 'AIRE ACONDICIONADO',        pat: ['AIRE ACONDICIONADO', 'SPLIT', 'CLIMATIZACION'] },
    { canon: 'CALDERA',                   pat: ['CALDERA'] },
    { canon: 'PLANTA ELECTRICA',          pat: ['PLANTA ELECTRICA', 'GENERADOR'] },
    { canon: 'ASCENSOR',                  pat: ['ASCENSOR'] },
    { canon: 'BOMBA DE AGUA',             pat: ['BOMBA DE AGUA', 'MOTOBOMBA'] },
    { canon: 'COMPRESOR',                 pat: ['COMPRESOR'] },
    { canon: 'RED HIDRAULICA',            pat: ['LAVAMANOS', 'SANITARIO', 'INODORO', 'TUBERIA', 'GRIFO', 'LLAVE DE PASO', 'DUCHA'] },
    { canon: 'RED ELECTRICA / ILUMINACION', pat: ['TOMACORRIENTE', 'ILUMINACION', 'LUMINARIA', 'BOMBILLO', 'TABLERO ELECTRICO', 'BREAKER'] },
    { canon: 'OBRA CIVIL',                pat: ['PUERTA', 'VENTANA', 'MURO', 'PARED', 'TECHO', 'CIELO RASO', 'PISO', 'CERRADURA'] },
    { canon: 'MOBILIARIO',                pat: ['ESCRITORIO', 'SILLA', 'ARMARIO', 'ESTANTE', 'MESA DE NOCHE'] }
];

/**
 * Devuelve el nombre canónico del equipo.
 * @param {string} valor  texto crudo del campo `equipo`
 * @param {boolean} agrupar  true = agrupación inteligente, false = texto normalizado tal cual
 */
function rkCanonizarEquipo(valor, agrupar = true) {
    const norm = rkNormalizar(valor);
    if (!norm) return 'SIN ESPECIFICAR';
    if (!agrupar) return norm;

    let mejor = null;
    let mejorLargo = 0;
    for (const item of RK_CATALOGO_EQUIPOS) {
        for (const p of item.pat) {
            if (norm.includes(p) && p.length > mejorLargo) {
                mejor = item.canon;
                mejorLargo = p.length;
            }
        }
    }
    return mejor || norm;
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
