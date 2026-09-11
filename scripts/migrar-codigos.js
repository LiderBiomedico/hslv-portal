// ===============================================
// scripts/migrar-codigos.js
// Migracion unica: convierte codigoAcceso (texto plano) en codigoAccesoHash
// y borra el campo original. Se ejecuta UNA vez desde su equipo, no en Netlify.
//
//   node scripts/migrar-codigos.js --dry-run     (solo muestra lo que haria)
//   node scripts/migrar-codigos.js               (aplica los cambios)
//
// Requiere las variables AIRTABLE_API_KEY y AIRTABLE_BASE_ID en el entorno.
// Antes de ejecutar: duplique la base en Airtable como respaldo.
// ===============================================

const { hashCode } = require('../netlify/functions/utils/session');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const DRY_RUN = process.argv.includes('--dry-run');
// Cada tabla guarda el codigo en un campo distinto en esta base
const TABLAS = [
    { nombre: 'Usuarios', campoOrigen: 'codigoAcceso' },
    { nombre: 'Tecnicos', campoOrigen: 'pin' }
];

if (!API_KEY || !BASE_ID) {
    console.error('Faltan AIRTABLE_API_KEY o AIRTABLE_BASE_ID en el entorno.');
    process.exit(1);
}

async function airtable(path, options = {}) {
    const respuesta = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    if (!respuesta.ok) {
        throw new Error(`Airtable ${respuesta.status}: ${(await respuesta.text()).slice(0, 300)}`);
    }
    return respuesta.json();
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

async function migrarTabla({ nombre: tabla, campoOrigen }) {
    console.log(`\n=== ${tabla} (campo ${campoOrigen}) ===`);

    const registros = [];
    let offset = null;

    do {
        const data = await airtable(`${tabla}?pageSize=100${offset ? `&offset=${offset}` : ''}`);
        registros.push(...data.records);
        offset = data.offset || null;
    } while (offset);

    const pendientes = registros.filter(
        r => r.fields[campoOrigen] && !r.fields.codigoAccesoHash
    );

    console.log(`${registros.length} registros, ${pendientes.length} por migrar`);

    if (DRY_RUN) {
        pendientes.forEach(r => console.log(`  [dry-run] ${r.fields.email || r.id}`));
        return;
    }

    // Lotes de 10: es el maximo por peticion de Airtable, y respeta el limite
    // de 5 peticiones por segundo con la pausa entre lotes.
    for (let i = 0; i < pendientes.length; i += 10) {
        const lote = pendientes.slice(i, i + 10);

        await airtable(tabla, {
            method: 'PATCH',
            body: JSON.stringify({
                records: lote.map(r => ({
                    id: r.id,
                    fields: {
                        codigoAccesoHash: hashCode(r.fields[campoOrigen]),
                        [campoOrigen]: ''   // se borra el codigo en claro
                    }
                }))
            })
        });

        console.log(`  Lote ${Math.floor(i / 10) + 1}: ${lote.length} registros`);
        await esperar(250);
    }
}

(async () => {
    console.log(DRY_RUN ? 'MODO SIMULACION' : 'APLICANDO CAMBIOS');
    for (const tabla of TABLAS) {
        try {
            await migrarTabla(tabla);
        } catch (error) {
            console.error(`Error en ${tabla.nombre}: ${error.message}`);
        }
    }
    console.log('\nListo.');
})();
