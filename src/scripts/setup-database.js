const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  console.log('🗄️  Setting up Woodstock Outlet Chatbot Database...');
  
  try {
    // Read the database schema
    const schemaPath = path.join(__dirname, '..', 'woodstock_outlet_database.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Reading database schema...');
    console.log('🔧 Executing database schema as a single transaction...');
    
    // Clean the SQL by removing comments and database-specific commands
    const cleanSQL = schemaSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('--') && 
               !trimmed.toLowerCase().includes('create database') &&
               !trimmed.toLowerCase().includes('\\c');
      })
      .join('\n');
    
    // Execute the entire schema as one transaction
    await pool.query('BEGIN');
    
    try {
      await pool.query(cleanSQL);
      await pool.query('COMMIT');
      console.log('✅ Database schema executed successfully');
    } catch (error) {
      await pool.query('ROLLBACK');
      
      // If it fails because things already exist, that's okay
      if (error.message.includes('already exists')) {
        console.log('⚠️  Some database objects already exist, continuing...');
      } else {
        console.error('❌ Database schema execution failed:', error.message);
        throw error;
      }
    }
    
    console.log('✅ Database setup completed successfully!');
    
    // Verify the setup
    console.log('🔍 Verifying database setup...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for functions
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `);
    
    if (functions.rows.length > 0) {
      console.log('🔧 Created functions:');
      functions.rows.forEach(row => {
        console.log(`  - ${row.routine_name}`);
      });
    }
    
    // Check for triggers
    const triggers = await pool.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `);
    
    if (triggers.rows.length > 0) {
      console.log('⚡ Created triggers:');
      triggers.rows.forEach(row => {
        console.log(`  - ${row.trigger_name}`);
      });
    }
    
    console.log('🎉 Database setup verification completed!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🚀 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 