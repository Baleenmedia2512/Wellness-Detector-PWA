import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';

const NutritionDashboard = ({ user, onBack, apiBaseUrl }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    mealCount: 0
  });

  // Meal time categories
  const getMealCategory = (timeString) => {
    const hour = new Date(timeString).getHours();
    
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 12) return 'morning-snack';
    if (hour >= 12 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'afternoon-snack';
    if (hour >= 18 && hour < 22) return 'dinner';
    return 'late-night';
  };

  const getMealCategoryInfo = (category) => {
    const categories = {
      'breakfast': { name: 'Breakfast', icon: '🌅', time: '6:00 - 10:00' },
      'morning-snack': { name: 'Morning Snack', icon: '☕', time: '10:00 - 12:00' },
      'lunch': { name: 'Lunch', icon: '🍽️', time: '12:00 - 15:00' },
      'afternoon-snack': { name: 'Afternoon Snack', icon: '🍎', time: '15:00 - 18:00' },
      'dinner': { name: 'Dinner', icon: '🌙', time: '18:00 - 22:00' },
      'late-night': { name: 'Late Night', icon: '🌃', time: '22:00 - 6:00' }
    };
    return categories[category] || categories['late-night'];
  };

  const fetchDayAnalyses = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = user.id || user.uid || user.email;
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await fetch(`${apiBaseUrl}/api/get-background-analysis?userId=${userId}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        // Filter analyses for selected date
        const dayAnalyses = (data.data || []).filter(analysis => {
          const analysisDate = new Date(analysis.CreatedAt);
          return analysisDate >= startDate && analysisDate <= endDate;
        });
        
        setAnalyses(dayAnalyses);
        calculateDailyStats(dayAnalyses);
      } else {
        setError('Failed to load nutrition data');
      }
    } catch (err) {
      console.error('Failed to fetch day analyses:', err);
      setError('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  }, [user, apiBaseUrl]);

  const calculateDailyStats = (dayAnalyses) => {
    const stats = dayAnalyses.reduce((acc, analysis) => {
      return {
        totalCalories: acc.totalCalories + (analysis.TotalCalories || 0),
        totalProtein: acc.totalProtein + (analysis.TotalProtein || 0),
        totalCarbs: acc.totalCarbs + (analysis.TotalCarbs || 0),
        totalFat: acc.totalFat + (analysis.TotalFat || 0),
        totalFiber: acc.totalFiber + (analysis.TotalFiber || 0),
        mealCount: acc.mealCount + 1
      };
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      mealCount: 0
    });
    
    setDailyStats(stats);
  };

  useEffect(() => {
    if (user) {
      fetchDayAnalyses(selectedDate);
    }
  }, [user, selectedDate, fetchDayAnalyses]);

  const formatDateHeader = (date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const parseAnalysisData = (analysisData) => {
    try {
      const parsed = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
      
      if (parsed.foods && parsed.foods.length > 0) {
        const firstFood = parsed.foods[0];
        return {
          name: firstFood.name || 'Unknown Food',
          nutrition: firstFood.nutrition || {},
          confidence: firstFood.confidence || null
        };
      }
      
      return { name: 'Unknown Food', nutrition: {}, confidence: null };
    } catch (err) {
      console.error('Error parsing analysis data:', err);
      return { name: 'Error parsing data', nutrition: {}, confidence: null };
    }
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      
      days.push({
        date: day,
        isCurrentMonth: day.getMonth() === currentMonth,
        isToday: day.toDateString() === today.toDateString(),
        isSelected: day.toDateString() === selectedDate.toDateString(),
        isFuture: day > today
      });
    }
    
    return days;
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  // Group analyses by meal category
  const groupedMeals = analyses.reduce((groups, analysis) => {
    const category = getMealCategory(analysis.CreatedAt);
    if (!groups[category]) groups[category] = [];
    groups[category].push(analysis);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-lg font-semibold text-gray-900">
                {formatDateHeader(selectedDate)}
              </span>
              <ChevronRight 
                className={`h-5 w-5 text-gray-500 transition-transform ${showDatePicker ? 'rotate-90' : ''}`} 
              />
            </button>
            
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Date Picker Calendar */}
      {showDatePicker && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => {
                const isDisabled = day.isFuture || !day.isCurrentMonth;
                
                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && selectDate(day.date)}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                      ${day.isSelected && day.isCurrentMonth ? 'bg-green-500 text-white font-semibold' : ''}
                      ${day.isToday && !day.isSelected ? 'bg-green-100 text-green-700 font-semibold' : ''}
                      ${day.isCurrentMonth && !day.isSelected && !day.isToday ? 'text-gray-900 hover:bg-gray-100' : ''}
                      ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                      ${day.isFuture ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-md mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-600">Loading nutrition data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <div className="text-red-500 mb-3 text-lg">⚠️ {error}</div>
            <button
              onClick={() => fetchDayAnalyses(selectedDate)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Daily Overview Stats */}
            <div className="p-4 bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Daily Overview
              </h3>
              
              {/* Main Calorie Display */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border-l-4 border-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-blue-700">
                      {Math.round(dailyStats.totalCalories)}
                    </div>
                    <div className="text-sm text-blue-600">Total Calories</div>
                  </div>
                  <div className="text-4xl">🔥</div>
                </div>
              </div>

              {/* Nutrition Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                  <div className="text-lg font-bold text-orange-600">
                    {Math.round(dailyStats.totalCarbs)}g
                  </div>
                  <div className="text-xs text-gray-600">Carbs</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((dailyStats.totalCarbs / 300) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(dailyStats.totalProtein)}g
                  </div>
                  <div className="text-xs text-gray-600">Protein</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((dailyStats.totalProtein / 150) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(dailyStats.totalFiber)}g
                  </div>
                  <div className="text-xs text-gray-600">Fiber</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((dailyStats.totalFiber / 35) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">
                  {dailyStats.mealCount} meal{dailyStats.mealCount !== 1 ? 's' : ''} tracked
                </span>
              </div>
            </div>

            {/* Meals by Category */}
            <div className="p-4">
              {dailyStats.mealCount === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium mb-2 text-lg">No meals tracked today</p>
                  <p className="text-gray-400 text-sm">
                    Take photos of your food to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {['breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner', 'late-night'].map(category => {
                    const meals = groupedMeals[category] || [];
                    if (meals.length === 0) return null;
                    
                    const categoryInfo = getMealCategoryInfo(category);
                    const categoryCalories = meals.reduce((sum, meal) => sum + (meal.TotalCalories || 0), 0);
                    
                    return (
                      <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        {/* Category Header */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-3xl">{categoryInfo.icon}</span>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-lg">{categoryInfo.name}</h4>
                                <p className="text-sm text-gray-500">{categoryInfo.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">
                                {Math.round(categoryCalories)} cal
                              </div>
                              <div className="text-sm text-gray-500">
                                {meals.length} item{meals.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Meals List */}
                        <div className="divide-y divide-gray-100">
                          {meals.map((meal, index) => {
                            const foodData = parseAnalysisData(meal.AnalysisData);
                            const mealTime = new Date(meal.CreatedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            
                            return (
                              <div key={meal.ID} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 flex items-center space-x-2 mb-1">
                                      <span className="text-lg">{foodData.name}</span>
                                      {foodData.confidence && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          {Math.round(foodData.confidence * 100)}%
                                        </span>
                                      )}
                                    </h5>
                                    <p className="text-sm text-gray-500">{mealTime}</p>
                                  </div>
                                  <div className="text-lg font-semibold text-gray-700">
                                    {meal.TotalCalories ? `${Math.round(meal.TotalCalories)} cal` : 'N/A'}
                                  </div>
                                </div>
                                
                                {/* Mini Nutrition Bar */}
                                <div className="flex space-x-2 text-sm">
                                  {meal.TotalProtein && (
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                      P: {Math.round(meal.TotalProtein)}g
                                    </span>
                                  )}
                                  {meal.TotalCarbs && (
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                                      C: {Math.round(meal.TotalCarbs)}g
                                    </span>
                                  )}
                                  {meal.TotalFat && (
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                      F: {Math.round(meal.TotalFat)}g
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NutritionDashboard;
