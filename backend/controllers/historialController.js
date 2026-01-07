
const { pool } = require('../config/database');

// Obtener historial de un propietario
const getHistorialPropietario = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Obteniendo historial del propietario ID:', id);

        const [historial] = await pool.execute(`
            SELECT h.*, u.nombre_completo as usuario_nombre
            FROM historial_acciones h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.tipo_entidad = 'propietario' AND h.entidad_id = ?
            ORDER BY h.fecha_accion DESC
        `, [id]);

        console.log(`✅ Encontradas ${historial.length} acciones en el historial`);

        res.json({
            success: true,
            data: historial,
            total: historial.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo historial del propietario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener historial de un vehículo
const getHistorialVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Obteniendo historial del vehículo ID:', id);

        const [historial] = await pool.execute(`
            SELECT h.*, u.nombre_completo as usuario_nombre
            FROM historial_acciones h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.tipo_entidad = 'vehiculo' AND h.entidad_id = ?
            ORDER BY h.fecha_accion DESC
        `, [id]);

        console.log(`✅ Encontradas ${historial.length} acciones en el historial`);

        res.json({
            success: true,
            data: historial,
            total: historial.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo historial del vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener historial general del sistema
const getHistorialGeneral = async (req, res) => {
    try {
        const { tipo_entidad, accion, fecha_desde, fecha_hasta, limit } = req.query;

        console.log('🔍 Obteniendo historial general con filtros:', req.query);

        let query = `
            SELECT h.*, u.nombre_completo as usuario_nombre
            FROM historial_acciones h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (tipo_entidad) {
            query += ' AND h.tipo_entidad = ?';
            params.push(tipo_entidad);
        }

        if (accion) {
            query += ' AND h.accion = ?';
            params.push(accion);
        }

        if (fecha_desde) {
            query += ' AND DATE(h.fecha_accion) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(h.fecha_accion) <= ?';
            params.push(fecha_hasta);
        }

        query += ' ORDER BY h.fecha_accion DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        } else {
            query += ' LIMIT 100'; // Por defecto, últimas 100 acciones
        }

        const [historial] = await pool.execute(query, params);

        console.log(`✅ Encontradas ${historial.length} acciones en el historial`);

        res.json({
            success: true,
            data: historial,
            total: historial.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo historial general:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener acciones de un usuario específico
const getHistorialByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        console.log('🔍 Obteniendo historial del usuario ID:', usuario_id);

        const [historial] = await pool.execute(`
            SELECT h.*, u.nombre_completo as usuario_nombre
            FROM historial_acciones h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.usuario_id = ?
            ORDER BY h.fecha_accion DESC
            LIMIT 100
        `, [usuario_id]);

        console.log(`✅ Encontradas ${historial.length} acciones del usuario`);

        res.json({
            success: true,
            data: historial,
            total: historial.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo historial del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Función helper para registrar una acción en el historial
const registrarAccion = async (tipo_entidad, entidad_id, accion, datos_anteriores, datos_nuevos, usuario_id, usuario_nombre, ip_address = null) => {
    try {
        await pool.execute(
            `INSERT INTO historial_acciones 
            (tipo_entidad, entidad_id, accion, datos_anteriores, datos_nuevos, usuario_id, usuario_nombre, ip_address, fecha_accion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
                tipo_entidad,
                entidad_id,
                accion,
                datos_anteriores ? JSON.stringify(datos_anteriores) : null,
                datos_nuevos ? JSON.stringify(datos_nuevos) : null,
                usuario_id,
                usuario_nombre,
                ip_address
            ]
        );
        console.log(`✅ Acción registrada en historial: ${accion} en ${tipo_entidad} ID ${entidad_id}`);
    } catch (error) {
        console.error('❌ Error registrando acción en historial:', error);
        // No lanzar error para no interrumpir la operación principal
    }
};

module.exports = {
    getHistorialPropietario,
    getHistorialVehiculo,
    getHistorialGeneral,
    getHistorialByUsuario,
    registrarAccion
};
