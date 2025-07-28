# Background Service Testing Scenarios

## 🔐 User Authentication Scenarios

### A. OTP Users (Database Users)
- **Test Case 1**: Login with existing OTP user (`logeshwaran67677@gmail.com`)
- **Expected**: Should use database UserId `277` directly
- **Verification**: Check logs for "Using OTP database UserId directly"

### B. Firebase Users
- **Test Case 2**: Login with Firebase/Google account
- **Expected**: Should lookup database UserId via email
- **Verification**: Check logs for "Using database UserId from lookup"

### C. Anonymous/No User
- **Test Case 3**: No user logged in (current scenario)
- **Expected**: Should use test user fallback (`logeshwaran67677@gmail.com`)
- **Verification**: Check logs for "Using test database UserId"

### D. User Switching
- **Test Case 4**: Switch between users
- **Expected**: Should clear cached UserId and lookup new user
- **Verification**: Different UserId in database entries

## 📱 Device & Network Scenarios

### A. Network Connectivity
- **Test Case 5**: Enable/disable WiFi during analysis
- **Expected**: Failed requests should queue for retry
- **Verification**: Check RetryQueue logs and eventual success

### B. Server Downtime
- **Test Case 6**: Stop backend server during analysis
- **Expected**: Items should queue and retry when server returns
- **Verification**: Multiple retry attempts in logs

### C. Device Restart
- **Test Case 7**: Restart Android device/emulator
- **Expected**: Service should auto-start and resume monitoring
- **Verification**: Service starts on boot, cached UserId persists

## 🍽️ Food Analysis Scenarios

### A. Different Food Types
- **Test Case 8**: Pizza, salad, burger, fruits, beverages
- **Expected**: Accurate nutrition data for each type
- **Verification**: Check nutrition values in database

### B. Multiple Food Items
- **Test Case 9**: Plate with multiple foods
- **Expected**: Combined nutrition totals
- **Verification**: Check `total` section in analysis data

### C. Non-Food Images
- **Test Case 10**: Take photos of people, objects, text
- **Expected**: Should still analyze but may get low confidence
- **Verification**: Check confidence scores and Gemini responses

## 💾 Database Scenarios

### A. Duplicate Prevention
- **Test Case 11**: Take same photo multiple times quickly
- **Expected**: Should not create duplicate entries
- **Verification**: Check database for unique entries by timestamp

### B. Large Data Handling
- **Test Case 12**: Analyze 20+ images in sequence
- **Expected**: All should be processed and saved
- **Verification**: Count database entries vs images processed

### C. Database Errors
- **Test Case 13**: Simulate database connection issues
- **Expected**: Should retry and eventually succeed
- **Verification**: Check retry queue behavior

## 🔄 Service Lifecycle Scenarios

### A. Service Management
- **Test Case 14**: Kill app, service should continue
- **Expected**: Background service persists, continues monitoring
- **Verification**: Take photo with app closed, check processing

### B. Battery Optimization
- **Test Case 15**: Enable battery optimization for app
- **Expected**: Service might be killed, should restart
- **Verification**: Monitor service restarts in logs

### C. Memory Pressure
- **Test Case 16**: Open many apps to simulate low memory
- **Expected**: Service should handle gracefully
- **Verification**: Check for memory-related crashes

## 📊 Data Validation Scenarios

### A. Nutrition Accuracy
- **Test Case 17**: Known food items with verified nutrition
- **Expected**: Reasonable accuracy in calories, protein, etc.
- **Verification**: Compare with known nutrition facts

### B. Confidence Scoring
- **Test Case 18**: Clear vs blurry food images
- **Expected**: Higher confidence for clear images
- **Verification**: Check confidence values in database

### C. Edge Cases
- **Test Case 19**: Very small food portions
- **Test Case 20**: Multiple identical items
- **Expected**: Proportional nutrition calculations
- **Verification**: Check portion size impact on nutrition

## 🧪 Current Testing Commands

### Quick Database Check
```bash
# Check latest entries
curl "http://localhost:3000/api/get-background-analysis?userId=277&limit=10"
```

### Service Status Check (Android)
```bash
adb logcat -s GalleryMonitorService DatabaseSyncClient RetryQueue
```

### Manual Testing Steps
1. **Basic Flow**: Take food photo → Wait 5-10 seconds → Check logs → Verify database entry
2. **User Switch**: Login different user → Take photo → Verify correct UserId in database
3. **Network Test**: Disable WiFi → Take photo → Enable WiFi → Check retry success
4. **Service Restart**: Kill app → Take photo → Check background processing

## 📈 Success Metrics

### Performance Metrics
- **Image Processing Time**: < 10 seconds from capture to database
- **Network Success Rate**: > 95% successful API calls
- **Service Uptime**: Service stays active for hours without crashes

### Data Quality Metrics
- **Nutrition Accuracy**: Reasonable values (not 0 or extremely high)
- **Confidence Scores**: Average > 0.6 for clear food images
- **Database Integrity**: No duplicate entries, proper UserId mapping

## 🚀 Automated Testing Script

Would you like me to create automated testing scripts for these scenarios?
