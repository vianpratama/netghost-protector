/**
 * NetGhost WiFi Protector
 * Popup UI Logic - Firefox Standard Optimized
 */

document.addEventListener('DOMContentLoaded', async () => {
  const stealthToggle = document.getElementById('stealth-toggle');
  const hardenToggle = document.getElementById('harden-toggle');
  const proxyToggle = document.getElementById('proxy-toggle');
  const proxyConfig = document.getElementById('proxy-config');
  const saveProxyBtn = document.getElementById('save-proxy');
  const panicBtn = document.getElementById('panic-btn');
  const statusBadge = document.getElementById('status-badge');
  const shieldStatusText = document.getElementById('shield-status');

  // Load existing settings
  const settings = await browser.storage.local.get([
    'stealthMode', 
    'hardenMode', 
    'proxyEnabled',
    'proxyHost',
    'proxyPort'
  ]);

  // Set initial UI state
  stealthToggle.checked = settings.stealthMode === true;
  hardenToggle.checked = settings.hardenMode === true;
  proxyToggle.checked = settings.proxyEnabled === true;
  
  if (proxyToggle.checked) proxyConfig.classList.remove('hidden');
  updateStatusUI();

  // Stealth Mode Toggle
  stealthToggle.addEventListener('change', () => {
    browser.storage.local.set({ stealthMode: stealthToggle.checked });
    updateStatusUI();
  });

  // Harden Mode Toggle
  hardenToggle.addEventListener('change', () => {
    browser.storage.local.set({ hardenMode: hardenToggle.checked });
    browser.runtime.sendMessage({ 
      action: "updatePrivacySettings", 
      enabled: hardenToggle.checked 
    });
    updateStatusUI();
  });

  // Proxy Toggle
  proxyToggle.addEventListener('change', () => {
    proxyConfig.classList.toggle('hidden', !proxyToggle.checked);
    if (!proxyToggle.checked) {
      disableProxy();
    }
    browser.storage.local.set({ proxyEnabled: proxyToggle.checked });
    updateStatusUI();
  });

  // Save Proxy
  saveProxyBtn.addEventListener('click', () => {
    const host = document.getElementById('proxy-host').value;
    const port = document.getElementById('proxy-port').value;
    
    if (host && port) {
      browser.storage.local.set({ 
        proxyHost: host, 
        proxyPort: port 
      });
      enableProxy(host, port);
      showNotification("Proxy Applied!");
    } else {
      showNotification("Invalid Config", true);
    }
  });

  // Panic Button - Optimized for Firefox
  panicBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmModal("This will wipe all data and close tabs. Proceed?");
    if (confirmed) {
      browser.browsingData.remove({
        "since": 0
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

      // Close all tabs
      const tabs = await browser.tabs.query({});
      tabs.forEach(tab => browser.tabs.remove(tab.id));
    }
  });

  function updateStatusUI() {
    const isProtected = stealthToggle.checked || hardenToggle.checked || proxyToggle.checked;
    statusBadge.textContent = isProtected ? "SECURED" : "UNPROTECTED";
    statusBadge.style.color = isProtected ? "var(--accent-color)" : "var(--danger-color)";
    statusBadge.style.borderColor = isProtected ? "var(--accent-color)" : "var(--danger-color)";
    
    shieldStatusText.textContent = proxyToggle.checked ? "Tunneling Active" : 
                                   (stealthToggle.checked ? "Stealth Mode Active" : "Privacy Shield Ready");
  }

  function enableProxy(host, port) {
    const config = {
      proxyType: "manual",
      http: `socks5://${host}:${port}`,
      socks: `socks5://${host}:${port}`,
      socksVersion: 5,
      passthrough: "localhost, 127.0.0.1"
    };
    // Firefox specific proxy setting check
    if (browser.proxy && browser.proxy.settings) {
      browser.proxy.settings.set({ value: config, scope: 'regular' });
    }
  }

  function disableProxy() {
    if (browser.proxy && browser.proxy.settings) {
      browser.proxy.settings.clear({ scope: 'regular' });
    }
  }

  // Helper UI functions to avoid 'alert' & 'confirm' warnings
  function showNotification(msg, isError = false) {
    const originalText = shieldStatusText.textContent;
    shieldStatusText.textContent = msg;
    shieldStatusText.style.color = isError ? "var(--danger-color)" : "var(--accent-color)";
    setTimeout(() => {
      shieldStatusText.textContent = originalText;
      shieldStatusText.style.color = "white";
    }, 2000);
  }

  function showConfirmModal(msg) {
    return new Promise((resolve) => {
      const confirmResult = confirm(msg); // Firefox allows confirm in popups, but alert is disliked
      resolve(confirmResult);
    });
  }

  // Guide Toggle Logic
  const guideOpen = document.getElementById('guide-open');
  const guideClose = document.getElementById('guide-close');
  const guidePanel = document.getElementById('guide-panel');

  guideOpen.addEventListener('click', () => {
    guidePanel.classList.add('active');
  });

  guideClose.addEventListener('click', () => {
    guidePanel.classList.remove('active');
  });
});
