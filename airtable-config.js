// 🔐 MÉTODO CORREGIDO: Aprobar solicitud y crear usuario (sin campos inexistentes)
async approveAccessRequestAndCreateUser(requestId) {
    console.log('✅ Iniciando aprobación de solicitud:', requestId);
    
    try {
        // 1. Obtener la solicitud de acceso
        const solicitudesAcceso = await this.getSolicitudesAcceso();
        const solicitud = solicitudesAcceso.find(s => s.id === requestId);
        
        if (!solicitud) {
            throw new Error('Solicitud de acceso no encontrada');
        }

        if (solicitud.estado === 'APROBADA' || solicitud.estado === 'Aprobada') {
            throw new Error('La solicitud ya fue aprobada anteriormente');
        }

        // 2. Generar código de acceso
        const codigoAcceso = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`🔐 Código generado: ${codigoAcceso}`);

        // 3. Detectar valores válidos si no se han detectado
        if (!this.validUserValues.estado) {
            await this.detectValidUserValues();
        }

        // 4. Preparar datos del usuario con valores limpios
        const userData = {
            nombreCompleto: this.cleanFieldValue(solicitud.nombreCompleto || 'Sin nombre'),
            email: this.cleanFieldValue(solicitud.email || 'no-email@temp.com'),
            servicioHospitalario: this.cleanFieldValue(solicitud.servicioHospitalario || ''),
            cargo: this.cleanFieldValue(solicitud.cargo || ''),
            codigoAcceso: codigoAcceso,
            fechaCreacion: new Date().toISOString(),
            solicitudOrigenId: requestId  // ID de la solicitud de origen
        };

        // 5. Agregar estado si tenemos un valor válido
        if (this.validUserValues.estado) {
            userData.estado = this.validUserValues.estado;
        } else {
            console.warn('⚠️ No se detectó valor válido para estado de usuario, creando sin estado');
        }

        console.log('📝 Datos del usuario a crear:', userData);

        // 6. Intentar crear el usuario
        let newUser;
        try {
            newUser = await this.makeRequest(this.tables.usuarios, 'POST', {
                fields: userData
            });
            console.log('✅ Usuario creado exitosamente:', newUser.id);
            
        } catch (error) {
            if (error.message.includes('422')) {
                console.warn('⚠️ Error 422 al crear usuario, reintentando con campos mínimos...');
                
                // Reintentar con campos absolutamente mínimos
                const minimalUserData = {
                    nombreCompleto: userData.nombreCompleto,
                    email: userData.email,
                    codigoAcceso: userData.codigoAcceso,
                    fechaCreacion: userData.fechaCreacion
                };
                
                newUser = await this.makeRequest(this.tables.usuarios, 'POST', {
                    fields: minimalUserData
                });
                
                console.log('✅ Usuario creado con campos mínimos:', newUser.id);
                
                // Intentar agregar campos adicionales uno por uno
                const additionalFields = {
                    servicioHospitalario: userData.servicioHospitalario,
                    cargo: userData.cargo,
                    solicitudOrigenId: userData.solicitudOrigenId
                };
                
                if (this.validUserValues.estado) {
                    additionalFields.estado = this.validUserValues.estado;
                }
                
                for (const [fieldName, fieldValue] of Object.entries(additionalFields)) {
                    if (fieldValue) {
                        try {
                            await this.makeRequest(`${this.tables.usuarios}/${newUser.id}`, 'PATCH', {
                                fields: { [fieldName]: fieldValue }
                            });
                            console.log(`✅ Campo ${fieldName} agregado al usuario`);
                        } catch (patchError) {
                            console.warn(`⚠️ No se pudo agregar campo ${fieldName}:`, patchError.message);
                        }
                    }
                }
            } else {
                throw error;
            }
        }

        // 7. Actualizar SOLO el estado de la solicitud de acceso (sin fechaAprobacion)
        try {
            // Detectar el valor correcto para estado APROBADA
            let aprobadasValue = 'APROBADA';
            if (this.validAccessRequestValues.estadoValues) {
                const aprobadaDetectada = this.validAccessRequestValues.estadoValues.find(v => 
                    v.toUpperCase().includes('APROBADA') || v.toUpperCase().includes('APROBADO')
                );
                if (aprobadaDetectada) {
                    aprobadasValue = aprobadaDetectada;
                    console.log(`✅ Usando valor de estado detectado: "${aprobadasValue}"`);
                }
            } else {
                console.warn('⚠️ Usando valor de estado por defecto: "APROBADA"');
            }

            // IMPORTANTE: Solo actualizar campos que existan en Airtable
            const updateFields = {
                estado: aprobadasValue
            };
            
            // Solo agregar usuarioCreado si sabemos que el campo existe
            // Puedes comentar la siguiente línea si el campo no existe
            updateFields.usuarioCreado = newUser.id;

            console.log('📝 Actualizando solicitud con campos:', updateFields);

            await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', {
                fields: updateFields
            });
            
            console.log('✅ Solicitud de acceso actualizada');
            
        } catch (updateError) {
            console.error('❌ Error actualizando solicitud de acceso:', updateError);
            
            // Si falla por campo desconocido, intentar solo con estado
            if (updateError.message.includes('UNKNOWN_FIELD_NAME')) {
                console.warn('⚠️ Reintentando actualización solo con estado...');
                
                try {
                    await this.makeRequest(`${this.tables.solicitudesAcceso}/${requestId}`, 'PATCH', {
                        fields: {
                            estado: 'APROBADA' // Usar valor simple
                        }
                    });
                    console.log('✅ Estado de solicitud actualizado');
                } catch (secondError) {
                    console.error('❌ No se pudo actualizar el estado:', secondError);
                    // No fallar, el usuario ya fue creado
                }
            }
            
            console.warn('⚠️ El usuario fue creado pero no se pudo actualizar completamente la solicitud');
        }

        // 8. Retornar resultado exitoso
        return {
            success: true,
            user: {
                id: newUser.id,
                ...newUser.fields
            },
            accessCode: codigoAcceso,
            requestId: requestId
        };

    } catch (error) {
        console.error('❌ Error en aprobación:', error);
        
        // Proporcionar información detallada del error
        if (error.message.includes('422') || error.message.includes('UNKNOWN_FIELD_NAME')) {
            console.error('🔍 Diagnóstico del error:');
            console.error('- Error específico:', error.message);
            console.error('💡 Solución: Verificar que los campos existan en Airtable');
            console.error('Campos que pueden no existir:');
            console.error('- fechaAprobacion (no existe)');
            console.error('- usuarioCreado (verificar si existe)');
        }
        
        throw error;
    }
}

