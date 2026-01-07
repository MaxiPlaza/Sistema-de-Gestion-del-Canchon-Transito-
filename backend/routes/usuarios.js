const express = require('express');
const {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    changePassword,
    getAdminStats
} = require('../controllers/usuariosController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken, requireAdmin);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', getAllUsuarios);

// GET /api/usuarios/stats - Estadísticas de administración
router.get('/stats', getAdminStats);

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', getUsuarioById);

// POST /api/usuarios - Crear nuevo usuario
router.post('/', createUsuario);

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', updateUsuario);

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', deleteUsuario);

// POST /api/usuarios/:id/password - Cambiar contraseña
router.post('/:id/password', changePassword);

module.exports = router;