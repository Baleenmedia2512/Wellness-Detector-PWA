# Android Background Service Testing Guide

## Prerequisites
✅ Backend server running on localhost:3000
✅ MySQL database (baleeed5_wellness) connected
✅ Android emulator or physical device
✅ Android Studio installed

## Testing Steps

### 1. Build and Install the APK

```bash
# Navigate to frontend directory
cd c:\xampp\htdocs\Wellness-Buddy-PWA\frontend

# Install dependencies (if not done)
npm install

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android
```

### 2. Configure Android Emulator Network

For Android Emulator:
- Backend URL: http://10.0.2.2:3000 ✅ (already configured)
- This maps to your localhost:3000

For Physical Device:
- Find your PC's IP: ipconfig
- Update GalleryMonitorService.java API_BASE_URL
- Example: http://192.168.1.100:3000

### 3. Enable Required Permissions

Ensure these permissions in AndroidManifest.xml:
- READ_EXTERNAL_STORAGE
- CAMERA
- INTERNET
- ACCESS_NETWORK_STATE
- FOREGROUND_SERVICE

### 4. Test User Authentication

Option A - OTP Login:
1. Open the app
2. Use email: test@wellness.com
3. Check backend logs for OTP generation
4. Verify user context is stored

Option B - Firebase Login:
1. Use Google Sign-in
2. Verify email is passed to background service

### 5. Test Background Service

1. **Start Service**: Login triggers background service
2. **Take Photo**: Use camera or add image to gallery
3. **Monitor Logs**: Check Android Studio Logcat
4. **Verify Database**: Check food_nutrition_data_table

### 6. Monitor Real-time Activity

Android Logcat Filters:
- Tag: GalleryMonitorService
- Tag: DatabaseSyncClient
- Tag: WellnessBuddy

Database Query:
```sql
SELECT * FROM food_nutrition_data_table ORDER BY CreatedAt DESC LIMIT 5;
```

## Expected Flow

1. User Login → SharedPreferences updated
2. Photo Taken → ContentObserver triggers
3. Image Queued → Background processing starts
4. Gemini Analysis → Food data extracted
5. Database Save → Record inserted
6. Notification → User sees results

## Debugging Tips

### Check Service Status
```bash
adb shell dumpsys activity services | grep GalleryMonitor
```

### View SharedPreferences
```bash
adb shell
run-as com.wellnessbuddy.app
cat shared_prefs/WellnessBuddy.xml
```

### Check Network Connectivity
```bash
adb shell
ping 10.0.2.2
```

## Test Cases

### Test Case 1: Basic Flow
1. Login with test@wellness.com
2. Take food photo
3. Wait for notification
4. Check database for new record

### Test Case 2: Network Recovery
1. Disable WiFi
2. Take photo (should queue)
3. Enable WiFi
4. Verify delayed processing

### Test Case 3: User Switching
1. Login as User A
2. Take photo
3. Logout, login as User B
4. Take photo
5. Verify separate database records

## Success Indicators

✅ Background service starts on login
✅ ContentObserver detects new images
✅ Gemini API analysis completes
✅ Database saves with correct UserId
✅ Notifications appear with food data
✅ Service persists after app close
