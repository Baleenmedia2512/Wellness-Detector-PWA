import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();

    // Get service statistics
    const statsConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const [totalCount] = await statsConnection.execute(
      'SELECT COUNT(*) as total FROM food_nutrition_data_table'
    );

    const [todayCount] = await statsConnection.execute(
      'SELECT COUNT(*) as today FROM food_nutrition_data_table WHERE DATE(CreatedAt) = CURDATE()'
    );

    const [backgroundCount] = await statsConnection.execute(
      'SELECT COUNT(*) as background FROM food_nutrition_data_table WHERE ProcessedBy = "background_service"'
    );

    await statsConnection.end();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        testQuery: rows[0].test === 1
      },
      statistics: {
        totalAnalyses: totalCount[0].total,
        todayAnalyses: todayCount[0].today,
        backgroundAnalyses: backgroundCount[0].background
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false
      }
    });
  }
}
