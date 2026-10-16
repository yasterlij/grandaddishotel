import mysql from 'mysql2/promise';
import {
  isMysql,
  connectionString,
  getMysqlConnectionConfig,
  createPgPool,
} from './db-common.mjs';

async function checkStatus() {
  console.log('============================================================');
  console.log('GRAND ADDIS HOTEL - DATABASE HEALTH & STATUS CHECK');
  console.log(`Detected Engine: ${isMysql ? 'MySQL / MariaDB' : 'PostgreSQL'}`);
  console.log('============================================================\n');

  const start = Date.now();

  if (isMysql) {
    const mysqlConfig = getMysqlConnectionConfig();
    const finalHost = mysqlConfig.host;
    const finalPort = mysqlConfig.port;
    const finalUser = mysqlConfig.user;
    const finalDatabase = mysqlConfig.database;
    const finalPassword = mysqlConfig.password;

    console.log(`Host:     ${finalHost}:${finalPort}`);
    console.log(`User:     ${finalUser}`);
    console.log(`Database: ${finalDatabase}`);
    console.log(`Password: ${finalPassword ? 'YES (' + String(finalPassword).length + ' chars)' : 'NO'}`);
    console.log('------------------------------------------------------------');

    try {
      const conn = await mysql.createConnection({
        host: finalHost,
        port: finalPort,
        user: finalUser,
        password: finalPassword,
        database: finalDatabase,
      });

      const latency = Date.now() - start;
      console.log(`✓ Connected in ${latency}ms!\n`);

      const tables = [
        'room_types',
        'rooms',
        'reservations',
        'payments',
        'gallery_images',
        'experiences',
        'dining_menu',
        'spa_treatments',
        'testimonials',
        'hotel_settings',
      ];

      console.log('Table Row Counts:');
      for (const tbl of tables) {
        try {
          const [rows] = await conn.query(`SELECT COUNT(*) as count FROM \`${tbl}\``);
          const count = Array.isArray(rows) && rows[0] ? rows[0].count : 0;
          console.log(`  • \`${tbl.padEnd(16)}\`: ${count} records`);
        } catch {
          console.log(`  • \`${tbl.padEnd(16)}\`: [table not found]`);
        }
      }

      await conn.end();
      console.log('\n✓ Database is healthy and ready for production traffic!\n');
    } catch (err) {
      console.error('✗ Connection failed:', err.message || err);
      process.exit(1);
    }
  } else {
    console.log(`Connection URL: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
    console.log('------------------------------------------------------------');

    try {
      const pool = createPgPool();
      const res = await pool.query('SELECT NOW() as current_time');
      const latency = Date.now() - start;
      console.log(`✓ Connected in ${latency}ms! DB Time: ${res.rows[0].current_time}\n`);

      const tables = [
        'room_types',
        'rooms',
        'reservations',
        'payments',
        'gallery_images',
        'experiences',
        'dining_menu',
        'spa_treatments',
        'testimonials',
        'hotel_settings',
      ];

      console.log('Table Row Counts:');
      for (const tbl of tables) {
        try {
          const r = await pool.query(`SELECT COUNT(*) as count FROM ${tbl}`);
          console.log(`  • ${tbl.padEnd(16)}: ${r.rows[0].count} records`);
        } catch {
          console.log(`  • ${tbl.padEnd(16)}: [table not found]`);
        }
      }

      await pool.end();
      console.log('\n✓ Database is healthy and ready!\n');
    } catch (err) {
      console.error('✗ Connection failed:', err.message || err);
      process.exit(1);
    }
  }
}

checkStatus();
