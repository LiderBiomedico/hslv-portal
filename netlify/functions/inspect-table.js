// 🔍 Función para inspeccionar campos de tablas en Airtable
// netlify/functions/inspect-table.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Variables de entorno no configuradas' })
            };
        }

        // Obtener tabla a inspeccionar desde query parameter
        const tableName = event.queryStringParameters?.table || 'SolicitudesAcceso';
        
        console.log(`🔍 Inspeccionando tabla: ${tableName}`);

        // Obtener algunos records para ver la estructura
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=3`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = errorText;
            }

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: `Error inspeccionando tabla ${tableName}`,
                    airtableError: errorData,
                    status: response.status
                })
            };
        }

        const data = await response.json();
        
        // Analizar estructura
        const analysis = {
            tableName: tableName,
            recordCount: data.records.length,
            fields: {},
            sampleData: data.records
        };

        // Recopilar todos los campos únicos de todos los records
        const allFields = new Set();
        
        data.records.forEach(record => {
            if (record.fields) {
                Object.keys(record.fields).forEach(field => {
                    allFields.add(field);
                });
            }
        });

        // Analizar tipos de datos por campo
        allFields.forEach(fieldName => {
            const values = data.records
                .map(r => r.fields[fieldName])
                .filter(v => v !== undefined && v !== null);
            
            const types = [...new Set(values.map(v => typeof v))];
            const sampleValues = values.slice(0, 3);
            
            analysis.fields[fieldName] = {
                type: types.length === 1 ? types[0] : types,
                sampleValues: sampleValues,
                isRequired: values.length === data.records.length
            };
        });

        // Crear recomendaciones para SolicitudesAcceso
        const recommendations = {};
        if (tableName === 'SolicitudesAcceso') {
            recommendations.recommendedMapping = {
                id: allFields.has('id') ? 'id' : allFields.has('ID') ? 'ID' : '❌ No encontrado',
                nombreCompleto: allFields.has('nombreCompleto') ? 'nombreCompleto' : 
                               allFields.has('Nombre') ? 'Nombre' : 
                               allFields.has('nombre') ? 'nombre' : '❌ No encontrado',
                email: allFields.has('email') ? 'email' : 
                       allFields.has('Email') ? 'Email' : 
                       allFields.has('correo') ? 'correo' : '❌ No encontrado',
                fechaSolicitud: allFields.has('fechaSolicitud') ? 'fechaSolicitud' :
                               allFields.has('fecha') ? 'fecha' :
                               allFields.has('Fecha') ? 'Fecha' :
                               allFields.has('Created time') ? 'Created time' :
                               allFields.has('createdTime') ? 'createdTime' : '❌ No encontrado - CREAR O OMITIR',
                estado: allFields.has('estado') ? 'estado' :
                       allFields.has('Estado') ? 'Estado' :
                       allFields.has('status') ? 'status' : '❌ No encontrado',
                servicioHospitalario: allFields.has('servicioHospitalario') ? 'servicioHospitalario' :
                                     allFields.has('servicio') ? 'servicio' :
                                     allFields.has('Servicio') ? 'Servicio' : '❌ No encontrado',
                cargo: allFields.has('cargo') ? 'cargo' :
                      allFields.has('Cargo') ? 'Cargo' :
                      allFields.has('puesto') ? 'puesto' : '❌ No encontrado'
            };
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            analysis: analysis,
            availableFields: Array.from(allFields).sort(),
            fieldCount: allFields.size,
            recommendations: recommendations
        };

        console.log(`✅ Inspección completada: ${allFields.size} campos encontrados`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result, null, 2)
        };

    } catch (error) {
        console.error('❌ Error en inspección:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            })
        };
    }
};