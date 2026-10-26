package com.quickfix.roadside;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable Chrome remote inspection over USB cable (chrome://inspect/#devices)
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
