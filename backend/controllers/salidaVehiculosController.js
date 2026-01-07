
const { pool } = require('../config/database');
const { registrarAccion } = require('./historialController');

// Obtener todas las salidas
const getAllSalidas = async (req, res) => {
    try {
        console.log('📋 Obteniendo todas las salidas');

        const [salidas] = await pool.execute(`
            SELECT s.*, 
                   v.patente, v.marca, v.modelo, v.color, v.tipo_vehiculo,
                   i.numero_acta, i.fecha_infraccion,
                   u.nombre_completo as usuario_autoriza_nombre
            FROM salidas_vehiculos s
            LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
            LEFT JOIN infracciones i ON s.infraccion_id = i.id
            LEFT JOIN usuarios u ON s.usuario_autoriza_id = u.id
            ORDER BY s.fecha_salida DESC
        `);

        console.log(`✅ Encontradas ${salidas.length} salidas`);

        res.json({
            success: true,
            data: salidas,
            total: salidas.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo salidas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener salida por ID
const getSalidaById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Obteniendo salida ID:', id);

        const [salidas] = await pool.execute(`
            SELECT s.*, 
                   v.patente, v.marca, v.modelo, v.color, v.tipo_vehiculo,
                   p.nombre as propietario_nombre, p.dni as propietario_dni,
                   i.numero_acta, i.fecha_infraccion, i.motivo,
                   u.nombre_completo as usuario_autoriza_nombre
            FROM salidas_vehiculos s
            LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            LEFT JOIN infracciones i ON s.infraccion_id = i.id
            LEFT JOIN usuarios u ON s.usuario_autoriza_id = u.id
            WHERE s.id = ?
        `, [id]);

        if (salidas.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }

        console.log('✅ Salida encontrada:', salidas[0].id);

        res.json({
            success: true,
            data: salidas[0]
        });
    } catch (error) {
        console.error('❌ Error obteniendo salida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear nueva salida
const createSalida = async (req, res) => {
    try {
        const {
            vehiculo_id,
            infraccion_id,
            persona_retira_nombre,
            persona_retira_dni,
            persona_retira_telefono,
            vehiculo_patente,
            fecha_salida,
            observaciones
        } = req.body;

        console.log('📝 Creando salida con datos:', req.body);

        // Validaciones básicas
        if (!vehiculo_id || !persona_retira_nombre || !persona_retira_dni || !vehiculo_patente) {
            return res.status(400).json({
                error: 'Vehículo, patente, nombre y DNI de quien retira son requeridos'
            });
        }

        // Verificar que el vehículo existe
        const [vehiculos] = await pool.execute(
            'SELECT id, patente FROM vehiculos WHERE id = ?',
            [vehiculo_id]
        );

        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        const usuario_autoriza_id = req.user.id;
        const fechaSalidaFinal = fecha_salida || new Date().toISOString();

        // Insertar salida
        const [result] = await pool.execute(
            `INSERT INTO salidas_vehiculos 
            (vehiculo_id, infraccion_id, persona_retira_nombre, persona_retira_dni, 
             persona_retira_telefono, vehiculo_patente, fecha_salida, observaciones, 
             usuario_autoriza_id, fecha_registro) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
                vehiculo_id, infraccion_id, persona_retira_nombre, persona_retira_dni,
                persona_retira_telefono, vehiculo_patente, fechaSalidaFinal, observaciones,
                usuario_autoriza_id
            ]
        );

        console.log('✅ Salida creada ID:', result.insertId);

        // Si hay infracción asociada, cambiar su estado a 'resuelta'
        if (infraccion_id) {
            await pool.execute(
                `UPDATE infracciones SET estado = 'resuelta' WHERE id = ?`,
                [infraccion_id]
            );
            console.log('✅ Infracción marcada como resuelta');
        }

        // Obtener la salida recién creada
        const [nuevaSalida] = await pool.execute(`
            SELECT s.*, 
                   v.patente, v.marca, v.modelo,
                   u.nombre_completo as usuario_autoriza_nombre
            FROM salidas_vehiculos s
            LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
            LEFT JOIN usuarios u ON s.usuario_autoriza_id = u.id
            WHERE s.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Salida de vehículo registrada exitosamente',
            data: nuevaSalida[0]
        });

        // Registrar acción en historial
        await registrarAccion(
            'salida',
            result.insertId,
            'crear',
            null,
            nuevaSalida[0],
            req.user.id,
            req.user.nombre_completo || req.user.username
        );

    } catch (error) {
        console.error('💥 Error creando salida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar salida
const updateSalida = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            persona_retira_nombre,
            persona_retira_dni,
            persona_retira_telefono,
            fecha_salida,
            observaciones
        } = req.body;

        console.log('✏️ Actualizando salida ID:', id);

        // Verificar que la salida existe
        const [salidas] = await pool.execute(
            'SELECT id FROM salidas_vehiculos WHERE id = ?',
            [id]
        );

        if (salidas.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }

        // Obtener datos actuales para el historial
        const [salidaActual] = await pool.execute('SELECT * FROM salidas_vehiculos WHERE id = ?', [id]);

        // Actualizar salida
        await pool.execute(
            `UPDATE salidas_vehiculos 
            SET persona_retira_nombre = ?, persona_retira_dni = ?, 
                persona_retira_telefono = ?, fecha_salida = ?, observaciones = ?
            WHERE id = ?`,
            [persona_retira_nombre, persona_retira_dni, persona_retira_telefono,
                fecha_salida, observaciones, id]
        );

        console.log('✅ Salida actualizada');

        // Obtener datos actualizados para el historial
        const [salidaActualizada] = await pool.execute('SELECT * FROM salidas_vehiculos WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Salida de vehículo actualizada exitosamente',
            data: salidaActualizada[0]
        });

        // Registrar acción en historial
        await registrarAccion(
            'salida',
            id,
            'modificar',
            salidaActual[0],
            salidaActualizada[0],
            req.user.id,
            req.user.nombre_completo || req.user.username
        );

    } catch (error) {
        console.error('💥 Error actualizando salida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Buscar salidas
const searchSalidas = async (req, res) => {
    try {
        const { patente, dni, fecha_desde, fecha_hasta } = req.query;

        console.log('🔍 Búsqueda de salidas con filtros:', req.query);

        let query = `
            SELECT s.*, 
                   v.patente, v.marca, v.modelo,
                   i.numero_acta,
                   u.nombre_completo as usuario_autoriza_nombre
            FROM salidas_vehiculos s
            LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
            LEFT JOIN infracciones i ON s.infraccion_id = i.id
            LEFT JOIN usuarios u ON s.usuario_autoriza_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (patente) {
            query += ' AND v.patente LIKE ?';
            params.push(`%${patente}%`);
        }

        if (dni) {
            query += ' AND s.persona_retira_dni LIKE ?';
            params.push(`%${dni}%`);
        }

        if (fecha_desde) {
            query += ' AND DATE(s.fecha_salida) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(s.fecha_salida) <= ?';
            params.push(fecha_hasta);
        }

        query += ' ORDER BY s.fecha_salida DESC';

        const [salidas] = await pool.execute(query, params);

        console.log(`✅ Búsqueda completada: ${salidas.length} salidas encontradas`);

        res.json({
            success: true,
            data: salidas,
            total: salidas.length
        });
    } catch (error) {
        console.error('❌ Error buscando salidas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener salidas de un vehículo específico
const getSalidasByVehiculo = async (req, res) => {
    try {
        const { vehiculo_id } = req.params;
        console.log('🔍 Obteniendo salidas del vehículo ID:', vehiculo_id);

        const [salidas] = await pool.execute(`
            SELECT s.*, 
                   i.numero_acta, i.fecha_infraccion,
                   u.nombre_completo as usuario_autoriza_nombre
            FROM salidas_vehiculos s
            LEFT JOIN infracciones i ON s.infraccion_id = i.id
            LEFT JOIN usuarios u ON s.usuario_autoriza_id = u.id
            WHERE s.vehiculo_id = ?
            ORDER BY s.fecha_salida DESC
        `, [vehiculo_id]);

        console.log(`✅ Encontradas ${salidas.length} salidas para este vehículo`);

        res.json({
            success: true,
            data: salidas,
            total: salidas.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo salidas del vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


const deleteSalida = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Eliminando salida ID:', id);

        const [salidas] = await pool.execute(
            'SELECT * FROM salidas_vehiculos WHERE id = ?', // Fetch full salida data
            [id]
        );

        if (salidas.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }

        const salida = salidas[0]; // Store the salida data before deletion

        await pool.execute('DELETE FROM salidas_vehiculos WHERE id = ?', [id]);

        console.log('✅ Salida eliminada');

        res.json({
            success: true,
            message: 'Salida de vehículo eliminada exitosamente'
        });

        // Registrar acción en historial
        await registrarAccion(
            'salida',
            id,
            'eliminar',
            salida,
            null,
            req.user.id,
            req.user.nombre_completo || req.user.username
        );
    } catch (error) {
        console.error('💥 Error eliminando salida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getAllSalidas,
    getSalidaById,
    createSalida,
    updateSalida,
    searchSalidas,
    getSalidasByVehiculo,
    deleteSalida
};
