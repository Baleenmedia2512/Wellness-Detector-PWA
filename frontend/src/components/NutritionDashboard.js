import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import DatePickerCalendar from './DatePickerCalendar';

const NutritionDashboard = ({ user, onBack, apiBaseUrl }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyStats, setDailyStats] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    mealCount: 0
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Generate calendar grid - removed since we're using the separate component

  // Meal time categories with updated times for better categorization
  const getMealCategory = (timeString) => {
    const hour = new Date(timeString).getHours();
    
    if (hour >= 5 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 12) return 'morning-snack';
    if (hour >= 12 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 18) return 'evening-snack';
    if (hour >= 18 && hour < 23) return 'dinner';
    return 'late-night';
  };

  const getMealCategoryInfo = (category) => {
    const categories = {
      'breakfast': { name: 'Breakfast', icon: '🌅', time: '5:00 - 10:00', color: 'from-green-400 to-emerald-400', targetCalories: 525 },
      'morning-snack': { name: 'Morning Snack', icon: '☕', time: '10:00 - 12:00', color: 'from-emerald-400 to-teal-400', targetCalories: 262 },
      'lunch': { name: 'Lunch', icon: '🍽️', time: '12:00 - 16:00', color: 'from-teal-400 to-cyan-400', targetCalories: 650 },
      'evening-snack': { name: 'Evening Snack', icon: '🍎', time: '16:00 - 18:00', color: 'from-cyan-400 to-blue-400', targetCalories: 200 },
      'dinner': { name: 'Dinner', icon: '🌙', time: '18:00 - 23:00', color: 'from-blue-400 to-indigo-400', targetCalories: 700 },
      'late-night': { name: 'Late Night', icon: '🌃', time: '23:00 - 5:00', color: 'from-gray-400 to-slate-400', targetCalories: 150 }
    };
    return categories[category] || categories['late-night'];
  };

  // Detect if user is on mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  };

  // Generate horizontal calendar dates (7 days centered around selected date)
  const generateHorizontalCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    // Get 7 days: 3 before selected, selected, 3 after selected
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      
      // Check if this is the first day of a new month in our date range
      const prevDate = i > -3 ? new Date(selectedDate) : null;
      if (prevDate) {
        prevDate.setDate(selectedDate.getDate() + (i - 1));
      }
      
      const isNewMonth = i === -3 || (prevDate && date.getMonth() !== prevDate.getMonth());
      
      dates.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.toDateString() === today.toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        isFuture: date > today,
        isNewMonth: isNewMonth
      });
    }
    
    return dates;
  };

  // Generate extended date range for mobile scrolling (3 weeks = 21 days before today)
  const generateScrollableDates = () => {
    const dates = [];
    const today = new Date();
    
    // Generate 21 days: 20 days before today + today (no future dates)
    for (let i = -20; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Check if this is the first day of a new month
      const prevDate = i > -20 ? new Date(today) : null;
      if (prevDate) {
        prevDate.setDate(today.getDate() + (i - 1));
      }
      
      const isNewMonth = i === -20 || (prevDate && date.getMonth() !== prevDate.getMonth());
      
      dates.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.toDateString() === today.toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        isFuture: false, // No future dates in this range
        isNewMonth: isNewMonth
      });
    }
    
    return dates;
  };

  // Auto-scroll to selected date on mobile and close calendar
  useEffect(() => {
    if (isMobileDevice()) {
      setTimeout(() => {
        const scrollableDates = generateScrollableDates();
        const selectedIndex = scrollableDates.findIndex(dateObj => 
          dateObj.date.toDateString() === selectedDate.toDateString()
        );
        if (selectedIndex !== -1) {
          const dateElement = document.querySelector(`[data-date-index="${selectedIndex}"]`);
          if (dateElement) {
            dateElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }, 100);
    }
    
    // Close calendar when date changes (for both web and mobile)
    setShowCalendar(false);
  }, [selectedDate]);

  const fetchDayAnalyses = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = user.id || user.uid || user.email;
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Use the enhanced API for better performance
      const response = await fetch(
        `${apiBaseUrl}/api/user-nutrition-stats?userId=${userId}&date=${dateString}&detailed=true`
      );
      const data = await response.json();
      
      if (data.success) {
        const analysesData = data.data || [];
        setAnalyses(analysesData);
        
        // Always calculate daily stats from the actual data to ensure accuracy
        calculateDailyStats(analysesData);
      } else {
        setError('Failed to load nutrition data');
        console.error('API Error:', data.message);
      }
    } catch (err) {
      console.error('Failed to fetch day analyses:', err);
      setError('Failed to load nutrition data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user, apiBaseUrl]);

  const calculateDailyStats = (dayAnalyses) => {
    const stats = dayAnalyses.reduce((acc, analysis) => {
      // Parse nutrition data from AnalysisData JSON
      const foodData = parseAnalysisData(analysis.AnalysisData);
      const nutrition = foodData.nutrition || {};
      
      // Use JSON nutrition data, fallback to database columns
      const calories = nutrition.calories || analysis.TotalCalories || 0;
      const protein = nutrition.protein || analysis.TotalProtein || 0;
      const carbs = nutrition.carbs || analysis.TotalCarbs || 0;
      const fat = nutrition.fat || analysis.TotalFat || 0;
      const fiber = nutrition.fiber || analysis.TotalFiber || 0;
      
      return {
        totalCalories: acc.totalCalories + calories,
        totalProtein: acc.totalProtein + protein,
        totalCarbs: acc.totalCarbs + carbs,
        totalFat: acc.totalFat + fat,
        totalFiber: acc.totalFiber + fiber,
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
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    
    // Don't allow future dates
    const today = new Date();
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  const parseAnalysisData = (analysisData) => {
    try {
      const parsed = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
      
      // Handle new data structure from your database
      if (parsed.category && parsed.category.name) {
        return {
          name: parsed.category.name,
          nutrition: parsed.nutrition || {},
          confidence: parsed.confidence === 'medium' ? 0.7 : parsed.confidence === 'high' ? 0.9 : parsed.confidence === 'low' ? 0.5 : parsed.confidence || null,
          detailedItems: parsed.detailedItems || []
        };
      }
      
      // Handle legacy data structure
      if (parsed.foods && parsed.foods.length > 0) {
        const firstFood = parsed.foods[0];
        return {
          name: firstFood.name || 'Unknown Food',
          nutrition: firstFood.nutrition || {},
          confidence: firstFood.confidence || null,
          detailedItems: []
        };
      }
      
      return { name: 'Unknown Food', nutrition: {}, confidence: null, detailedItems: [] };
    } catch (err) {
      console.error('Error parsing analysis data:', err);
      return { name: 'Error parsing data', nutrition: {}, confidence: null, detailedItems: [] };
    }
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
      {/* Background Elements - Simplified */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-tr from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Fixed Header - Clean Design */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
          <div className="flex items-center justify-between p-4 md:p-6">
            <button
              onClick={onBack}
              className="p-2 md:p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            
            <div className="text-center">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">Nutrition</h1>
              <p className="text-sm text-gray-600">{formatDateHeader(selectedDate)}</p>
            </div>
            
            {/* Calendar Button */}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="p-2 md:p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Calendar className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Date Calendar - Clean Design */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
          {isMobileDevice() ? (
            // Mobile: Horizontal Scrollable Date List
            <div className="px-4 py-3">
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="flex space-x-2 pb-1" style={{ minWidth: 'max-content' }}>
                  {generateScrollableDates().map((day, index) => (
                    <React.Fragment key={index}>
                      {/* Mobile Month Separator */}
                      {day.isNewMonth && index > 0 && (
                        <div className="flex items-center justify-center mx-1 relative">
                          <div className="backdrop-blur-sm bg-white/30 rounded-lg px-1.5 py-1.5 shadow-sm border border-white/20">
                            <div 
                              className="text-xs font-semibold text-gray-600"
                              style={{ 
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                fontSize: '9px',
                                letterSpacing: '1px'
                              }}
                            >
                              {day.monthName.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Mobile Date Button */}
                      <button
                        data-date-index={index}
                        onClick={() => setSelectedDate(day.date)}
                        className={`
                          flex-shrink-0 w-12 text-center py-2 px-1 rounded-lg transition-all duration-300 relative backdrop-blur-sm border
                          ${day.isSelected 
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg scale-105 border-emerald-300' 
                            : day.isToday && !day.isSelected
                              ? 'bg-white/40 text-gray-800 border-white/30 shadow-md'
                              : 'text-gray-600 hover:bg-white/30 bg-white/20 border-white/20'
                          }
                        `}
                      >
                        <div className="text-xs font-medium mb-0.5">{day.dayName}</div>
                        <div className="text-sm font-semibold">
                          {day.dayNumber}
                        </div>
                        
                        {/* Today indicator */}
                        {day.isToday && (
                          <div className={`w-1 h-1 rounded-full mx-auto mt-0.5 ${
                            day.isSelected ? 'bg-white' : 'bg-emerald-500'
                          }`} />
                        )}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Web: Fixed 7-day view with arrows
            <div className="flex items-center px-4 py-3 md:px-6 md:py-4">
              {/* Left Arrow */}
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 md:p-3 hover:bg-white/30 rounded-xl md:rounded-2xl transition-all duration-300 mr-2 md:mr-3 backdrop-blur-sm border border-white/20"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
              </button>

              {/* Date Carousel */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-center space-x-1 md:space-x-2">
                  {generateHorizontalCalendarDates().map((day, index) => (
                    <React.Fragment key={index}>
                      {/* Web Month Separator */}
                      {day.isNewMonth && index > 0 && (
                        <div className="flex items-center justify-center mx-1 md:mx-2 relative h-full">
                          <div className="backdrop-blur-sm bg-white/30 rounded-lg md:rounded-xl px-1.5 md:px-2 py-2 md:py-3 shadow-sm border border-white/20">
                            <div 
                              className="text-xs font-bold text-gray-600 tracking-wider"
                              style={{ 
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                letterSpacing: '2px'
                              }}
                            >
                              {day.monthName.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Web Date Button */}
                      <button
                        onClick={() => !day.isFuture && setSelectedDate(day.date)}
                        disabled={day.isFuture}
                        className={`
                          w-12 h-12 md:w-16 md:h-16 text-center rounded-lg md:rounded-2xl transition-all duration-300 relative backdrop-blur-sm border
                          ${day.isSelected 
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg scale-105 border-emerald-300' 
                            : day.isToday && !day.isSelected
                              ? 'bg-white/40 text-gray-800 border-white/30 shadow-md'
                              : day.isFuture
                                ? 'text-gray-300 cursor-not-allowed bg-white/10 border-white/10'
                                : 'text-gray-600 hover:bg-white/30 bg-white/20 border-white/20'
                          }
                        `}
                      >
                        <div className="text-xs font-medium mb-0.5 md:mb-1">{day.dayName}</div>
                        <div className="text-sm md:text-lg font-semibold">
                          {day.dayNumber}
                        </div>
                        
                        {/* Today indicator */}
                        {day.isToday && (
                          <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mx-auto mt-0.5 md:mt-1 ${
                            day.isSelected ? 'bg-white' : 'bg-emerald-500'
                          }`} />
                        )}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => navigateDate(1)}
                disabled={(() => {
                  const nextDay = new Date(selectedDate);
                  nextDay.setDate(selectedDate.getDate() + 1);
                  return nextDay > new Date();
                })()}
                className="p-2 md:p-3 hover:bg-white/30 rounded-xl md:rounded-2xl transition-all duration-300 ml-2 md:ml-3 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Calendar with Slide Animation */}
      <div className={`bg-white border-b border-green-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${
        showCalendar ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className={`max-w-md mx-auto p-4 transform transition-transform duration-300 ease-in-out ${
          showCalendar ? 'translate-y-0' : '-translate-y-4'
        }`}>
          <div className="bg-white rounded-2xl border border-green-100">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-100">
              <button
                onClick={() => {
                  const prevMonth = new Date(calendarMonth);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setCalendarMonth(prevMonth);
                }}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-green-600" />
              </button>
              
              <h3 className="text-lg font-semibold text-green-900">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => {
                  const nextMonth = new Date(calendarMonth);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setCalendarMonth(nextMonth);
                }}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-green-600" />
              </button>
            </div>
            
            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 px-4 pb-4">
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const today = new Date();
                
                // Get first day of month and number of days
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
                
                const days = [];
                
                // Add empty cells for days before the month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                  const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
                  days.push({
                    date: prevDate,
                    dayNumber: prevDate.getDate(),
                    isCurrentMonth: false,
                    isToday: prevDate.toDateString() === today.toDateString(),
                    isSelected: prevDate.toDateString() === selectedDate.toDateString(),
                    isFuture: prevDate > today
                  });
                }
                
                // Add days of current month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  days.push({
                    date: date,
                    dayNumber: day,
                    isCurrentMonth: true,
                    isToday: date.toDateString() === today.toDateString(),
                    isSelected: date.toDateString() === selectedDate.toDateString(),
                    isFuture: date > today
                  });
                }
                
                // Add days from next month to fill the grid
                const remainingCells = 42 - days.length; // 6 rows × 7 days
                for (let day = 1; day <= remainingCells; day++) {
                  const nextDate = new Date(year, month + 1, day);
                  days.push({
                    date: nextDate,
                    dayNumber: day,
                    isCurrentMonth: false,
                    isToday: nextDate.toDateString() === today.toDateString(),
                    isSelected: nextDate.toDateString() === selectedDate.toDateString(),
                    isFuture: nextDate > today
                  });
                }
                
                return days.map((day, index) => {
                  const isDisabled = day.isFuture;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedDate(day.date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={isDisabled}
                      className={`
                        aspect-square p-2 text-sm font-medium rounded-lg transition-all duration-200 relative
                        ${day.isSelected
                          ? 'bg-green-500 text-white shadow-lg transform scale-105'
                          : day.isToday && !day.isSelected
                            ? 'bg-green-100 text-green-700 border-2 border-green-300 font-bold'
                            : day.isCurrentMonth
                              ? isDisabled
                                ? 'text-gray-400 cursor-not-allowed opacity-50'
                                : 'text-gray-700 hover:bg-green-50 hover:scale-105'
                              : isDisabled
                                ? 'text-gray-300 cursor-not-allowed opacity-30'
                                : 'text-gray-400 hover:bg-green-50 hover:scale-105'
                        }
                      `}
                    >
                      {day.dayNumber}
                      
                      {/* Today indicator dot */}
                      {day.isToday && !day.isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:max-w-2xl lg:max-w-4xl md:mx-auto pb-4 md:pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 md:px-6">
            <div className="backdrop-blur-xl bg-white/30 rounded-2xl md:rounded-3xl p-8 md:p-12 border border-white/30 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-emerald-300 border-t-emerald-600 mb-4 md:mb-6 mx-auto"></div>
              <p className="text-gray-700 font-semibold text-lg md:text-xl text-center">Loading nutrition data...</p>
              <p className="text-gray-600 text-sm mt-2 text-center">Please wait</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 md:py-20 px-4 md:px-6">
            <div className="backdrop-blur-xl bg-white/30 rounded-2xl md:rounded-3xl p-8 md:p-12 border border-white/30 shadow-2xl">
              <div className="text-5xl md:text-7xl mb-4 md:mb-6">😔</div>
              <div className="text-red-600 mb-3 md:mb-4 text-lg md:text-xl font-semibold">{error}</div>
              <button
                onClick={() => fetchDayAnalyses(selectedDate)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl font-semibold backdrop-blur-sm border border-white/20"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Nutrition Overview Section - Redesigned */}
            <div className="px-4 md:px-6 mt-3 md:mt-6 mb-4 md:mb-8">
              <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow p-5">
                <div className="flex items-center mb-4">
                  {/* Circular progress for calories */}
                  <div className="relative w-16 h-16 flex-shrink-0 mr-4">
                    <svg className="w-16 h-16" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                      <circle
                        cx="20" cy="20" r="18" fill="none"
                        stroke="#22C55E"
                        strokeWidth="4"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - Math.min(1, (dailyStats.totalCalories || 0) / 1800))}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s' }}
                      />
                      <text x="20" y="24" textAnchor="middle" fontSize="16" fill="#222">🍽️</text>
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {dailyStats.totalCalories || 0} <span className="font-normal text-gray-500 text-base">of 1,800</span>
                    </div>
                    <div className="text-gray-500 text-sm">Cal Eaten</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {/* Protein */}
                  {(() => {
                    const proteinPercent = (dailyStats.totalProtein / 36) * 100 || 0;
                    let proteinColor = '';
                    if (proteinPercent > 100) proteinColor = 'bg-red-500';
                    else if (proteinPercent >= 80) proteinColor = 'bg-green-500'; // bright green
                    else if (proteinPercent >= 60) proteinColor = 'bg-green-300'; // light green
                    else if (proteinPercent >= 30) proteinColor = 'bg-orange-300'; // light orange
                    else if (proteinPercent >= 1) proteinColor = 'bg-orange-500'; // bright orange
                    else proteinColor = 'bg-gray-200';
                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Protein:</span>
                          <span className="font-semibold">{Math.round(proteinPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${proteinColor}`}
                            style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  {/* Carbs */}
                  {(() => {
                    const carbsPercent = (dailyStats.totalCarbs / 225) * 100 || 0;
                    let carbsColor = '';
                    if (carbsPercent > 100) carbsColor = 'bg-red-500';
                    else if (carbsPercent >= 80) carbsColor = 'bg-green-500';
                    else if (carbsPercent >= 60) carbsColor = 'bg-green-300';
                    else if (carbsPercent >= 30) carbsColor = 'bg-orange-300';
                    else if (carbsPercent >= 1) carbsColor = 'bg-orange-500';
                    else carbsColor = 'bg-gray-200';
                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Carbs:</span>
                          <span className="font-semibold">{Math.round(carbsPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${carbsColor}`}
                            style={{ width: `${Math.min(carbsPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  {/* Fats */}
                  {(() => {
                    const fatPercent = (dailyStats.totalFat / 60) * 100 || 0;
                    let fatColor = '';
                    if (fatPercent > 100) fatColor = 'bg-red-500';
                    else if (fatPercent >= 80) fatColor = 'bg-green-500';
                    else if (fatPercent >= 60) fatColor = 'bg-green-300';
                    else if (fatPercent >= 30) fatColor = 'bg-orange-300';
                    else if (fatPercent >= 1) fatColor = 'bg-orange-500';
                    else fatColor = 'bg-gray-200';
                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Fats:</span>
                          <span className="font-semibold">{Math.round(fatPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${fatColor}`}
                            style={{ width: `${Math.min(fatPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  {/* Fibre */}
                  {(() => {
                    const fiberPercent = (dailyStats.totalFiber / 30) * 100 || 0;
                    let fiberColor = '';
                    if (fiberPercent > 100) fiberColor = 'bg-red-500';
                    else if (fiberPercent >= 80) fiberColor = 'bg-green-500';
                    else if (fiberPercent >= 60) fiberColor = 'bg-green-400';
                    else if (fiberPercent >= 30) fiberColor = 'bg-orange-400';
                    else if (fiberPercent >= 1) fiberColor = 'bg-orange-500';
                    else fiberColor = 'bg-gray-200';
                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Fibre:</span>
                          <span className="font-semibold">{Math.round(fiberPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${fiberColor}`}
                            style={{ width: `${Math.min(fiberPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Clean Readable Meals Section */}
            <div className="px-4 md:px-6 space-y-6">
              {dailyStats.mealCount === 0 ? (
                <div className="text-center py-12 md:py-20 backdrop-blur-xl bg-white/20 rounded-2xl md:rounded-3xl shadow-2xl border border-white/30">
                  <div className="text-5xl md:text-7xl mb-4 md:mb-6">🍽️</div>
                  <p className="text-gray-700 font-semibold mb-2 md:mb-3 text-lg md:text-2xl">No meals tracked today</p>
                  <p className="text-gray-600 text-sm md:text-base px-6 md:px-8 leading-relaxed">
                    Start tracking your meals by taking photos of your food. Your nutrition data will appear here automatically!
                  </p>
                  <div className="mt-6 md:mt-8 flex justify-center space-x-4 md:space-x-6 text-3xl md:text-5xl">
                    <span className="animate-bounce">📸</span>
                    <span className="text-gray-400">➡️</span>
                    <span className="animate-pulse">📊</span>
                  </div>
                </div>
                            ) : (
                <>
                  {['breakfast', 'morning-snack', 'lunch', 'evening-snack', 'dinner', 'late-night'].map(category => {
                    const meals = groupedMeals[category] || [];
                    if (meals.length === 0) return null;
                    
                    const categoryInfo = getMealCategoryInfo(category);
                    
                    // Calculate category totals from AnalysisData JSON
                    const categoryCalories = meals.reduce((sum, meal) => {
                      const foodData = parseAnalysisData(meal.AnalysisData);
                      return sum + (foodData.nutrition.calories || meal.TotalCalories || 0);
                    }, 0);
                    
                    return (
                      <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        {/* Clean Category Header */}
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{categoryInfo.name}</h3>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {Math.round(categoryCalories)} of {categoryInfo.targetCalories || 525} Cal
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Clean Meals List */}
                        <div className="divide-y divide-gray-100">
                          {meals.map((meal, index) => {
                            const foodData = parseAnalysisData(meal.AnalysisData);
                            const mealTime = new Date(meal.CreatedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            
                            // Use nutrition data from AnalysisData JSON, fallback to database columns
                            const calories = foodData.nutrition.calories || meal.TotalCalories || 0;
                            const protein = foodData.nutrition.protein || meal.TotalProtein || 0;
                            const carbs = foodData.nutrition.carbs || meal.TotalCarbs || 0;
                            const fat = foodData.nutrition.fat || meal.TotalFat || 0;
                            const fiber = foodData.nutrition.fiber || meal.TotalFiber || 0;
                            
                            return (
                              <div 
                                key={meal.ID} 
                                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedMeal(meal)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-base font-medium text-gray-900 mb-1">
                                      {foodData.name}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {foodData.serving || `Logged at ${mealTime}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <div className="text-base font-semibold text-gray-900">
                                        {calories ? `${Math.round(calories)}.0 Cal` : '— Cal'}
                                      </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detailed Meal Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Meal Details</h2>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {(() => {
                const foodData = parseAnalysisData(selectedMeal.AnalysisData);
                const mealTime = new Date(selectedMeal.CreatedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const mealDate = new Date(selectedMeal.CreatedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                // Use nutrition data from AnalysisData JSON, fallback to database columns
                const calories = foodData.nutrition.calories || selectedMeal.TotalCalories || 0;
                const protein = foodData.nutrition.protein || selectedMeal.TotalProtein || 0;
                const carbs = foodData.nutrition.carbs || selectedMeal.TotalCarbs || 0;
                const fat = foodData.nutrition.fat || selectedMeal.TotalFat || 0;
                const fiber = foodData.nutrition.fiber || selectedMeal.TotalFiber || 0;
                const sugar = foodData.nutrition.sugar || selectedMeal.TotalSugar || 0;
                const sodium = foodData.nutrition.sodium || selectedMeal.TotalSodium || 0;

                return (
                  <>
                    {/* Food Image */}
                    {selectedMeal.ImagePath && (
                      <div className="mb-6">
                        <img
                          src={`${apiBaseUrl}${selectedMeal.ImagePath}`}
                          alt={foodData.name}
                          className="w-full h-48 object-cover rounded-xl"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Food Name and Basic Info */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{foodData.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span>{mealTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <span>{mealDate}</span>
                        </div>
                      </div>
                      {foodData.confidence && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {Math.round(foodData.confidence * 100)}% confidence
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Calories Highlight */}
                    <div className="bg-orange-50 rounded-xl p-4 mb-6 text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {calories ? Math.round(calories) : '—'}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">Calories</div>
                    </div>

                    {/* Detailed Nutrition Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Nutrition Information</h4>
                      
                      {/* Macronutrients */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <div className="text-xl font-bold text-green-600">
                            {carbs ? `${Math.round(carbs)}g` : '—'}
                          </div>
                          <div className="text-sm text-green-600 font-medium">Carbohydrates</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <div className="text-xl font-bold text-blue-600">
                            {protein ? `${Math.round(protein)}g` : '—'}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">Protein</div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4 text-center">
                          <div className="text-xl font-bold text-yellow-600">
                            {fat ? `${Math.round(fat)}g` : '—'}
                          </div>
                          <div className="text-sm text-yellow-600 font-medium">Total Fat</div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <div className="text-xl font-bold text-purple-600">
                            {fiber ? `${Math.round(fiber)}g` : '—'}
                          </div>
                          <div className="text-sm text-purple-600 font-medium">Fiber</div>
                        </div>
                      </div>

                      {/* Additional Nutrients */}
                      {(sugar > 0 || sodium > 0) && (
                        <div className="mt-6">
                          <h5 className="text-base font-semibold text-gray-900 mb-3">Additional Information</h5>
                          <div className="space-y-3">
                            {sugar > 0 && (
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-700">Sugar</span>
                                <span className="font-medium text-gray-900">{Math.round(sugar)}g</span>
                              </div>
                            )}
                            {sodium > 0 && (
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-700">Sodium</span>
                                <span className="font-medium text-gray-900">{Math.round(sodium)}mg</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-700">Processed By</span>
                              <span className="font-medium text-gray-900">{selectedMeal.ProcessedBy || 'Manual Entry'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-6 space-y-3">
                        <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
                          Edit Meal
                        </button>
                        <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                          Delete Meal
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDashboard;
