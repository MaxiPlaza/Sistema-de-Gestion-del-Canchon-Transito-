const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../transit_system.sqlite');

// Initialize DB connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error initializing SQLite database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// Wrapper to mimic mysql2/promise pool interface
const pool = {
    query: (sql, params) => {
        return new Promise((resolve, reject) => {
            // Convert MySQL ? placeholders to SQLite ? placeholders (they are the same, but behavior might differ slightly)
            // SQLite driver handles ? fine.

            // However, mysql2 returns [rows, fields]. We need to mimic that structure.

            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('Error in query:', sql, err);
                        reject(err);
                    } else {
                        resolve([rows, []]); // mimic [rows, fields]
                    }
                });
            } else {
                // For INSERT, UPDATE, DELETE
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error('Error in query:', sql, err);
                        reject(err);
                    } else {
                        // this.lastID, this.changes
                        resolve([{
                            insertId: this.lastID,
                            affectedRows: this.changes
                        }, []]);
                    }
                });
            }
        });
    },
    getConnection: async () => {
        // Return a mock connection object that releases immediately
        return {
            release: () => { },
            beginTransaction: () => new Promise((resolve) => {
                db.run('BEGIN TRANSACTION', resolve);
            }),
            commit: () => new Promise((resolve) => {
                db.run('COMMIT', resolve);
            }),
            rollback: () => new Promise((resolve) => {
                db.run('ROLLBACK', resolve);
            }),
            query: (sql, params) => pool.query(sql, params),
            execute: (sql, params) => pool.query(sql, params) // alias execute to query
        };
    },
    execute: (sql, params) => pool.query(sql, params) // Add execute method directly to pool
};

// Test connection function
const testConnection = async () => {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = { pool, testConnection };