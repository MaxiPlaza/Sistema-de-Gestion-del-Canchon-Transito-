const multer = require('multer');

// Configurar multer para almacenamiento en memoria
const storage = multer.memoryStorage();

// Función para validar tipo de archivo
const fileFilter = (req, file, cb) => {
    // Permitir solo archivos Excel
    const allowedMimeTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.oasis.opendocument.spreadsheet' // .ods (opcional)
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx)'), false);
    }
};

// Configurar multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10 MB
    }
});

module.exports = upload;
