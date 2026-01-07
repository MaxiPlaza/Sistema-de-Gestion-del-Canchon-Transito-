const express = require('express');
const { importIngresosCompletos } = require('../controllers/importController');
const { authenticateToken, requireUsuario } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/import/ingresos-completos - Importar Excel combinado (propietarios + vehículos + infracciones)
router.post('/ingresos-completos', requireUsuario, upload.single('file'), importIngresosCompletos);

module.exports = router;
