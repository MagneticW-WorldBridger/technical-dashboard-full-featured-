const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importOrderDetailsWithValidOrders() {
  console.log('🔍 Getting valid order IDs...');
  const validOrders = await pool.query('SELECT orderid FROM orders');
  const validOrderIds = new Set(validOrders.rows.map(row => row.orderid));
  console.log(`✅ Found ${validOrderIds.size} valid orders`);
  
  console.log('📦 Reading order details CSV...');
  const orderDetails = [];
  let totalOrderDetails = 0;
  let validOrderDetails = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('loftorderdetails_202507110918.csv')
      .pipe(csv())
      .on('data', (row) => {
        totalOrderDetails++;
        if (validOrderIds.has(row.orderid)) {
          validOrderDetails++;
          orderDetails.push({
            orderid: row.orderid,
            lineid: parseInt(row.lineid) || 0,
            productid: row.productid,
            qtyordered: parseFloat(row.qtyordered) || 0,
            itemprice: parseFloat(row.itemprice) || 0
          });
        }
      })
      .on('end', async () => {
        console.log(`📊 Total order details in CSV: ${totalOrderDetails}`);
        console.log(`✅ Valid order details to import: ${validOrderDetails}`);
        console.log(`❌ Order details skipped (invalid orderid): ${totalOrderDetails - validOrderDetails}`);
        
        console.log('🗑️ Clearing existing order details...');
        await pool.query('DELETE FROM order_details');
        
        console.log('📥 Importing valid order details...');
        for (const detail of orderDetails) {
          await pool.query(`
            INSERT INTO order_details (
              orderid, lineid, productid, qtyordered, itemprice
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            detail.orderid, detail.lineid, detail.productid, detail.qtyordered, detail.itemprice
          ]);
        }
        
        console.log(`✅ Successfully imported ${orderDetails.length} order details!`);
        await pool.end();
        resolve();
      })
      .on('error', reject);
  });
}

importOrderDetailsWithValidOrders().catch(console.error); 