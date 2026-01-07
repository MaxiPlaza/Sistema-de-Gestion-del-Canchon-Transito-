const express = require('express');
const {
    getHistorialPropietario,
    getHistorialVehiculo,
    getHistorialGeneral,
    getHistorialByUsuario
} = require('../controllers/historialController');
const { authenticateToken, requireUsuario, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/historial/general - Historial completo del sistema
router.get('/general', requireAdmin, getHistorialGeneral);

// GET /api/historial/propietario/:id - Historial de un propietario
router.get('/propietario/:id', requireUsuario, getHistorialPropietario);

// GET /api/historial/vehiculo/:id - Historial de un vehículo
router.get('/vehiculo/:id', requireUsuario, getHistorialVehiculo);

// GET /api/historial/usuario/:usuario_id - Acciones de un usuario
router.get('/usuario/:usuario_id', requireAdmin, getHistorialByUsuario);

module.exports = router;
