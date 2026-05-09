// ============================================================
//  pos.js — Service grid, cart, checkout, receipt printing
// ============================================================
import * as C from './config.js';
import { fmt, fmtK, getT, fTm, parseItems, toast, opn, cls } from './utils.js';
import { renderSales }  from './sales.js';
import { openPinOverlay } from './pin.js';

// ── Service grid ──────────────────────────────────────────────
export function renderPOS() {
  document.getElementById('services-grid').innerHTML = C.services.map(s =>
    `<button class="svc-btn" onclick="addC('${s.id}')">
      <div class="svc-emoji">${s.emoji}</div>
      <div class="svc-name">${s.name}</div>
      <div class="svc-price">${fmt(s.price)}</div>
    </button>`
  ).join('');
}

// ── Cart ─────────────────────────────────────────────────────
export function addC(id) {
  if (!C.activeEmp) { openPinOverlay(true); return; }
  const s = C.services.find(x => x.id === id); if (!s) return;
  const ex  = C.cart.find(i => i.id === id);
  const rate = s.comm_rate !== undefined ? s.comm_rate : (s.commRate !== undefined ? s.commRate : 0.4);
  if (ex) { ex.qty++; } else { C.cart.push({ ...s, qty: 1, savedRate: Number(rate) }); }
  renderCart();
}

export function updC(id, d) {
  const it = C.cart.find(i => i.id === id); if (!it) return;
  it.qty += d;
  if (it.qty < 1) C.setCart(C.cart.filter(i => i.id !== id));
  renderCart();
}

export function cartTot() {
  return C.cart.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
}

export function renderCart() {
  const tc = C.cart.reduce((s, i) => s + i.qty, 0);
  const cb = document.getElementById('cart-badge');
  if (tc > 0) { cb.textContent = tc; cb.classList.remove('hidden'); } else cb.classList.add('hidden');
  document.getElementById('cart-total').textContent = fmtK(cartTot());
  document.getElementById('btn-checkout').disabled = C.cart.length === 0;
  const cl = document.getElementById('cart-list');
  if (!C.cart.length) {
    cl.innerHTML = `<div class="empty"><div class="empty-ic">💈</div><div style="font-size:13px">ဝန်ဆောင်မှု ရွေးချယ်ပါ</div></div>`;
  } else {
    cl.innerHTML = C.cart.map(i => `
      <div class="cart-item">
        <div class="ci-emoji">${i.emoji}</div>
        <div class="ci-info">
          <div class="ci-name">${i.name}</div>
          <div class="ci-price" style="display:flex;align-items:center;gap:8px">
            ${fmtK(i.price)}
            <span style="cursor:pointer;font-size:14px;opacity:0.6;" onclick="editItemPrice('${i.id}')" title="ဈေးနှုန်း ပြင်ရန်">✏️</span>
          </div>
        </div>
        <div class="qty-ctrl">
          <button class="qb" onclick="updC('${i.id}',-1)">−</button>
          <div class="qn">${i.qty}</div>
          <button class="qb" onclick="updC('${i.id}',1)">+</button>
        </div>
      </div>`).join('');
  }
}

export function editItemPrice(id) {
  const it = C.cart.find(i => i.id === id); if (!it) return;
  const v = prompt(`${it.name} ၏ ဈေးနှုန်းအသစ်:`, it.price);
  if (v !== null && v.trim() !== '') {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0) { it.price = n; renderCart(); }
    else toast('ဈေးနှုန်း မှားယွင်းနေပါသည်', 'err');
  }
}

// ── Checkout ──────────────────────────────────────────────────
export function openPayModal() {
  document.getElementById('pay-amt').textContent = fmtK(cartTot());
  let opts = C.employees.filter(e => e.status === 'active').map(e => `<option value="${e.id}">${e.name}</option>`);
  opts.unshift(`<option value="admin">Admin / Cashier (ကော်မရှင်မရှိ)</option>`);
  document.getElementById('pay-emp').innerHTML = opts.join('');
  if (C.activeEmp && C.activeEmp.id !== 'admin') document.getElementById('pay-emp').value = C.activeEmp.id;
  setPM('cash');
  opn('modal-pay');
}

