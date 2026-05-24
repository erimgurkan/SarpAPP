/* ═══════════════════════════════════════════════════════════
   PostCraft — Database Inspector CLI
   Run: node server/db/inspect.js
   ═══════════════════════════════════════════════════════════ */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function inspect() {
    const dbPath = path.join(__dirname, 'postcraft.db');
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Database file not found at:', dbPath);
        return;
    }

    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    console.log('\n====================== USERS ======================');
    const usersRes = db.exec('SELECT id, email, name, plan, monthly_usage, created_at FROM users');
    if (usersRes.length > 0) {
        const columns = usersRes[0].columns;
        const rows = usersRes[0].values.map(row => {
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
        console.table(rows);
    } else {
        console.log('No users found.');
    }

    console.log('\n================= BRAND PROFILES =================');
    const profilesRes = db.exec('SELECT id, user_id, name, sector, tone, target_audience FROM brand_profiles');
    if (profilesRes.length > 0) {
        const columns = profilesRes[0].columns;
        const rows = profilesRes[0].values.map(row => {
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
        console.table(rows);
    } else {
        console.log('No profiles found.');
    }
    
    console.log('\n==================================================');
}

inspect().catch(console.error);
