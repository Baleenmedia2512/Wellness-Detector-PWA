@echo off
REM API Testing Script for Wellness Buddy PWA - Windows Version
REM Run this to test all APIs before Android development

set API_BASE=http://localhost:3000
set TEST_EMAIL=test@wellness.com
set TEST_USER_ID=248

echo 🧪 Testing Wellness Buddy APIs...
echo =======================================
echo.

REM Test 1: Database Connection
echo 1. Testing Database Connection...
curl -s "%API_BASE%/api/test-db"
echo.
echo.

REM Test 2: User Lookup
echo 2. Testing User Lookup...
curl -s "%API_BASE%/api/lookup-user-id?email=%TEST_EMAIL%"
echo.
echo.

REM Test 3: Health Check
echo 3. Testing Health Check...
curl -s "%API_BASE%/api/health-check"
echo.
echo.

REM Test 4: OTP Send (POST request)
echo 4. Testing OTP Send...
curl -s -X POST "%API_BASE%/api/send-otp" -H "Content-Type: application/json" -d "{\"recipient\":\"%TEST_EMAIL%\",\"contactType\":\"email\"}"
echo.
echo.

REM Test 5: Background Analysis Save (POST request)
echo 5. Testing Background Analysis Save...
curl -s -X POST "%API_BASE%/api/save-background-analysis" -H "Content-Type: application/json" -d "{\"userId\":\"%TEST_USER_ID%\",\"imagePath\":\"/storage/test_image.jpg\",\"analysisResult\":{\"foods\":[{\"name\":\"Apple\",\"nutrition\":{\"calories\":95,\"protein\":0.5,\"carbs\":25,\"fat\":0.3,\"fiber\":4.4},\"confidence\":0.95}]},\"deviceInfo\":\"Windows CLI Test\"}"
echo.
echo.

REM Test 6: Get Analysis History
echo 6. Testing Get Analysis History...
curl -s "%API_BASE%/api/get-background-analysis?userId=%TEST_USER_ID%&limit=5"
echo.
echo.

echo =======================================
echo ✅ API Testing Complete!
echo.
echo Next steps:
echo 1. Verify all APIs return success: true
echo 2. Check database for test record
echo 3. Proceed to Android testing
echo.
pause
