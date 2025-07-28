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

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'UserId is required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Get user statistics
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM food_nutrition_data_table WHERE UserID = ?',
      [userId]
    );

    const [todayCount] = await connection.execute(
      'SELECT COUNT(*) as today FROM food_nutrition_data_table WHERE UserID = ? AND DATE(CreatedAt) = CURDATE()',
      [userId]
    );

    const [weekCount] = await connection.execute(
      'SELECT COUNT(*) as week FROM food_nutrition_data_table WHERE UserID = ? AND CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
      [userId]
    );

    const [backgroundCount] = await connection.execute(
      'SELECT COUNT(*) as background FROM food_nutrition_data_table WHERE UserID = ? AND ProcessedBy = "background_service"',
      [userId]
    );

    // Get nutrition totals for the week
    const [weeklyNutrition] = await connection.execute(
      `SELECT 
        SUM(TotalCalories) as totalCalories,
        SUM(TotalProtein) as totalProtein,
        SUM(TotalCarbs) as totalCarbs,
        SUM(TotalFat) as totalFat,
        SUM(TotalFiber) as totalFiber
       FROM food_nutrition_data_table 
       WHERE UserID = ? AND CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    // Get daily nutrition for the last 7 days
    const [dailyNutrition] = await connection.execute(
      `SELECT 
        DATE(CreatedAt) as date,
        SUM(TotalCalories) as calories,
        SUM(TotalProtein) as protein,
        SUM(TotalCarbs) as carbs,
        SUM(TotalFat) as fat,
        COUNT(*) as meals
       FROM food_nutrition_data_table 
       WHERE UserID = ? AND CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(CreatedAt)
       ORDER BY date DESC`,
      [userId]
    );

    // Get recent analyses
    const [recentAnalyses] = await connection.execute(
      `SELECT 
        ID, ImagePath, TotalCalories, TotalProtein, TotalCarbs, TotalFat,
        ProcessedBy, CreatedAt
       FROM food_nutrition_data_table 
       WHERE UserID = ? 
       ORDER BY CreatedAt DESC 
       LIMIT 10`,
      [userId]
    );

    await connection.end();

    res.status(200).json({
      success: true,
      userId: userId,
      statistics: {
        total: totalCount[0].total,
        today: todayCount[0].today,
        thisWeek: weekCount[0].week,
        backgroundProcessed: backgroundCount[0].background,
        manualProcessed: totalCount[0].total - backgroundCount[0].background
      },
      weeklyNutrition: {
        totalCalories: weeklyNutrition[0].totalCalories || 0,
        totalProtein: weeklyNutrition[0].totalProtein || 0,
        totalCarbs: weeklyNutrition[0].totalCarbs || 0,
        totalFat: weeklyNutrition[0].totalFat || 0,
        totalFiber: weeklyNutrition[0].totalFiber || 0
      },
      dailyNutrition: dailyNutrition,
      recentAnalyses: recentAnalyses
    });

  } catch (error) {
    console.error('Failed to get user statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
