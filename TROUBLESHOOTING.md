# Google Sign-In Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. "Invalid client ID" Error
**Symptoms**: Error message about invalid client ID on Android
**Solution**:
- Check `android/app/src/main/res/values/strings.xml` has correct `server_client_id`
- Verify it matches the web client ID from Firebase Console
- Current correct value: `610941252952-u9h8srgfr879aucl4sbc8h3f6i68cq7n.apps.googleusercontent.com`

### 2. "Sign-in failed" on Android
**Symptoms**: Sign-in fails silently or with generic error
**Solutions**:
1. **Check SHA-1 Certificate**:
   ```bash
   # For debug builds
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Add the SHA-1 to Firebase Console → Project Settings → Your Apps → Android app
   ```

2. **Verify google-services.json**:
   - Should be in `android/app/google-services.json`
   - Should contain correct project_id and client_id
   - Download latest from Firebase Console if unsure

3. **Check Package Name**:
   - AndroidManifest.xml: `package="com.wellnessbuddy.app"`
   - google-services.json: should have matching package_name
   - Firebase Console: should have matching Android package name

### 3. Plugin Not Found Error
**Symptoms**: Error about GoogleAuth plugin not being found
**Solutions**:
1. Ensure plugin is installed:
   ```bash
   npm list @southdevs/capacitor-google-auth
   ```

2. Sync Capacitor:
   ```bash
   npx cap sync
   ```

3. Clean and rebuild:
   ```bash
   npx cap sync --ionic-build
   ```

### 4. Browser Opens Instead of Native Flow
**Symptoms**: Google Sign-In opens browser instead of native account picker
**Solutions**:
1. **Check Platform Detection**: Look for console log `🤖 Using native Android Google Sign-In`
2. **Verify Running on Device**: Make sure testing on actual Android device/emulator, not browser
3. **Check Capacitor Context**: Ensure `Capacitor.isNativePlatform()` returns true

### 5. Web Sign-In Broken
**Symptoms**: Web version stops working after Android changes
**Solutions**:
1. **Check Console Logs**: Look for `🪟 Using popup authentication for web`
2. **Test in Different Browsers**: Some browsers block popups
3. **Check Firebase Config**: Ensure Firebase config is still correct

## 🧪 Testing Checklist

### Before Testing
- [ ] Plugin installed: `@southdevs/capacitor-google-auth@7.0.0`
- [ ] App built: `npm run build`
- [ ] Capacitor synced: `npx cap sync`
- [ ] strings.xml updated with correct client ID
- [ ] google-services.json in correct location

### Web Testing
- [ ] Open in Chrome/Firefox
- [ ] Click "Continue with Google"
- [ ] Should see popup or redirect to Google
- [ ] Console shows correct platform logs
- [ ] User authenticated successfully

### Android Testing  
- [ ] Open in Android Studio
- [ ] Build and run on device/emulator
- [ ] Click "Continue with Google"
- [ ] Should see native account picker (no browser)
- [ ] Console shows `🤖 Using native Android Google Sign-In`
- [ ] User authenticated successfully

## 📱 Device-Specific Issues

### Android Emulator
- Use emulator with Google Play Services
- Sign in to Google account in emulator settings
- API level 23+ recommended

### Physical Android Device
- Enable Developer Options
- Enable USB Debugging
- Sign in to Google account in device settings

## 🔍 Debug Commands

### Check Plugin Installation
```bash
npx cap ls
# Should show @southdevs/capacitor-google-auth@7.0.0
```

### View Capacitor Config
```bash
npx cap config
# Check if GoogleAuth plugin config is present
```

### Check Firebase Project
```bash
# In Firebase Console
1. Go to Authentication → Sign-in method
2. Ensure Google is enabled
3. Check authorized domains include your domain
```

### Android Logs
```bash
# View device logs
adb logcat | grep -i google
adb logcat | grep -i auth
```

## 🆘 If Nothing Works

### Nuclear Option (Clean Reset)
```bash
# 1. Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Reinstall plugin
npm install @southdevs/capacitor-google-auth

# 3. Clean build
npm run build
npx cap sync --force

# 4. Clean Android build
cd android
./gradlew clean
cd ..

# 5. Rebuild everything
npx cap open android
# Build and run in Android Studio
```

### Verify All Configurations
1. **Firebase Console**: Project settings, SHA-1 certificates, package names
2. **google-services.json**: Correct file, correct location
3. **strings.xml**: Correct server_client_id
4. **capacitor.config.js**: Correct GoogleAuth configuration
5. **Package names**: Consistent across all files

## 📞 Get Help

If issues persist:
1. Check plugin documentation: https://github.com/southdevs/capacitor-google-auth
2. Firebase documentation: https://firebase.google.com/docs/auth/android/google-signin
3. Capacitor documentation: https://capacitorjs.com/docs/plugins

Remember: Google Sign-In requires exact configuration matches between Firebase Console, Android app, and web app configurations!
