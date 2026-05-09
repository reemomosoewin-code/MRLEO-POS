// ============================================================
//  auth.js — Boot, login, logout, cloud data loading
// ============================================================
import * as C from './config.js';
import { toast } from './utils.js';
import { renderPOS } from './pos.js';
import { renderSales } from './sales.js';
import { opn, cls } from './utils.js';
import { checkSuperAdminStatus } from './superadmin.js';
import { loadSavedLogo } from './admin.js';
import { setRole } from './pin.js';
import { startClock } from './ui.js';

// ── Supabase paginated fetch ───────────────────────────────────
export async function fetchAllData(tableName, shopId) {
  let resultList = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await C.sb.from(tableName)
      .select('*')
      .eq('shop_id', shopId)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) { console.error(`Error fetching ${tableName}:`, error); break; }
    if (!data || data.length === 0) break;
    resultList.push(...data);
    document.getElementById('loading-text').textContent =
      `Downloaded ${resultList.length} rows from ${tableName}...`;
    if (data.length < pageSize) break;
    page++;
  }
  return resultList;
}

// ── Boot (runs on window.onload) ──────────────────────────────
export async function boot() {
  try {
    const client = supabase.createClient(C.SUPA_URL, C.SUPA_KEY);
    C.setSB(client);
  } catch (e) {
    alert('❌ Supabase Connection Failed.');
    return;
  }
  const { data: { session } } = await C.sb.auth.getSession();
  if (session) {
    C.setMe(session.user);
    await loadCloudData();
  } else {
    document.getElementById('auth').style.display = 'flex';
    document.getElementById('app').classList.remove('on');
  }
}

// ── Login ────────────────────────────────────────────────────
export async function login() {
  const e = document.getElementById('le').value.trim();
  const p = document.getElementById('lp').value;
  if (!e || !p) { toast('Email/Password ဖြည့်ပါ', 'err'); return; }
  const { error } = await C.sb.auth.signInWithPassword({ email: e, password: p });
  if (error) {
    const errEl = document.getElementById('login-err');
    errEl.style.display = 'block';
    errEl.textContent = error.message;
  } else {
    location.reload();
  }
}

// ── Logout ───────────────────────────────────────────────────
export async function cloudLogout() {
  if (confirm('Cloud မှ ထွက်မည်လား?')) await C.sb.auth.signOut();
}

// ── Main data loader ─────────────────────────────────────────
export async function loadCloudData() {
  try {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('loading-text').textContent = 'Connecting to shop profile...';

    const { data: prof } = await C.sb.from('profiles').select('*').eq('id', C.me.id).single();
    if (!prof || !prof.shop_id) {
      alert('No Shop ID found. Please contact admin.');
      await C.sb.auth.signOut();
      return;
    }
    C.setMyShopId(prof.shop_id);

    const { data: shop } = await C.sb.from('shops').select('*').eq('id', C.myShopId).single();
    C.setMyShopName(shop ? shop.name : 'Unknown Shop');
    document.getElementById('h-title').textContent = C.myShopName;
    document.getElementById('sg-title').textContent = C.myShopName;

    document.getElementById('loading-text').textContent = 'Downloading settings...';
    const [empRes, svcRes, sessRes] = await Promise.all([
      C.sb.from('employees').select('*').eq('shop_id', C.myShopId),
      C.sb.from('services').select('*').eq('shop_id', C.myShopId),
      C.sb.from('sessions').select('*').eq('shop_id', C.myShopId).is('closed_at', null),
    ]);
    C.setEmployees(empRes.data || []);
    C.setServices(svcRes.data || []);
    C.setActiveSession(sessRes.data && sessRes.data.length > 0 ? sessRes.data[0] : null);

    document.getElementById('loading-text').textContent = 'Starting data sync...';
    const allSess = await fetchAllData('sessions', C.myShopId);
    const allTxn  = await fetchAllData('transactions', C.myShopId);
    const allExp  = await fetchAllData('expenses', C.myShopId);

    const { getT } = await import('./utils.js');
    C.setSessions(allSess.filter(s => s.closed_at !== null).sort((a, b) => new Date(getT(b)) - new Date(getT(a))));
    C.setTransactions(allTxn.sort((a, b) => new Date(getT(b)) - new Date(getT(a))));
    C.setExpenses(allExp.sort((a, b) => new Date(getT(b)) - new Date(getT(a))));

    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').classList.add('on');

    loadSavedLogo();
    setRole(null, null);
    renderPOS();
    startClock();
    opn('app-boot-lock');
    checkSuperAdminStatus();
  } catch (e) {
    document.getElementById('loading-state').style.display = 'none';
    alert('Failed to load data. ' + e.message);
    await C.sb.auth.signOut();
  }
}

window.login       = login;
window.cloudLogout = cloudLogout;
window.boot        = boot;
window.onload      = boot;
