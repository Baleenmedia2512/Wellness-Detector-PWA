-- Test script for verifying background service database integration
-- Run these queries in SQL Workbench to monitor the system

-- 1. Check if tables exist and have data
SELECT 
    TABLE_NAME,
    TABLE_ROWS as 'Estimated Rows'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'wellness_buddy'
AND TABLE_NAME IN ('team_table', 'otp_tokens_table', 'food_nutrition_data_table');

-- 2. Check test user
SELECT 
    UserId,
    UserName,
    Email,
    Status,
    EntryDateTime
FROM team_table 
WHERE Email = 'test@wellness.com';

-- 3. Monitor background analysis results (run this after taking photos)
SELECT 
    ID,
    UserID,
    SUBSTRING(ImagePath, -50) as 'Image File',
    JSON_EXTRACT(AnalysisData, '$.foods[0].name') as 'Food Name',
    TotalCalories as 'Calories',
    TotalProtein as 'Protein',
    TotalCarbs as 'Carbs',
    TotalFat as 'Fat',
    TotalFiber as 'Fiber',
    ConfidenceScore as 'Confidence',
    ProcessedBy as 'Source',
    DeviceInfo,
    CreatedAt as 'Analysis Time'
FROM food_nutrition_data_table 
ORDER BY CreatedAt DESC 
LIMIT 10;

-- 4. Check OTP tokens (for login testing)
SELECT 
    ID,
    Recipient,
    ContactType,
    ExpiresAt,
    Verified,
    IsActive,
    CreatedAt
FROM otp_tokens_table 
ORDER BY CreatedAt DESC 
LIMIT 5;

-- 5. Real-time monitoring query (refresh this while testing)
SELECT 
    'Latest Background Analysis' as Status,
    COUNT(*) as 'Total Records',
    MAX(CreatedAt) as 'Last Analysis',
    COUNT(DISTINCT UserID) as 'Unique Users',
    SUM(TotalCalories) as 'Total Calories Tracked'
FROM food_nutrition_data_table;

-- 6. Clean up test data (run if needed)
-- DELETE FROM food_nutrition_data_table WHERE UserID = '1';
-- DELETE FROM otp_tokens_table WHERE Recipient = 'test@wellness.com';
