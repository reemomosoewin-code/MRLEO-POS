// ============================================================
//  commission.js — Commission tab rendering
// ============================================================
import * as C from './config.js';
import { fmtK, sum, init, getT, calcCommission, isDay, isWk, isMo, todayStr } from './utils.js';

let cFilt = 'daily';

export function setCommFilt(f) {
  cFilt = f;
  document.querySelectorAll('#tab-comm .fc').forEach(b => b.classList.toggle('on', b.dataset.c === f));
  renderComm();
}

export function renderComm() {
  const dtVal = document.getElementById('comm-date').value;
  const d     = dtVal ? new Date(dtVal + 'T00:00:00') : new Date();
  let fTxn    = C.transactions;
  if (cFilt === 'daily')   fTxn = C.transactions.filter(t => isDay(getT(t), d));
  else if (cFilt === 'weekly') fTxn = C.transactions.filter(t => isWk(getT(t), d));
  else fTxn = C.transactions.filter(t => isMo(getT(t), d));

  const tSales = sum(fTxn);
  const tComm  = fTxn.reduce((s, t) => s + (Number(t.commission) || calcCommission(t)), 0);

  document.getElementById('cs-sales').textContent = fmtK(tSales);
  document.getElementById('cs-comm').textContent  = fmtK(Math.round(tComm));

  if (!fTxn.length) {
    document.getElementById('comm-list').innerHTML = '<div class="empty"><div class="empty-ic">📊</div><div>မှတ်တမ်းမရှိပါ</div></div>';
    return;
  }

  let emps = [...C.employees.filter(e => e.status === 'active')];
  if (fTxn.some(t => !t.employee_id)) emps.push({ id: null, name: 'Admin / Cashier', color: 'var(--gold)' });

  document.getElementById('comm-list').innerHTML = emps.map(emp => {
    const eT = fTxn.filter(t => emp.id === null ? !t.employee_id : t.employee_id === emp.id);
    if (!eT.length) return '';
    const eS = sum(eT);
    const eC = eT.reduce((s, t) => s + (Number(t.commission) || calcCommission(t)), 0);
    return `<div class="list-row">
      <div class="lr-icon" style="background:${emp.color};${emp.id === null ? '' : 'color:#111'}">${init(emp.name)}</div>
      <div class="lr-info">
        <div class="lr-title">${emp.name}</div>
        <div class="lr-sub">${eT.length} ကြိမ် · Sales: ${fmtK(eS)}</div>
      </div>
      <div class="lr-right">
        <div class="lr-val c-green" style="font-size:18px">${fmtK(Math.round(eC))}</div>
        <div style="font-size:11px;color:var(--t3)">Commission</div>
      </div>
    </div>`;
  }).join('');
}

window.setCommFilt = setCommFilt;
window.renderComm  = renderComm;
