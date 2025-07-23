package com.wellnessbuddy.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.wellnessbuddy.app.MainActivity;

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
    private long lastCheckedTime = 0; // Tracks the last detected image time

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");

        createNotificationChannel();

        int foregroundServiceType = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            foregroundServiceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                foregroundServiceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING;
            }

            startForeground(NOTIFICATION_ID, createNotification(), foregroundServiceType);
        } else {
            startForeground(NOTIFICATION_ID, createNotification());
        }

        Toast.makeText(this, "GalleryMonitorService Running", Toast.LENGTH_SHORT).show();

        handler = new Handler(Looper.getMainLooper());
        executorService = Executors.newSingleThreadExecutor();

        galleryCheckRunnable = () -> executorService.execute(this::checkGalleryForNewImages);

        // ✅ Run the first check immediately, then every 5s
        handler.post(galleryCheckRunnable);
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? PendingIntent.FLAG_IMMUTABLE
                        : 0
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Gallery Monitor Active")
                .setContentText("Wellness Buddy is monitoring new food photos.")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Gallery Monitor",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Monitors for new food photos");
            channel.enableLights(true);
            channel.enableVibration(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void showNewImageNotification(String imagePath) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentTitle("📸 New Image Detected")
                .setContentText("Detected: " + new File(imagePath).getName())
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

        NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    private void checkGalleryForNewImages() {
        Log.d(TAG, "Performing background gallery check");
        try {
            File dcimDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM);
            File cameraDir = new File(dcimDir, "Camera");

            if (cameraDir.exists()) {
                File[] files = cameraDir.listFiles();
                if (files != null && files.length > 0) {
                    Arrays.sort(files, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
                    File latestImage = files[0];

                    if (latestImage.getName().toLowerCase().matches(".*\\.(jpg|jpeg|png)$")) {
                        long modifiedTime = latestImage.lastModified();
                        if (modifiedTime > lastCheckedTime) {
                            Log.d(TAG, "🆕 New image detected: " + latestImage.getAbsolutePath());
                            showNewImageNotification(latestImage.getAbsolutePath());
                            lastCheckedTime = modifiedTime;
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking gallery", e);
        } finally {
            // ✅ Schedule next check
            handler.postDelayed(galleryCheckRunnable, 5000);
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
