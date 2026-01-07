const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../transit_system.sqlite');
console.log('Checking database at:', dbPath);
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error('❌ Error listing tables:', err);
    } else {
        console.log('✅ Tables found:', rows.map(r => r.name).join(', '));

        // If infracciones exists, check its columns
        if (rows.some(r => r.name === 'infracciones')) {
            db.all("PRAGMA table_info(infracciones)", (err, columns) => {
                if (err) {
                    console.error('❌ Error checking columns:', err);
                } else {
                    console.log('✅ Columns in infracciones:');
                    columns.forEach(c => console.log(`- ${c.name} (${c.type})`));
                }
                db.close();
            });
        } else {
            db.close();
        }
    }
});
