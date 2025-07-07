import React, { forwardRef, useRef } from 'react';

const ImageUpload = forwardRef(({ onImageSelect, imagePreview }, ref) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      
      onImageSelect(file);
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const triggerFileInput = () => {
    // Default behavior for backward compatibility
    cameraInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
      {/* Camera input for direct camera access */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Gallery input for photo library access */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Backward compatibility input */}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {imagePreview ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Selected food"
              className="w-full h-64 object-cover rounded-lg border-2 border-green-300"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              ✓ Ready
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={triggerCamera}
              className="bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200 border border-blue-300 flex items-center justify-center gap-2"
            >
              📷 Take Photo
            </button>
            <button
              onClick={triggerGallery}
              className="bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors duration-200 border border-green-300 flex items-center justify-center gap-2"
            >
              �️ From Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="border-2 border-dashed border-green-300 rounded-lg p-8 hover:border-green-400 transition-colors duration-200">
            <div className="text-6xl mb-4">🍎</div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Upload Food Photo
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Take a photo with camera or select from gallery
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={triggerCamera}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                📷 Take Photo
              </button>
              
              <button
                onClick={triggerGallery}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                �️ From Gallery
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Camera works best on mobile devices • Max 10MB
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;
