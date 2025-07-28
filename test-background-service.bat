@echo off
REM Background Service Testing Utility for Windows
REM Run this script to test various scenarios

echo 🧪 Wellness Buddy Background Service Testing
echo =============================================

set BASE_URL=http://localhost:3000
set TEST_USER_ID=277

echo.
echo 📊 1. Database Connection Test
echo ------------------------------
curl -s "%BASE_URL%/api/test-db"

echo.
echo.
echo 📋 2. Latest Background Analysis Results
echo ----------------------------------------
curl -s "%BASE_URL%/api/get-background-analysis?userId=%TEST_USER_ID%&limit=5"

echo.
echo.
echo 👤 3. User Lookup Test
echo ----------------------
curl -s -X POST "%BASE_URL%/api/lookup-user-id" -H "Content-Type: application/json" -d "{\"email\": \"logeshwaran67677@gmail.com\"}"

echo.
echo.
echo 🔍 4. Recent Entries Count
echo -------------------------
curl -s "%BASE_URL%/api/get-background-analysis?userId=%TEST_USER_ID%&limit=10"

echo.
echo.
echo 📱 5. Android Service Status
echo -----------------------------
echo Run this command to check Android logs:
echo adb logcat -s GalleryMonitorService:D DatabaseSyncClient:D RetryQueue:D

echo.
echo ✅ Testing Complete!
echo.
echo Next Steps:
echo 1. Take a food photo on Android device
echo 2. Wait 5-10 seconds  
echo 3. Run this script again to see new entries
echo 4. Check Android logs with: adb logcat -s GalleryMonitorService
