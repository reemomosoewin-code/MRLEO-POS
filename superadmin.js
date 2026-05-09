// ============================================================
//  superadmin.js — Master dashboard for multi-branch owners
// ============================================================
import * as C from './config.js';
import { fmtK, sum, init, getT, parseItems, calcCommission, toast, todayStr } from './utils.js';

let getExpDate; // lazy import to avoid circular dep
import('./utils.js').then(u => { getExpDate = u.getExpDate; });

export async function checkSuperAdminStatus() {
  try {
    const { data: profile } = await C.sb.from('profiles').select('is_super_admin').eq('id', C.me.id).single();
    if (profile && profile.is_super_admin) {
      C.setIsSuperAdmin(true);
      showSecretDoor();
    }
  } catch (err) { console.error('SA check failed:', err); }
}

function showSecretDoor() {
  const sec = document.getElementById('av-sec');
  if (sec && !document.getElementById('btn-super-admin')) {
    sec.insertAdjacentHTML('afterbegin', `
      <div style="margin-bottom:16px">
        <button id="btn-super-admin" onclick="enterSuperAdmin()" style="width:100%;background:linear-gradient(135deg,var(--gold),#b8860b);color:#000;font-weight:800;padding:15px;border-radius:12px;border:none;font-size:15px;letter-spacing:.5px;">
          👑 ENTER MASTER DASHBOARD
        </button>
      </div>`);
  }
}

export async function enterSuperAdmin() {
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('super-admin-dashboard').classList.remove('hidden');
  const today = todayStr();
  document.getElementById('sa-from').value = today.substring(0, 7) + '-01';
  document.getElementById('sa-to').value   = today;
  await loadSuperAdminData();
}

export function exitSuperAdmin() {
  document.getElementById('super-admin-dashboard').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
}

async function loadSuperAdminData() {
  document.getElementById('sa-loading').style.display = 'block';
  C.setSaShops([]); C.setSaAllTxn([]); C.setSaAllExp([]);
  C.setSaAllSess([]); C.setSaAllEmp([]); C.setSaAllSvc([]);

  try {
    document.getElementById('sa-loading-text').textContent = 'Loading permitted branches...';
    const { data: perms } = await C.sb.from('super_admin_shops').select('shop_id').eq('super_admin_user_id', C.me.id);
    if (!perms || !perms.length) { document.getElementById('sa-loading').style.display = 'none'; toast('No branches assigned', 'err'); return; }
    const shopIds = perms.map(p => p.shop_id);
    const { data: shopData } = await C.sb.from('shops').select('*').in('id', shopIds);
    C.setSaShops(shopData || []);

    const allTxn = [], allExp = [], allSess = [], allEmp = [], allSvc = [];
    for (const shop of C.sa_shops) {
      document.getElementById('sa-loading-text').textContent = `Loading ${shop.name}...`;
      const [txnRes, expRes, sessRes, empRes, svcRes] = await Promise.all([
        C.sb.from('transactions').select('*').eq('shop_id', shop.id),
        C.sb.from('expenses').select('*').eq('shop_id', shop.id),
        C.sb.from('sessions').select('*').eq('shop_id', shop.id),
        C.sb.from('employees').select('*').eq('shop_id', shop.id),
        C.sb.from('services').select('*').eq('shop_id', shop.id),
      ]);
      (txnRes.data  || []).forEach(r => { r._shop = shop.name; r._shop_id = shop.id; allTxn.push(r); });
      (expRes.data  || []).forEach(r => { r._shop = shop.name; r._shop_id = shop.id; allExp.push(r); });
      (sessRes.data || []).forEach(r => { r._shop = shop.name; r._shop_id = shop.id; allSess.push(r); });
      (empRes.data  || []).forEach(r => { r._shop = shop.name; allEmp.push(r); });
      (svcRes.data  || []).forEach(r => { r._shop = shop.name; allSvc.push(r); });
    }
    C.setSaAllTxn(allTxn); C.setSaAllExp(allExp); C.setSaAllSess(allSess);
    C.setSaAllEmp(allEmp); C.setSaAllSvc(allSvc);

    document.getElementById('sa-loading').style.display = 'none';
    renderSABranchChips();
    renderSADashboard();
  } catch (e) {
    document.getElementById('sa-loading').style.display = 'none';
    toast('Error: ' + e.message, 'err');
  }
}

