const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function populateAnalyticsSimple() {
  console.log('📊 Populating analytics tables (simplified)...');
  
  try {
    // 1. Populate customer analytics
    console.log('👥 Calculating customer analytics...');
    await pool.query(`
      INSERT INTO customer_analytics (
        customerid, total_orders, total_spent, average_order_value, 
        loyalty_tier, risk_score
      )
      SELECT 
        c.customerid,
        COALESCE(COUNT(DISTINCT o.orderid), 0) as total_orders,
        COALESCE(SUM(od.itemprice * od.qtyordered), 0) as total_spent,
        CASE 
          WHEN COUNT(DISTINCT o.orderid) > 0 
          THEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) / COUNT(DISTINCT o.orderid)
          ELSE 0 
        END as average_order_value,
        CASE 
          WHEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) >= 5000 THEN 'PLATINUM'
          WHEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) >= 2000 THEN 'GOLD'  
          WHEN COALESCE(SUM(od.itemprice * od.qtyordered), 0) >= 500 THEN 'SILVER'
          ELSE 'BRONZE'
        END as loyalty_tier,
        CASE 
          WHEN COUNT(DISTINCT o.orderid) = 0 THEN 90
          WHEN COUNT(DISTINCT o.orderid) = 1 THEN 40
          ELSE 20
        END as risk_score
      FROM customers c
      LEFT JOIN orders o ON c.customerid = o.customerid
      LEFT JOIN order_details od ON o.orderid = od.orderid
      GROUP BY c.customerid
      ON CONFLICT (customerid) DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_spent = EXCLUDED.total_spent,
        average_order_value = EXCLUDED.average_order_value,
        loyalty_tier = EXCLUDED.loyalty_tier,
        risk_score = EXCLUDED.risk_score,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    const customerStats = await pool.query('SELECT COUNT(*) as count FROM customer_analytics');
    console.log(`✅ Populated customer analytics for ${customerStats.rows[0].count} customers`);
    
    // 2. Populate product analytics  
    console.log('📦 Calculating product analytics...');
    await pool.query(`
      INSERT INTO product_analytics (
        productid, product_name, total_orders, total_quantity_sold, 
        total_revenue, average_price, category
      )
      SELECT 
        od.productid,
        od.productid as product_name,
        COUNT(DISTINCT od.orderid) as total_orders,
        SUM(od.qtyordered) as total_quantity_sold,
        SUM(od.itemprice * od.qtyordered) as total_revenue,
        AVG(od.itemprice) as average_price,
        CASE 
          WHEN od.productid LIKE '6%' THEN 'Sofas'
          WHEN od.productid LIKE '3%' THEN 'Sectionals'
          WHEN od.productid LIKE '8%' THEN 'Recliners'
          WHEN od.productid LIKE '2%' THEN 'Chairs'
          WHEN od.productid LIKE '0%' THEN 'Accessories'
          WHEN od.productid LIKE '4%' THEN 'Tables'
          WHEN od.productid LIKE '5%' THEN 'Bedroom'
          WHEN od.productid LIKE '1%' THEN 'Dining'
          WHEN od.productid LIKE '7%' THEN 'Entertainment'
          WHEN od.productid LIKE '9%' THEN 'Mattresses'
          ELSE 'Other'
        END as category
      FROM order_details od
      WHERE od.productid IS NOT NULL AND od.productid != '' AND od.productid != 'DECLINE'
      GROUP BY od.productid
      ON CONFLICT (productid) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        total_orders = EXCLUDED.total_orders,
        total_quantity_sold = EXCLUDED.total_quantity_sold,
        total_revenue = EXCLUDED.total_revenue,
        average_price = EXCLUDED.average_price,
        category = EXCLUDED.category,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    const productStats = await pool.query('SELECT COUNT(*) as count FROM product_analytics');
    console.log(`✅ Populated product analytics for ${productStats.rows[0].count} products`);
    
    // 3. Show summary stats
    console.log('\n📈 ANALYTICS SUMMARY:');
    
    const loyaltyStats = await pool.query(`
      SELECT loyalty_tier, COUNT(*) as count, 
             ROUND(AVG(total_spent), 2) as avg_spent
      FROM customer_analytics 
      GROUP BY loyalty_tier 
      ORDER BY avg_spent DESC
    `);
    
    console.log('🏆 LOYALTY TIERS:');
    loyaltyStats.rows.forEach(row => {
      console.log(`   ${row.loyalty_tier}: ${row.count} customers (avg: $${row.avg_spent})`);
    });
    
    const topProducts = await pool.query(`
      SELECT productid, category, total_revenue, total_orders
      FROM product_analytics 
      ORDER BY total_revenue DESC 
      LIMIT 5
    `);
    
    console.log('\n💰 TOP REVENUE PRODUCTS:');
    topProducts.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.productid} (${row.category}): $${row.total_revenue} (${row.total_orders} orders)`);
    });
    
    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as products, SUM(total_revenue) as revenue
      FROM product_analytics 
      GROUP BY category 
      ORDER BY revenue DESC
    `);
    
    console.log('\n🏷️ PRODUCT CATEGORIES:');
    categoryStats.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.products} products, $${row.revenue} revenue`);
    });
    
    console.log('\n✅ Analytics population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating analytics:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

populateAnalyticsSimple().catch(console.error); 