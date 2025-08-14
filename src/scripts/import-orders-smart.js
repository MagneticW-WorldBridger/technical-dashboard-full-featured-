const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importOrdersWithValidCustomers() {
  console.log('🔍 Getting valid customer IDs...');
  const validCustomers = await pool.query('SELECT customerid FROM customers');
  const validCustomerIds = new Set(validCustomers.rows.map(row => row.customerid));
  console.log(`✅ Found ${validCustomerIds.size} valid customers`);
  
  console.log('📦 Reading orders CSV...');
  const orders = [];
  let totalOrders = 0;
  let validOrders = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('loftorders_202507110918.csv')
      .pipe(csv())
      .on('data', (row) => {
        totalOrders++;
        if (validCustomerIds.has(row.customerid)) {
          validOrders++;
          orders.push({
            orderid: row.orderid,
            type: row.type,
            orderdate: row.orderdate,
            status: row.status,
            customerid: row.customerid,
            deliverytype: row.deliverytype,
            deliverydate: row.deliverydate,
            setupcharge: parseFloat(row.setupcharge) || 0,
            tax: parseFloat(row.tax) || 0,
            deliverycharge: parseFloat(row.deliverycharge) || 0
          });
        }
      })
      .on('end', async () => {
        console.log(`📊 Total orders in CSV: ${totalOrders}`);
        console.log(`✅ Valid orders to import: ${validOrders}`);
        console.log(`❌ Orders skipped (invalid customerid): ${totalOrders - validOrders}`);
        
        console.log('🗑️ Clearing existing orders...');
        await pool.query('DELETE FROM orders');
        
        console.log('📥 Importing valid orders...');
        for (const order of orders) {
          await pool.query(`
            INSERT INTO orders (
              orderid, type, orderdate, status, customerid,
              deliverytype, deliverydate, setupcharge, tax, deliverycharge
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            order.orderid, order.type, order.orderdate, order.status,
            order.customerid, order.deliverytype, order.deliverydate,
            order.setupcharge, order.tax, order.deliverycharge
          ]);
        }
        
        console.log(`✅ Successfully imported ${orders.length} orders!`);
        await pool.end();
        resolve();
      })
      .on('error', reject);
  });
}

importOrdersWithValidCustomers().catch(console.error); 