function renderSABranchChips() {
  document.getElementById('sa-branch-chips').innerHTML =
    `<button class="fc ${C.sa_selectedShop === 'all' ? 'on' : ''}" onclick="setSAShop('all')">🏢 All Branches</button>` +
    C.sa_shops.map(s => `<button class="fc ${C.sa_selectedShop === s.id ? 'on' : ''}" onclick="setSAShop('${s.id}')">${s.name}</button>`).join('');
}

export function setSAShop(id) {
  C.setSaSelectedShop(id);
  renderSABranchChips();
  renderSADashboard();
}

export function setSARange(r) {
  const today = new Date(); const t = todayStr();
  let from = t, to = t;
  if (r === 'week')  { const d = new Date(today); d.setDate(today.getDate() - ((today.getDay() + 6) % 7)); from = d.toISOString().split('T')[0]; }
  else if (r === 'month') { from = t.substring(0, 7) + '-01'; }
  else if (r === 'year')  { from = t.substring(0, 4) + '-01-01'; }
  else if (r === 'all')   { from = '2020-01-01'; }
  document.getElementById('sa-from').value = from;
  document.getElementById('sa-to').value   = to;
  document.querySelectorAll('[id^="sa-btn-"]').forEach(b => b.classList.remove('on'));
  const btn = document.getElementById('sa-btn-' + r); if (btn) btn.classList.add('on');
  renderSADashboard();
}

