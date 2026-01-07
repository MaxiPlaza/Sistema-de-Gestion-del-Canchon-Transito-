const express = require('express');
const {
    getAllSalidas,
    getSalidaById,
    createSalida,
    updateSalida,
    searchSalidas,
    getSalidasByVehiculo,
    deleteSalida
} = require('../controllers/salidaVehiculosController');
const { authenticateToken, requireUsuario, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/salidas - Obtener todas las salidas
router.get('/', requireUsuario, getAllSalidas);

// GET /api/salidas/search - Buscar salidas por criterios
router.get('/search', requireUsuario, searchSalidas);

// GET /api/salidas/vehiculo/:vehiculo_id - Obtener salidas de un vehículo
router.get('/vehiculo/:vehiculo_id', requireUsuario, getSalidasByVehiculo);

// GET /api/salidas/:id - Obtener salida por ID
router.get('/:id', requireUsuario, getSalidaById);

// POST /api/salidas - Crear nueva salida
router.post('/', requireUsuario, createSalida);

// PUT /api/salidas/:id - Actualizar salida
router.put('/:id', requireAdmin, updateSalida);

// DELETE /api/salidas/:id - Eliminar salida
router.delete('/:id', requireAdmin, deleteSalida);

module.exports = router;
