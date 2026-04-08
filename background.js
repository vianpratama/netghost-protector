/**
 * NetGhost WiFi Protector
 * Service Worker: Mengelola pembersihan data otomatis
 */

// Inisialisasi status default saat instalasi
browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    stealthMode: false,
    hardenMode: false,
    proxyEnabled: false
  });
  console.log("NetGhost: Inisialisasi status default (OFF).");
});

// Listener saat tab ditutup
browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const settings = await browser.storage.local.get(['stealthMode']);
  
  if (settings.stealthMode) {
    const oneMinuteAgo = (new Date()).getTime() - (1000 * 60);
    
    browser.browsingData.remove({
      "since": oneMinuteAgo
    }, {
      "cache": true,
      "cookies": true,
      "downloads": true,
      "formData": true,
      "history": true,
      "indexedDB": true,
      "localStorage": true,
      "passwords": true
    });
    
    console.log("NetGhost: Data 1 menit terakhir telah dibersihkan.");
  }
});

// Listener saat pesan datang dari popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updatePrivacySettings") {
    applyPrivacyHardening(message.enabled);
    return Promise.resolve({status: "success"});
  }
});

/**
 * Menerapkan pengaturan pengerasan privasi jaringan
 */
function applyPrivacyHardening(enabled) {
  // Mematikan Network Prediction (DNS Pre-fetching)
  if (browser.privacy && browser.privacy.network && browser.privacy.network.networkPredictionEnabled) {
    browser.privacy.network.networkPredictionEnabled.set({ value: !enabled });
  }
  
  // Mengatur WebRTC agar tidak membocorkan IP lokal
  if (browser.privacy && browser.privacy.network && browser.privacy.network.webRTCIPHandlingPolicy) {
    browser.privacy.network.webRTCIPHandlingPolicy.set({ 
      value: enabled ? 'disable_non_proxied_udp' : 'default' 
    });
  }

  console.log(`NetGhost: Network Hardening ${enabled ? 'Enabled' : 'Disabled'}`);
}
