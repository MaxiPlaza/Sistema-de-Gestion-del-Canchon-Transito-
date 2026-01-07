const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Obtener todos los usuarios
const getAllUsuarios = async (req, res) => {
    try {
        console.log('👥 Obteniendo todos los usuarios');
        
        const [usuarios] = await pool.execute(`
            SELECT id, username, rol, nombre_completo, email, activo, 
                   fecha_creacion, ultimo_login
            FROM usuarios 
            ORDER BY fecha_creacion DESC
        `);

        res.json({
            success: true,
            data: usuarios,
            total: usuarios.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [usuarios] = await pool.execute(`
            SELECT id, username, rol, nombre_completo, email, activo,
                   fecha_creacion, ultimo_login
            FROM usuarios 
            WHERE id = ?
        `, [id]);

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            data: usuarios[0]
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear nuevo usuario
const createUsuario = async (req, res) => {
    try {
        const {
            username,
            password,
            rol,
            nombre_completo,
            email
        } = req.body;

        console.log('📝 Creando usuario:', username);

        // Validaciones
        if (!username || !password || !rol || !nombre_completo) {
            return res.status(400).json({ 
                error: 'Username, password, rol y nombre completo son requeridos' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        // Verificar si el usuario ya existe
        const [usuariosExistentes] = await pool.execute(
            'SELECT id FROM usuarios WHERE username = ?',
            [username]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ error: 'El username ya existe' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [result] = await pool.execute(
            `INSERT INTO usuarios (username, password, rol, nombre_completo, email, activo)
            VALUES (?, ?, ?, ?, ?, TRUE)`,
            [username, hashedPassword, rol, nombre_completo, email]
        );

        // Obtener el usuario recién creado (sin password)
        const [nuevoUsuario] = await pool.execute(`
            SELECT id, username, rol, nombre_completo, email, activo, fecha_creacion
            FROM usuarios WHERE id = ?
        `, [result.insertId]);

        console.log('✅ Usuario creado ID:', result.insertId);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: nuevoUsuario[0]
        });

    } catch (error) {
        console.error('💥 Error creando usuario:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El username ya existe' });
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username,
            rol,
            nombre_completo,
            email,
            activo
        } = req.body;

        console.log('✏️ Actualizando usuario ID:', id);

        // Verificar que el usuario existe
        const [usuarios] = await pool.execute(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar si el nuevo username ya existe (excluyendo el usuario actual)
        const [usuariosConUsername] = await pool.execute(
            'SELECT id FROM usuarios WHERE username = ? AND id != ?',
            [username, id]
        );

        if (usuariosConUsername.length > 0) {
            return res.status(400).json({ error: 'El username ya está en uso' });
        }

        // Actualizar usuario
        await pool.execute(
            `UPDATE usuarios 
            SET username = ?, rol = ?, nombre_completo = ?, email = ?, activo = ?
            WHERE id = ?`,
            [username, rol, nombre_completo, email, activo, id]
        );

        console.log('✅ Usuario actualizado ID:', id);

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('💥 Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar usuario
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Eliminando usuario ID:', id);

        // Verificar que el usuario existe
        const [usuarios] = await pool.execute(
            'SELECT id, username FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        // No permitir eliminar el propio usuario
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }

        // No permitir eliminar si es el único administrador activo
        if (usuario.rol === 'admin') {
            const [adminsActivos] = await pool.execute(
                'SELECT COUNT(*) as total FROM usuarios WHERE rol = "admin" AND activo = TRUE AND id != ?',
                [id]
            );
            
            if (adminsActivos[0].total === 0) {
                return res.status(400).json({ 
                    error: 'No se puede eliminar el último administrador activo' 
                });
            }
        }

        // Eliminar usuario
        await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);

        console.log('✅ Usuario eliminado:', usuario.username);

        res.json({
            success: true,
            message: `Usuario ${usuario.username} eliminado exitosamente`
        });

    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Cambiar contraseña de usuario
const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_password } = req.body;

        console.log('🔐 Cambiando contraseña usuario ID:', id);

        if (!nueva_password) {
            return res.status(400).json({ error: 'La nueva contraseña es requerida' });
        }

        if (nueva_password.length < 6) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        // Verificar que el usuario existe
        const [usuarios] = await pool.execute(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva_password, 10);

        // Actualizar contraseña
        await pool.execute(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );

        console.log('✅ Contraseña actualizada usuario ID:', id);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener estadísticas de administración
const getAdminStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de administración');

        // Estadísticas de usuarios
        const [estadisticasUsuarios] = await pool.execute(`
            SELECT 
                COUNT(*) as total_usuarios,
                SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as usuarios_activos,
                SUM(CASE WHEN activo = FALSE THEN 1 ELSE 0 END) as usuarios_inactivos,
                SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as total_admins,
                SUM(CASE WHEN rol = 'usuario' THEN 1 ELSE 0 END) as total_usuarios_rol,
                SUM(CASE WHEN rol = 'invitado' THEN 1 ELSE 0 END) as total_invitados
            FROM usuarios
        `);

        // Actividad reciente de usuarios
        const [actividadReciente] = await pool.execute(`
            SELECT id, username, ultimo_login, rol
            FROM usuarios 
            WHERE ultimo_login IS NOT NULL
            ORDER BY ultimo_login DESC
            LIMIT 10
        `);

        // Usuarios más activos (por infracciones registradas)
        const [usuariosActivos] = await pool.execute(`
            SELECT 
                u.id,
                u.username,
                u.nombre_completo,
                u.rol,
                COUNT(i.id) as infracciones_registradas
            FROM usuarios u
            LEFT JOIN infracciones i ON u.id = i.usuario_id
            WHERE u.activo = TRUE
            GROUP BY u.id
            ORDER BY infracciones_registradas DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                usuarios: estadisticasUsuarios[0],
                actividad_reciente: actividadReciente,
                usuarios_activos: usuariosActivos
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas de admin:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    changePassword,
    getAdminStats
};