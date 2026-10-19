import pg from 'pg';
const { Pool } = pg;
let pool;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  if (!pool) pool = new Pool( { connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 } );
  return pool;
}
