import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import GalleryMonitorPlugin from '../plugins/galleryMonitorPlugin';

export const GalleryMonitor = {
  async initialize() {
    // Check if we're running on Android
    if (Capacitor.getPlatform() !== 'android') {
      console.warn('Gallery monitoring only works on Android');
      return false;
    }

    // Request permissions
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    // Start the service
    return this.startMonitoring();
  },

  async setCurrentUser(userId, userEmail = null) {
    try {
      if (Capacitor.getPlatform() === 'android') {
        await GalleryMonitorPlugin.setCurrentUser({ 
          userId, 
          userEmail: userEmail || userId // Use email if provided, otherwise fall back to userId
        });
        console.log('✅ Current user set for background service:', { userId, userEmail });
      }
    } catch (error) {
      console.error('Failed to set current user for background service:', error);
    }
  },

  async getCurrentUser() {
    try {
      if (Capacitor.getPlatform() === 'android') {
        const result = await GalleryMonitorPlugin.getCurrentUser();
        return {
          userId: result.userId,
          userEmail: result.userEmail
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get current user from background service:', error);
      return null;
    }
  },

  async clearCurrentUser() {
    try {
      if (Capacitor.getPlatform() === 'android') {
        await GalleryMonitorPlugin.clearCurrentUser();
        console.log('✅ Current user cleared from background service');
      }
    } catch (error) {
      console.error('Failed to clear current user from background service:', error);
    }
  },

  async requestPermissions() {
    try {
      // Request storage permission
      const permissionResult = await GalleryMonitorPlugin.requestPermissions();
      
      if (!permissionResult.granted) {
        // Use browser alert for now, or implement custom modal
        alert('Permission Needed: Please grant storage access to monitor your food photos');
        return false;
      }

      // Request battery optimization exemption
      await this.requestBatteryOptimizationExemption();
      
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  },

  async requestBatteryOptimizationExemption() {
    try {
      const packageName = await App.getPackageName();
      const intent = 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS';
      const data = `package:${packageName}`;
      
      await App.openUrl({ url: `${intent}?${data}` });
    } catch (error) {
      console.error('Battery optimization request failed:', error);
    }
  },

  async startMonitoring() {
    try {
      // Register app state change listener for background handling
      App.addListener('appStateChange', async (state) => {
        if (!state.isActive) {
          console.log('App going to background, checking gallery...');
          await this.checkGallery();
        }
      });

      // Start native service
      await GalleryMonitorPlugin.startService();
      
      // Initial check
      await this.checkGallery();
      
      // Set up periodic checks (every 15 minutes)
      setInterval(this.checkGallery, 15 * 60 * 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return false;
    }
  },

  async checkGallery() {
    try {
      // This would trigger the native service to check for new images
      const result = await GalleryMonitorPlugin.checkGallery();
      
      if (result.newImages && result.newImages.length > 0) {
        await this.processNewImages(result.newImages);
      }
    } catch (error) {
      console.error('Gallery check failed:', error);
    }
  },

  async processNewImages(images) {
    try {
      // Log notification to console for now
      console.log(`New Food Photos Detected: Found ${images.length} new food photos to analyze`);
      
      // Note: The actual analysis and database saving now happens in the Android background service
      // This JavaScript method is mainly for logging and potential UI notifications
      
      // You could implement a custom notification system here
      // or install @capacitor/local-notifications package
      
      // The background service handles:
      // 1. Image analysis via Gemini API
      // 2. Saving results to MariaDB database
      // 3. Showing Android notifications
      // 4. Retry logic for failed operations
      
      console.log('✅ Background service will handle analysis and database saving');
      
    } catch (error) {
      console.error('Image processing failed:', error);
    }
  },

  async analyzeImage(image) {
    // Note: This method is now primarily handled by the Android background service
    // The service directly calls Gemini API and saves to database
    console.log('Analyzing image in background service:', image.path);
    
    // If you need to analyze from JavaScript for UI purposes, keep this:
    try {
      const { GeminiService } = await import('./geminiService');
      return await GeminiService.analyzeFoodImage(image);
    } catch (error) {
      console.error('JavaScript image analysis failed:', error);
      return null;
    }
  },

  async saveAnalysis(analysis) {
    // Note: Database saving is now handled by the Android background service
    // This method can be used for local storage or UI updates
    console.log('Analysis will be saved by background service:', analysis);
    
    // Optional: Save to local storage for UI purposes
    try {
      const savedAnalyses = JSON.parse(localStorage.getItem('backgroundAnalyses') || '[]');
      savedAnalyses.unshift({
        ...analysis,
        timestamp: Date.now(),
        source: 'background_service'
      });
      
      // Keep only last 50 analyses in local storage
      if (savedAnalyses.length > 50) {
        savedAnalyses.splice(50);
      }
      
      localStorage.setItem('backgroundAnalyses', JSON.stringify(savedAnalyses));
      console.log('✅ Analysis cached locally for UI');
    } catch (error) {
      console.error('Failed to cache analysis locally:', error);
    }
  },

  // New method to get background analyses from local storage
  getLocalBackgroundAnalyses() {
    try {
      return JSON.parse(localStorage.getItem('backgroundAnalyses') || '[]');
    } catch (error) {
      console.error('Failed to get local background analyses:', error);
      return [];
    }
  },

  // New method to clear local background analyses
  clearLocalBackgroundAnalyses() {
    try {
      localStorage.removeItem('backgroundAnalyses');
      console.log('✅ Local background analyses cleared');
    } catch (error) {
      console.error('Failed to clear local background analyses:', error);
    }
  }
};

export default GalleryMonitor;