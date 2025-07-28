import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, imagePath, analysisResult, timestamp, deviceInfo } = req.body;

  if (!userId || !imagePath || !analysisResult) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, imagePath, analysisResult' 
    });
  }

  try {
    // Parse analysis result to extract nutrition values
    let totalCalories = null, totalProtein = null, totalCarbs = null, totalFat = null, totalFiber = null;
    let confidenceScore = null;
    
    try {
      const analysis = typeof analysisResult === 'string' ? JSON.parse(analysisResult) : analysisResult;
      
      // Extract nutrition data from first food item
      if (analysis.foods && analysis.foods.length > 0) {
        const firstFood = analysis.foods[0];
        if (firstFood.nutrition) {
          totalCalories = firstFood.nutrition.calories || null;
          totalProtein = firstFood.nutrition.protein || null;
          totalCarbs = firstFood.nutrition.carbs || null;
          totalFat = firstFood.nutrition.fat || null;
          totalFiber = firstFood.nutrition.fiber || null;
        }
        // Extract confidence if available
        confidenceScore = firstFood.confidence || null;
      }
    } catch (parseError) {
      console.warn('Could not parse nutrition data:', parseError);
    }

    // Database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Insert into the new table structure
    const insertQuery = `
      INSERT INTO food_nutrition_data_table (
        UserID, ImagePath, AnalysisData, ConfidenceScore, 
        TotalCalories, TotalProtein, TotalCarbs, TotalFat, TotalFiber,
        ProcessedBy, DeviceInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'background_service', ?)
    `;

    const analysisDataJson = typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult);

    const [result] = await connection.execute(insertQuery, [
      userId,
      imagePath,
      analysisDataJson,
      confidenceScore,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      deviceInfo || 'Android Background Service'
    ]);

    await connection.end();

    console.log(`✅ Background analysis saved for user ${userId}, ID: ${result.insertId}`);

    res.status(200).json({
      success: true,
      id: result.insertId,
      message: 'Analysis saved successfully',
      data: {
        userId,
        imagePath: imagePath.substring(imagePath.lastIndexOf('/') + 1),
        nutrition: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          fiber: totalFiber
        },
        confidence: confidenceScore,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save analysis',
      error: error.message
    });
  }
}
