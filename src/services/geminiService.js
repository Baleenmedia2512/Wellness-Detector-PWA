import { GoogleGenerativeAI } from '@google/generative-ai';

// Comprehensive network debugging to catch ALL requests
const originalFetch = window.fetch;
const originalXMLHttpRequest = window.XMLHttpRequest;

// Override fetch
window.fetch = function(...args) {
  const url = args[0];
  // const options = args[1] || {};

  
  // Check for unwanted API calls
  if (typeof url === 'string') {
    if (url.includes('spoonacular') || 
        url.includes('calorieninjas') || 
        url.includes('rapidapi') ||
        url.includes('nutritionix') ||
        url.includes('edamam')) {
      console.error('❌ UNWANTED API CALL DETECTED:', url);
      console.trace('Call stack:');
      throw new Error(`BLOCKED: Unwanted API call to ${url}`);
    }
  }
  
  return originalFetch.apply(this, args);
};

// Override XMLHttpRequest
window.XMLHttpRequest = function() {
  const xhr = new originalXMLHttpRequest();
  const originalOpen = xhr.open;
  
  xhr.open = function(method, url, ...args) {
    console.log('🌐 XHR REQUEST:', {
      method: method,
      url: url,
      timestamp: new Date().toISOString()
    });
    
    // Check for unwanted API calls
    if (typeof url === 'string') {
      if (url.includes('spoonacular') || 
          url.includes('calorieninjas') || 
          url.includes('rapidapi') ||
          url.includes('nutritionix') ||
          url.includes('edamam')) {
        console.error('❌ UNWANTED XHR API CALL DETECTED:', url);
        console.trace('Call stack:');
        throw new Error(`BLOCKED: Unwanted XHR API call to ${url}`);
      }
    }
    
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  return xhr;
};

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  getApiInfo() {
    return {
      hasCredentials: !!this.apiKey,
      provider: 'Google Gemini',
      dailyLimit: 1500, // Gemini free tier daily limit
      description: 'Google Gemini AI for food image analysis'
    };
  }

  async analyzeImageForNutrition(imageFile) {
    console.log('🔍 GeminiService: Starting image analysis...');
    console.log('📸 Image file:', imageFile.name, imageFile.type, imageFile.size);
    
    if (!this.model) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      // Convert image to base64
      const imageBase64 = await this.fileToBase64(imageFile);
      console.log('📋 Image converted to base64, length:', imageBase64.length);
      
      // Create the prompt for nutrition analysis
      const prompt = `
        Analyze this food image and provide detailed nutrition information. Please return a JSON response with the following structure:

        {
          "foods": [
            {
              "name": "detected food name",
              "confidence": "confidence level (high/medium/low)",
              "nutrition": {
                "calories": "number per 100g",
                "protein": "grams per 100g", 
                "carbs": "grams per 100g",
                "fat": "grams per 100g",
                "fiber": "grams per 100g",
                "sugar": "grams per 100g",
                "sodium": "mg per 100g"
              },
              "serving_info": {
                "typical_serving": "typical serving description",
                "weight_per_serving": "grams",
                "calories_per_serving": "calories"
              }
            }
          ],
          "analysis": {
            "total_items": "number of food items detected",
            "image_quality": "good/fair/poor",
            "notes": "any additional observations"
          }
        }

        Rules:
        1. Identify all visible foods in the image
        2. Provide realistic nutrition values based on typical food composition
        3. If multiple foods are visible, analyze each separately
        4. Use standard nutrition database values
        5. Be conservative with portion estimates
        6. Return valid JSON only, no markdown formatting
        7. If you cannot clearly identify food, indicate low confidence
      `;

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: imageFile.type
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      let nutritionData;
      try {
        // Clean the response text - remove any markdown formatting
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        nutritionData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini API');
      }

      // Transform the response to match our app's expected format
      return this.transformGeminiResponse(nutritionData);

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async analyzeTextForNutrition(foodText) {
    if (!this.model) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const prompt = `
        Analyze the food "${foodText}" and provide detailed nutrition information. Please return a JSON response with the following structure:

        {
          "food": {
            "name": "${foodText}",
            "nutrition": {
              "calories": "number per 100g",
              "protein": "grams per 100g", 
              "carbs": "grams per 100g",
              "fat": "grams per 100g",
              "fiber": "grams per 100g",
              "sugar": "grams per 100g",
              "sodium": "mg per 100g"
            },
            "serving_info": {
              "typical_serving": "typical serving description",
              "weight_per_serving": "grams",
              "calories_per_serving": "calories"
            }
          }
        }

        Rules:
        1. Use standard USDA nutrition database values
        2. Provide realistic nutrition values for the specified food
        3. Include typical serving size information
        4. Return valid JSON only, no markdown formatting
        5. If the food is not recognized, indicate with null values
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      let nutritionData;
      try {
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        nutritionData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini API');
      }

      // Transform the response for text-based queries
      return this.transformTextResponse(nutritionData);

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to analyze food: ${error.message}`);
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  transformGeminiResponse(geminiData) {
    if (!geminiData || !geminiData.foods || geminiData.foods.length === 0) {
      throw new Error('No food items detected in the image');
    }

    const primaryFood = geminiData.foods[0];
    const totalItems = geminiData.foods.length;

    // Calculate combined nutrition if multiple foods
    let combinedNutrition = { ...primaryFood.nutrition };
    if (totalItems > 1) {
      combinedNutrition = geminiData.foods.reduce((acc, food) => {
        return {
          calories: (parseFloat(acc.calories) + parseFloat(food.nutrition.calories)) / 2,
          protein: (parseFloat(acc.protein) + parseFloat(food.nutrition.protein)) / 2,
          carbs: (parseFloat(acc.carbs) + parseFloat(food.nutrition.carbs)) / 2,
          fat: (parseFloat(acc.fat) + parseFloat(food.nutrition.fat)) / 2,
          fiber: (parseFloat(acc.fiber || 0) + parseFloat(food.nutrition.fiber || 0)) / 2,
          sugar: (parseFloat(acc.sugar || 0) + parseFloat(food.nutrition.sugar || 0)) / 2,
          sodium: (parseFloat(acc.sodium || 0) + parseFloat(food.nutrition.sodium || 0)) / 2
        };
      }, combinedNutrition);
    }

    return {
      nutrition: {
        calories: Math.round(parseFloat(combinedNutrition.calories) || 0),
        protein: Math.round(parseFloat(combinedNutrition.protein) || 0),
        carbs: Math.round(parseFloat(combinedNutrition.carbs) || 0),
        fat: Math.round(parseFloat(combinedNutrition.fat) || 0),
        fiber: Math.round(parseFloat(combinedNutrition.fiber) || 0)
      },
      category: {
        name: totalItems > 1 ? `Mixed Foods (${totalItems} items)` : primaryFood.name
      },
      source: 'Google Gemini AI',
      isRealData: true,
      itemCount: totalItems,
      detailedItems: geminiData.foods.map(food => ({
        name: food.name,
        calories: Math.round(parseFloat(food.nutrition.calories) || 0),
        protein: Math.round(parseFloat(food.nutrition.protein) || 0),
        carbs: Math.round(parseFloat(food.nutrition.carbs) || 0),
        fat: Math.round(parseFloat(food.nutrition.fat) || 0),
        fiber: Math.round(parseFloat(food.nutrition.fiber) || 0),
        confidence: food.confidence
      })),
      servingInfo: primaryFood.serving_info ? {
        description: primaryFood.serving_info.typical_serving,
        weight: primaryFood.serving_info.weight_per_serving,
        unit: 'g'
      } : null,
      analysisNotes: geminiData.analysis?.notes || null
    };
  }

  transformTextResponse(geminiData) {
    if (!geminiData || !geminiData.food) {
      throw new Error('No nutrition data found for the specified food');
    }

    const food = geminiData.food;

    return {
      nutrition: {
        calories: Math.round(parseFloat(food.nutrition.calories) || 0),
        protein: Math.round(parseFloat(food.nutrition.protein) || 0),
        carbs: Math.round(parseFloat(food.nutrition.carbs) || 0),
        fat: Math.round(parseFloat(food.nutrition.fat) || 0),
        fiber: Math.round(parseFloat(food.nutrition.fiber) || 0)
      },
      category: {
        name: food.name
      },
      source: 'Google Gemini AI',
      isRealData: true,
      itemCount: 1,
      servingInfo: food.serving_info ? {
        description: food.serving_info.typical_serving,
        weight: food.serving_info.weight_per_serving,
        unit: 'g'
      } : null
    };
  }
}

export const geminiService = new GeminiService();
