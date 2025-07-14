// src/services/cameraService.js

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

class CameraService {
  isNativeApp() {
    return Capacitor.isNativePlatform();
  }

  async takePhoto() {
    if (this.isNativeApp()) {
      // ✅ Native app - use Capacitor Camera
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });

        return {
          success: true,
          src: photo.webPath,
          file: null // Native doesn't return file object
        };
      } catch (err) {
        console.error('Native camera failed:', err);
        return { success: false, error: err.message };
      }
    } else {
      // ✅ Web - fallback to <input type="file" />
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';

        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) {
            resolve({ success: false, error: 'No file selected' });
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              success: true,
              src: reader.result,
              file
            });
          };
          reader.readAsDataURL(file);
        };

        input.click();
      });
    }
  }
}

export const cameraService = new CameraService();
