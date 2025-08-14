const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importCSVData() {
  console.log('📊 Importing CSV data into Woodstock Outlet Chatbot Database...');
  
  try {
    // CSV file paths
    const csvFiles = {
      customers: path.join(__dirname, '..', 'loftcustomers_202507110919.csv'),
      orders: path.join(__dirname, '..', 'loftorders_202507110918.csv'),
      orderDetails: path.join(__dirname, '..', 'loftorderdetails_202507110918.csv')
    };
    
    // Verify CSV files exist
    for (const [table, filePath] of Object.entries(csvFiles)) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`CSV file not found: ${filePath}`);
      }
      console.log(`✅ Found ${table} CSV file: ${path.basename(filePath)}`);
    }
    
    // Import customers
    console.log('\n👥 Importing customers...');
    await importCustomers(csvFiles.customers);
    
    // Import orders
    console.log('\n📦 Importing orders...');
    await importOrders(csvFiles.orders);
    
    // Import order details
    console.log('\n📋 Importing order details...');
    await importOrderDetails(csvFiles.orderDetails);
    
    // Populate analytics tables
    console.log('\n📈 Populating analytics tables...');
    await populateAnalytics();
    
    // Verify import
    console.log('\n🔍 Verifying data import...');
    await verifyImport();
    
    console.log('\n🎉 CSV data import completed successfully!');
    
  } catch (error) {
    console.error('❌ CSV data import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function importCustomers(csvPath) {
  const customers = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        customers.push({
          customerid: row.customerid,
          firstname: row.firstname,
          middlename: row.middlename,
          lastname: row.lastname,
          phonenumber: row.phonenumber,
          businessphone: row.businessphone,
          extension: row.extension,
          address1: row.address1,
          address2: row.address2,
          city: row.city,
          state: row.state,
          zipcode: row.zipcode,
          countryid: row.countryid,
          email: row.email,
          shipemail: row.shipemail,
          type: row.type,
          accountopendate: row.accountopendate,
          taxexemptionid: row.taxexemptionid,
          taxexemptionnumber: row.taxexemptionnumber,
          companyname: row.companyname,
          markerid: row.markerid,
          ssn: row.ssn,
          memo: row.memo,
          noemail: row.noemail === 'Y' || row.noemail === 'true',
          interfacedforsalescube: row.interfacedforsalescube === 'Y' || row.interfacedforsalescube === 'true',
          interfacedforforecasting: row.interfacedforforecasting === 'Y' || row.interfacedforforecasting === 'true'
        });
      })
      .on('end', async () => {
        try {
          console.log(`📥 Found ${customers.length} customers to import`);
          
          // Clear existing data
          await pool.query('DELETE FROM customers');
          
          // Import customers with ALL CSV columns
          for (const customer of customers) {
            await pool.query(`
              INSERT INTO customers (
                customerid, firstname, middlename, lastname, phonenumber, businessphone, extension,
                address1, address2, city, state, zipcode, countryid, email, shipemail, type,
                accountopendate, taxexemptionid, taxexemptionnumber, companyname, markerid, ssn, memo,
                noemail, interfacedforsalescube, interfacedforforecasting
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            `, [
              customer.customerid, customer.firstname, customer.middlename, customer.lastname,
              customer.phonenumber, customer.businessphone, customer.extension, customer.address1,
              customer.address2, customer.city, customer.state, customer.zipcode, customer.countryid,
              customer.email, customer.shipemail, customer.type, customer.accountopendate,
              customer.taxexemptionid, customer.taxexemptionnumber, customer.companyname,
              customer.markerid, customer.ssn, customer.memo, customer.noemail,
              customer.interfacedforsalescube, customer.interfacedforforecasting
            ]);
          }
          
          console.log(`✅ Imported ${customers.length} customers`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importOrders(csvPath) {
  const orders = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
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
      })
      .on('end', async () => {
        try {
          console.log(`📥 Found ${orders.length} orders to import`);
          
          // Clear existing data
          await pool.query('DELETE FROM orders');
          
          // Import orders - simplified version
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
          
          console.log(`✅ Imported ${orders.length} orders`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importOrderDetails(csvPath) {
  const orderDetails = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        orderDetails.push({
          orderid: row.orderid,
          lineid: parseInt(row.lineid) || 0,
          productid: row.productid,
          qtyordered: parseFloat(row.qtyordered) || 0,
          itemprice: parseFloat(row.itemprice) || 0
        });
      })
      .on('end', async () => {
        try {
          console.log(`📥 Found ${orderDetails.length} order details to import`);
          
          // Clear existing data
          await pool.query('DELETE FROM order_details');
          
          // Import order details - simplified version
          for (const detail of orderDetails) {
            await pool.query(`
              INSERT INTO order_details (
                orderid, lineid, productid, qtyordered, itemprice
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              detail.orderid, detail.lineid, detail.productid, detail.qtyordered, detail.itemprice
            ]);
          }
          
          console.log(`✅ Imported ${orderDetails.length} order details`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function populateAnalytics() {
  try {
    // Populate customer_analytics - using order_details to calculate totals since orders table doesn't have sum
    console.log('📊 Populating customer analytics...');
    await pool.query(`
      INSERT INTO customer_analytics (customerid, total_orders, total_spent, loyalty_tier, days_since_last_order)
      SELECT 
        c.customerid,
        COUNT(DISTINCT o.orderid) as total_orders,
        COALESCE(SUM(od.itemprice * od.qtyordered), 0) as total_spent,
        CASE
          WHEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) >= 5000 THEN 'PLATINUM'
          WHEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) >= 2000 THEN 'GOLD'
          WHEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) >= 500 THEN 'SILVER'
          ELSE 'BRONZE'
        END as loyalty_tier,
        EXTRACT(DAY FROM (CURRENT_DATE - MAX(o.orderdate))) as days_since_last_order
      FROM customers c
      LEFT JOIN orders o ON c.customerid = o.customerid
      LEFT JOIN order_details od ON o.orderid = od.orderid
      GROUP BY c.customerid
    `);
    
    // Populate product_analytics - categorizing by product ID patterns since we don't have descriptions
    console.log('📊 Populating product analytics...');
    await pool.query(`
      INSERT INTO product_analytics (productid, category, total_sold, total_revenue)
      SELECT 
        od.productid,
        CASE 
          WHEN od.productid ILIKE '%sofa%' OR od.productid ILIKE '%couch%' OR od.productid LIKE '6%' THEN 'Sofas'
          WHEN od.productid ILIKE '%chair%' OR od.productid LIKE '7%' THEN 'Chairs'
          WHEN od.productid ILIKE '%table%' OR od.productid LIKE '8%' THEN 'Tables'
          WHEN od.productid ILIKE '%bed%' OR od.productid LIKE '9%' THEN 'Beds'
          WHEN od.productid ILIKE '%dresser%' OR od.productid ILIKE '%chest%' OR od.productid LIKE '5%' THEN 'Storage'
          ELSE 'Furniture'
        END as category,
        SUM(od.qtyordered) as total_sold,
        SUM(od.itemprice * od.qtyordered) as total_revenue
      FROM order_details od
      GROUP BY od.productid
    `);
    
    // Populate purchase_patterns - using product ID as name since we don't have descriptions
    console.log('📊 Populating purchase patterns...');
    await pool.query(`
      INSERT INTO purchase_patterns (productid, companion_productid, companion_product_name, confidence_score)
      SELECT 
        od1.productid,
        od2.productid as companion_productid,
        od2.productid as companion_product_name,
        (COUNT(*) * 100.0 / total_orders.total_count) as confidence_score
      FROM order_details od1
      JOIN order_details od2 ON od1.orderid = od2.orderid AND od1.productid != od2.productid
      JOIN (
        SELECT productid, COUNT(DISTINCT orderid) as total_count
        FROM order_details
        GROUP BY productid
      ) total_orders ON od1.productid = total_orders.productid
      GROUP BY od1.productid, od2.productid, total_orders.total_count
      HAVING COUNT(*) > 1
      ORDER BY confidence_score DESC
    `);
    
    console.log('✅ Analytics tables populated successfully');
    
  } catch (error) {
    console.error('❌ Error populating analytics:', error);
    throw error;
  }
}

async function verifyImport() {
  try {
    // Check record counts
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM customers'),
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query('SELECT COUNT(*) as count FROM order_details'),
      pool.query('SELECT COUNT(*) as count FROM customer_analytics'),
      pool.query('SELECT COUNT(*) as count FROM product_analytics'),
      pool.query('SELECT COUNT(*) as count FROM purchase_patterns')
    ]);
    
    console.log('📊 Import verification results:');
    console.log(`  - Customers: ${counts[0].rows[0].count}`);
    console.log(`  - Orders: ${counts[1].rows[0].count}`);
    console.log(`  - Order Details: ${counts[2].rows[0].count}`);
    console.log(`  - Customer Analytics: ${counts[3].rows[0].count}`);
    console.log(`  - Product Analytics: ${counts[4].rows[0].count}`);
    console.log(`  - Purchase Patterns: ${counts[5].rows[0].count}`);
    
    // Sample data verification
    const sampleCustomer = await pool.query('SELECT * FROM customers LIMIT 1');
    const sampleOrder = await pool.query('SELECT * FROM orders LIMIT 1');
    const sampleOrderDetail = await pool.query('SELECT * FROM order_details LIMIT 1');
    
    console.log('\n🔍 Sample data verification:');
    console.log(`  - Sample customer: ${sampleCustomer.rows[0]?.firstname} ${sampleCustomer.rows[0]?.lastname}`);
    console.log(`  - Sample order: ${sampleOrder.rows[0]?.orderid} ($${sampleOrder.rows[0]?.sum})`);
    console.log(`  - Sample order detail: ${sampleOrderDetail.rows[0]?.productid}`);
    
    console.log('✅ Data import verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Import verification failed:', error);
    throw error;
  }
}

// Run the import
if (require.main === module) {
  importCSVData()
    .then(() => {
      console.log('🚀 CSV data import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 CSV data import failed:', error);
      process.exit(1);
    });
}

module.exports = { importCSVData }; 