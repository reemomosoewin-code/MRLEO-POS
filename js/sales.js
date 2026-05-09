// ============================================================
//  sales.js — Session view, history, transaction detail, delete
// ============================================================
import * as C from './config.js';
import { fmt, fmtK, getT, fTm, sum, init, parseItems,
         getEmpNameForDetail, calcCommission, toast, opn, cls } from './utils.js';
import { populateRptEmpFilter, setRptRange, renderReport } from './reports.js';
import { setExpDateRange, renderExpTab }                   from './expenses.js';

let slsView = 'current';

export function setSalesView(v) {
  slsView = v;
  document.getElementById('fc-curr').className = 'fc' + (v === 'current' ? ' on' : '');
  document.getElementById('fc-hist').className = 'fc' + (v === 'history' ? ' on' : '');
  document.getElementById('fc-rpt').className  = 'fc' + (v === 'report'  ? ' on' : '');
  document.getElementById('sv-current').className = v === 'current' ? '' : 'hidden';
  document.getElementById('sv-history').className  = v === 'history' ? '' : 'hidden';
  document.getElementById('sv-report').className   = v === 'report'  ? '' : 'hidden';
  if (v === 'history') renderHistory();
  else if (v === 'current') renderSales();
  else if (v === 'report') {
    populateRptEmpFilter();
    if (!document.getElementById('rpt-from').value) setRptRange('month');
    else renderReport();
  }
}

// ── Active session view ───────────────────────────────────────
export function renderSales() {
  if (!C.activeSession) {
    document.getElementById('sv-current-empty').classList.remove('hidden');
    document.getElementById('sv-current-data').classList.add('hidden');
    return;
  }
  document.getElementById('sv-current-empty').classList.add('hidden');
  document.getElementById('sv-current-data').classList.remove('hidden');

  const sId = C.activeSession.id;
  const tX  = C.transactions.filter(t => t.session_id === sId);
  const eX  = C.expenses.filter(e => e.session_id === sId);
  const cT  = tX.filter(t => t.payment_method === 'cash');
  const mT  = tX.filter(t => t.payment_method === 'mmqr');

  document.getElementById('ss-id').textContent   = '#' + String(sId).slice(0, 8);
  document.getElementById('ss-time').textContent = fTm(getT(C.activeSession));
  document.getElementById('ss-tot').textContent  = fmtK(sum(tX));
  document.getElementById('ss-cash').textContent = fmtK(sum(cT));
  document.getElementById('ss-mmqr').textContent = fmtK(sum(mT));

  const openCash = C.activeSession.opening_cash || 0;
  const totalExp = eX.reduce((s, e) => s + (e.amount || 0), 0);
  document.getElementById('ss-open').textContent     = fmt(openCash);
  document.getElementById('ss-cash-add').textContent = fmt(sum(cT));
  document.getElementById('ss-exp').textContent      = fmt(totalExp);
  document.getElementById('ss-expect').textContent   = fmtK(openCash + sum(cT) - totalExp);

  const getEmpColor = id => { if (!id) return 'var(--gold)'; const e = C.employees.find(x => x.id === id); return e ? e.color : '#888'; };

  document.getElementById('ss-txns').innerHTML = tX.length === 0
    ? '<div class="empty" style="padding:20px"><div class="empty-ic">🧾</div><div>အရောင်းမရှိသေးပါ</div></div>'
    : tX.map(t => {
        const items    = parseItems(t.items);
        const empName  = getEmpNameForDetail(t.employee_id);
        const empColor = getEmpColor(t.employee_id);
        const delBtn   = C.curRole === 'admin'
          ? `<button class="btn bo" style="padding:6px 10px;font-size:11px;margin-top:6px;color:var(--r);border-color:var(--rs)" onclick="delTxn(event,'${t.id}')">ဖျက်မည်</button>`
          : '';
        return `<div class="list-row" onclick="viewTxnDetail('${t.id}')" style="cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='var(--sf)'">
          <div class="lr-icon" style="background:${empColor};font-size:11px">${init(empName)}</div>
          <div class="lr-info">
            <div class="lr-title">${items.map(i => i.emoji || '').join('')} ${items.map(i => i.name).join(', ')}</div>
            <div class="lr-sub">${empName} · ${fTm(getT(t))} · <span class="${t.payment_method === 'cash' ? 'c-green' : 'c-blue'}">${t.payment_method === 'cash' ? '💵 Cash' : '📱 QR'}</span></div>
          </div>
          <div class="lr-right"><div class="lr-val">${fmtK(t.total)}</div>${delBtn}</div>
        </div>`;
      }).join('');
}

