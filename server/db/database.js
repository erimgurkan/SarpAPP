/* ═══════════════════════════════════════════════════════════
   PostCraft — Database (SQLite via sql.js)
   Pure JavaScript SQLite — no C++ build tools needed
   Users, Brand Profiles, Generated Content
   ═══════════════════════════════════════════════════════════ */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const bcrypt = require('bcryptjs');

// Ensure db directory exists
const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

/**
 * Initialize or load database
 */
async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new
    if (fs.existsSync(config.db.path)) {
        const buffer = fs.readFileSync(config.db.path);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            email           TEXT    UNIQUE NOT NULL,
            password_hash   TEXT    NOT NULL,
            name            TEXT    NOT NULL,
            plan            TEXT    DEFAULT 'free',
            monthly_usage   INTEGER DEFAULT 0,
            usage_reset_date TEXT   DEFAULT (date('now', 'start of month', '+1 month')),
            created_at      TEXT    DEFAULT (datetime('now'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS brand_profiles (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id           INTEGER NOT NULL,
            name              TEXT    NOT NULL,
            sector            TEXT    NOT NULL,
            tone              TEXT    DEFAULT 'samimi',
            target_audience   TEXT,
            primary_color     TEXT,
            secondary_color   TEXT,
            heading_font      TEXT,
            body_font         TEXT,
            brand_description TEXT,
            sample_posts      TEXT,
            is_default        INTEGER DEFAULT 0,
            created_at        TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS generated_content (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id            INTEGER NOT NULL,
            profile_id         INTEGER NOT NULL,
            content_type       TEXT    NOT NULL,
            user_input         TEXT    NOT NULL,
            generated_content  TEXT    NOT NULL,
            full_prompt        TEXT,
            model_used         TEXT,
            tokens_used        INTEGER DEFAULT 0,
            is_favorite        INTEGER DEFAULT 0,
            created_at         TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (profile_id) REFERENCES brand_profiles(id) ON DELETE CASCADE
        )
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_profiles_user ON brand_profiles(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_content_user ON generated_content(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_content_profile ON generated_content(profile_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_content_created ON generated_content(created_at)');

    // Seed admin user if it does not exist
    try {
        const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
        checkStmt.bind(['admin@postmax.io']);
        const hasAdmin = checkStmt.step();
        checkStmt.free();

        if (!hasAdmin) {
            console.log('Seeding admin user...');
            const passwordHash = bcrypt.hashSync('adminpassword123', 12);
            
            // Insert admin user
            db.run('INSERT INTO users (name, email, password_hash, plan) VALUES (?, ?, ?, ?)', [
                'Admin', 'admin@postmax.io', passwordHash, 'pro'
            ]);

            // Get the user ID
            const idStmt = db.prepare('SELECT last_insert_rowid() as id');
            idStmt.step();
            const adminId = idStmt.get()[0];
            idStmt.free();

            // Insert default brand profile
            db.run(`
                INSERT INTO brand_profiles (user_id, name, sector, tone, target_audience, is_default)
                VALUES (?, ?, ?, ?, ?, 1)
            `, [adminId, 'Varsayılan İşletme', 'Genel', 'Samimi ve Profesyonel', 'Genel Müşteri']);
            
            console.log('✅ Admin user and default profile seeded successfully!');
        }
    } catch (e) {
        console.error('Failed to seed admin user:', e.message);
    }

    // Save to disk
    saveDatabase();

    console.log('📦 Veritabanı hazır:', config.db.path);
    return db;
}

/**
 * Save database to disk
 */
function saveDatabase() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.db.path, buffer);
}

// Auto-save every 30 seconds
setInterval(saveDatabase, 30000);

// Save on process exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(); });

/**
 * Wrapper helpers to match better-sqlite3-like API
 * so we don't need to rewrite all routes
 */
const dbWrapper = {
    prepare(sql) {
        return {
            run(...params) {
                db.run(sql, params);
                // Get last insert rowid BEFORE save (export can reset state)
                const res = db.exec('SELECT last_insert_rowid() as id');
                const lastId = res.length > 0 ? res[0].values[0][0] : 0;
                const changes = db.getRowsModified();
                saveDatabase();
                return { lastInsertRowid: lastId, changes };
            },
            get(...params) {
                try {
                    const stmt = db.prepare(sql);
                    if (params.length > 0) {
                        stmt.bind(params);
                    }
                    if (stmt.step()) {
                        const columns = stmt.getColumnNames();
                        const values = stmt.get();
                        stmt.free();
                        const row = {};
                        columns.forEach((col, i) => { row[col] = values[i]; });
                        return row;
                    }
                    stmt.free();
                    return undefined;
                } catch (e) {
                    console.error('DB get error:', e.message, 'SQL:', sql, 'Params:', params);
                    return undefined;
                }
            },
            all(...params) {
                try {
                    const results = [];
                    const stmt = db.prepare(sql);
                    if (params.length > 0) {
                        stmt.bind(params);
                    }
                    while (stmt.step()) {
                        const columns = stmt.getColumnNames();
                        const values = stmt.get();
                        const row = {};
                        columns.forEach((col, i) => { row[col] = values[i]; });
                        results.push(row);
                    }
                    stmt.free();
                    return results;
                } catch (e) {
                    console.error('DB all error:', e.message, 'SQL:', sql, 'Params:', params);
                    return [];
                }
            },
        };
    },
};

module.exports = { initDatabase, dbWrapper, saveDatabase };
