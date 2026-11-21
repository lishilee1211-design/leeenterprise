package com.leeenterprise.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Locale;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Lee Enterprise app: shows the company website and the staff expense tally,
 * bundled inside the app (works offline; expenses sync when online).
 */
public class MainActivity extends Activity {

    /** The app opens the live website, so every website update shows in the app at once. */
    private static final String LIVE_HOST = "lishilee1211-design.github.io";
    private static final String LIVE_START = "https://" + LIVE_HOST + "/leeenterprise/index.html";
    /** Built-in copy, used only when the phone is offline. */
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/www/index.html";
    private boolean usingOffline = false;
    private static final int PICK = 41;
    private static final int VOICE = 42;
    private TextToSpeech tts;

    private WebView web;
    private ValueCallback<Uri[]> fileCb;
    private Uri cameraUri;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.addJavascriptInterface(new Bridge(), "LeeApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, android.webkit.WebResourceError e) {
                // No internet: show the built-in copy of the same page
                if (r.isForMainFrame() && !usingOffline && LIVE_HOST.equals(r.getUrl().getHost())) {
                    usingOffline = true;
                    String path = r.getUrl().getPath();
                    String page = path == null ? "index.html" : path.substring(path.lastIndexOf('/') + 1);
                    if (page.isEmpty()) page = "index.html";
                    v.loadUrl("https://" + HOST + "/assets/www/" + page);
                    Toast.makeText(MainActivity.this, "Offline - showing saved copy", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;          // built-in pages
                if (LIVE_HOST.equals(u.getHost()) && u.getPath() != null && u.getPath().startsWith("/leeenterprise")) return false; // live site
                openOutside(u);                                       // WhatsApp, phone, email, maps, web
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent gallery = new Intent(Intent.ACTION_GET_CONTENT);
                gallery.addCategory(Intent.CATEGORY_OPENABLE);
                gallery.setType("image/*");
                Intent chooser = Intent.createChooser(gallery, "Bill photo");
                try {
                    File dir = new File(getCacheDir(), "camera");
                    dir.mkdirs();
                    File f = new File(dir, "bill_" + System.currentTimeMillis() + ".jpg");
                    cameraUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", f);
                    Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                    cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                } catch (Exception e) {
                    cameraUri = null;
                }
                try {
                    startActivityForResult(chooser, PICK);
                } catch (ActivityNotFoundException e) {
                    fileCb.onReceiveValue(null);
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });

        if (state != null) web.restoreState(state);
        else web.loadUrl(LIVE_START);
    }

    private void openOutside(Uri u) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            if ("tel".equals(u.getScheme())) i = new Intent(Intent.ACTION_DIAL, u);
            if ("mailto".equals(u.getScheme())) i = new Intent(Intent.ACTION_SENDTO, u);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app found to open this", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == VOICE) {
            String text = "";
            if (res == RESULT_OK && data != null) {
                ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (r != null && !r.isEmpty()) text = r.get(0);
            }
            web.evaluateJavascript("window.leeVoice && window.leeVoice(" + JSONObject.quote(text) + ")", null);
            return;
        }
        if (req != PICK || fileCb == null) { super.onActivityResult(req, res, data); return; }
        Uri[] out = null;
        if (res == RESULT_OK) {
            if (data != null && data.getData() != null) out = new Uri[]{data.getData()};
            else if (cameraUri != null) out = new Uri[]{cameraUri};
        }
        fileCb.onReceiveValue(out);
        fileCb = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    /** Lets the page save files, listen to the owner's voice and speak replies. */
    private class Bridge {
        @JavascriptInterface
        public void listen(String lang) {
            runOnUiThread(() -> {
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.isEmpty() ? "en-IN" : lang);
                i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to your AI Manager");
                try {
                    startActivityForResult(i, VOICE);
                } catch (ActivityNotFoundException e) {
                    web.evaluateJavascript("window.leeVoiceError && window.leeVoiceError('Voice typing is not available on this phone. Install or enable Google voice typing.')", null);
                }
            });
        }

        @JavascriptInterface
        public void speak(String text, String lang) {
            runOnUiThread(() -> {
                final String t = text == null ? "" : text;
                final Locale loc = Locale.forLanguageTag(lang == null || lang.isEmpty() ? "en-IN" : lang);
                if (tts == null) {
                    tts = new TextToSpeech(MainActivity.this, status -> {
                        if (status == TextToSpeech.SUCCESS) { tts.setLanguage(loc); tts.speak(t, TextToSpeech.QUEUE_FLUSH, null, "lee"); }
                    });
                } else {
                    tts.setLanguage(loc);
                    tts.speak(t, TextToSpeech.QUEUE_FLUSH, null, "lee");
                }
            });
        }

        @JavascriptInterface
        public void saveFile(String name, String text) {
            String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
            try {
                byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    cv.put(MediaStore.Downloads.MIME_TYPE, "text/csv");
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) { os.write(bytes); }
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    try (OutputStream os = new FileOutputStream(new File(dir, safe))) { os.write(bytes); }
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved " + safe + " to Downloads", Toast.LENGTH_LONG).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Could not save file", Toast.LENGTH_SHORT).show());
            }
        }
    }
}
