
const { pool } = require('../config/database');
const { registrarAccion } = require('./historialController');

// Obtener todas las infracciones
const getAllInfracciones = async (req, res) => {
    try {
        console.log('📋 Obteniendo todas las infracciones');
        const [infracciones] = await pool.execute(`
            SELECT i.*, 
                   v.patente, v.marca, v.modelo, v.color, v.tipo_vehiculo,
                   p.nombre as propietario_nombre,
                   u.nombre_completo as usuario_nombre
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN propietarios p ON i.conductor_dni = p.dni
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            ORDER BY i.fecha_infraccion DESC
        `);

        console.log(`✅ Encontradas ${infracciones.length} infracciones`);

        // DEBUG: Mostrar estados de las infracciones
        infracciones.forEach(inf => {
            console.log(`🔍 Infracción ${inf.numero_acta}: estado = ${inf.estado}`);
        });

        res.json({
            success: true,
            data: infracciones,
            total: infracciones.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo infracciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener infracción por ID
const getInfraccionById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Obteniendo infracción ID:', id);

        const [infracciones] = await pool.execute(`
            SELECT i.*, 
                   v.patente, v.marca, v.modelo, v.color, v.tipo_vehiculo,
                   p.nombre as propietario_nombre, p.telefono as propietario_telefono,
                   u.nombre_completo as usuario_nombre
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN propietarios p ON i.conductor_dni = p.dni
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            WHERE i.id = ?
        `, [id]);

        if (infracciones.length === 0) {
            console.log('❌ Infracción no encontrada ID:', id);
            return res.status(404).json({ error: 'Infracción no encontrada' });
        }

        const infraccion = infracciones[0];
        console.log('✅ Infracción encontrada:', infraccion.numero_acta);

        res.json({
            success: true,
            data: infraccion
        });
    } catch (error) {
        console.error('❌ Error obteniendo infracción:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear nueva infracción
const createInfraccion = async (req, res) => {
    try {
        const {
            numero_acta,
            vehiculo_id,
            conductor_dni,
            conductor_nombre,
            motivo,
            fecha_infraccion,
            lugar_infraccion,
            estado,
            observaciones,
            nombre_inspector,
            articulo,
            ordenanza,
            traslado_movil
        } = req.body;

        console.log('📝 Creando infracción con datos:', req.body);

        // Validaciones básicas
        if (!numero_acta || !vehiculo_id || !motivo) {
            return res.status(400).json({
                error: 'Número de acta, vehículo y motivo son requeridos'
            });
        }

        // Obtener el usuario autenticado
        const usuario_id = req.user.id;

        // Insertar infracción - estado por defecto 'activa'
        const [result] = await pool.execute(
            `INSERT INTO infracciones 
            (numero_acta, vehiculo_id, conductor_dni, conductor_nombre, motivo, 
             usuario_id, fecha_infraccion, lugar_infraccion, estado, observaciones,
             nombre_inspector, articulo, ordenanza, traslado_movil) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                numero_acta, vehiculo_id, conductor_dni, conductor_nombre, motivo,
                usuario_id, fecha_infraccion, lugar_infraccion, estado || 'activa', observaciones,
                nombre_inspector, articulo, ordenanza, traslado_movil
            ]
        );

        console.log('✅ Infracción creada ID:', result.insertId);

        // Obtener la infracción recién creada
        const [nuevaInfraccion] = await pool.execute(`
            SELECT i.*, 
                   v.patente, v.marca, v.modelo, v.color,
                   p.nombre as propietario_nombre,
                   u.nombre_completo as usuario_nombre
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN propietarios p ON i.conductor_dni = p.dni
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            WHERE i.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Infracción creada exitosamente',
            data: nuevaInfraccion[0]
        });

        // Registrar acción en historial
        await registrarAccion(
            'infraccion',
            result.insertId,
            'crear',
            null,
            nuevaInfraccion[0],
            req.user.id,
            req.user.nombre_completo || req.user.username
        );

    } catch (error) {
        console.error('💥 Error creando infracción:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El número de acta ya existe' });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar infracción
const updateInfraccion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numero_acta,
            vehiculo_id,
            conductor_dni,
            conductor_nombre,
            motivo,
            fecha_infraccion,
            lugar_infraccion,
            estado,
            observaciones,
            nombre_inspector,
            articulo,
            ordenanza,
            traslado_movil
        } = req.body;

        console.log('✏️ Actualizando infracción ID:', id, 'Datos:', req.body);

        // Verificar que la infracción existe
        const [infracciones] = await pool.execute(
            'SELECT id, numero_acta FROM infracciones WHERE id = ?',
            [id]
        );

        if (infracciones.length === 0) {
            return res.status(404).json({ error: 'Infracción no encontrada' });
        }

        const infraccionActual = infracciones[0];

        // Actualizar infracción
        await pool.execute(
            `UPDATE infracciones 
            SET numero_acta = ?, vehiculo_id = ?, conductor_dni = ?, conductor_nombre = ?,
                motivo = ?, fecha_infraccion = ?, lugar_infraccion = ?, estado = ?, observaciones = ?,
                nombre_inspector = ?, articulo = ?, ordenanza = ?, traslado_movil = ?
            WHERE id = ?`,
            [
                numero_acta, vehiculo_id, conductor_dni, conductor_nombre,
                motivo, fecha_infraccion, lugar_infraccion, estado, observaciones,
                nombre_inspector, articulo, ordenanza, traslado_movil, id
            ]
        );

        console.log('✅ Infracción actualizada:', infraccionActual.numero_acta);

        res.json({
            success: true,
            message: `Infracción ${infraccionActual.numero_acta} actualizada exitosamente`
        });

        // Obtener datos actualizados para el historial
        const [datosNuevos] = await pool.execute('SELECT * FROM infracciones WHERE id = ?', [id]);

        // Registrar acción en historial
        await registrarAccion(
            'infraccion',
            id,
            'modificar',
            infraccionActual,
            datosNuevos[0],
            req.user.id,
            req.user.nombre_completo || req.user.username
        );

    } catch (error) {
        console.error('💥 Error actualizando infracción:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar infracción
const deleteInfraccion = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Eliminando infracción ID:', id);

        // Verificar si la infracción existe
        const [infracciones] = await pool.execute(
            'SELECT id, numero_acta FROM infracciones WHERE id = ?',
            [id]
        );

        if (infracciones.length === 0) {
            return res.status(404).json({ error: 'Infracción no encontrada' });
        }

        const infraccion = infracciones[0];

        // Eliminar la infracción
        await pool.execute('DELETE FROM infracciones WHERE id = ?', [id]);

        console.log('✅ Infracción eliminada:', infraccion.numero_acta);

        res.json({
            success: true,
            message: `Infracción ${infraccion.numero_acta} eliminada exitosamente`
        });

        // Registrar acción en historial
        await registrarAccion(
            'infraccion',
            id,
            'eliminar',
            infraccion,
            null,
            req.user.id,
            req.user.nombre_completo || req.user.username
        );

    } catch (error) {
        console.error('❌ Error eliminando infracción:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Buscar infracciones por múltiples criterios
const searchInfracciones = async (req, res) => {
    try {
        const { numero_acta, patente, conductor_dni, estado, fecha_desde, fecha_hasta } = req.query;

        console.log('🔍 Búsqueda de infracciones con filtros:', req.query);

        let query = `
            SELECT i.*, 
                   v.patente, v.marca, v.modelo, v.color,
                   p.nombre as propietario_nombre,
                   u.nombre_completo as usuario_nombre
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN propietarios p ON i.conductor_dni = p.dni
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (numero_acta) {
            query += ' AND i.numero_acta LIKE ?';
            params.push(`%${numero_acta}%`);
        }

        if (patente) {
            query += ' AND v.patente LIKE ?';
            params.push(`%${patente}%`);
        }

        if (conductor_dni) {
            query += ' AND i.conductor_dni LIKE ?';
            params.push(`%${conductor_dni}%`);
        }

        if (estado) {
            query += ' AND i.estado = ?';
            params.push(estado);
            console.log(`🔍 Filtro estado aplicado: ${estado}`);
        }

        if (fecha_desde) {
            query += ' AND DATE(i.fecha_infraccion) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(i.fecha_infraccion) <= ?';
            params.push(fecha_hasta);
        }

        query += ' ORDER BY i.fecha_infraccion DESC';

        console.log('📝 Query ejecutado:', query);
        console.log('🔧 Parámetros:', params);

        const [infracciones] = await pool.execute(query, params);

        console.log(`✅ Búsqueda completada: ${infracciones.length} infracciones encontradas`);

        // DEBUG: Mostrar estados de los resultados
        infracciones.forEach(inf => {
            console.log(`🔍 Resultado ${inf.numero_acta}: estado = ${inf.estado}`);
        });

        res.json({
            success: true,
            data: infracciones,
            total: infracciones.length
        });
    } catch (error) {
        console.error('❌ Error buscando infracciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


// Obtener estadísticas de infracciones
const getEstadisticasInfracciones = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de infracciones');

        const [estadisticas] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
                SUM(CASE WHEN estado = 'resuelta' THEN 1 ELSE 0 END) as resueltas,
                SUM(CASE WHEN estado = 'anulada' THEN 1 ELSE 0 END) as anuladas
            FROM infracciones
        `);

        console.log('📈 Estadísticas obtenidas:', estadisticas[0]);

        // Estadísticas por mes
        const [estadisticasMensuales] = await pool.execute(`
            SELECT 
                DATE_FORMAT(fecha_infraccion, '%Y-%m') as mes,
                COUNT(*) as cantidad
            FROM infracciones 
            WHERE fecha_infraccion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_infraccion, '%Y-%m')
            ORDER BY mes DESC
        `);

        // Top motivos de infracción
        const [topMotivos] = await pool.execute(`
            SELECT motivo, COUNT(*) as cantidad
            FROM infracciones
            GROUP BY motivo
            ORDER BY cantidad DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                resumen: estadisticas[0] || { total: 0, activas: 0, resueltas: 0, anuladas: 0 },
                mensual: estadisticasMensuales,
                topMotivos: topMotivos
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getAllInfracciones,
    getInfraccionById,
    createInfraccion,
    updateInfraccion,
    deleteInfraccion,
    searchInfracciones,
    getEstadisticasInfracciones
};