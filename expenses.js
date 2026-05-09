// ============================================================
//  expenses.js — Expense modal, tab rendering, export
// ============================================================
import * as C from './config.js';
import { fmtK, toast, opn, cls, todayStr, getExpDate } from './utils.js';
import { renderSales } from './sales.js';

export const EXP_CAT_ICONS   = { commission: '💰', rent: '🏠', inventory: '🧴', supplies: '🛒', equipment: '🔧', other: '📝' };
export const EXP_CAT_LABELS  = { commission: 'Commission', rent: 'Rent & Bills', inventory: 'Inventory', supplies: 'Supplies', equipment: 'Equipment', other: 'Other' };

let curExpCat    = 'commission';
let expCatFilter = 'all';

export function setExpCat(cat) {
  curExpCat = cat;
  document.querySelectorAll('#exp-cat-chips .fc').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
}

export function openExpenseModal() {
  curExpCat = 'commission';
  document.querySelectorAll('#exp-cat-chips .fc').forEach(b => b.classList.toggle('on', b.dataset.cat === 'commission'));
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-amt').value  = '';
  document.getElementById('exp-date').value = todayStr();
  opn('modal-exp');
}

export async function saveExp() {
  const d       = document.getElementById('exp-desc').value.trim();
  const a       = parseFloat(document.getElementById('exp-amt').value) || 0;
  const expDate = document.getElementById('exp-date').value || todayStr();
  if (!d || a <= 0) { toast('အချက်အလက် ပြည့်စုံစွာ ထည့်ပါ', 'err'); return; }
  const btn     = document.getElementById('btn-sv-exp');
  btn.disabled  = true;
  const insertData = { shop_id: C.myShopId, description: d, amount: a, category: curExpCat, expense_date: expDate };
  if (C.activeSession) insertData.session_id = C.activeSession.id;
  const { data, error } = await C.sb.from('expenses').insert(insertData).select().single();
  btn.disabled = false;
  if (error) { toast(error.message, 'err'); return; }
  C.expenses.unshift(data);
  cls('modal-exp');
  renderSales();
  renderExpTab();
  toast('✅ အသုံးစရိတ် မှတ်သားပြီးပါပြီ', 'ok');
}

export function setExpCatFilter(cat) {
  expCatFilter = cat;
  document.querySelectorAll('#tab-exp .fc[data-ecat]').forEach(b => b.classList.toggle('on', b.dataset.ecat === cat));
  renderExpTab();
}

export function setExpDateRange(r) {
  const today = new Date(); const t = todayStr();
  let from = t, to = t;
  if (r === 'week') { const d = new Date(today); d.setDate(today.getDate() - ((today.getDay() + 6) % 7)); from = d.toISOString().split('T')[0]; }
  else if (r === 'month') { from = t.substring(0, 7) + '-01'; }
  else if (r === 'all') { from = '2020-01-01'; }
  document.getElementById('exp-from').value = from;
  document.getElementById('exp-to').value   = to;
  renderExpTab();
}

export function renderExpTab() {
  const from = document.getElementById('exp-from').value;
  const to   = document.getElementById('exp-to').value;
  let filtered = C.expenses;
  if (from) filtered = filtered.filter(e => getExpDate(e) >= from);
  if (to)   filtered = filtered.filter(e => getExpDate(e) <= to);
  if (expCatFilter !== 'all') filtered = filtered.filter(e => (e.category || 'other') === expCatFilter);

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const bycat = {};
  filtered.forEach(e => { const c = e.category || 'other'; bycat[c] = (bycat[c] || 0) + (e.amount || 0); });

  let cardsHtml = `<div class="sc" style="grid-column:span 2;background:var(--rs);border-color:var(--r)"><div class="sl" style="color:var(--r)">စုစုပေါင်း အသုံးစရိတ်</div><div class="sv c-red">${fmtK(total)}</div></div>`;
  Object.keys(bycat).forEach(cat => {
    cardsHtml += `<div class="sc"><div class="sl">${EXP_CAT_ICONS[cat] || '📝'} ${EXP_CAT_LABELS[cat] || cat}</div><div class="sv" style="font-size:16px;color:var(--r)">${fmtK(bycat[cat])}</div></div>`;
  });
  document.getElementById('exp-summary-cards').innerHTML = cardsHtml;

  if (!filtered.length) {
    document.getElementById('exp-tab-list').innerHTML = '<div class="empty"><div class="empty-ic">💸</div><div>မှတ်တမ်းမရှိပါ</div></div>';
    return;
  }
  document.getElementById('exp-tab-list').innerHTML = filtered.map(e => {
    const cat = e.category || 'other';
    return `<div class="list-row" style="margin-bottom:8px">
      <div class="lr-icon" style="background:var(--rs);font-size:18px">${EXP_CAT_ICONS[cat] || '📝'}</div>
      <div class="lr-info">
        <div class="lr-title">${e.description}</div>
        <div class="lr-sub">${EXP_CAT_LABELS[cat] || cat} · ${getExpDate(e)}</div>
      </div>
      <div class="lr-right"><div class="lr-val c-red">${fmtK(e.amount)}</div></div>
    </div>`;
  }).join('');
}

window.setExpCat       = setExpCat;
window.openExpenseModal = openExpenseModal;
window.saveExp         = saveExp;
window.setExpCatFilter  = setExpCatFilter;
window.setExpDateRange  = setExpDateRange;
window.renderExpTab    = renderExpTab;
