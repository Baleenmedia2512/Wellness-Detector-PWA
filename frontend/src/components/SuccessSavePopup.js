import React, { useState } from 'react';

/**
 * SuccessSavePopup
 * Shows a single popup when open=true OR multiple popups when popups array is provided
 * Props:
 * - open: boolean (for single popup mode)
 * - popups: array of { id, nutritionData, imagePreview } (for stack mode)
 * - onClose: function(id) or function() for single mode
 * - onDelete: function(id) or function() for single mode
 * - nutritionData: object (for single popup mode)
 * - imagePreview: string (for single popup mode)
 */
const SuccessSavePopup = ({ 
  open, 
  popups, 
  onClose, 
  onDelete, 
  nutritionData, 
  imagePreview 
}) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderNutritionDetails = (data) => {
    const nutrition = data?.nutrition || {};
    const mainNutrient = {
      label: 'Calories',
      value: nutrition.calories,
      unit: '',
      emoji: '🔥',
      bgColor: 'bg-red-50/70 backdrop-blur-sm',
      borderColor: 'border-red-400/50',
      textColor: 'text-red-700'
    };

    const otherNutrients = [
      { label: 'Carbs', value: nutrition.carbs, unit: 'g', emoji: '🌾', bgColor: 'bg-yellow-50/70 backdrop-blur-sm', borderColor: 'border-yellow-400/50', textColor: 'text-yellow-700' },
      { label: 'Protein', value: nutrition.protein, unit: 'g', emoji: '🥩', bgColor: 'bg-blue-50/70 backdrop-blur-sm', borderColor: 'border-blue-400/50', textColor: 'text-blue-700' },
      { label: 'Fat', value: nutrition.fat, unit: 'g', emoji: '🥑', bgColor: 'bg-purple-50/70 backdrop-blur-sm', borderColor: 'border-purple-400/50', textColor: 'text-purple-700' },
      { label: 'Fiber', value: nutrition.fiber, unit: 'g', emoji: '🌿', bgColor: 'bg-green-50/70 backdrop-blur-sm', borderColor: 'border-green-400/50', textColor: 'text-green-700' }
    ];

    return (
      <div className="mt-4 p-4 bg-white/60 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-lg">
        <h4 className="font-semibold text-gray-800 text-sm mb-3">Nutrition Facts</h4>
        
        {/* Calories - Full Width */}
        <div className={`p-4 rounded-xl border ${mainNutrient.borderColor} ${mainNutrient.bgColor} mb-3 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{mainNutrient.emoji}</span>
              <span className={`text-sm font-medium ${mainNutrient.textColor}`}>{mainNutrient.label}</span>
            </div>
            <div className={`text-2xl font-bold ${mainNutrient.textColor}`}>
              {mainNutrient.value || 0}{mainNutrient.unit}
            </div>
          </div>
        </div>

        {/* Other Nutrients - 2 per row */}
        <div className="grid grid-cols-2 gap-3">
          {otherNutrients.map((nutrient, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${nutrient.borderColor} ${nutrient.bgColor} shadow-sm`}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm">{nutrient.emoji}</span>
                <span className={`text-xs font-medium ${nutrient.textColor}`}>{nutrient.label}</span>
              </div>
              <div className={`text-lg font-bold ${nutrient.textColor}`}>
                {nutrient.value || 0}{nutrient.unit}
              </div>
            </div>
          ))}
        </div>

        {data?.category?.description && (
          <div className="mt-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
            <div className="text-xs font-medium text-gray-600 mb-1">Description</div>
            <div className="text-sm text-gray-800">{data.category.description}</div>
          </div>
        )}
      </div>
    );
  };
  // Single popup mode
  if (open && !popups) {
    const isExpanded = expandedId === 'single';
    
    return (
      <div className="fixed z-50 bottom-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className={`pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-green-200 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-md' : ''}`}>
          {/* Main Content */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Image */}
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-16 h-16 object-cover rounded-xl border-2 border-green-200 shadow-sm flex-shrink-0"
                />
              )}
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800 text-base truncate">
                    {nutritionData?.category?.name || 'Food'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-green-100 text-xs text-green-700 font-semibold whitespace-nowrap">
                    ✓ Saved
                  </span>
                </div>
                
                {/* Nutrition Info */}
                <div className="text-xs text-gray-600 mb-2 leading-relaxed">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>{nutritionData?.nutrition?.calories || 0} cal</span>
                    <span>{nutritionData?.nutrition?.carbs || 0}g carbs</span>
                    <span>{nutritionData?.nutrition?.protein || 0}g protein</span>
                  </div>
                </div>
                
                {/* View Details Link */}
                <button
                  onClick={() => toggleExpanded('single')}
                  className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline transition-colors"
                >
                  {isExpanded ? 'Hide Details ↑' : 'View Details →'}
                </button>
              </div>
              
              {/* Close Button - Always visible */}
              <button
                onClick={() => onClose()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Close"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Expanded Details */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              {isExpanded && renderNutritionDetails(nutritionData)}
            </div>
          </div>
          
          {/* Delete Button - Only visible when expanded */}
          {isExpanded && (
            <div className="px-4 pb-4 transition-all duration-300 ease-in-out">
              <button
                onClick={() => onDelete()}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Stack mode
  if (!popups || popups.length === 0) return null;

  return (
    <div className="fixed z-50 bottom-4 left-4 right-4 flex justify-center pointer-events-none">
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {popups.map((popup, idx) => {
          const isExpanded = expandedId === popup.id;
          
          return (
            <div
              key={popup.id}
              className={`pointer-events-auto w-full bg-white rounded-2xl shadow-2xl border border-green-200 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-md' : ''}`}
              style={{ marginTop: idx === 0 ? 0 : '-8px' }}
            >
              {/* Main Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Image */}
                  {popup.imagePreview && (
                    <img
                      src={popup.imagePreview}
                      alt="Food preview"
                      className="w-16 h-16 object-cover rounded-xl border-2 border-green-200 shadow-sm flex-shrink-0"
                    />
                  )}
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800 text-base truncate">
                        {popup.nutritionData?.category?.name || 'Food'}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-green-100 text-xs text-green-700 font-semibold whitespace-nowrap">
                        ✓ Saved
                      </span>
                    </div>
                    
                    {/* Nutrition Info */}
                    <div className="text-xs text-gray-600 mb-2 leading-relaxed">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span>{popup.nutritionData?.nutrition?.calories || 0} cal</span>
                        <span>{popup.nutritionData?.nutrition?.carbs || 0}g carbs</span>
                        <span>{popup.nutritionData?.nutrition?.protein || 0}g protein</span>
                      </div>
                    </div>
                    
                    {/* View Details Link */}
                    <button
                      onClick={() => toggleExpanded(popup.id)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline transition-colors"
                    >
                      {isExpanded ? 'Hide Details ↑' : 'View Details →'}
                    </button>
                  </div>
                  
                  {/* Close Button - Always visible */}
                  <button
                    onClick={() => onClose(popup.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    title="Close"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Expanded Details */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  {isExpanded && renderNutritionDetails(popup.nutritionData)}
                </div>
              </div>
              
              {/* Delete Button - Only visible when expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 transition-all duration-300 ease-in-out">
                  <button
                    onClick={() => onDelete(popup.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Analysis
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuccessSavePopup;
