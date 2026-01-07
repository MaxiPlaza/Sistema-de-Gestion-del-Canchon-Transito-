
const { pool } = require('../config/database');
const xlsx = require('xlsx');

// Importar ingresos completos desde Excel (combina propietario, vehículo e infracción)
const importIngresosCompletos = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        console.log('📁 Archivo recibido:', req.file.originalname);

        // Leer el archivo Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir a array de objetos
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log(`📊 Total de registros en Excel: ${data.length}`);

        if (data.length === 0) {
            return res.status(400).json({ error: 'El archivo Excel está vacío' });
        }

        const resultados = {
            total: data.length,
            exitosos: 0,
            errores: 0,
            omitidos: 0,
            detalles: []
        };

        const usuario_id = req.user.id;

        // Procesar cada fila
        for (let i = 0; i < data.length; i++) {
            const fila = data[i];
            const numeroFila = i + 2; // +2 porque Excel empieza en 1 y tiene encabezado

            try {
                console.log(`\n🔄 Procesando fila ${numeroFila}:`, fila);

                // Validar campos obligatorios
                if (!fila['Dominio'] || !fila['Acta']) {
                    resultados.omitidos++;
                    resultados.detalles.push({
                        fila: numeroFila,
                        estado: 'omitido',
                        motivo: 'Falta Dominio (patente) o Número de Acta'
                    });
                    continue;
                }

                // === PASO 1: PROCESAR PROPIETARIO ===
                let propietario_id = null;
                const conductorNombre = fila['Conducido por'] || '';
                const conductorDomicilio = fila['Domicilio'] || '';

                if (conductorNombre) {
                    // Buscar si ya existe el propietario por nombre
                    const [propietariosExistentes] = await pool.execute(
                        'SELECT id FROM propietarios WHERE nombre = ?',
                        [conductorNombre]
                    );

                    if (propietariosExistentes.length > 0) {
                        propietario_id = propietariosExistentes[0].id;
                        console.log(`✅ Propietario existente encontrado: ${conductorNombre} (ID: ${propietario_id})`);
                    } else {
                        // Crear nuevo propietario
                        const [resultPropietario] = await pool.execute(
                            `INSERT INTO propietarios (dni, nombre, direccion, fecha_registro) 
                             VALUES (?, ?, ?, datetime('now'))`,
                            ['', conductorNombre, conductorDomicilio]
                        );
                        propietario_id = resultPropietario.insertId;
                        console.log(`➕ Nuevo propietario creado: ${conductorNombre} (ID: ${propietario_id})`);
                    }
                }

                // === PASO 2: PROCESAR VEHÍCULO ===
                const patente = (fila['Dominio'] || '').toString().toUpperCase().trim();
                const tipoVehiculo = normalizarTipoVehiculo(fila['Tipo Vehiculo']);
                const marca = fila['Marca'] || '';
                const numeroMotor = fila['MOTOR'] || '';

                // Buscar si ya existe el vehículo
                let vehiculo_id = null;
                const [vehiculosExistentes] = await pool.execute(
                    'SELECT id FROM vehiculos WHERE patente = ?',
                    [patente]
                );

                if (vehiculosExistentes.length > 0) {
                    vehiculo_id = vehiculosExistentes[0].id;
                    console.log(`✅ Vehículo existente encontrado: ${patente} (ID: ${vehiculo_id})`);

                    // Actualizar propietario si se proporcionó
                    if (propietario_id) {
                        await pool.execute(
                            'UPDATE vehiculos SET propietario_id = ? WHERE id = ?',
                            [propietario_id, vehiculo_id]
                        );
                    }
                } else {
                    // Crear nuevo vehículo
                    const [resultVehiculo] = await pool.execute(
                        `INSERT INTO vehiculos 
                        (patente, tipo_vehiculo, marca, numero_motor, propietario_id, fecha_registro) 
                        VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                        [patente, tipoVehiculo, marca, numeroMotor, propietario_id]
                    );
                    vehiculo_id = resultVehiculo.insertId;
                    console.log(`➕ Nuevo vehículo creado: ${patente} (ID: ${vehiculo_id})`);
                }

                // === PASO 3: PROCESAR INFRACCIÓN ===
                const numeroActa = (fila['Acta'] || '').toString().trim();

                // Verificar si ya existe la infracción
                const [infraccionesExistentes] = await pool.execute(
                    'SELECT id FROM infracciones WHERE numero_acta = ?',
                    [numeroActa]
                );

                if (infraccionesExistentes.length > 0) {
                    resultados.omitidos++;
                    resultados.detalles.push({
                        fila: numeroFila,
                        estado: 'omitido',
                        motivo: `Infracción ${numeroActa} ya existe`
                    });
                    console.log(`⚠️ Infracción ${numeroActa} ya existe, omitiendo...`);
                    continue;
                }

                // Construir fecha y hora de infracción
                const fechaInfraccion = construirFechaInfraccion(fila['Fecha'], fila['Hora']);
                const inspector = fila['Inspector'] || '';
                const articulo = fila['Articulo'] || '';
                const ordenanza = fila['Ordenanza'] || '';
                const trasladoMovil = fila['Traslado movil'] || '';
                const observaciones = fila['Observaciones'] || '';

                // Crear la infracción
                const [resultInfraccion] = await pool.execute(
                    `INSERT INTO infracciones 
                    (numero_acta, vehiculo_id, conductor_nombre, motivo, usuario_id, 
                     fecha_infraccion, lugar_infraccion, estado, observaciones,
                     nombre_inspector, articulo, ordenanza, traslado_movil, fecha_registro) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'activa', ?, ?, ?, ?, ?, datetime('now'))`,
                    [
                        numeroActa,
                        vehiculo_id,
                        conductorNombre,
                        '', // motivo vacío por defecto
                        usuario_id,
                        fechaInfraccion,
                        conductorDomicilio, // usar domicilio como lugar
                        observaciones,
                        inspector,
                        articulo,
                        ordenanza,
                        trasladoMovil
                    ]
                );

                console.log(`✅ Infracción creada: ${numeroActa} (ID: ${resultInfraccion.insertId})`);

                resultados.exitosos++;
                resultados.detalles.push({
                    fila: numeroFila,
                    estado: 'exitoso',
                    acta: numeroActa,
                    patente: patente
                });

            } catch (error) {
                console.error(`❌ Error procesando fila ${numeroFila}:`, error);
                resultados.errores++;
                resultados.detalles.push({
                    fila: numeroFila,
                    estado: 'error',
                    motivo: error.message
                });
            }
        }

        console.log('\n📊 Resultado de importación:', resultados);

        res.json({
            success: true,
            message: 'Importación completada',
            data: resultados
        });

    } catch (error) {
        console.error('❌ Error en importación:', error);
        res.status(500).json({
            error: 'Error procesando el archivo',
            detalle: error.message
        });
    }
};

// Helper: Normalizar tipo de vehículo
function normalizarTipoVehiculo(tipo) {
    if (!tipo) return 'otro';

    const tipoLower = tipo.toString().toLowerCase().trim();

    if (tipoLower.includes('auto') || tipoLower.includes('automov')) return 'auto';
    if (tipoLower.includes('cami') || tipoLower.includes('truck')) return 'camion';
    if (tipoLower.includes('moto') || tipoLower.includes('motocicl')) return 'moto';
    if (tipoLower.includes('bici')) return 'bicicleta';

    return 'otro';
}

// Helper: Construir fecha de infracción desde fecha y hora
function construirFechaInfraccion(fecha, hora) {
    try {
        let fechaStr = '';

        // Si fecha es un número serial de Excel
        if (typeof fecha === 'number') {
            const fechaExcel = xlsx.SSF.parse_date_code(fecha);
            fechaStr = `${fechaExcel.y}-${String(fechaExcel.m).padStart(2, '0')}-${String(fechaExcel.d).padStart(2, '0')}`;
        } else if (fecha) {
            // Intentar parsear la fecha como string
            const d = new Date(fecha);
            if (!isNaN(d.getTime())) {
                fechaStr = d.toISOString().split('T')[0];
            }
        }

        // Si no hay fecha válida, usar fecha actual
        if (!fechaStr) {
            fechaStr = new Date().toISOString().split('T')[0];
        }

        // Procesar hora
        let horaStr = '00:00:00';
        if (hora) {
            if (typeof hora === 'number') {
                // Hora como fracción de día (formato Excel)
                const totalMinutos = Math.round(hora * 24 * 60);
                const horas = Math.floor(totalMinutos / 60);
                const minutos = totalMinutos % 60;
                horaStr = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
            } else if (typeof hora === 'string') {
                horaStr = hora.trim() + ':00';
            }
        }

        return `${fechaStr} ${horaStr}`;
    } catch (error) {
        console.error('Error construyendo fecha:', error);
        return new Date().toISOString().replace('T', ' ').split('.')[0];
    }
}

module.exports = {
    importIngresosCompletos
};