// También actualiza el método detectValidAccessRequestValues para verificar campos disponibles
async detectValidAccessRequestValues() {
    console.log('🔍 Detectando valores y campos válidos para SolicitudesAcceso...');
    
    try {
        const result = await this.makeRequest(`${this.tables.solicitudesAcceso}?maxRecords=20`);
        
        if (result.records && result.records.length > 0) {
            // Detectar valores únicos de estado
            const estadoValues = new Set();
            const servicioValues = new Set();
            const cargoValues = new Set();
            const availableFields = new Set();
            
            result.records.forEach(record => {
                if (record.fields) {
                    // Recopilar todos los campos disponibles
                    Object.keys(record.fields).forEach(field => {
                        availableFields.add(field);
                    });
                    
                    if (record.fields.estado) {
                        estadoValues.add(record.fields.estado);
                    }
                    if (record.fields.servicioHospitalario) {
                        servicioValues.add(record.fields.servicioHospitalario);
                    }
                    if (record.fields.cargo) {
                        cargoValues.add(record.fields.cargo);
                    }
                }
            });
            
            console.log('📋 Campos disponibles en SolicitudesAcceso:', Array.from(availableFields));
            
            // Buscar el valor correcto para PENDIENTE
            let pendienteValue = null;
            estadoValues.forEach(value => {
                const cleanValue = this.cleanFieldValue(value);
                if (cleanValue.toUpperCase() === 'PENDIENTE') {
                    pendienteValue = value;
                    console.log(`✅ Valor PENDIENTE detectado: "${value}"`);
                }
            });
            
            this.validAccessRequestValues = {
                estado: pendienteValue,
                estadoValues: Array.from(estadoValues),
                servicioHospitalario: Array.from(servicioValues),
                cargo: Array.from(cargoValues),
                availableFields: Array.from(availableFields) // NUEVO: campos disponibles
            };
            
            console.log('📋 Valores válidos detectados:', {
                estado: this.validAccessRequestValues.estado,
                todosEstados: this.validAccessRequestValues.estadoValues,
                camposDisponibles: this.validAccessRequestValues.availableFields,
                servicios: this.validAccessRequestValues.servicioHospitalario.length,
                cargos: this.validAccessRequestValues.cargo.length
            });
            
            // Advertir si campos esperados no existen
            const expectedFields = ['estado', 'nombreCompleto', 'email', 'fechaSolicitud'];
            const missingFields = expectedFields.filter(f => !availableFields.has(f));
            if (missingFields.length > 0) {
                console.warn('⚠️ Campos esperados que no existen:', missingFields);
            }
            
        } else {
            console.warn('⚠️ No hay registros en SolicitudesAcceso para detectar valores');
        }
        
    } catch (error) {
        console.error('❌ Error detectando valores válidos:', error);
    }
}