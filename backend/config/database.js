/**
 * Database Configuration and Connection
 */

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'momnextdoor_booking',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Database connected:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// Query helper function
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Transaction helper
async function transaction(callback) {
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
}

module.exports = {
    pool,
    query,
    transaction,
    initializeDatabase
};