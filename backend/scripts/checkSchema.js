const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../transit_system.sqlite');
const db = new sqlite3.Database(dbPath);

db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='infracciones'", (err, row) => {
    if (err) {
        console.error('❌ Error checking schema:', err);
    } else if (row) {
        console.log('✅ Infracciones table schema:');
        console.log(row.sql);
    } else {
        console.log('❌ Table infracciones not found');
    }
    db.close();
});
