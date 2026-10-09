import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString =
  process.env.DATABASE_URL ||
  'mysql://root:@127.0.0.1:3306/grand_addis_db';

async function seedMysql() {
  console.log('Connecting to MySQL at:', connectionString.replace(/:[^:@]+@/, ':****@'));

  const sqlFile = path.join(__dirname, 'grand_addis_mysql.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  // Strip CREATE DATABASE / USE statements if connecting to a specific DB in Plesk
  const sanitizedSql = sqlContent
    .replace(/CREATE DATABASE[^\n;]+;/gi, '')
    .replace(/USE `?[a-zA-Z0-9_]+`?;/gi, '');

  let connection;
  try {
    connection = await mysql.createConnection({
      uri: connectionString,
      multipleStatements: true,
    });

    console.log('Executing MySQL DDL and Seed Data...');
    await connection.query(sanitizedSql);
    console.log('✓ MySQL database schema and production data seeded successfully!');
  } catch (error) {
    console.error('✗ Failed to seed MySQL database:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedMysql();
