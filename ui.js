// ============================================================
//  ui.js — Tab switching, clock, generic UI routing
// ============================================================
import { renderExpTab, setExpDateRange } from './expenses.js';
import { setSalesView }                 from './sales.js';
import { setAdminView }                 from './admin.js';
import { renderComm }                   from './commission.js';
import { todayStr }                     from './utils.js';

export function switchTab(t) {
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t));
  if (t === 'sales') setSalesView('current');
  if (t === 'exp') {
    if (!document.getElementById('exp-from').value) setExpDateRange('month');
    else renderExpTab();
  }
  if (t === 'comm') {
    if (!document.getElementById('comm-date').value) document.getElementById('comm-date').value = todayStr();
    renderComm();
  }
  if (t === 'admin') setAdminView('emp');
}

export function startClock() {
  setInterval(() => {
    const n = new Date();
    const el = document.getElementById('clock-dt');
    if (el) el.textContent =
      n.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' · ' +
      n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, 1000);
}

window.switchTab = switchTab;
