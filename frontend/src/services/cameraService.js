/**
 * Camera Service for PWA
 * Handles camera permissions and device detection
 */

class CameraService {
  constructor() {
    this.hasCamera = null;
    this.hasPermission = null;
  }

  /**
   * Check if the device has camera capabilities
   */
  async checkCameraAvailability() {
    try {
      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        this.hasCamera = false;
        return false;
      }

      // Check for video input devices (cameras)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      this.hasCamera = videoDevices.length > 0;
      
      return this.hasCamera;
    } catch (error) {
      console.warn('Camera availability check failed:', error);
      this.hasCamera = false;
      return false;
    }
  }

  /**
   * Check camera permissions
   */
  async checkCameraPermission() {
    try {
      // Check if Permissions API is supported
      if (!navigator.permissions) {
        // Fallback: assume permission is needed
        this.hasPermission = null;
        return null;
      }

      const permission = await navigator.permissions.query({ name: 'camera' });
      this.hasPermission = permission.state === 'granted';
      
      return permission.state;
    } catch (error) {
      console.warn('Camera permission check failed:', error);
      this.hasPermission = null;
      return null;
    }
  }

  /**
   * Request camera permission by attempting to access camera
   */
  async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera for food photos
        } 
      });
      
      // Stop the stream immediately as we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      
      this.hasPermission = true;
      return true;
    } catch (error) {
      console.warn('Camera permission request failed:', error);
      this.hasPermission = false;
      return false;
    }
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if the app is running as PWA
   */
  isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  /**
   * Get camera info for the current device
   */
  async getCameraInfo() {
    const hasCamera = await this.checkCameraAvailability();
    const permissionState = await this.checkCameraPermission();
    const isMobile = this.isMobileDevice();
    const isPWA = this.isPWA();

    return {
      hasCamera,
      permissionState,
      hasPermission: this.hasPermission,
      isMobile,
      isPWA,
      supportsCapture: hasCamera && isMobile
    };
  }

  /**
   * Get user-friendly message about camera status
   */
  async getCameraStatusMessage() {
    const info = await this.getCameraInfo();
    
    if (!info.hasCamera) {
      return 'Camera not detected on this device. You can still upload photos from your gallery.';
    }
    
    if (info.hasPermission === false) {
      return 'Camera access denied. Please allow camera permission in your browser settings to take photos.';
    }
    
    if (info.hasPermission === null) {
      return 'Camera permission will be requested when you try to take a photo.';
    }
    
    if (info.supportsCapture) {
      return 'Camera ready! You can take photos or select from gallery.';
    }
    
    return 'Camera detected. You can take photos or select from gallery.';
  }
}

export const cameraService = new CameraService();
