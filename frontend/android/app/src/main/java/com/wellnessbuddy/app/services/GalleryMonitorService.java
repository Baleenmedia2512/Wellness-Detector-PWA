package com.wellnessbuddy.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.database.ContentObserver;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.wellnessbuddy.app.MainActivity;

import java.io.File;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

public class GalleryMonitorService extends Service {
    private static final String TAG = "GalleryMonitorService";
    private static final String CHANNEL_ID = "GalleryMonitorChannel";
    private static final int NOTIFICATION_ID = 101;

    private ExecutorService executorService;
    private ContentObserver imageObserver;
    private long lastCheckedTime = 0;

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

        executorService = Executors.newSingleThreadExecutor();

        // ✅ Register ContentObserver to detect image changes
        imageObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
            @Override
            public void onChange(boolean selfChange, @Nullable Uri uri) {
                super.onChange(selfChange, uri);
                Log.d(TAG, "📸 MediaStore content change detected: " + uri);
                executorService.execute(() -> checkGalleryForNewImages());
            }
        };

        getContentResolver().registerContentObserver(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                true,
                imageObserver
        );
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

    private void scanDirectoryForNewImages(File dir, Consumer<File> callback) {
        File[] files = dir.listFiles();
        if (files == null) return;

        for (File file : files) {
            if (file.isDirectory()) {
                scanDirectoryForNewImages(file, callback); // recurse
            } else if (file.getName().toLowerCase().matches(".*\\.(jpg|jpeg|png)$")) {
                if (file.lastModified() > lastCheckedTime) {
                    callback.accept(file);
                }
            }
        }
    }

    private void checkGalleryForNewImages() {
        Log.d(TAG, "Checking for new images...");

        List<File> imageDirs = Arrays.asList(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        );

        try {
            final File[] latestImage = {null};
            final long[] latestModified = {lastCheckedTime};

            for (File dir : imageDirs) {
                if (dir != null && dir.exists()) {
                    scanDirectoryForNewImages(dir, imageFile -> {
                        if (imageFile != null && imageFile.lastModified() > latestModified[0]) {
                            latestImage[0] = imageFile;
                            latestModified[0] = imageFile.lastModified();
                        }
                    });
                }
            }

            if (latestImage[0] != null) {
                Log.d(TAG, "🆕 New image detected: " + latestImage[0].getAbsolutePath());
                showNewImageNotification(latestImage[0].getAbsolutePath());
                lastCheckedTime = latestModified[0];
            }

        } catch (Exception e) {
            Log.e(TAG, "Error checking gallery", e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");

        if (imageObserver != null) {
            getContentResolver().unregisterContentObserver(imageObserver);
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
