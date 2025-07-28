# Android Testing Guide for Wellness Buddy PWA

## Prerequisites
- Android Emulator running
- Backend server running on localhost:3000
- MySQL database setup with baleeed5_wellness database

## STEP 0: API Testing (Do This First!)

Before testing on Android, verify all APIs are working:

### 1. Test Database Connection
**URL**: http://localhost:3000/api/test-db
**Method**: GET
**Expected Response**:
```json
{
  "success": true,
  "message": "Database connection successful",
  "database": "baleeed5_wellness",
  "tables": ["team_table", "otp_tokens_table", "food_nutrition_data_table", ...],
  "counts": {"team_table": 247, "otp_tokens_table": 37, "food_nutrition_data_table": 0}
}
```

### 2. Test User Lookup API
**URL**: http://localhost:3000/api/lookup-user-id?email=test@wellness.com
**Method**: GET
**Expected Response**:
```json
{
  "success": true,
  "userId": "248",
  "user": {"UserId": 248, "UserName": "testuser", "Email": "test@wellness.com"}
}
```

### 3. Test OTP Send API
**URL**: http://localhost:3000/api/send-otp
**Method**: POST
**Body**: 
```json
{
  "recipient": "test@wellness.com",
  "contactType": "email"
}
```
**Expected Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### 4. Test OTP Verify API  
**URL**: http://localhost:3000/api/verify-otp
**Method**: POST
**Body**:
```json
{
  "recipient": "test@wellness.com",
  "otp": "123456",
  "contactType": "email"
}
```

### 5. Test Background Analysis Save API
**URL**: http://localhost:3000/api/save-background-analysis
**Method**: POST
**Body**:
```json
{
  "userId": "248",
  "imagePath": "/storage/test_image.jpg",
  "analysisResult": {
    "foods": [{
      "name": "Apple",
      "nutrition": {
        "calories": 95,
        "protein": 0.5,
        "carbs": 25,
        "fat": 0.3,
        "fiber": 4.4
      },
      "confidence": 0.95
    }]
  },
  "deviceInfo": "Test API Call"
}
```
**Expected Response**:
```json
{
  "success": true,
  "id": 1,
  "message": "Analysis saved successfully",
  "data": {
    "userId": "248",
    "nutrition": {"calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "fiber": 4.4}
  }
}
```

### 6. Test Get Background Analysis API
**URL**: http://localhost:3000/api/get-background-analysis?userId=248&limit=5
**Method**: GET
**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "UserID": "248",
      "ImagePath": "/storage/test_image.jpg",
      "TotalCalories": 95,
      "TotalProtein": 0.5,
      "CreatedAt": "2025-07-28T10:00:00.000Z"
    }
  ],
  "pagination": {"total": 1, "limit": 5, "offset": 0, "hasMore": false}
}
```

## STEP 1: Android Testing Steps

### 1. Build and Install APK
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

### 2. Enable Network Access in Android Emulator
- The emulator uses `10.0.2.2` to access localhost
- Your GalleryMonitorService is already configured for this

### 3. Test User Login
- Open the app in emulator
- Try OTP login with: test@wellness.com
- Check backend logs for OTP generation

### 4. Test Background Service
- Login successfully
- Take a photo with emulator camera OR
- Add a test image to emulator gallery
- Check Android logs for service activity

### 5. Monitor Database Changes
In SQL Workbench, run:
```sql
-- Check if background analysis data is being saved
SELECT * FROM food_nutrition_data_table ORDER BY created_at DESC LIMIT 5;

-- Check user lookup
SELECT UserId, UserName, Email FROM team_table WHERE Email = 'test@wellness.com';
```

### 6. Debug Android Logs
Use Android Studio Logcat to filter:
- Tag: "GalleryMonitorService"
- Tag: "DatabaseSyncClient"
- Tag: "WellnessBuddy"

## Expected Flow
1. User logs in → User context stored in SharedPreferences
2. Take photo → ContentObserver detects change
3. Image queued → Gemini API analysis
4. Background service → Database save to food_nutrition_data_table
5. Notification shown → User sees analysis results

## Troubleshooting
- If network fails: Check if backend is accessible at http://10.0.2.2:3000/api/test-db
- If database fails: Verify MySQL is running and credentials in .env.local
- If service doesn't start: Check Android permissions in manifest