export function renderSADashboard() {
  const from = document.getElementById('sa-from').value;
  const to   = document.getElementById('sa-to').value;
  const _getExpDate = e => e.expense_date || (e.created_at ? e.created_at.split('T')[0] : todayStr());

  let txn = C.sa_allTxn, exp = C.sa_allExp;
  if (C.sa_selectedShop !== 'all') { txn = txn.filter(t => t._shop_id === C.sa_selectedShop); exp = exp.filter(e => e._shop_id === C.sa_selectedShop); }
  if (from) txn = txn.filter(t => getT(t).split('T')[0] >= from);
  if (to)   txn = txn.filter(t => getT(t).split('T')[0] <= to);
  if (from) exp = exp.filter(e => _getExpDate(e) >= from);
  if (to)   exp = exp.filter(e => _getExpDate(e) <= to);

  const tSales = sum(txn);
  const tExp   = exp.reduce((s, e) => s + (e.amount || 0), 0);
  const tComm  = txn.reduce((s, t) => s + (Number(t.commission) || calcCommission(t)), 0);
  const netP   = tSales - tExp - tComm;

  document.getElementById('sa-summary').innerHTML = `
    <div class="sc" style="background:rgba(210,153,34,.05);border-color:var(--gold)"><div class="sl">စုစုပေါင်း အရောင်း</div><div class="sv c-gold">${fmtK(tSales)}</div></div>
    <div class="sc" style="background:rgba(46,160,67,.05);border-color:var(--g)"><div class="sl">အသားတင် Profit</div><div class="sv c-green">${fmtK(netP)}</div></div>
    <div class="sc"><div class="sl">အသုံးစရိတ်</div><div class="sv c-red" style="font-size:16px">${fmtK(tExp)}</div></div>
    <div class="sc"><div class="sl">ကော်မရှင်</div><div class="sv" style="color:var(--r);font-size:16px">${fmtK(Math.round(tComm))}</div></div>`;

  // Branch comparison
  let branchHtml = '<div class="ctitle">🏢 Branch အလိုက်</div>';
  C.sa_shops.forEach(shop => {
    const sTxn   = C.sa_allTxn.filter(t => t._shop_id === shop.id && (!from || getT(t).split('T')[0] >= from) && (!to || getT(t).split('T')[0] <= to));
    const sExp   = C.sa_allExp.filter(e => e._shop_id === shop.id && (!from || _getExpDate(e) >= from) && (!to || _getExpDate(e) <= to));
    const sSales = sum(sTxn);
    const sExp2  = sExp.reduce((s, e) => s + (e.amount || 0), 0);
    const sComm  = sTxn.reduce((s, t) => s + (Number(t.commission) || calcCommission(t)), 0);
    branchHtml  += `<div class="list-row" style="margin-bottom:8px">
      <div class="lr-icon" style="background:var(--gold-sub);color:var(--gold);font-size:14px">🏪</div>
      <div class="lr-info"><div class="lr-title">${shop.name}</div><div class="lr-sub">Exp: ${fmtK(sExp2)} · Comm: ${fmtK(Math.round(sComm))}</div></div>
      <div class="lr-right"><div class="lr-val">${fmtK(sSales)}</div><div style="font-size:11px;color:var(--g)">${fmtK(sSales - sExp2 - sComm)} net</div></div>
    </div>`;
  });
  document.getElementById('sa-branch-compare').innerHTML = branchHtml;

  // Top services
  const svcCount = {};
  txn.forEach(t => parseItems(t.items).forEach(i => {
    const k = i.name;
    if (!svcCount[k]) svcCount[k] = { name: i.name, emoji: i.emoji || '✂️', count: 0, rev: 0 };
    svcCount[k].count += Number(i.qty) || 1;
    svcCount[k].rev   += (Number(i.price) || 0) * (Number(i.qty) || 1);
  }));
  const topSvc = Object.values(svcCount).sort((a, b) => b.count - a.count).slice(0, 5);
  document.getElementById('sa-top-services').innerHTML = `<div class="ctitle">🏆 Top Services (All Branches)</div>` +
    (topSvc.length ? topSvc.map((s, i) =>
      `<div class="list-row" style="margin-bottom:8px">
        <div class="lr-icon" style="background:var(--gold-sub);color:var(--gold);font-size:18px">${s.emoji}</div>
        <div class="lr-info"><div class="lr-title">${s.name}</div><div class="lr-sub">${s.count} ကြိမ် · ${fmtK(s.rev)}</div></div>
        <div class="lr-right"><div style="font-size:20px;font-weight:800;color:var(--gold)">#${i + 1}</div></div>
      </div>`).join('')
    : '<div class="empty" style="padding:20px"><div>ဒေတာမရှိပါ</div></div>');

  // Recent transactions
  const recent = [...txn].sort((a, b) => new Date(getT(b)) - new Date(getT(a))).slice(0, 15);
  document.getElementById('sa-recent-txns').innerHTML = `<div class="ctitle">🧾 Recent Transactions</div>` +
    (recent.length ? recent.map(t => {
      const items = parseItems(t.items);
      const emp   = C.sa_allEmp.find(e => e.id === t.employee_id);
      return `<div class="list-row" style="margin-bottom:8px">
        <div class="lr-icon" style="background:var(--sf2);font-size:11px;color:var(--t2)">${t._shop.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
        <div class="lr-info"><div class="lr-title">${items.map(i => i.name).join(', ')}</div><div class="lr-sub">${t._shop} · ${emp ? emp.name : 'Admin'} · ${new Date(getT(t)).toLocaleDateString()}</div></div>
        <div class="lr-right"><div class="lr-val">${fmtK(t.total)}</div></div>
      </div>`;
    }).join('')
    : '<div class="empty" style="padding:20px"><div>ဒေတာမရှိပါ</div></div>');
}

window.enterSuperAdmin   = enterSuperAdmin;
window.exitSuperAdmin    = exitSuperAdmin;
window.setSAShop         = setSAShop;
window.setSARange        = setSARange;
window.renderSADashboard = renderSADashboard;