// ── History view ──────────────────────────────────────────────
export function renderHistory() {
  if (!C.sessions.length) {
    document.getElementById('hist-sessions').innerHTML = '<div class="empty"><div class="empty-ic">📋</div><div>မှတ်တမ်းမရှိသေးပါ</div></div>';
    return;
  }
  document.getElementById('hist-sessions').innerHTML = C.sessions.map(s => {
    const tX        = C.transactions.filter(t => t.session_id === s.id);
    const cashTxns  = tX.filter(t => t.payment_method === 'cash');
    const qrTxns    = tX.filter(t => t.payment_method === 'mmqr');
    const eX        = C.expenses.filter(e => e.session_id === s.id);
    const totalExp  = eX.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalComm = tX.reduce((acc, t) => acc + (Number(t.commission) || calcCommission(t)), 0);
    const netProfit = sum(tX) - totalExp - totalComm;
    const openDate  = new Date(s.opened_at);
    const closeDate = s.closed_at ? new Date(s.closed_at) : null;
    return `<div class="card" style="margin-bottom:12px;cursor:pointer;transition:border-color 0.2s;" onclick="viewSessionDetail('${s.id}')" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--bd)'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid var(--bd);padding-bottom:10px">
        <div>
          <div style="font-size:13px;font-weight:700">${openDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div style="font-size:11px;color:var(--t3)">${openDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}${closeDate ? ' → ' + closeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
        </div>
        <div style="text-align:right">
          <div class="mono c-gold" style="font-weight:800;font-size:17px">${fmtK(sum(tX))}</div>
          <div style="font-size:11px;color:var(--g);font-weight:600">Net: ${fmtK(Math.round(netProfit))}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">
        <div style="color:var(--g)">💵 ${fmtK(sum(cashTxns))}</div>
        <div style="color:var(--b)">📱 ${fmtK(sum(qrTxns))}</div>
        <div style="color:var(--t2)">${tX.length} sales</div>
        <div style="color:var(--r)">Exp: ${fmtK(totalExp)}</div>
        <div style="color:var(--r)">Comm: ${fmtK(Math.round(totalComm))}</div>
        <div style="color:${(s.cash_diff || 0) < 0 ? 'var(--r)' : 'var(--t2)'}">Diff: ${fmtK(s.cash_diff || 0)}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Transaction detail modal ──────────────────────────────────
export function viewTxnDetail(txnId) {
  const txn = C.transactions.find(t => t.id === txnId); if (!txn) return;
  C.setLastTxn(txn);
  const items    = parseItems(txn.items);
  const empName  = getEmpNameForDetail(txn.employee_id);
  const txnComm  = Number(txn.commission) || calcCommission(txn);
  let html = `
    <div style="background:var(--sf2);padding:16px;border-radius:12px;border:1px solid var(--bd);margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;"><span style="color:var(--t2)">အချိန်:</span><span class="mono">${new Date(getT(txn)).toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;"><span style="color:var(--t2)">ဝန်ထမ်း:</span><span style="font-weight:600">${empName}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;"><span style="color:var(--t2)">Payment:</span><span class="${txn.payment_method === 'cash' ? 'c-green' : 'c-blue'}">${txn.payment_method === 'cash' ? '💵 Cash' : '📱 QR'}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:var(--t2)">ကော်မရှင်:</span><span style="color:var(--r);font-weight:700">${fmtK(Math.round(txnComm))}</span></div>
    </div>
    <div style="font-weight:700;margin-bottom:10px;font-size:13px;color:var(--t2);text-transform:uppercase;letter-spacing:1px;">SERVICES</div>`;
  items.forEach(it => {
    const rate     = it.savedRate ? Math.round(it.savedRate * 100) : 40;
    const itemComm = Math.round(Number(it.price) * Number(it.qty) * Number(it.savedRate || 0.4));
    html += `
      <div style="padding:12px 0;border-bottom:1px solid var(--bd);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-weight:600;font-size:14px;">${it.emoji || ''} ${it.name}</div>
          <div class="mono c-gold" style="font-weight:700;">${fmtK(it.price * it.qty)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t3);">
          <span>${fmtK(it.price)} × ${it.qty}</span>
          <span style="color:var(--r)">Comm ${rate}% = ${fmtK(itemComm)}</span>
        </div>
      </div>`;
  });
  html += `<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:2px solid var(--bd);">
    <span style="font-weight:800;font-size:16px;">စုစုပေါင်း</span>
    <span class="mono c-gold" style="font-weight:800;font-size:20px;">${fmtK(txn.total)}</span>
  </div>`;
  document.getElementById('txn-detail-content').innerHTML = html;
  opn('modal-txn-detail');
}

// ── Session detail modal ──────────────────────────────────────
export function viewSessionDetail(sId) {
  const sess      = C.sessions.find(s => s.id === sId); if (!sess) return;
  const tX        = C.transactions.filter(t => t.session_id === sId);
  const eX        = C.expenses.filter(e => e.session_id === sId);
  const cT        = tX.filter(t => t.payment_method === 'cash');
  const mT        = tX.filter(t => t.payment_method === 'mmqr');
  const totalExp  = eX.reduce((s, e) => s + (e.amount || 0), 0);
  const totalComm = tX.reduce((s, t) => s + (Number(t.commission) || calcCommission(t)), 0);
  const netProfit = sum(tX) - totalExp - totalComm;
  const catIcons  = { commission: '💰', rent: '🏠', inventory: '🧴', supplies: '🛒', equipment: '🔧', other: '📝' };

  let html = `
    <div style="background:var(--sf2);padding:14px;border-radius:12px;margin-bottom:16px;border:1px solid var(--bd)">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span style="color:var(--t2)">ဖွင့်ချိန်:</span><span class="mono">${new Date(sess.opened_at).toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px"><span style="color:var(--t2)">ပိတ်ချိန်:</span><span class="mono">${sess.closed_at ? new Date(sess.closed_at).toLocaleString() : 'Not Closed'}</span></div>
      <hr style="border-color:var(--bd);margin:10px 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span>Total Sales:</span><span class="mono c-gold" style="font-weight:700">${fmtK(sum(tX))}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span class="c-green">💵 Cash:</span><span class="mono">${fmtK(sum(cT))}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span class="c-blue">📱 QR:</span><span class="mono">${fmtK(sum(mT))}</span></div>
      <hr style="border-color:var(--bd);margin:10px 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span style="color:var(--t2)">Opening Cash:</span><span class="mono">${fmtK(sess.opening_cash || 0)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span class="c-red">− Expenses:</span><span class="mono c-red">-${fmtK(totalExp)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span class="c-red">− Commission:</span><span class="mono c-red">-${fmtK(Math.round(totalComm))}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span class="c-gold">Expected Cash:</span><span class="mono c-gold">${fmtK(sess.expected_cash || 0)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px"><span class="c-green">Actual Cash:</span><span class="mono c-green">${fmtK(sess.actual_cash || 0)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;font-weight:bold"><span style="color:var(--t2)">Cash Diff:</span><span class="mono ${(sess.cash_diff || 0) < 0 ? 'c-red' : 'c-gold'}">${fmtK(sess.cash_diff || 0)}</span></div>
      <hr style="border-color:var(--bd);margin:10px 0">
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;padding-top:4px"><span style="color:var(--g)">🟢 Net Profit:</span><span class="mono" style="color:var(--g)">${fmtK(Math.round(netProfit))}</span></div>
    </div>`;

  if (eX.length > 0) {
    html += `<div style="font-weight:700;margin-bottom:8px;color:var(--r);font-size:13px;text-transform:uppercase;letter-spacing:1px;">💸 Expenses</div>`;
    html += eX.map(e => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--bd)">
      <span>${catIcons[e.category || 'other'] || '📝'} ${e.description}</span>
      <span class="c-red mono">-${fmtK(e.amount)}</span>
    </div>`).join('');
    html += `<div style="margin-bottom:16px"></div>`;
  }
  if (tX.length > 0) {
    html += `<div style="font-weight:700;margin-bottom:8px;color:var(--g);font-size:13px;text-transform:uppercase;letter-spacing:1px;">🧾 Transactions (${tX.length})</div>`;
    html += tX.map(t => {
      const items   = parseItems(t.items);
      const empName = getEmpNameForDetail(t.employee_id);
      const tComm   = Number(t.commission) || calcCommission(t);
      return `<div style="padding:10px 0;border-bottom:1px solid var(--bd)">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <div style="font-weight:600;font-size:13px">${items.map(i => (i.emoji || '') + ' ' + i.name).join(', ')}</div>
          <div class="c-gold mono" style="font-weight:700">${fmtK(t.total)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t3)">
          <span>${empName} · ${t.payment_method === 'cash' ? 'Cash' : 'QR'} · ${new Date(getT(t)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style="color:var(--r)">Comm: ${fmtK(Math.round(tComm))}</span>
        </div>
      </div>`;
    }).join('');
  }
  document.getElementById('sd-content').innerHTML = html;
  opn('modal-sess-detail');
}

// ── Delete transaction ────────────────────────────────────────
export async function delTxn(event, id) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  if (!confirm('ဤအရောင်းဘောက်ချာကို အပြီးတိုင် ဖျက်ပစ်မည်လား?')) return;
  C.setTransactions(C.transactions.filter(t => String(t.id) !== String(id)));
  renderSales();
  toast('🗑️ ဖျက်ပစ်လိုက်ပါပြီ', 'ok');
  const { error } = await C.sb.from('transactions').delete().eq('id', id);
  if (error) alert('Database Error: ' + error.message);
}

window.setSalesView      = setSalesView;
window.viewTxnDetail     = viewTxnDetail;
window.viewSessionDetail = viewSessionDetail;
window.delTxn            = delTxn;
