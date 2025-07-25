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
      
      // You could implement a custom notification system here
      // or install @capacitor/local-notifications package
      
      // Process each image
      for (const image of images) {
        const analysis = await this.analyzeImage(image);
        await this.saveAnalysis(analysis);
      }
    } catch (error) {
      console.error('Image processing failed:', error);
    }
  },

  async analyzeImage(image) {
    // Implement your image analysis logic here
    console.log('Analyzing image:', image.path);
    
    // Example: Use your Gemini service
    const { GeminiService } = await import('./geminiService');
    return await GeminiService.analyzeFoodImage(image);
  },

  async saveAnalysis(analysis) {
    // Save to your database or local storage
    console.log('Saving analysis:', analysis);
    // Implement your save logic here
  }
};

export default GalleryMonitor;