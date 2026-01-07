const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../transit_system.sqlite');

function initDB() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database at ' + dbPath);
        });

        const schema = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            rol TEXT CHECK(rol IN ('admin', 'usuario', 'invitado')) NOT NULL DEFAULT 'usuario',
            nombre_completo TEXT NOT NULL,
            email TEXT,
            activo INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            ultimo_login DATETIME
        );

        CREATE TABLE IF NOT EXISTS propietarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dni TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            carnet_conducir TEXT,
            direccion TEXT,
            telefono TEXT,
            email TEXT,
            fecha_nacimiento DATE,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vehiculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patente TEXT NOT NULL UNIQUE,
            tipo_vehiculo TEXT CHECK(tipo_vehiculo IN ('auto', 'camion', 'moto', 'bicicleta', 'otro')) NOT NULL,
            marca TEXT,
            modelo TEXT,
            color TEXT,
            numero_motor TEXT,
            numero_chasis TEXT,
            propietario_id INTEGER,
            cedula_verde TEXT,
            titulo_registro TEXT,
            seguro_activo INTEGER DEFAULT 0,
            compañia_seguro TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(propietario_id) REFERENCES propietarios(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS infracciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_acta TEXT NOT NULL UNIQUE,
            vehiculo_id INTEGER NOT NULL,
            conductor_dni TEXT,
            conductor_nombre TEXT,
            motivo TEXT NOT NULL,
            usuario_id INTEGER NOT NULL,
            fecha_infraccion DATETIME NOT NULL,
            lugar_infraccion TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            estado TEXT CHECK(estado IN ('activa', 'resuelta', 'anulada')) DEFAULT 'activa',
            observaciones TEXT,
            nombre_inspector TEXT,
            articulo TEXT,
            ordenanza TEXT,
            traslado_movil TEXT,
            FOREIGN KEY(vehiculo_id) REFERENCES vehiculos(id),
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS inventario_partes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            infraccion_id INTEGER NOT NULL,
            parte_vehiculo TEXT NOT NULL,
            estado TEXT CHECK(estado IN ('bueno', 'danado', 'ausente', 'irregular')) DEFAULT 'bueno',
            descripcion TEXT,
            FOREIGN KEY(infraccion_id) REFERENCES infracciones(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS salidas_vehiculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehiculo_id INTEGER NOT NULL,
            infraccion_id INTEGER,
            persona_retira_nombre TEXT NOT NULL,
            persona_retira_dni TEXT NOT NULL,
            persona_retira_telefono TEXT,
            vehiculo_patente TEXT NOT NULL,
            fecha_salida DATETIME DEFAULT CURRENT_TIMESTAMP,
            observaciones TEXT,
            usuario_autoriza_id INTEGER NOT NULL,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(vehiculo_id) REFERENCES vehiculos(id),
            FOREIGN KEY(infraccion_id) REFERENCES infracciones(id),
            FOREIGN KEY(usuario_autoriza_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS historial_acciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_entidad TEXT CHECK(tipo_entidad IN ('propietario', 'vehiculo', 'infraccion', 'salida', 'usuario')) NOT NULL,
            entidad_id INTEGER NOT NULL,
            accion TEXT CHECK(accion IN ('crear', 'modificar', 'eliminar')) NOT NULL,
            datos_anteriores TEXT,
            datos_nuevos TEXT,
            usuario_id INTEGER NOT NULL,
            usuario_nombre TEXT,
            fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        );
        `;

        db.exec(schema, (err) => {
            if (err) {
                console.error('Error executing schema', err);
                reject(err);
            } else {
                console.log('Schema created successfully');
                
                // Insert default admin if not exists
                const checkAdmin = "SELECT id FROM usuarios WHERE username = 'admin'";
                db.get(checkAdmin, (err, row) => {
                    if (!row) {
                        const insertAdmin = `
                            INSERT INTO usuarios (username, password, rol, nombre_completo, email, activo)
                            VALUES ('admin', '$2a$10$0KVOjlaeOhsp8Uoryv/3reArzls636S..BLCPIpB9KDxA65F84JBW', 'admin', 'Administrador Principal', 'admin@transito.gov', 1)
                        `;
                        db.run(insertAdmin, (err) => {
                            if (err) console.error('Error inserting default admin', err);
                            else console.log('Default admin inserted');
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

if (require.main === module) {
    initDB().catch(console.error);
}

module.exports = initDB;
