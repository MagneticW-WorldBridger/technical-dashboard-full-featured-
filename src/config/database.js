const { Pool } = require('pg');
require('dotenv').config();

// Use actual PSQL URL from .env file as specified in requirements
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Database utility functions
const db = {
  query: (text, params) => pool.query(text, params),
  
  // Get a single row
  getOne: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows[0];
  },
  
  // Get multiple rows
  getMany: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows;
  },
  
  // Execute a transaction
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Close the pool
  close: () => pool.end()
};

module.exports = db; 