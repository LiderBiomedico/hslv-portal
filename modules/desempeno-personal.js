/* ============================================================================
   MODULO: DESEMPENO DEL PERSONAL  -  Portal de Gestion HSLV
   Autor: Paul Eduardo Munoz R.
   Analiza que tecnico / ingeniero completa las solicitudes, con que tiempos
   y sobre que equipos. Se integra como pestana "Desempeno del Personal".
   Comandos de consola: tpRenderizar() - tpExportarCSV()
   ============================================================================ */

let tpFiltros = {
    area: 'TODAS',      // TODAS | BIOMEDICA | MECANICA | INFRAESTRUCTURA
    meses: 12,          // 3 | 6 | 12 | 0 (historico)
    orden: 'total',     // total | tiempo | criticas
    top: 20
};

// --- Dependencias del modulo de equipos, con respaldo propio ----------------
// Si el modulo "Ranking de Equipos" no esta cargado, este modulo sigue
// funcionando con versiones minimas equivalentes.
const TP_COLORES = (typeof RK_COLORES !== 'undefined') ? RK_COLORES : {
    TODAS: '#2563eb', BIOMEDICA: '#059669', MECANICA: '#f59e0b', INFRAESTRUCTURA: '#8b5cf6'
};

function tpNorm(txt) {
    if (typeof rkNormalizar === 'function') return rkNormalizar(txt);
    if (!txt) return '';
    return String(txt).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().replace(/[_\-\/]/g, ' ')
        .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tpEquipo(v) {
    return (typeof rkCanonizarEquipo === 'function') ? rkCanonizarEquipo(v, true)
                                                     : (tpNorm(v) || 'SIN ESPECIFICAR');
}

function tpUbicacion(v) {
    return (typeof rkCanonizarUbicacion === 'function') ? rkCanonizarUbicacion(v)
                                                        : (tpNorm(v) || 'SIN ESPECIFICAR');
}

function tpBarra(valor, maximo, color) {
    if (typeof rkBarra === 'function') return rkBarra(valor, maximo, color);
    const pct = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
    return `<div style="background:#f1f5f9;border-radius:999px;height:8px;overflow:hidden;min-width:60px;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:999px;"></div>
            </div>`;
}

// ---------------------------------------------------------------------------
// 1) CÁLCULO
// ---------------------------------------------------------------------------

function tpBaseSolicitudes() {
    if (!solicitudesPorArea || !solicitudesPorArea.BIOMEDICA) {
        clasificarSolicitudesPorArea();
    }
    let base = tpFiltros.area === 'TODAS'
        ? [...(solicitudesPorArea.BIOMEDICA || []),
           ...(solicitudesPorArea.MECANICA || []),
           ...(solicitudesPorArea.INFRAESTRUCTURA || [])]
        : (solicitudesPorArea[tpFiltros.area] || []);

    if (tpFiltros.meses > 0) {
        const limite = new Date();
        limite.setMonth(limite.getMonth() - tpFiltros.meses);
        base = base.filter(s => s.fechaCreacion && new Date(s.fechaCreacion) >= limite);
    }
    return base;
}

// Datos de la tabla Tecnicos (rol, area, especialidad), indexados por nombre
function tpIndicePersonal() {
    const idx = {};
    (typeof cloudTecnicos !== 'undefined' ? cloudTecnicos : []).forEach(t => {
        const k = tpNorm(t.nombre);
        if (k) idx[k] = {
            rol: (t.tipo || '').toLowerCase() || 'sin rol',
            area: t.area || '',
            especialidad: t.especialidad || '',
            estado: t.estado || ''
        };
    });
    return idx;
}

function tpMediana(arr) {
    if (!arr.length) return null;
    const a = [...arr].sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function tpCalcular() {
    const base = tpBaseSolicitudes();
    const infoPersonal = tpIndicePersonal();

    const personas = {};
    let completadasTotal = 0;
    let completadasSinTecnico = 0;

    // Últimos 6 meses para la mini-tendencia
    const clavesMes = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
        const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        clavesMes.push(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`);
    }

    base.forEach(s => {
        const estado = tpNorm(s.estado);
        const esCompletada = estado === 'COMPLETADA';
        const nombreCrudo = (s.tecnicoAsignado || '').trim();
        const clave = tpNorm(nombreCrudo);

        if (esCompletada) {
            completadasTotal++;
            if (!clave) { completadasSinTecnico++; return; }
        }
        if (!clave) return;

        if (!personas[clave]) {
            const info = infoPersonal[clave] || {};
            personas[clave] = {
                nombre: nombreCrudo,
                rol: info.rol || 'no registrado',
                area: info.area || '',
                especialidad: info.especialidad || '',
                estadoPersonal: info.estado || '',
                completadas: 0, pendientes: 0, criticas: 0,
                reparaciones: 0, inspecciones: 0,
                tiempos: [], conAsignacion: 0,
                equipos: {}, ubicaciones: {}, areas: {},
                meses: Object.fromEntries(clavesMes.map(m => [m, 0]))
            };
        }
        const p = personas[clave];

        if (esCompletada) {
            p.completadas++;
            const tipo = tpNorm(s.tipoServicio);
            if (tpNorm(s.prioridad) === 'CRITICA') p.criticas++;
            if (tipo.includes('REPARACION')) p.reparaciones++;
            if (tipo.includes('INSPECCION')) p.inspecciones++;

            // Tiempo de resolución: desde la asignación si existe, si no desde la creación
            const fin = s.fechaCompletado ? new Date(s.fechaCompletado) : null;
            const ini = s.fechaAsignacion ? new Date(s.fechaAsignacion)
                      : (s.fechaCreacion ? new Date(s.fechaCreacion) : null);
            if (fin && ini) {
                const h = (fin - ini) / 3600000;
                if (h >= 0 && h < 8760) {          // descarta datos absurdos (> 1 año)
                    p.tiempos.push(h);
                    if (s.fechaAsignacion) p.conAsignacion++;
                }
            }

            const eq = tpEquipo(s.equipo);
            const ub = tpUbicacion(s.ubicacion);
            p.equipos[eq] = (p.equipos[eq] || 0) + 1;
            p.ubicaciones[ub] = (p.ubicaciones[ub] || 0) + 1;
            const ar = tpNorm(s.servicioIngenieria).replace('INGENIERIA ', '');
            if (ar) p.areas[ar] = (p.areas[ar] || 0) + 1;

            if (s.fechaCompletado) {
                const d = new Date(s.fechaCompletado);
                const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (k in p.meses) p.meses[k]++;
            }
        } else {
            p.pendientes++;
        }
    });

    const top1 = (obj) => {
        const e = Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
        return e ? `${e[0]} (${e[1]})` : '—';
    };

    let lista = Object.values(personas).map(p => ({
        ...p,
        promedioHoras: p.tiempos.length ? p.tiempos.reduce((a, b) => a + b, 0) / p.tiempos.length : null,
        medianaHoras: tpMediana(p.tiempos),
        topEquipo: top1(p.equipos),
        topUbicacion: top1(p.ubicaciones),
        areasTexto: Object.keys(p.areas).join(', ') || '—',
        serieMeses: clavesMes.map(m => p.meses[m])
    }));

    const totalConTecnico = lista.reduce((a, b) => a + b.completadas, 0);
    lista.forEach(p => { p.porcentaje = totalConTecnico > 0 ? (p.completadas / totalConTecnico) * 100 : 0; });

    // Ordenamiento
    if (tpFiltros.orden === 'tiempo') {
        lista.sort((a, b) => {
            if (a.medianaHoras === null) return 1;
            if (b.medianaHoras === null) return -1;
            return a.medianaHoras - b.medianaHoras;
        });
    } else if (tpFiltros.orden === 'criticas') {
        lista.sort((a, b) => b.criticas - a.criticas || b.completadas - a.completadas);
    } else {
        lista.sort((a, b) => b.completadas - a.completadas);
    }

    // Resumen por rol
    const porRol = {};
    lista.forEach(p => {
        if (!porRol[p.rol]) porRol[p.rol] = { personas: 0, completadas: 0, tiempos: [] };
        porRol[p.rol].personas++;
        porRol[p.rol].completadas += p.completadas;
        porRol[p.rol].tiempos.push(...p.tiempos);
    });
    Object.values(porRol).forEach(r => { r.mediana = tpMediana(r.tiempos); });

    const todosTiempos = lista.flatMap(p => p.tiempos);

    return {
        totalAnalizado: base.length,
        completadasTotal,
        completadasSinTecnico,
        totalConTecnico,
        personas: lista,
        porRol,
        medianaGlobal: tpMediana(todosTiempos),
        clavesMes
    };
}

// ---------------------------------------------------------------------------
// 2) RENDERIZADO
// ---------------------------------------------------------------------------

function tpFormatoHoras(h) {
    if (h === null || h === undefined) return '—';
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 48) return `${h.toFixed(1)} h`;
    return `${(h / 24).toFixed(1)} d`;
}

function tpSparkline(serie, color) {
    const max = Math.max(...serie, 1);
    return `<div style="display:flex;align-items:flex-end;gap:2px;height:24px;">` +
        serie.map(v => `<div title="${v}" style="width:6px;height:${Math.max(2, (v / max) * 24)}px;
            background:${v > 0 ? color : '#e5e7eb'};border-radius:1px;"></div>`).join('') + `</div>`;
}

function tpRenderizar() {
    const cont = document.getElementById('ranking-personal-container');
    if (!cont) return;

    const color = TP_COLORES[tpFiltros.area] || TP_COLORES.TODAS;
    const d = tpCalcular();
    window.__tpUltimoResultado = d;

    const top = d.personas.slice(0, tpFiltros.top);
    const lider = d.personas.filter(p => p.completadas > 0)
        .sort((a, b) => b.completadas - a.completadas)[0];
    const periodoTxt = tpFiltros.meses === 0 ? 'histórico completo' : `últimos ${tpFiltros.meses} meses`;
    const pctSin = d.completadasTotal > 0
        ? ((d.completadasSinTecnico / d.completadasTotal) * 100).toFixed(1) : '0.0';

    const btn = (label, activo, onclick) => `
        <button onclick="${onclick}"
            style="padding:0.4rem 0.85rem;border-radius:0.5rem;border:1px solid ${activo ? color : '#e5e7eb'};
                   background:${activo ? color : '#fff'};color:${activo ? '#fff' : '#374151'};
                   font-size:0.8rem;font-weight:600;cursor:pointer;">${label}</button>`;

    const avisoSinTecnico = d.completadasSinTecnico > 0 ? `
        <div class="alert alert-warning" style="margin-bottom:1.5rem;">
            <strong>⚠️ ${d.completadasSinTecnico} solicitudes completadas (${pctSin}%) no tienen técnico registrado.</strong>
            <p style="margin:0.4rem 0 0;font-size:0.85rem;">
                No aparecen en este ranking. Suelen ser solicitudes cerradas antes de que el sistema
                empezara a conservar el técnico asignado, o cerradas sin pasar por asignación.
                Interpreta los totales como "solicitudes completadas <em>con registro de responsable</em>".
            </p>
        </div>` : '';

    const filas = top.map((p, i) => {
        const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="color:#9ca3af;">${i + 1}</span>`;
        const iconoRol = p.rol.includes('ingenier') ? '👨‍🔬' : p.rol.includes('tecnic') ? '🔧' : p.rol.includes('auxiliar') ? '🧰' : '👤';
        const maxComp = top[0] ? Math.max(...top.map(x => x.completadas), 1) : 1;
        return `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:0.55rem 0.4rem;text-align:center;font-weight:600;">${medalla}</td>
                <td style="padding:0.55rem 0.4rem;">
                    <div style="font-weight:600;color:#1f2937;">${iconoRol} ${p.nombre}</div>
                    <div style="font-size:0.72rem;color:#9ca3af;text-transform:capitalize;">
                        ${p.rol}${p.especialidad ? ' · ' + p.especialidad : ''}
                    </div>
                </td>
                <td style="padding:0.55rem 0.4rem;min-width:80px;">${tpBarra(p.completadas, maxComp, color)}</td>
                <td style="padding:0.55rem 0.4rem;text-align:right;font-weight:700;color:${color};">${p.completadas}</td>
                <td style="padding:0.55rem 0.4rem;text-align:right;color:#6b7280;">${p.porcentaje.toFixed(1)}%</td>
                <td style="padding:0.55rem 0.4rem;text-align:right;color:#f59e0b;font-weight:600;">${p.pendientes}</td>
                <td style="padding:0.55rem 0.4rem;text-align:right;color:#dc2626;font-weight:600;">${p.criticas}</td>
                <td style="padding:0.55rem 0.4rem;text-align:right;color:#374151;">${tpFormatoHoras(p.medianaHoras)}</td>
                <td style="padding:0.55rem 0.4rem;text-align:right;color:#9ca3af;font-size:0.8rem;">${tpFormatoHoras(p.promedioHoras)}</td>
                <td style="padding:0.55rem 0.4rem;">${tpSparkline(p.serieMeses, color)}</td>
                <td style="padding:0.55rem 0.4rem;color:#6b7280;font-size:0.78rem;">${p.topEquipo}</td>
                <td style="padding:0.55rem 0.4rem;color:#6b7280;font-size:0.78rem;">${p.topUbicacion}</td>
            </tr>`;
    }).join('');

    const rolesHtml = Object.entries(d.porRol)
        .sort((a, b) => b[1].completadas - a[1].completadas)
        .map(([rol, r]) => `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0.6rem;padding:0.85rem 1rem;">
                <div style="font-size:0.72rem;text-transform:uppercase;color:#6b7280;font-weight:700;">${rol}</div>
                <div style="font-size:1.4rem;font-weight:700;color:${color};">${r.completadas}</div>
                <div style="font-size:0.75rem;color:#6b7280;">
                    ${r.personas} persona${r.personas !== 1 ? 's' : ''} · mediana ${tpFormatoHoras(r.mediana)}
                </div>
            </div>`).join('');

    cont.innerHTML = `
        <!-- Controles -->
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:0.75rem;padding:1rem;margin-bottom:1.5rem;">
            <div style="display:flex;flex-wrap:wrap;gap:1.25rem;align-items:center;">
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Área</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('🌐 Todas', tpFiltros.area === 'TODAS', "tpSetFiltro('area','TODAS')")}
                        ${btn('🏥 Biomédica', tpFiltros.area === 'BIOMEDICA', "tpSetFiltro('area','BIOMEDICA')")}
                        ${btn('⚙️ Mecánica', tpFiltros.area === 'MECANICA', "tpSetFiltro('area','MECANICA')")}
                        ${btn('🏗️ Infraestructura', tpFiltros.area === 'INFRAESTRUCTURA', "tpSetFiltro('area','INFRAESTRUCTURA')")}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Periodo</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('3 m', tpFiltros.meses === 3, "tpSetFiltro('meses',3)")}
                        ${btn('6 m', tpFiltros.meses === 6, "tpSetFiltro('meses',6)")}
                        ${btn('12 m', tpFiltros.meses === 12, "tpSetFiltro('meses',12)")}
                        ${btn('Histórico', tpFiltros.meses === 0, "tpSetFiltro('meses',0)")}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.7rem;text-transform:uppercase;color:#6b7280;margin-bottom:0.35rem;font-weight:700;">Ordenar por</div>
                    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                        ${btn('📊 Más completadas', tpFiltros.orden === 'total', "tpSetFiltro('orden','total')")}
                        ${btn('⏱️ Menor tiempo', tpFiltros.orden === 'tiempo', "tpSetFiltro('orden','tiempo')")}
                        ${btn('🚨 Más críticas', tpFiltros.orden === 'criticas', "tpSetFiltro('orden','criticas')")}
                    </div>
                </div>
                <div style="margin-left:auto;">
                    <button class="btn btn-info btn-sm" onclick="tpExportarCSV()">📥 Exportar CSV</button>
                </div>
            </div>
        </div>

        ${avisoSinTecnico}

        <!-- KPIs -->
        <div class="stats-grid" style="margin-bottom:1.5rem;">
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">👥 Personal con actividad</span></div>
                <div class="stat-card-value" style="color:${color};">${d.personas.length}</div>
                <div class="stat-card-description">${tpFiltros.area === 'TODAS' ? 'Todas las áreas' : tpFiltros.area} · ${periodoTxt}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">✅ Completadas con responsable</span></div>
                <div class="stat-card-value" style="color:${color};">${d.totalConTecnico}</div>
                <div class="stat-card-description">de ${d.completadasTotal} completadas en el periodo</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">🏆 Mayor volumen</span></div>
                <div class="stat-card-value" style="color:${color};font-size:1.1rem;line-height:1.3;">${lider ? lider.nombre : '—'}</div>
                <div class="stat-card-description">${lider ? `${lider.completadas} completadas · ${lider.porcentaje.toFixed(1)}% del total` : 'Sin datos'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header"><span class="stat-card-title">⏱️ Tiempo mediano global</span></div>
                <div class="stat-card-value" style="color:${color};">${tpFormatoHoras(d.medianaGlobal)}</div>
                <div class="stat-card-description">desde asignación hasta cierre</div>
            </div>
        </div>

        <!-- Resumen por rol -->
        ${rolesHtml ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.75rem;margin-bottom:1.5rem;">${rolesHtml}</div>` : ''}

        <!-- Tabla principal -->
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="card-header">
                <h3 class="card-title">👷 Desempeño individual
                    <span style="font-weight:normal;color:#6b7280;font-size:0.8rem;">
                        (${d.personas.length} personas · mostrando ${top.length})
                    </span>
                </h3>
            </div>
            <div class="card-content" style="overflow-x:auto;">
                ${top.length === 0 ? '<p style="color:#6b7280;">Sin datos de personal para los filtros seleccionados.</p>' : `
                <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
                    <thead>
                        <tr style="border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:0.72rem;text-transform:uppercase;">
                            <th style="padding:0.5rem 0.4rem;">#</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">Persona</th>
                            <th style="padding:0.5rem 0.4rem;"></th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Completadas</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">%</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Abiertas</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Críticas</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Mediana</th>
                            <th style="padding:0.5rem 0.4rem;text-align:right;">Promedio</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">6 meses</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">Equipo frecuente</th>
                            <th style="padding:0.5rem 0.4rem;text-align:left;">Ubicación frecuente</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>`}
                <p style="margin:1rem 0 0;color:#6b7280;font-size:0.78rem;line-height:1.5;">
                    <strong>Cómo leer esta tabla.</strong> La <em>mediana</em> es más representativa que el promedio:
                    un solo caso que tardó semanas dispara el promedio pero no la mediana. Los tiempos se miden
                    desde la asignación hasta el cierre, o desde la creación si no hubo asignación registrada.
                    Compara tiempos solo entre personas con carga y tipo de trabajo similares: una reparación
                    mayor y una inspección de rutina no son equiparables.
                </p>
            </div>
        </div>`;
}

function tpSetFiltro(campo, valor) {
    tpFiltros[campo] = valor;
    tpRenderizar();
}

// ---------------------------------------------------------------------------
// 3) EXPORTACIÓN CSV
// ---------------------------------------------------------------------------

function tpExportarCSV() {
    try {
        const d = window.__tpUltimoResultado || tpCalcular();
        const sep = ';';
        const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
        const lineas = [];

        lineas.push(esc('DESEMPENO DEL PERSONAL - HOSPITAL SUSANA LOPEZ DE VALENCIA'));
        lineas.push([esc('Area'), esc(tpFiltros.area)].join(sep));
        lineas.push([esc('Periodo'), esc(tpFiltros.meses === 0 ? 'Historico completo' : `Ultimos ${tpFiltros.meses} meses`)].join(sep));
        lineas.push([esc('Completadas en el periodo'), esc(d.completadasTotal)].join(sep));
        lineas.push([esc('Completadas con responsable'), esc(d.totalConTecnico)].join(sep));
        lineas.push([esc('Completadas SIN tecnico registrado'), esc(d.completadasSinTecnico)].join(sep));
        lineas.push([esc('Generado'), esc(new Date().toLocaleString('es-CO'))].join(sep));
        lineas.push('');

        lineas.push([esc('#'), esc('Nombre'), esc('Rol'), esc('Especialidad'), esc('Completadas'),
                     esc('% del total'), esc('Abiertas'), esc('Criticas'), esc('Reparaciones'),
                     esc('Inspecciones'), esc('Mediana (h)'), esc('Promedio (h)'),
                     esc('Areas'), esc('Equipo frecuente'), esc('Ubicacion frecuente')].join(sep));

        d.personas.forEach((p, i) => {
            lineas.push([
                esc(i + 1), esc(p.nombre), esc(p.rol), esc(p.especialidad), esc(p.completadas),
                esc(p.porcentaje.toFixed(1)), esc(p.pendientes), esc(p.criticas), esc(p.reparaciones),
                esc(p.inspecciones),
                esc(p.medianaHoras !== null ? p.medianaHoras.toFixed(1) : ''),
                esc(p.promedioHoras !== null ? p.promedioHoras.toFixed(1) : ''),
                esc(p.areasTexto), esc(p.topEquipo), esc(p.topUbicacion)
            ].join(sep));
        });

        const blob = new Blob(['\ufeff' + lineas.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `desempeno_personal_${tpFiltros.area}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (typeof showNotification === 'function') {
            showNotification('✅ Desempeño del personal exportado', 'success');
        }
    } catch (error) {
        console.error('❌ Error exportando desempeno:', error);
        alert('No fue posible exportar: ' + error.message);
    }
}

// ---------------------------------------------------------------------------
// 4) AUTO-INSTALADOR DE LA PESTAÑA
// ---------------------------------------------------------------------------

function tpInstalarPestana() {
    const tabs = document.querySelector('#stats-modal-content .analysis-tabs');
    if (!tabs) return false;
    if (tabs.querySelector('[data-analysis-type="personal"]')) return true;

    const btn = document.createElement('button');
    btn.className = 'analysis-tab';
    btn.setAttribute('data-analysis-type', 'personal');
    btn.innerHTML = '👷 Desempeño del Personal';
    btn.addEventListener('click', () => showAnalysisType('personal'));
    tabs.appendChild(btn);

    if (!document.getElementById('analysis-personal')) {
        const cont = document.createElement('div');
        cont.id = 'analysis-personal';
        cont.className = 'analysis-content';
        cont.style.display = 'none';
        cont.innerHTML = '<div id="ranking-personal-container"></div>';
        tabs.parentNode.appendChild(cont);
    }
    console.log('✅ Pestaña "Desempeño del Personal" instalada');
    return true;
}

function tpIntentarInstalar(intentos = 20) {
    if (tpInstalarPestana()) return;
    if (intentos > 0) setTimeout(() => tpIntentarInstalar(intentos - 1), 250);
}

(function tpEnganchar() {
    if (typeof window.showAdvancedStatisticsModal === 'function' && !window.__tpModalParcheado) {
        const original = window.showAdvancedStatisticsModal;
        window.showAdvancedStatisticsModal = async function (...args) {
            const r = await original.apply(this, args);
            tpIntentarInstalar();
            return r;
        };
        window.__tpModalParcheado = true;
    }
    if (typeof window.showAnalysisType === 'function' && !window.__tpTabParcheado) {
        const originalTab = window.showAnalysisType;
        window.showAnalysisType = function (type) {
            originalTab.apply(this, arguments);
            if (type === 'personal') setTimeout(() => tpRenderizar(), 30);
        };
        window.__tpTabParcheado = true;
    }
    tpIntentarInstalar(4);
})();

window.tpRenderizar = tpRenderizar;
window.tpSetFiltro = tpSetFiltro;
window.tpExportarCSV = tpExportarCSV;
window.tpCalcular = tpCalcular;
window.tpInstalarPestana = tpInstalarPestana;

console.log('👷 Módulo Desempeño del Personal cargado. Comandos: tpRenderizar() · tpExportarCSV()');
