const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
});


async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'unverified',
        verification_token UUID DEFAULT gen_random_uuid(),
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
      ON users (LOWER(email))
    `);

    console.log('Database initialized successfully');
    console.log('Unique index on email created/verified');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

function getUniqIdValue() {
  return require('crypto').randomUUID();
}

module.exports = { pool, initializeDatabase, getUniqIdValue };
