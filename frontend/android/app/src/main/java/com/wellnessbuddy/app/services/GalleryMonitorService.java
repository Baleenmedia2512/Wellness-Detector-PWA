package com.wellnessbuddy.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import java.io.File;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GalleryMonitorService extends Service {
    private static final String TAG = "GalleryMonitorService";
    private static final String CHANNEL_ID = "GalleryMonitorChannel";
    private static final int NOTIFICATION_ID = 101;
    
    private Handler handler;
    private ExecutorService executorService;
    private Runnable galleryCheckRunnable;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        createNotificationChannel();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Use dataSync as the base type for gallery monitoring
            int foregroundServiceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC;
            
            // Add mediaProcessing if available (Android 12+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                foregroundServiceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING;
            }
            
            startForeground(NOTIFICATION_ID, createNotification(), foregroundServiceType);
        } else {
            startForeground(NOTIFICATION_ID, createNotification());
        }
        
        handler = new Handler(Looper.getMainLooper());
        executorService = Executors.newSingleThreadExecutor();
        
        galleryCheckRunnable = () -> executorService.execute(this::checkGalleryForNewImages);
        handler.postDelayed(galleryCheckRunnable, 15 * 60 * 1000); // 15 minutes
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Wellness Buddy")
                .setContentText("Monitoring for new food photos")
                .setSmallIcon(android.R.drawable.ic_menu_gallery)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Gallery Monitor",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors for new food photos");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void checkGalleryForNewImages() {
        Log.d(TAG, "Performing background gallery check");
        try {
            File dcimDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM);
            File cameraDir = new File(dcimDir, "Camera");
            
            if (cameraDir.exists()) {
                File[] files = cameraDir.listFiles();
                if (files != null) {
                    Arrays.sort(files, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
                    for (File file : files) {
                        if (file.getName().toLowerCase().matches(".*\\.(jpg|jpeg|png)$")) {
                            Log.d(TAG, "Found image: " + file.getAbsolutePath());
                            // Process image here
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking gallery", e);
        } finally {
            handler.postDelayed(galleryCheckRunnable, 15 * 60 * 1000);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        if (handler != null && galleryCheckRunnable != null) {
            handler.removeCallbacks(galleryCheckRunnable);
        }
        if (executorService != null) {
            executorService.shutdown();
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}