import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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

  // Generate calendar grid
  const generateCalendarDays = () => {
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
    
    return days;
  };

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
      'breakfast': { name: 'Breakfast', icon: '🌅', time: '5:00 - 10:00', color: 'from-yellow-400 to-orange-400' },
      'morning-snack': { name: 'Morning Snack', icon: '☕', time: '10:00 - 12:00', color: 'from-amber-400 to-yellow-400' },
      'lunch': { name: 'Lunch', icon: '🍽️', time: '12:00 - 16:00', color: 'from-green-400 to-teal-400' },
      'evening-snack': { name: 'Evening Snack', icon: '🍎', time: '16:00 - 18:00', color: 'from-blue-400 to-indigo-400' },
      'dinner': { name: 'Dinner', icon: '🌙', time: '18:00 - 23:00', color: 'from-purple-400 to-pink-400' },
      'late-night': { name: 'Late Night', icon: '🌃', time: '23:00 - 5:00', color: 'from-gray-400 to-slate-400' }
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
        setAnalyses(data.data || []);
        
        // Use the pre-calculated totals from the API
        if (data.dailyTotals) {
          setDailyStats(data.dailyTotals);
        } else {
          // Fallback to client-side calculation
          calculateDailyStats(data.data || []);
        }
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

  // Group analyses by meal category
  const groupedMeals = analyses.reduce((groups, analysis) => {
    const category = getMealCategory(analysis.CreatedAt);
    if (!groups[category]) groups[category] = [];
    groups[category].push(analysis);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Nutrition Dashboard</h1>
              <p className="text-sm text-gray-500">{formatDateHeader(selectedDate)}</p>
            </div>
            
            {/* Calendar Button */}
            <button
              onClick={() => {
                setCalendarMonth(new Date(selectedDate)); // Set calendar to selected date's month
                setShowCalendar(!showCalendar);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Calendar className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Date Calendar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto">
          {isMobileDevice() ? (
            // Mobile: Horizontal Scrollable Date List
            <div className="px-4 py-2">
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
                          <div className="bg-gray-200 rounded px-1 py-1 shadow-sm">
                            <div 
                              className="text-xs font-semibold text-gray-600"
                              style={{ 
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                fontSize: '10px',
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
                          flex-shrink-0 w-12 text-center py-2 px-1 rounded-lg transition-all duration-200 relative
                          ${day.isSelected 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md' 
                            : day.isToday && !day.isSelected
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-xs font-medium mb-1">{day.dayName}</div>
                        <div className={`text-sm font-bold ${day.isSelected ? 'text-white' : ''}`}>
                          {day.dayNumber}
                        </div>
                        
                        {/* Today indicator */}
                        {day.isToday && (
                          <div className={`w-1 h-1 rounded-full mx-auto mt-1 ${
                            day.isSelected ? 'bg-white' : 'bg-blue-500'
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
            <div className="flex items-center px-4 py-3">
              {/* Left Arrow */}
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              {/* Date Carousel */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  {generateHorizontalCalendarDates().map((day, index) => (
                    <React.Fragment key={index}>
                      {/* Web Month Separator */}
                      {day.isNewMonth && index > 0 && (
                        <div className="flex items-center justify-center mx-2 relative h-full">
                          <div className="bg-gray-100 rounded-sm px-1 py-2 shadow-sm">
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
                          flex-1 min-w-0 text-center py-3 px-1 rounded-xl transition-all duration-200 relative
                          ${day.isSelected 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                            : day.isToday && !day.isSelected
                              ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                              : day.isFuture
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="text-xs font-medium mb-1">{day.dayName}</div>
                        <div className={`text-lg font-bold ${day.isSelected ? 'text-white' : ''}`}>
                          {day.dayNumber}
                        </div>
                        
                        {/* Today indicator */}
                        {day.isToday && (
                          <div className={`w-1 h-1 rounded-full mx-auto mt-1 ${
                            day.isSelected ? 'bg-white' : 'bg-blue-500'
                          }`} />
                        )}
                        
                        {/* Month name for first day of month */}
                        {day.dayNumber === 1 && !day.isNewMonth && (
                          <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
                            day.isSelected ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            {day.monthName}
                          </div>
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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Calendar Picker */}
      {showCalendar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCalendar(false);
          }}
        >
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-4 w-full max-w-sm text-white">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const prevMonth = new Date(calendarMonth);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setCalendarMonth(prevMonth);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-lg font-semibold">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => {
                  const nextMonth = new Date(calendarMonth);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setCalendarMonth(nextMonth);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowCalendar(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors ml-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-medium text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!day.isFuture) {
                      setSelectedDate(day.date);
                      setShowCalendar(false);
                    }
                  }}
                  disabled={day.isFuture}
                  className={`
                    aspect-square p-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${day.isSelected
                      ? 'bg-blue-600 text-white shadow-lg'
                      : day.isToday && !day.isSelected
                        ? 'bg-blue-100 text-blue-900 font-bold'
                        : day.isCurrentMonth
                          ? day.isFuture
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-white hover:bg-gray-700'
                          : day.isFuture
                            ? 'text-gray-700 cursor-not-allowed opacity-30'
                            : 'text-gray-500 hover:bg-gray-800'
                    }
                  `}
                >
                  {day.dayNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-md mx-auto pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading nutrition data...</p>
            <p className="text-gray-400 text-sm mt-1">Please wait</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="text-6xl mb-4">😔</div>
            <div className="text-red-500 mb-3 text-lg font-semibold">{error}</div>
            <button
              onClick={() => fetchDayAnalyses(selectedDate)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg font-medium"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Enhanced Daily Overview Stats */}
            <div className="mx-4 mt-4 mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-semibold">Daily Overview</span>
                    </div>
                    <div className="text-sm opacity-90">
                      {dailyStats.mealCount} meal{dailyStats.mealCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Main Calorie Display */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4 shadow-lg">
                      <div className="text-center text-white">
                        <div className="text-2xl font-bold">{Math.round(dailyStats.totalCalories)}</div>
                        <div className="text-xs opacity-90">kcal</div>
                      </div>
                    </div>
                    <h3 className="text-gray-600 font-medium">Total Calories</h3>
                  </div>

                  {/* Enhanced Macros Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-600 font-semibold">Carbs</span>
                        <span className="text-2xl">🍞</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-700 mb-1">
                        {Math.round(dailyStats.totalCarbs)}g
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((dailyStats.totalCarbs / 300) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">Target: 300g</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-600 font-semibold">Protein</span>
                        <span className="text-2xl">🥩</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mb-1">
                        {Math.round(dailyStats.totalProtein)}g
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((dailyStats.totalProtein / 150) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">Target: 150g</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-600 font-semibold">Fat</span>
                        <span className="text-2xl">🥑</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-700 mb-1">
                        {Math.round(dailyStats.totalFat)}g
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((dailyStats.totalFat / 65) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">Target: 65g</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-600 font-semibold">Fiber</span>
                        <span className="text-2xl">🌾</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700 mb-1">
                        {Math.round(dailyStats.totalFiber)}g
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((dailyStats.totalFiber / 25) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-green-600 mt-1">Target: 25g</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Meals by Category */}
            <div className="px-4">
              {dailyStats.mealCount === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-gray-700 font-semibold mb-2 text-xl">No meals tracked today</p>
                  <p className="text-gray-500 text-sm px-8">
                    Start tracking your meals by taking photos of your food. Your nutrition data will appear here automatically!
                  </p>
                  <div className="mt-6 flex justify-center space-x-4 text-4xl">
                    <span>📸</span>
                    <span>➡️</span>
                    <span>📊</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {['breakfast', 'morning-snack', 'lunch', 'evening-snack', 'dinner', 'late-night'].map(category => {
                    const meals = groupedMeals[category] || [];
                    if (meals.length === 0) return null;
                    
                    const categoryInfo = getMealCategoryInfo(category);
                    const categoryCalories = meals.reduce((sum, meal) => sum + (meal.TotalCalories || 0), 0);
                    const categoryProtein = meals.reduce((sum, meal) => sum + (meal.TotalProtein || 0), 0);
                    const categoryCarbs = meals.reduce((sum, meal) => sum + (meal.TotalCarbs || 0), 0);
                    const categoryFat = meals.reduce((sum, meal) => sum + (meal.TotalFat || 0), 0);
                    
                    return (
                      <div key={category} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
                        {/* Enhanced Category Header */}
                        <div className={`bg-gradient-to-r ${categoryInfo.color} px-6 py-4`}>
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center space-x-3">
                              <span className="text-3xl">{categoryInfo.icon}</span>
                              <div>
                                <h4 className="font-bold text-lg">{categoryInfo.name}</h4>
                                <p className="text-sm opacity-90">{categoryInfo.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {Math.round(categoryCalories)}
                              </div>
                              <div className="text-sm opacity-90">kcal</div>
                            </div>
                          </div>
                          
                          {/* Mini Macro Summary */}
                          <div className="mt-3 flex space-x-4 text-sm">
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                              P: {Math.round(categoryProtein)}g
                            </span>
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                              C: {Math.round(categoryCarbs)}g
                            </span>
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                              F: {Math.round(categoryFat)}g
                            </span>
                          </div>
                        </div>
                        
                        {/* Enhanced Meals List */}
                        <div className="divide-y divide-gray-100">
                          {meals.map((meal, index) => {
                            const foodData = parseAnalysisData(meal.AnalysisData);
                            const mealTime = new Date(meal.CreatedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            
                            return (
                              <div key={meal.ID} className="p-5 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h5 className="font-semibold text-gray-900 text-lg">
                                        {foodData.name}
                                      </h5>
                                      {foodData.confidence && (
                                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                                          {Math.round(foodData.confidence * 100)}% match
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                                      <span className="flex items-center space-x-1">
                                        <span>🕐</span>
                                        <span>{mealTime}</span>
                                      </span>
                                      <span className="flex items-center space-x-1">
                                        <span>📱</span>
                                        <span>{meal.ProcessedBy || 'Manual'}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-2xl font-bold text-gray-800">
                                      {meal.TotalCalories ? Math.round(meal.TotalCalories) : '—'}
                                    </div>
                                    <div className="text-sm text-gray-500">kcal</div>
                                  </div>
                                </div>
                                
                                {/* Enhanced Nutrition Info */}
                                <div className="grid grid-cols-4 gap-3">
                                  <div className="text-center bg-orange-50 rounded-lg py-2">
                                    <div className="text-sm font-semibold text-orange-700">
                                      {meal.TotalCarbs ? `${Math.round(meal.TotalCarbs)}g` : '—'}
                                    </div>
                                    <div className="text-xs text-orange-600">Carbs</div>
                                  </div>
                                  <div className="text-center bg-blue-50 rounded-lg py-2">
                                    <div className="text-sm font-semibold text-blue-700">
                                      {meal.TotalProtein ? `${Math.round(meal.TotalProtein)}g` : '—'}
                                    </div>
                                    <div className="text-xs text-blue-600">Protein</div>
                                  </div>
                                  <div className="text-center bg-purple-50 rounded-lg py-2">
                                    <div className="text-sm font-semibold text-purple-700">
                                      {meal.TotalFat ? `${Math.round(meal.TotalFat)}g` : '—'}
                                    </div>
                                    <div className="text-xs text-purple-600">Fat</div>
                                  </div>
                                  <div className="text-center bg-green-50 rounded-lg py-2">
                                    <div className="text-sm font-semibold text-green-700">
                                      {meal.TotalFiber ? `${Math.round(meal.TotalFiber)}g` : '—'}
                                    </div>
                                    <div className="text-xs text-green-600">Fiber</div>
                                  </div>
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
