package com.wellnessbuddy.app.plugins;

import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.wellnessbuddy.app.services.GalleryMonitorService;

import org.json.JSONArray;  // Add this import

@CapacitorPlugin(name = "GalleryMonitor")
public class GalleryMonitorPlugin extends Plugin {
    
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
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start service", e);
        }
    }
    
    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, GalleryMonitorService.class);
            context.stopService(serviceIntent);
            call.resolve();
        } catch (Exception e) {
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
        ret.put("newImages", new JSONArray());  // Changed JSArray to JSONArray
        call.resolve(ret);
    }
}