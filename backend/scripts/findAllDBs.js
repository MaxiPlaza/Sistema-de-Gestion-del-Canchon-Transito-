const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const possiblePaths = [
    path.resolve(__dirname, '../../transit_system.sqlite'),
    path.resolve(__dirname, '../transit_system.sqlite'),
    path.resolve(__dirname, 'transit_system.sqlite'),
    path.resolve(process.cwd(), 'transit_system.sqlite')
];

// Add unique paths
const uniquePaths = [...new Set(possiblePaths)];

uniquePaths.forEach(dbPath => {
    if (fs.existsSync(dbPath)) {
        console.log(`\n🔍 Checking database at: ${dbPath}`);
        const db = new sqlite3.Database(dbPath);

        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='infracciones'", (err, rows) => {
            if (err) {
                console.error(`❌ Error checking table in ${dbPath}:`, err.message);
            } else if (rows.length > 0) {
                console.log(`✅ Table 'infracciones' exists in ${dbPath}`);
                db.all("PRAGMA table_info(infracciones)", (err, columns) => {
                    if (err) {
                        console.error(`❌ Error checking columns in ${dbPath}:`, err.message);
                    } else {
                        const colNames = columns.map(c => c.name);
                        console.log(`📊 Columns: ${colNames.join(', ')}`);
                        if (colNames.includes('nombre_inspector')) {
                            console.log('✅ HAS nombre_inspector');
                        } else {
                            console.log('❌ MISSING nombre_inspector');
                        }
                    }
                    db.close();
                });
            } else {
                console.log(`❌ Table 'infracciones' NOT found in ${dbPath}`);
                db.close();
            }
        });
    } else {
        console.log(`\n🚫 File NOT found at: ${dbPath}`);
    }
});
