// ============================================================
//  pwa.js — Service Worker registration, install prompt
// ============================================================

let deferredPrompt = null;

export function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1 ||
         ua.indexOf('Instagram') > -1 || ua.indexOf('Telegram') > -1 ||
         ua.indexOf('Line') > -1 || ua.indexOf('Viber') > -1;
}

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js');
    });
  }
}

export function dismissLanding() {
  const landing = document.getElementById('pwa-landing');
  if (landing) landing.style.display = 'none';
}

export async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  const installBar = document.getElementById('pwa-install-bar');
  if (installBar) installBar.style.display = 'none';
  if (result.outcome === 'accepted') showInstallSuccess();
}

function showInstallSuccess() {
  let overlay = document.getElementById('install-success-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'install-success-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.cssText = 'position:fixed;inset:0;background:#090b0f;z-index:999999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;font-family:sans-serif;';
  overlay.innerHTML = `
    <div style="font-size:90px;margin-bottom:28px;animation:pop .4s ease-out;">✅</div>
    <div style="font-size:24px;font-weight:800;color:#d29922;margin-bottom:12px;letter-spacing:1px;">ဒေါင်းလော့လုပ်ပြီးပါပြီ။</div>
    <div style="font-size:15px;color:#8b949e;line-height:1.8;margin-bottom:48px;">
      App သည် သင့် Home Screen တွင်<br>ထည့်သွင်းပြီးပါပြီ။<br><br>
      <span style="color:#6e7681;font-size:13px;">Home Screen မှ Mr.Leo POS icon ကိုနှိပ်၍ ဖွင့်ပါ။</span>
    </div>
    <button onclick="document.getElementById('install-success-overlay').style.display='none'"
      style="width:100%;max-width:320px;background:linear-gradient(135deg,#d29922,#b8860b);color:#000;font-weight:800;font-size:17px;padding:18px;border-radius:14px;border:none;box-shadow:0 4px 24px rgba(210,153,34,0.5);">
      ✕ ပိတ်မည် (Close)
    </button>
    <style>@keyframes pop{0%{transform:scale(0)}80%{transform:scale(1.2)}100%{transform:scale(1)}}</style>`;
}

export function initPWA() {
  registerSW();

  if (isInAppBrowser()) {
    const bar = document.getElementById('pwa-install-bar');
    if (bar) bar.style.display = 'none';
  }

  if (!isAppInstalled()) {
    const landing = document.getElementById('pwa-landing');
    if (landing) landing.style.display = 'flex';
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const landBtn = document.getElementById('pwa-land-install-btn');
    if (landBtn) landBtn.style.display = 'block';
    const loading = document.getElementById('pwa-land-loading');
    if (loading) loading.style.display = 'none';
    const installBar = document.getElementById('pwa-install-bar');
    if (installBar && !isInAppBrowser()) installBar.style.display = 'block';
  });

  window.addEventListener('appinstalled', () => {
    const installBar = document.getElementById('pwa-install-bar');
    if (installBar) installBar.style.display = 'none';
    showInstallSuccess();
  });

  setTimeout(() => {
    if (!isInAppBrowser()) {
      const loading = document.getElementById('pwa-land-loading');
      if (loading) loading.style.display = 'none';
    }
  }, 3000);
}

window.installPWA    = installPWA;
window.dismissLanding = dismissLanding;
