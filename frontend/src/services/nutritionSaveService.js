/**
 * Transform analysis result to match background service format
 * Background service format: { foods: [...], total: {...}, confidence: "..." }
 * Manual save format: { nutrition: {...}, detailedItems: [...], confidence: "..." }
 */
function transformToBackgroundServiceFormat(analysisResult) {
  try {
    if (!analysisResult) return analysisResult;
    
    // If already in background service format (has foods and total), return as-is
    if (analysisResult.foods && analysisResult.total) {
      return analysisResult;
    }
    
    // If in manual save format (has nutrition object), transform it
    if (analysisResult.nutrition) {
      const nutrition = analysisResult.nutrition;
      const detailedItems = analysisResult.detailedItems || [];
      
      // Create foods array from detailedItems if available, or create single food item
      const foods = detailedItems.length > 0 
        ? detailedItems.map(item => ({
            name: item.name || 'Unknown Food',
            portion: item.portionDescription || '1 serving',
            weight_g: typeof item.estimatedWeight === 'number' ? item.estimatedWeight : 100,
            nutrition: {
              calories: item.calories || 0,
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fat: item.fat || 0,
              fiber: item.fiber || 0
            }
          }))
        : [{
            name: analysisResult.category?.name || 'Unknown Food',
            portion: '1 serving',
            weight_g: 100,
            nutrition: {
              calories: nutrition.calories || 0,
              protein: nutrition.protein || 0,
              carbs: nutrition.carbs || 0,
              fat: nutrition.fat || 0,
              fiber: nutrition.fiber || 0
            }
          }];
      
      // Create total object from nutrition
      const total = {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0
      };
      
      return {
        foods: foods,
        total: total,
        confidence: analysisResult.confidence || 'medium'
      };
    }
    
    // If in unknown format, return as-is
    return analysisResult;
    
  } catch (error) {
    console.error('[transformToBackgroundServiceFormat] Error transforming data:', error);
    return analysisResult; // Return original if transformation fails
  }
}

/**
 * Utility to lookup the real UserID from team_table based on email
 * Returns: { success, userId, ... }
 */
export async function lookupUserId(email, firebaseUid = null) {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  try {
    console.log('[lookupUserId] Looking up:', { email, firebaseUid });
    const res = await fetch(`${apiBaseUrl}/api/lookup-user-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firebaseUid })
    });
    console.log('[lookupUserId] Response status:', res.status);
    const data = await res.json();
    console.log('[lookupUserId] Response data:', data);
    if (!res.ok) throw new Error(data.message || 'Failed to lookup user ID');
    return data;
  } catch (err) {
    console.error('[lookupUserId] Error:', err);
    throw err;
  }
}

/**
 * Utility to upload nutrition analysis result to backend DB
 * Always uses the real UserID from team_table for consistency
 * Returns: { success, id, ... }
 */
export async function saveNutritionAnalysis({ userId, imagePath, analysisResult, deviceInfo }) {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  console.log('apiBaseUrl:', apiBaseUrl);
  
  try {
    // Always lookup the real UserID from team_table
    let actualUserId = userId;
    
    // If userId looks like an email, lookup the team_table UserID
    if (userId && userId.includes('@')) {
      console.log('[saveNutritionAnalysis] Email detected, looking up team_table UserID');
      try {
        const lookupResult = await lookupUserId(userId);
        if (lookupResult.success && lookupResult.userId) {
          actualUserId = lookupResult.userId;
          console.log('[saveNutritionAnalysis] Using team_table UserID:', actualUserId);
        } else {
          console.warn('[saveNutritionAnalysis] No UserID found in team_table for:', userId);
          throw new Error('User not found in team_table. Please contact support.');
        }
      } catch (lookupErr) {
        console.error('[saveNutritionAnalysis] UserID lookup failed:', lookupErr.message);
        throw new Error(`Unable to save: ${lookupErr.message}`);
      }
    } else if (userId && !isNaN(userId)) {
      // If it's already a numeric ID, use it directly
      console.log('[saveNutritionAnalysis] Using provided UserID:', userId);
      actualUserId = userId;
    } else {
      // Handle other cases (uid, anonymous, etc.)
      console.warn('[saveNutritionAnalysis] Non-email userId provided:', userId);
      throw new Error('Please log in with a valid email to save nutrition data.');
    }
    
    // Transform analysisResult to match background service format (foods array + total object)
    const transformedAnalysisResult = transformToBackgroundServiceFormat(analysisResult);
    
    console.log('[saveNutritionAnalysis] Sending:', { userId: actualUserId, imagePath, analysisResult: transformedAnalysisResult, deviceInfo });
    const res = await fetch(`${apiBaseUrl}/api/save-background-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: actualUserId, imagePath, analysisResult: transformedAnalysisResult, deviceInfo })
    });
    console.log('[saveNutritionAnalysis] Response status:', res.status);
    const data = await res.json();
    console.log('[saveNutritionAnalysis] Response data:', data);
    if (!res.ok) throw new Error(data.message || 'Failed to save analysis');
    return data;
  } catch (err) {
    console.error('[saveNutritionAnalysis] Error:', err);
    throw err;
  }
}

/**
 * Utility to delete a saved nutrition analysis by ID
 * Note: This function works with analysis IDs, not UserIDs, so no lookup needed
 */
export async function deleteNutritionAnalysis({ id }) {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  try {
    console.log('[deleteNutritionAnalysis] Sending:', { id });
    const res = await fetch(`${apiBaseUrl}/api/delete-background-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    console.log('[deleteNutritionAnalysis] Response status:', res.status);
    const data = await res.json();
    console.log('[deleteNutritionAnalysis] Response data:', data);
    if (!res.ok) throw new Error(data.message || 'Failed to delete analysis');
    return data;
  } catch (err) {
    console.error('[deleteNutritionAnalysis] Error:', err);
    throw err;
  }
}
