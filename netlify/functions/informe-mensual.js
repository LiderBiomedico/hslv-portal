/* =========================================================================
   INFORME MENSUAL — Portal de Gestión HSLV
   Pestaña "Informe Mensual" dentro del modal de Estadísticas Avanzadas.
   Muestra, para el mes seleccionado:
     • Qué equipo tuvo más llamados (ranking)
     • Quién lo solucionó (técnico que más atendió por equipo y técnico del mes)
     • Si el llamado fue en día de semana o fin de semana
   Módulo autoinstalable: parchea showAdvancedStatisticsModal y showAnalysisType
   en tiempo de ejecución. No requiere editar pestañas HTML manualmente.
   Diseñado para coexistir con los módulos "Equipos y Servicios" y
   "Desempeño del Personal" (encadena sobre las funciones ya existentes).
   ========================================================================= */
(function () {
  'use strict';

  if (window.__informeMensualInstalado) return;
  window.__informeMensualInstalado = true;

  var IM_TIPO = 'mensual';
  var IM_VERDE = '#059669';
  var IM_AZUL = '#2563eb';

  // Estado de la vista (se conserva mientras el modal está abierto)
  var imEstado = { mes: null, area: 'todas' };

  /* ---------------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------------- */

  // Parser de fechas orientado al DÍA CALENDARIO local (no al instante UTC).
  // Esto es clave para el informe: el mes y la clasificación día de semana /
  // fin de semana deben corresponder a la fecha tal como aparece en el registro,
  // sin que la zona horaria (Colombia, UTC-5) la corra un día.
  function imParseFecha(raw) {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw) ? null : raw;
    var texto = String(raw).trim();

    // ISO: YYYY-MM-DD (con o sin hora). Se toma el día calendario tal cual.
    var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }

    // Formato colombiano: dd/mm/yyyy o dd-mm-yyyy (con hora opcional).
    var lat = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (lat) {
      return new Date(Number(lat[3]), Number(lat[2]) - 1, Number(lat[1]));
    }

    // Último recurso: dejar que el motor intente, y si el portal tiene su
    // propio parser, usarlo como respaldo.
    var d = new Date(texto);
    if (!isNaN(d)) return d;
    try {
      if (typeof parseFechaSolicitud === 'function') {
        var f = parseFechaSolicitud(raw);
        if (f) return f;
      }
    } catch (e) { /* noop */ }
    return null;
  }

  // Lee las solicitudes globales de forma segura.
  function imSolicitudes() {
    try {
      if (typeof cloudSolicitudes !== 'undefined' && Array.isArray(cloudSolicitudes)) {
        return cloudSolicitudes;
      }
    } catch (e) { /* noop */ }
    if (Array.isArray(window.cloudSolicitudes)) return window.cloudSolicitudes;
    return [];
  }

  function imClasificarArea(servicio) {
    var s = (servicio || '').toString().toLowerCase();
    if (s.indexOf('biomed') !== -1 || s.indexOf('bioméd') !== -1) return 'BIOMEDICA';
    if (s.indexOf('mecán') !== -1 || s.indexOf('mecan') !== -1) return 'MECANICA';
    if (s.indexOf('infra') !== -1) return 'INFRAESTRUCTURA';
    return 'OTRA';
  }

  var IM_AREA_KEY = { todas: null, biomedica: 'BIOMEDICA', mecanica: 'MECANICA', infraestructura: 'INFRAESTRUCTURA' };

  // Normalización de nombres de equipo.
  // Si el módulo "Ranking de Equipos" está cargado, se usa su catálogo canónico
  // (rkCanonizarEquipo) para que el "equipo con más llamados" coincida con la
  // pestaña "Equipos y Servicios" en modo Agrupados. Si no, se usa un
  // normalizador básico (mayúsculas, sin tildes, sin numeración final).
  // Se puede forzar uno propio con:  window.imNormalizarEquipoOverride = fn;
  function imNormalizarEquipoDefault(nombre) {
    if (!nombre) return 'SIN ESPECIFICAR';
    var t = String(nombre).toUpperCase();
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    t = t.replace(/\s*(#|N[º°O]\.?\s*|NO\.?\s*)\d+\s*$/i, '');
    t = t.replace(/[\s\-_.]+$/, '');
    t = t.replace(/\s+/g, ' ').trim();
    return t || 'SIN ESPECIFICAR';
  }
  function imNormalizarEquipo(nombre) {
    if (typeof window.imNormalizarEquipoOverride === 'function') {
      try { return window.imNormalizarEquipoOverride(nombre); } catch (e) { /* fallback */ }
    }
    if (typeof rkCanonizarEquipo === 'function') {
      try {
        var canon = rkCanonizarEquipo(nombre);
        if (canon) return canon;
      } catch (e) { /* fallback */ }
    }
    return imNormalizarEquipoDefault(nombre);
  }

  function imEsFinDeSemana(fecha) {
    var d = fecha.getDay(); // 0 = domingo, 6 = sábado
    return d === 0 || d === 6;
  }

  function imEsCritica(prioridad) {
    var p = (prioridad || '').toString().toUpperCase();
    return p === 'CRITICA' || p === 'CRÍTICA';
  }

  function imMesKey(fecha) {
    return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
  }

  var IM_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function imMesLegible(mesKey) {
    if (!mesKey) return '';
    var p = mesKey.split('-');
    var mi = Number(p[1]) - 1;
    return (IM_MESES[mi] || '') + ' ' + p[0];
  }

  function imEscapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function imTopDeMapa(mapa) {
    var top = null, max = -1;
    mapa.forEach(function (v, k) { if (v > max) { max = v; top = k; } });
    return { nombre: top, cantidad: max < 0 ? 0 : max };
  }

  /* ---------------------------------------------------------------------
     Cálculo
     --------------------------------------------------------------------- */

  // Devuelve los mesKey presentes en los datos (para el selector y el default).
  function imMesesDisponibles() {
    var set = {};
    imSolicitudes().forEach(function (s) {
      var f = imParseFecha(s.fechaCreacion || s.fecha || s.createdTime);
      if (f) set[imMesKey(f)] = true;
    });
    return Object.keys(set).sort(); // ascendente
  }

  function imComputar(mesKey, areaKey) {
    var areaObjetivo = IM_AREA_KEY[areaKey] || null;
    var resultado = {
      total: 0, entreSemana: 0, finDeSemana: 0, criticas: 0,
      completadas: 0, sinTecnico: 0,
      porEquipo: new Map(),   // norm -> {total,entreSemana,finDeSemana,criticas,tecnicos:Map,original}
      porTecnico: new Map()   // tecnico -> cantidad
    };

    imSolicitudes().forEach(function (s) {
      var f = imParseFecha(s.fechaCreacion || s.fecha || s.createdTime);
      if (!f) return;
      if (imMesKey(f) !== mesKey) return;
      if (areaObjetivo && imClasificarArea(s.servicioIngenieria) !== areaObjetivo) return;

      var norm = imNormalizarEquipo(s.equipo);
      var tecnico = (s.tecnicoAsignado || '').toString().trim();
      var finde = imEsFinDeSemana(f);
      var critica = imEsCritica(s.prioridad);
      var estado = (s.estado || '').toString().toUpperCase();

      resultado.total++;
      if (finde) resultado.finDeSemana++; else resultado.entreSemana++;
      if (critica) resultado.criticas++;
      if (estado === 'COMPLETADA') resultado.completadas++;

      if (tecnico) {
        resultado.porTecnico.set(tecnico, (resultado.porTecnico.get(tecnico) || 0) + 1);
      } else {
        resultado.sinTecnico++;
      }

      var eq = resultado.porEquipo.get(norm);
      if (!eq) {
        eq = { total: 0, entreSemana: 0, finDeSemana: 0, criticas: 0,
               tecnicos: new Map(), original: s.equipo || 'Sin especificar' };
        resultado.porEquipo.set(norm, eq);
      }
      eq.total++;
      if (finde) eq.finDeSemana++; else eq.entreSemana++;
      if (critica) eq.criticas++;
      if (tecnico) eq.tecnicos.set(tecnico, (eq.tecnicos.get(tecnico) || 0) + 1);
    });

    // Ranking de equipos ordenado por total desc
    resultado.ranking = Array.from(resultado.porEquipo.entries())
      .map(function (par) {
        var eq = par[1];
        var topTec = imTopDeMapa(eq.tecnicos);
        return {
          equipo: par[0], total: eq.total,
          entreSemana: eq.entreSemana, finDeSemana: eq.finDeSemana,
          criticas: eq.criticas, tecnicoTop: topTec.nombre, tecnicoTopCant: topTec.cantidad
        };
      })
      .sort(function (a, b) { return b.total - a.total || a.equipo.localeCompare(b.equipo); });

    resultado.tecnicoDelMes = imTopDeMapa(resultado.porTecnico);
    return resultado;
  }

  /* ---------------------------------------------------------------------
     Render
     --------------------------------------------------------------------- */

  function imTarjeta(icono, titulo, valor, sub, color) {
    return '' +
      '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem 1.25rem 1.1rem;">' +
        '<div style="font-size:.8rem;color:#6b7280;font-weight:600;margin-bottom:.4rem;">' + icono + ' ' + imEscapar(titulo) + '</div>' +
        '<div style="font-size:1.7rem;font-weight:800;color:' + color + ';line-height:1.1;">' + valor + '</div>' +
        '<div style="font-size:.8rem;color:#6b7280;margin-top:.35rem;">' + sub + '</div>' +
      '</div>';
  }

  function imBotonArea(key, etiqueta, icono) {
    var activo = imEstado.area === key;
    return '<button onclick="imSetArea(\'' + key + '\')" style="' +
      'padding:.5rem 1rem;border-radius:8px;border:1px solid ' + (activo ? IM_VERDE : '#d1d5db') + ';' +
      'background:' + (activo ? IM_VERDE : '#fff') + ';color:' + (activo ? '#fff' : '#374151') + ';' +
      'font-weight:600;font-size:.85rem;cursor:pointer;">' + icono + ' ' + etiqueta + '</button>';
  }

  function imRender() {
    var cont = document.getElementById('analysis-mensual');
    if (!cont) return;

    var disponibles = imMesesDisponibles();
    if (!imEstado.mes) {
      imEstado.mes = disponibles.length ? disponibles[disponibles.length - 1] : imMesKey(new Date());
    }

    var r = imComputar(imEstado.mes, imEstado.area);
    var pctFinde = r.total ? Math.round((r.finDeSemana / r.total) * 100) : 0;
    var pctSemana = 100 - pctFinde;

    // --- Controles ---
    var html = '';
    html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.25rem;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:1.5rem;align-items:flex-end;">' +
        '<div>' +
          '<div style="font-size:.75rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:.4rem;">Mes</div>' +
          '<input type="month" id="im-mes" value="' + imEstado.mes + '" ' +
            (disponibles.length ? 'min="' + disponibles[0] + '" max="' + disponibles[disponibles.length - 1] + '"' : '') +
            ' onchange="imOnMesChange(this.value)" ' +
            'style="padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:8px;font-size:.9rem;font-weight:600;color:#111827;">' +
        '</div>' +
        '<div>' +
          '<div style="font-size:.75rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:.4rem;">Área</div>' +
          '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">' +
            imBotonArea('todas', 'Todas', '🌐') +
            imBotonArea('biomedica', 'Biomédica', '🏥') +
            imBotonArea('mecanica', 'Mecánica', '⚙️') +
            imBotonArea('infraestructura', 'Infraestructura', '🏗️') +
          '</div>' +
        '</div>' +
        '<div style="margin-left:auto;">' +
          '<button onclick="imExportCSV()" style="padding:.55rem 1.1rem;border:none;border-radius:8px;background:' + IM_AZUL + ';color:#fff;font-weight:600;font-size:.85rem;cursor:pointer;">📥 Exportar CSV</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:.75rem;font-size:.82rem;color:#6b7280;">Informe de <strong style="color:#111827;">' + imMesLegible(imEstado.mes) + '</strong> · el conteo de llamados y el clasificador día de semana / fin de semana se basan en la <strong>fecha de creación</strong> de cada solicitud.</div>' +
    '</div>';

    if (r.total === 0) {
      html += '<div style="text-align:center;padding:3rem;color:#6b7280;border:1px dashed #d1d5db;border-radius:12px;">' +
        '<div style="font-size:2rem;margin-bottom:.5rem;">🗓️</div>' +
        'No hay llamados registrados en <strong>' + imMesLegible(imEstado.mes) + '</strong>' +
        (imEstado.area !== 'todas' ? ' para el área seleccionada.' : '.') +
        '</div>';
      cont.innerHTML = html;
      return;
    }

    var topEquipo = r.ranking[0];

    // --- Tarjetas resumen ---
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.25rem;">';
    html += imTarjeta('📋', 'Llamados del mes', r.total,
      r.completadas + ' completadas · ' + r.criticas + ' críticas', IM_VERDE);
    html += imTarjeta('🔧', 'Equipo con más llamados', imEscapar(topEquipo.equipo),
      topEquipo.total + ' llamados · atendió principalmente <strong>' + imEscapar(topEquipo.tecnicoTop || 'Sin registrar') + '</strong>', IM_VERDE);
    html += imTarjeta('👤', 'Técnico del mes',
      imEscapar(r.tecnicoDelMes.nombre || 'Sin registrar'),
      (r.tecnicoDelMes.nombre ? r.tecnicoDelMes.cantidad + ' llamados atendidos' : 'sin técnico en los registros'), IM_AZUL);
    html += imTarjeta('📆', 'Distribución semanal',
      pctSemana + '% <span style="font-size:1rem;color:#6b7280;">entre semana</span>',
      r.entreSemana + ' entre semana · ' + r.finDeSemana + ' fin de semana (' + pctFinde + '%)', IM_AZUL);
    html += '</div>';

    // --- Barra día de semana vs fin de semana ---
    html += '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1.1rem 1.25rem;margin-bottom:1.25rem;">' +
      '<div style="font-weight:700;color:#111827;margin-bottom:.75rem;">📆 Día de semana vs. fin de semana</div>' +
      '<div style="display:flex;height:26px;border-radius:8px;overflow:hidden;font-size:.78rem;font-weight:700;color:#fff;">' +
        (pctSemana > 0 ? '<div style="width:' + pctSemana + '%;background:' + IM_AZUL + ';display:flex;align-items:center;justify-content:center;">' + (pctSemana >= 12 ? 'Entre semana ' + pctSemana + '%' : '') + '</div>' : '') +
        (pctFinde > 0 ? '<div style="width:' + pctFinde + '%;background:' + IM_VERDE + ';display:flex;align-items:center;justify-content:center;">' + (pctFinde >= 12 ? 'Fin de semana ' + pctFinde + '%' : '') + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:1.5rem;margin-top:.6rem;font-size:.82rem;color:#6b7280;">' +
        '<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + IM_AZUL + ';margin-right:.35rem;"></span>Entre semana: <strong style="color:#111827;">' + r.entreSemana + '</strong></span>' +
        '<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + IM_VERDE + ';margin-right:.35rem;"></span>Fin de semana: <strong style="color:#111827;">' + r.finDeSemana + '</strong></span>' +
      '</div>' +
    '</div>';

    // --- Aviso de calidad de datos (técnico sin registrar) ---
    if (r.sinTecnico > 0) {
      var pctSin = Math.round((r.sinTecnico / r.total) * 100);
      html += '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.85rem;color:#92400e;">' +
        '⚠️ <strong>' + r.sinTecnico + '</strong> de ' + r.total + ' llamados (' + pctSin + '%) no tienen técnico registrado. ' +
        'Algunas versiones anteriores del sistema borraban el técnico asignado al completar la solicitud, por lo que "quién lo solucionó" puede quedar vacío en registros históricos.' +
        '</div>';
    }

    // --- Tabla de ranking ---
    html += '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">' +
      '<div style="padding:.9rem 1.25rem;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">🔧 Equipos con más llamados en ' + imMesLegible(imEstado.mes) + '</div>' +
      '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:.85rem;">' +
      '<thead><tr style="background:#f9fafb;color:#6b7280;text-align:left;">' +
        '<th style="padding:.6rem .75rem;">#</th>' +
        '<th style="padding:.6rem .75rem;">Equipo</th>' +
        '<th style="padding:.6rem .75rem;text-align:center;">Llamados</th>' +
        '<th style="padding:.6rem .75rem;text-align:center;">Entre semana</th>' +
        '<th style="padding:.6rem .75rem;text-align:center;">Fin de semana</th>' +
        '<th style="padding:.6rem .75rem;text-align:center;">Críticas</th>' +
        '<th style="padding:.6rem .75rem;">Quién lo solucionó (principal)</th>' +
      '</tr></thead><tbody>';

    r.ranking.forEach(function (row, i) {
      var resaltar = i === 0;
      html += '<tr style="border-top:1px solid #f0f0f0;' + (resaltar ? 'background:#ecfdf5;' : '') + '">' +
        '<td style="padding:.6rem .75rem;font-weight:700;color:#6b7280;">' + (i + 1) + '</td>' +
        '<td style="padding:.6rem .75rem;font-weight:' + (resaltar ? '800' : '600') + ';color:#111827;">' + imEscapar(row.equipo) + '</td>' +
        '<td style="padding:.6rem .75rem;text-align:center;font-weight:800;color:' + IM_VERDE + ';">' + row.total + '</td>' +
        '<td style="padding:.6rem .75rem;text-align:center;color:' + IM_AZUL + ';font-weight:600;">' + row.entreSemana + '</td>' +
        '<td style="padding:.6rem .75rem;text-align:center;color:' + IM_VERDE + ';font-weight:600;">' + row.finDeSemana + '</td>' +
        '<td style="padding:.6rem .75rem;text-align:center;color:' + (row.criticas ? '#dc2626' : '#9ca3af') + ';font-weight:600;">' + row.criticas + '</td>' +
        '<td style="padding:.6rem .75rem;color:#374151;">' +
          (row.tecnicoTop
            ? imEscapar(row.tecnicoTop) + ' <span style="color:#9ca3af;">(' + row.tecnicoTopCant + '/' + row.total + ')</span>'
            : '<span style="color:#9ca3af;font-style:italic;">Sin registrar</span>') +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div></div>';

    cont.innerHTML = html;
  }

  /* ---------------------------------------------------------------------
     Interacción (expuestas a window para los onclick/onchange inline)
     --------------------------------------------------------------------- */

  window.imOnMesChange = function (valor) {
    if (valor) imEstado.mes = valor;
    imRender();
  };

  window.imSetArea = function (area) {
    imEstado.area = area;
    imRender();
  };

  window.imExportCSV = function () {
    var r = imComputar(imEstado.mes, imEstado.area);
    var filas = [['Puesto', 'Equipo', 'Llamados', 'Entre semana', 'Fin de semana', 'Criticas', 'Tecnico principal', 'Llamados atendidos por ese tecnico']];
    r.ranking.forEach(function (row, i) {
      filas.push([i + 1, row.equipo, row.total, row.entreSemana, row.finDeSemana, row.criticas,
                  row.tecnicoTop || 'Sin registrar', row.tecnicoTop ? row.tecnicoTopCant : 0]);
    });
    var csv = filas.map(function (f) {
      return f.map(function (c) {
        var t = String(c == null ? '' : c);
        return /[",;\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
      }).join(',');
    }).join('\r\n');

    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'informe-mensual-' + imEstado.mes + '-' + imEstado.area + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  };

  /* ---------------------------------------------------------------------
     Inyección de la pestaña en el modal
     --------------------------------------------------------------------- */

  function imInyectarPestana() {
    var tabs = document.querySelector('#stats-modal-content .analysis-tabs');
    if (!tabs) return;
    if (document.querySelector('.analysis-tab[data-analysis-type="' + IM_TIPO + '"]')) return; // ya inyectada

    // Botón de pestaña
    var btn = document.createElement('button');
    btn.className = 'analysis-tab';
    btn.setAttribute('data-analysis-type', IM_TIPO);
    btn.setAttribute('onclick', "showAnalysisType('" + IM_TIPO + "')");
    btn.innerHTML = '📆 Informe Mensual';
    tabs.appendChild(btn);

    // Contenedor de contenido (hermano de los demás .analysis-content)
    if (!document.getElementById('analysis-' + IM_TIPO)) {
      var algunContenido = document.querySelector('#stats-modal-content .analysis-content');
      var div = document.createElement('div');
      div.id = 'analysis-' + IM_TIPO;
      div.className = 'analysis-content';
      div.style.display = 'none';
      if (algunContenido && algunContenido.parentNode) {
        algunContenido.parentNode.appendChild(div);
      } else {
        document.getElementById('stats-modal-content').appendChild(div);
      }
    }
  }

  /* ---------------------------------------------------------------------
     Parcheo de funciones globales (encadenado, no destructivo)
     --------------------------------------------------------------------- */

  function imInstalarParches() {
    if (typeof window.showAdvancedStatisticsModal !== 'function' ||
        typeof window.showAnalysisType !== 'function') {
      return false;
    }
    if (window.__imParchesAplicados) return true;
    window.__imParchesAplicados = true;

    // 1) Al abrir/reconstruir el modal, reinyectar la pestaña.
    var origModal = window.showAdvancedStatisticsModal;
    window.showAdvancedStatisticsModal = function () {
      var ret = origModal.apply(this, arguments);
      var reinyectar = function () { setTimeout(imInyectarPestana, 0); };
      if (ret && typeof ret.then === 'function') {
        ret.then(reinyectar, reinyectar);
      } else {
        reinyectar();
      }
      return ret;
    };

    // 2) Al cambiar de pestaña a "mensual", renderizar con datos frescos.
    var origTipo = window.showAnalysisType;
    window.showAnalysisType = function (type) {
      var ret = origTipo.apply(this, arguments);
      if (type === IM_TIPO) {
        imInyectarPestana(); // por si aún no estaba
        var cont = document.getElementById('analysis-' + IM_TIPO);
        if (cont) cont.style.display = 'block';
        setTimeout(imRender, 30);
      }
      return ret;
    };

    return true;
  }

  // Esperar a que existan las funciones globales (orden de carga flexible).
  var intentos = 0;
  (function esperar() {
    if (imInstalarParches()) return;
    if (intentos++ > 100) return; // ~10 s máximo
    setTimeout(esperar, 100);
  })();

})();
