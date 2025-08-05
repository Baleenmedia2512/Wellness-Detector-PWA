package com.wellnessbuddy.app.plugins;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.wellnessbuddy.app.services.GalleryMonitorService;

import org.json.JSONArray;

@CapacitorPlugin(name = "GalleryMonitor")
public class GalleryMonitorPlugin extends Plugin {
    private static final String TAG = "GalleryMonitorPlugin";
    private static GalleryMonitorPlugin instance = null;
    
    @Override
    public void load() {
        super.load();
        instance = this;
    }
    
    // Static method to trigger notification events from MainActivity
    public static void triggerNotificationEvent(String action) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", action);
            instance.notifyListeners("notificationClicked", ret);
        }
    }
    
    @PluginMethod
    public void startService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, GalleryMonitorService.class);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "✅ Gallery monitor service started");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start service", e);
            call.reject("Failed to start service", e);
        }
    }
    
    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, GalleryMonitorService.class);
            context.stopService(serviceIntent);
            Log.d(TAG, "✅ Gallery monitor service stopped");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop service", e);
            call.reject("Failed to stop service", e);
        }
    }
    
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        // In a real implementation, you would request runtime permissions here
        JSObject ret = new JSObject();
        ret.put("granted", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void checkGallery(PluginCall call) {
        // This would trigger an immediate gallery check
        JSObject ret = new JSObject();
        ret.put("newImages", new JSONArray());
        call.resolve(ret);
    }
    
    @PluginMethod
    public void setCurrentUser(PluginCall call) {
        try {
            String userId = call.getString("userId");
            String userEmail = call.getString("userEmail");
            
            if (userId == null || userId.isEmpty()) {
                call.reject("User ID is required");
                return;
            }
            
            SharedPreferences prefs = getContext().getSharedPreferences("WellnessBuddy", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("current_user_id", userId);
            
            // Store email for database UserId lookup and clear cached DB UserId
            if (userEmail != null && !userEmail.isEmpty()) {
                editor.putString("current_user_email", userEmail);
                // Clear cached database UserId when new user logs in
                editor.remove("cached_db_user_id");
                Log.d(TAG, "✅ Current user set - ID: " + userId + ", Email: " + userEmail + " (DB cache cleared)");
            } else {
                editor.remove("cached_db_user_id");
                Log.d(TAG, "✅ Current user set - ID: " + userId + " (no email provided, DB cache cleared)");
            }
            
            editor.apply();
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to set current user", e);
            call.reject("Failed to set current user", e);
        }
    }
    
    @PluginMethod
    public void getCurrentUser(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("WellnessBuddy", Context.MODE_PRIVATE);
            String userId = prefs.getString("current_user_id", null);
            String userEmail = prefs.getString("current_user_email", null);
            
            JSObject ret = new JSObject();
            ret.put("userId", userId);
            ret.put("userEmail", userEmail);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to get current user", e);
            call.reject("Failed to get current user", e);
        }
    }
    
    @PluginMethod
    public void clearCurrentUser(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("WellnessBuddy", Context.MODE_PRIVATE);
            prefs.edit()
                .remove("current_user_id")
                .remove("current_user_email")
                .remove("cached_db_user_id")  // Clear cached database UserId
                .apply();
            
            Log.d(TAG, "✅ Current user, email, and cached DB UserId cleared");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to clear current user", e);
            call.reject("Failed to clear current user", e);
        }
    }
}