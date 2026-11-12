import 'dotenv/config';
import pg from 'pg';

const local = (process.env.DATABASE_URL || '').includes('localhost');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: local ? false : { rejectUnauthorized: false }
});

export default pool;
