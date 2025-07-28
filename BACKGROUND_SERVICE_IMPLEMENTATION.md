# Background Service Database Integration - Implementation Guide

## Overview
This implementation adds comprehensive database integration to the Wellness Buddy PWA's background service, allowing automatic saving of food analysis results to your existing MariaDB database.

## Components Implemented

### 1. Database Schema
- **Table**: `food_nutrition_data_table`
- **Location**: `sql/scripts.sql`
- **Features**: 
  - JSON storage for full analysis data
  - Extracted nutrition totals for fast queries
  - User tracking and device info
  - Processing source tracking (background vs manual)

### 2. Backend API Endpoints

#### `/api/save-background-analysis` (POST)
- Saves analysis results from Android background service
- Validates and parses nutrition data
- Stores in `food_nutrition_data_table`

#### `/api/get-background-analysis` (GET)
- Retrieves background analysis results for a user
- Supports pagination
- Returns full analysis data and totals

#### `/api/service-health` (GET)
- Health check endpoint for monitoring
- Database connectivity test
- Service statistics

#### `/api/user-nutrition-stats` (GET)
- Comprehensive user nutrition statistics
- Daily/weekly breakdowns
- Recent analyses summary

### 3. Android Service Components

#### `DatabaseSyncClient.java`
- HTTP client for MariaDB API calls
- Robust error handling and logging
- Connection testing capabilities

#### `RetryQueue.java`
- Persistent retry mechanism for failed saves
- Configurable retry limits (max 3 attempts)
- SharedPreferences-based queue storage
- Comprehensive logging and statistics

#### Updated `GalleryMonitorService.java`
- Integrated database saving workflow
- User context management
- Scheduled retry processing
- Enhanced logging and monitoring

#### Updated `GalleryMonitorPlugin.java`
- User management methods for background service
- Better error handling and logging

### 4. JavaScript Integration

#### Updated `galleryMonitor.js`
- User context management methods
- Local caching for UI purposes
- Background service coordination

#### Updated `App.js`
- Automatic user context sync with background service
- User sign-out handling

## Setup Instructions

### 1. Database Setup
```sql
-- Run this SQL on your MariaDB database
source sql/scripts.sql;
```

### 2. Backend Configuration
- Ensure your `.env` file has correct database credentials:
```env
DB_HOST=your_mariadb_host
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_database_name
```

### 3. Android Configuration
- Update `API_BASE_URL` in `GalleryMonitorService.java`:
```java
// For development (emulator)
private static final String API_BASE_URL = "http://10.0.2.2:3000";

// For production
private static final String API_BASE_URL = "https://your-production-url.com";
```

### 4. Build and Deploy
```bash
# Build frontend
cd frontend
npm run build

# Build Android app
npx cap sync android
npx cap run android
```

## Flow Diagram

```
📱 User takes photo
    ↓
📁 Image saved to gallery
    ↓
👁️ ContentObserver detects change
    ↓
🔍 Service scans for new images
    ↓
📝 Image queued for processing
    ↓
🤖 Gemini API analysis
    ↓
🌐 HTTP POST to /api/save-background-analysis
    ↓
🗄️ MariaDB insert into food_nutrition_data_table
    ↓
✅ Success → Remove from queue
    ❌ Failure → Add to retry queue
    ↓
🔔 Show notification to user
```

## Key Features

### ✅ Implemented Features
- **Automatic Analysis**: Photos analyzed without user intervention
- **Database Integration**: Results saved to your existing MariaDB
- **Retry Logic**: Failed saves automatically retried (up to 3 times)
- **User Context**: Analysis linked to authenticated users
- **Offline Support**: Queues operations when network unavailable
- **Rich Notifications**: Android notifications with nutrition info
- **Service Persistence**: Survives app kills and device reboots
- **Health Monitoring**: API endpoints for service health checks
- **Statistics**: Comprehensive nutrition tracking and analytics

### 🔧 Configuration Options
- **API URL**: Configurable backend endpoint
- **Retry Limits**: Adjustable retry counts
- **Queue Processing**: Scheduled retry intervals
- **User Management**: Automatic user context sync

## Monitoring and Debugging

### Health Check
```bash
curl http://your-backend.com/api/service-health
```

### User Statistics
```bash
curl "http://your-backend.com/api/user-nutrition-stats?userId=USER_ID"
```

### Android Logs
```bash
adb logcat | grep "GalleryMonitorService\|DatabaseSyncClient\|RetryQueue"
```

## Database Queries

### View Recent Background Analyses
```sql
SELECT 
    UserID, TotalCalories, TotalProtein, TotalCarbs, 
    ProcessedBy, CreatedAt
FROM food_nutrition_data_table 
WHERE ProcessedBy = 'background_service' 
ORDER BY CreatedAt DESC 
LIMIT 20;
```

### User Nutrition Summary
```sql
SELECT 
    UserID,
    COUNT(*) as total_meals,
    SUM(TotalCalories) as total_calories,
    AVG(TotalCalories) as avg_calories_per_meal
FROM food_nutrition_data_table 
WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY UserID
ORDER BY total_calories DESC;
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check backend environment variables
   - Verify MariaDB server accessibility
   - Review firewall settings

2. **Background service not saving**
   - Verify API_BASE_URL in Android service
   - Check Android network permissions
   - Review retry queue logs

3. **User context not set**
   - Ensure user authentication is working
   - Check SharedPreferences in Android
   - Verify GalleryMonitorPlugin calls

### Debug Commands
```bash
# Check background service status
adb shell dumpsys activity services | grep GalleryMonitor

# View service logs
adb logcat -s GalleryMonitorService

# Test API endpoint
curl -X POST http://your-backend.com/api/save-background-analysis \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","imagePath":"/test","analysisResult":{},"timestamp":1234567890}'
```

## Performance Considerations

- **Database Indexing**: Indexes on UserID and CreatedAt for fast queries
- **JSON Storage**: Full analysis data in JSON for flexibility
- **Extracted Totals**: Separate columns for nutrition totals enable fast aggregations
- **Retry Queue**: Persistent queue prevents data loss
- **Background Processing**: Non-blocking database operations

## Security Features

- **Encrypted Storage**: API keys stored in Android EncryptedSharedPreferences
- **Input Validation**: All API endpoints validate input data
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **User Isolation**: Data queries filtered by UserID

This implementation provides a robust, scalable solution for automatic food analysis with comprehensive database integration while maintaining the existing functionality of your Wellness Buddy PWA.
