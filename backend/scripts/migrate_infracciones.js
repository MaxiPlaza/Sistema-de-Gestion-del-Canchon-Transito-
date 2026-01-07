const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../transit_system.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
        return;
    }
    console.log('Connected to SQLite database at ' + dbPath);

    const columnsToAdd = [
        'nombre_inspector TEXT',
        'articulo TEXT',
        'ordenanza TEXT',
        'traslado_movil TEXT'
    ];

    db.serialize(() => {
        columnsToAdd.forEach(columnDef => {
            const columnName = columnDef.split(' ')[0];
            db.run(`ALTER TABLE infracciones ADD COLUMN ${columnDef}`, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column name')) {
                        console.log(`Column ${columnName} already exists.`);
                    } else {
                        console.error(`Error adding column ${columnName}:`, err.message);
                    }
                } else {
                    console.log(`Column ${columnName} added successfully.`);
                }
            });
        });

        console.log('Migration finished.');
    });
});
