// ============================================================
//  pin.js — All PIN pad logic, employee selector, boot lock
// ============================================================
import * as C from './config.js';
import { init, toast, opn, cls } from './utils.js';
import { checkSession }           from './session.js';

// ── Role switcher ─────────────────────────────────────────────
export function setRole(emp, role) {
  C.setActiveEmp(emp);
  C.setCurRole(role);
  document.querySelectorAll('.admin-only').forEach(e => e.style.display = role === 'admin' ? 'flex' : 'none');
  if (role && emp) {
    document.getElementById('h-av').textContent = init(emp.name);
    document.getElementById('h-av').style.background = emp.color || 'var(--gold)';
    document.getElementById('h-name').textContent = emp.name;
  } else {
    document.getElementById('h-av').textContent = '?';
    document.getElementById('h-av').style.background = 'var(--bd)';
    document.getElementById('h-name').textContent = '---';
  }
}

// ── Boot lock ─────────────────────────────────────────────────
export function blUpd() {
  for (let i = 0; i < 4; i++)
    document.getElementById('bl-pd' + i).className = 'pdot' + (i < C.blBuf.length ? ' fll' : '');
}
export function blK(k) {
  if (C.blBuf.length < 4) C.setBlBuf(C.blBuf + k);
  blUpd();
  if (C.blBuf.length === 4) setTimeout(blEnter, 50);
}
export function blDel() { C.setBlBuf(C.blBuf.slice(0, -1)); blUpd(); }
export function blEnter() {
  if (C.blBuf === C.adminPin) {
    cls('app-boot-lock');
    C.setBlBuf('');
    blUpd();
    checkSession();
  } else {
    document.getElementById('bl-err').textContent = 'Admin PIN မှားယွင်းနေပါသည်';
    C.setBlBuf('');
    blUpd();
  }
}

// ── Employee PIN overlay ──────────────────────────────────────
export function openPinOverlay(req) {
  C.setPTarg(null); C.setPAdmin(false); C.setPBuf('');
  document.getElementById('pin-users').innerHTML =
    C.employees.map(e =>
      `<button class="svc-btn" style="padding:14px 10px;border-radius:12px" onclick="window._selectEmp('${e.id}')">
        <div class="lr-icon" style="background:${e.color}">${init(e.name)}</div>
        <div class="svc-name">${e.name}</div>
      </button>`
    ).join('') +
    `<button class="svc-btn" style="padding:14px 10px;border-radius:12px;border-color:var(--gold)" onclick="window._selectAdmin()">
      <div class="lr-icon" style="background:var(--gold-sub);color:var(--gold)">🔑</div>
      <div class="svc-name c-gold">Admin</div>
    </button>`;
  opn('pin-overlay');
}

// Bridge functions exposed to inline HTML (no eval in onclick)
window._selectEmp = (id) => {
  C.setPTarg(C.employees.find(x => x.id === id));
  C.setPAdmin(false);
  C.setPBuf(''); updPD();
  cls('pin-overlay');
  opn('pin-pad-modal');
};
window._selectAdmin = () => {
  C.setPTarg(null);
  C.setPAdmin(true);
  C.setPBuf(''); updPD();
  cls('pin-overlay');
  opn('pin-pad-modal');
};

// ── PIN pad ───────────────────────────────────────────────────
export function updPD() {
  for (let i = 0; i < 4; i++)
    document.getElementById('pd' + i).className = 'pdot' + (i < C.pBuf.length ? ' fll' : '');
}
export function padK(k) {
  if (C.pBuf.length < 4) C.setPBuf(C.pBuf + k);
  updPD();
  if (C.pBuf.length === 4) setTimeout(padEnter, 50);
}
export function padDel() { C.setPBuf(C.pBuf.slice(0, -1)); updPD(); }
export function padEnter() {
  if (C.pBuf.length < 4) return;
  if (C.pAdmin && C.pBuf === C.adminPin) {
    setRole({ name: 'Admin', id: 'admin', color: 'var(--gold)' }, 'admin');
    cls('pin-pad-modal');
    if (!C.activeSession) opn('session-gate');
  } else if (!C.pAdmin && C.pBuf === C.pTarg.pin) {
    setRole(C.pTarg, 'staff');
    cls('pin-pad-modal');
  } else {
    document.getElementById('pad-err').textContent = 'PIN မှားနေပါသည်။';
    C.setPBuf('');
    updPD();
  }
}

window.blK          = blK;
window.blDel        = blDel;
window.blEnter      = blEnter;
window.padK         = padK;
window.padDel       = padDel;
window.padEnter     = padEnter;
window.openPinOverlay = openPinOverlay;