export function setPM(m) {
  C.setPayM(m);
  document.getElementById('pm-cash').className = 'pay-btn' + (m === 'cash' ? ' on-c' : '');
  document.getElementById('pm-mmqr').className = 'pay-btn' + (m === 'mmqr' ? ' on-m' : '');
}

export async function completeSale() {
  const comm   = Math.round(C.cart.reduce((s, i) => s + (Number(i.price) * Number(i.qty) * Number(i.savedRate || 0.4)), 0));
  const selEmp = document.getElementById('pay-emp').value;
  const btn    = document.getElementById('btn-conf-pay');
  btn.disabled = true; btn.textContent = 'Processing...';
  const cleanItems = C.cart.map(i => ({ name: i.name, price: i.price, qty: i.qty, emoji: i.emoji, savedRate: i.savedRate }));
  const txnData = {
    shop_id: C.myShopId, session_id: C.activeSession.id,
    employee_id: (selEmp === 'admin' || !selEmp) ? null : selEmp,
    items: cleanItems, total: cartTot(), commission: comm, payment_method: C.payM,
  };
  const { data, error } = await C.sb.from('transactions').insert(txnData).select().single();
  btn.disabled = false; btn.textContent = 'ငွေရှင်းမည်';
  if (error || !data) { toast(`Error: ${error?.message || 'Sale Failed'}`, 'err'); return; }
  C.transactions.unshift(data);
  C.setLastTxn(data);
  cls('modal-pay');
  document.getElementById('rec-id').textContent = '#' + data.id.slice(0, 8);
  opn('modal-rec');
  renderSales();
}

// ── Print receipt ─────────────────────────────────────────────
export function printReceipt() {
  if (!C.lastTxn) return;
  const emp   = C.employees.find(e => e.id === C.lastTxn.employee_id);
  const items = parseItems(C.lastTxn.items);
  const prt   = document.getElementById('print-area');
  prt.innerHTML = `
    <div id="receipt-content">
      <div class="rc-shop">💈 ${C.myShopName}</div>
      <div class="rc-tag">အရောင်း ဘောက်ချာ</div>
      <div class="rc-meta">${new Date(getT(C.lastTxn)).toLocaleDateString()} · ${fTm(getT(C.lastTxn))}<br>#${C.lastTxn.id.slice(0, 8)}</div>
      <div class="rc-div"></div>
      ${items.map(it => `<div class="rc-line"><span>${it.emoji} ${it.name}${it.qty > 1 ? ' ×' + it.qty : ''}</span><span>${fmt(it.price * it.qty)}</span></div>`).join('')}
      <div class="rc-div"></div>
      <div class="rc-line" style="font-size:16px;font-weight:800"><span>စုစုပေါင်း</span><span>${fmtK(C.lastTxn.total)}</span></div>
      <div class="rc-line" style="font-size:11px;color:#555;margin-top:8px"><span>ငွေချေမှု</span><span>${C.lastTxn.payment_method === 'cash' ? '💵 ငွေသား' : '📱 KPay/QR'}</span></div>
      <div class="rc-line" style="font-size:11px;color:#555"><span>ဝန်ထမ်း</span><span>${emp ? emp.name : 'Admin'}</span></div>
    </div>`;
  prt.style.display = 'block';
  setTimeout(() => { window.print(); prt.style.display = 'none'; }, 300);
}

window.addC          = addC;
window.updC          = updC;
window.editItemPrice = editItemPrice;
window.openPayModal  = openPayModal;
window.setPM         = setPM;
window.completeSale  = completeSale;
window.printReceipt  = printReceipt;
