// ============================================================
//  session.js — Open / close sessions, boot check
// ============================================================
import * as C from './config.js';
import { toast, opn, cls, sum, fmtK } from './utils.js';
import { renderSales }    from './sales.js';
import { openPinOverlay, setRole, blUpd, updPD } from './pin.js';

export function checkSession() {
  if (!C.activeSession) {
    opn('session-gate');
    setRole({ name: 'Admin', id: 'admin', color: 'var(--gold)' }, 'admin');
  } else {
    cls('session-gate');
    openPinOverlay(true);
  }
}

export function openSessionGate() { opn('session-gate'); }

export async function openSession() {
  const amt = parseFloat(document.getElementById('sg-cash').value) || 0;
  const btn = document.getElementById('btn-open-sess');
  btn.disabled = true;
  const { data, error } = await C.sb.from('sessions').insert({
    shop_id:      C.myShopId,
    opening_cash: amt,
    opened_at:    new Date().toISOString(),
  }).select().single();
  btn.disabled = false;
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  C.setActiveSession(data);
  cls('session-gate');
  renderSales();
  toast('✅ စာရင်းဖွင့်လှစ်ပြီးပါပြီ', 'ok');
  openPinOverlay(true);
}

export function openCloseSessionModal() {
  if (!C.activeSession) return;
  const cT  = C.transactions.filter(t => t.session_id === C.activeSession.id && t.payment_method === 'cash');
  const eX  = C.expenses.filter(e => e.session_id === C.activeSession.id);
  const exp = (C.activeSession.opening_cash || 0) + sum(cT) - eX.reduce((s, e) => s + (e.amount || 0), 0);
  document.getElementById('cs-expected').textContent = fmtK(exp);
  document.getElementById('cs-actual').value = exp;
  opn('modal-close-sess');
}

export async function closeSession() {
  const act = parseFloat(document.getElementById('cs-actual').value) || 0;
  const cT  = C.transactions.filter(t => t.session_id === C.activeSession.id && t.payment_method === 'cash');
  const eX  = C.expenses.filter(e => e.session_id === C.activeSession.id);
  const exp = (C.activeSession.opening_cash || 0) + sum(cT) - eX.reduce((s, e) => s + (e.amount || 0), 0);
  const btn = document.getElementById('btn-cls-sess');
  btn.disabled = true; btn.textContent = 'Processing...';
  const { error } = await C.sb.from('sessions').update({
    closed_at:     new Date().toISOString(),
    expected_cash: exp,
    actual_cash:   act,
    cash_diff:     act - exp,
  }).eq('id', C.activeSession.id);
  btn.disabled = false; btn.textContent = 'စာရင်းပိတ် သိမ်းဆည်းမည်';
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  C.setSessions([{
    ...C.activeSession,
    closed_at: new Date().toISOString(),
    expected_cash: exp, actual_cash: act, cash_diff: act - exp
  }, ...C.sessions]);
  C.setActiveSession(null);
  cls('modal-close-sess');
  // Reset PIN buffers and re-lock
  C.setBlBuf(''); C.setPBuf('');
  blUpd(); updPD();
  opn('app-boot-lock');
  toast('🔒 စာရင်းပိတ်သိမ်းပြီးပါပြီ', 'ok');
}

window.openSession           = openSession;
window.openSessionGate       = openSessionGate;
window.openCloseSessionModal = openCloseSessionModal;
window.closeSession          = closeSession;
