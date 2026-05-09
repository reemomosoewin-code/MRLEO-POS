// ============================================================
//  admin.js — Employee & service CRUD, logo, security tab
// ============================================================
import * as C from './config.js';
import { init, toast, opn, cls } from './utils.js';
import { renderPOS }              from './pos.js';

let aView = 'emp';

export function setAdminView(v) {
  aView = v;
  document.getElementById('fa-emp').className = 'fc' + (v === 'emp' ? ' on' : '');
  document.getElementById('fa-svc').className = 'fc' + (v === 'svc' ? ' on' : '');
  document.getElementById('fa-sec').className = 'fc' + (v === 'sec' ? ' on' : '');
  document.getElementById('av-emp').className = v === 'emp' ? '' : 'hidden';
  document.getElementById('av-svc').className = v === 'svc' ? '' : 'hidden';
  document.getElementById('av-sec').className = v === 'sec' ? '' : 'hidden';
  if (v === 'emp') renderEmpAdmin();
  else if (v === 'svc') renderSvcAdmin();
}

// ── Logo ──────────────────────────────────────────────────────
export function loadSavedLogo() {
  const u = localStorage.getItem('mrleo_shop_logo');
  if (u) {
    const imgs = ['shop-logo-img', 'admin-logo-img'];
    const phs  = ['shop-logo-placeholder', 'admin-logo-ph'];
    imgs.forEach(i => { const el = document.getElementById(i); if (el) { el.src = u; el.style.display = 'block'; } });
    phs.forEach(p  => { const el = document.getElementById(p); if (el) el.style.display = 'none'; });
  }
}
export function triggerLogoUpload() { document.getElementById('logo-file-input').click(); }
export function handleLogoUpload(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => { localStorage.setItem('mrleo_shop_logo', ev.target.result); loadSavedLogo(); toast('✅ လိုဂို သိမ်းဆည်းပြီးပါပြီ', 'ok'); };
  r.readAsDataURL(f);
}
export function removeLogo() {
  localStorage.removeItem('mrleo_shop_logo');
  ['shop-logo-img', 'admin-logo-img'].forEach(i => { const el = document.getElementById(i); if (el) { el.src = ''; el.style.display = 'none'; } });
  ['shop-logo-placeholder', 'admin-logo-ph'].forEach(p => { const el = document.getElementById(p); if (el) el.style.display = 'block'; });
  toast('ဖယ်ရှားပြီးပါပြီ', 'ok');
}

// ── Color picker ──────────────────────────────────────────────
export function renderColorPick(id, sel) {
  document.getElementById(id).innerHTML = C.COLORS.map(c =>
    `<div class="c-swatch ${c === sel ? 'sel' : ''}" style="background:${c}" onclick="window._pickColor('${id}','${c}')"></div>`
  ).join('');
}
window._pickColor = (id, c) => { C.setSelColor(c); renderColorPick(id, c); };

// ── Employees ─────────────────────────────────────────────────
export function renderEmpAdmin() {
  document.getElementById('admin-emp-list').innerHTML = C.employees.map(e =>
    `<div class="list-row">
      <div class="lr-icon" style="background:${e.color}">${init(e.name)}</div>
      <div class="lr-info">
        <div class="lr-title">${e.name} <span class="bdg ${e.status === 'active' ? 'ba' : 'bp2'}">${e.status}</span></div>
        <div class="lr-sub">PIN: ${e.pin} · ${e.role_title || 'Staff'}</div>
      </div>
      <button class="btn bo" onclick="editEmp('${e.id}')">ပြင်မည်</button>
    </div>`
  ).join('');
}

export function openEmpModal() {
  document.getElementById('me-id').value    = '';
  document.getElementById('me-title').textContent = 'ဝန်ထမ်းအသစ်';
  document.getElementById('me-name').value  = '';
  document.getElementById('me-pin').value   = '';
  C.setSelColor(C.COLORS[0]);
  renderColorPick('me-colors', C.selColor);
  opn('modal-emp');
}

export function editEmp(id) {
  const e = C.employees.find(x => x.id === id); if (!e) return;
  document.getElementById('me-id').value    = e.id;
  document.getElementById('me-title').textContent = 'ဝန်ထမ်း ပြင်ဆင်ရန်';
  document.getElementById('me-name').value  = e.name;
  document.getElementById('me-pin').value   = e.pin;
  document.getElementById('me-status').value = e.status;
  C.setSelColor(e.color);
  renderColorPick('me-colors', C.selColor);
  opn('modal-emp');
}

export async function saveEmp() {
  const id = document.getElementById('me-id').value;
  const n  = document.getElementById('me-name').value.trim();
  const p  = document.getElementById('me-pin').value.trim();
  const s  = document.getElementById('me-status').value;
  if (!n || !/^\d{4}$/.test(p)) { toast('အမည် နှင့် PIN ၄ လုံး ပြည့်စုံစွာ ထည့်ပါ', 'err'); return; }
  const btn = document.getElementById('btn-sv-emp'); btn.disabled = true;
  if (id) {
    const { data, error } = await C.sb.from('employees').update({ name: n, pin: p, color: C.selColor, status: s }).eq('id', id).select().single();
    if (error) { toast(error.message, 'err'); btn.disabled = false; return; }
    C.setEmployees(C.employees.map(e => e.id === id ? data : e));
  } else {
    const { data, error } = await C.sb.from('employees').insert({ shop_id: C.myShopId, name: n, pin: p, color: C.selColor, status: s }).select().single();
    if (error) { toast(error.message, 'err'); btn.disabled = false; return; }
    C.employees.push(data);
  }
  btn.disabled = false;
  cls('modal-emp');
  renderEmpAdmin();
  toast('✅ သိမ်းဆည်းပြီးပါပြီ', 'ok');
}

export async function delEmp() {
  const id = document.getElementById('me-id').value; if (!id) return;
  if (C.employees.length <= 1) { toast('အနည်းဆုံး တစ်ဦးထားရမည်', 'err'); return; }
  if (!confirm('ဖျက်ပစ်မည်လား?')) return;
  await C.sb.from('employees').delete().eq('id', id);
  C.setEmployees(C.employees.filter(e => e.id !== id));
  cls('modal-emp');
  renderEmpAdmin();
  toast('ဖျက်ပြီးပါပြီ', 'ok');
}

// ── Services ──────────────────────────────────────────────────
export function renderSvcAdmin() {
  document.getElementById('admin-svc-list').innerHTML = C.services.map(s =>
    `<div class="list-row">
      <div style="font-size:28px;width:36px;text-align:center">${s.emoji}</div>
      <div class="lr-info">
        <div class="lr-title">${s.name}</div>
        <div style="margin-top:6px"><span class="mono c-gold" style="font-size:14px;font-weight:700">${s.price.toLocaleString('en-US')} Ks</span></div>
      </div>
      <button class="btn bo" onclick="editSvc('${s.id}')">ပြင်မည်</button>
    </div>`
  ).join('');
}

export function openSvcModal() {
  document.getElementById('ms-id').value    = '';
  document.getElementById('ms-title').textContent = 'ဝန်ဆောင်မှုအသစ်';
  document.getElementById('ms-name').value  = '';
  document.getElementById('ms-price').value = '';
  document.getElementById('ms-comm').value  = '40';
  opn('modal-svc');
}

export function editSvc(id) {
  const s = C.services.find(x => x.id === id); if (!s) return;
  document.getElementById('ms-id').value    = s.id;
  document.getElementById('ms-title').textContent = 'ဝန်ဆောင်မှု ပြင်ဆင်ရန်';
  document.getElementById('ms-emoji').value = s.emoji;
  document.getElementById('ms-name').value  = s.name;
  document.getElementById('ms-price').value = s.price;
  document.getElementById('ms-comm').value  = Math.round((s.comm_rate || 0.4) * 100).toString();
  opn('modal-svc');
}

export async function saveSvc() {
  const id    = document.getElementById('ms-id').value;
  const emoji = document.getElementById('ms-emoji').value;
  const n     = document.getElementById('ms-name').value.trim();
  const p     = parseInt(document.getElementById('ms-price').value) || 0;
  let cRate   = parseFloat(document.getElementById('ms-comm').value);
  if (isNaN(cRate) || cRate < 0) cRate = 40;
  cRate = cRate / 100;
  if (!n || p <= 0) { toast('အမည် နှင့် ဈေးနှုန်း အမှန်ထည့်ပါ', 'err'); return; }
  const btn = document.getElementById('btn-sv-svc'); btn.disabled = true;
  if (id) {
    const { data, error } = await C.sb.from('services').update({ emoji, name: n, price: p, comm_rate: cRate }).eq('id', id).select().single();
    if (error) { toast(error.message, 'err'); btn.disabled = false; return; }
    C.setServices(C.services.map(s => s.id === id ? data : s));
  } else {
    const { data, error } = await C.sb.from('services').insert({ shop_id: C.myShopId, emoji, name: n, price: p, comm_rate: cRate }).select().single();
    if (error) { toast(error.message, 'err'); btn.disabled = false; return; }
    C.services.push(data);
  }
  btn.disabled = false;
  cls('modal-svc');
  renderSvcAdmin();
  renderPOS();
  toast('✅ သိမ်းဆည်းပြီးပါပြီ', 'ok');
}

export async function delSvc() {
  const id = document.getElementById('ms-id').value; if (!id) return;
  if (C.services.length <= 1) { toast('အနည်းဆုံး တစ်ခုထားရမည်', 'err'); return; }
  if (!confirm('ဖျက်ပစ်မည်လား?')) return;
  await C.sb.from('services').delete().eq('id', id);
  C.setServices(C.services.filter(s => s.id !== id));
  cls('modal-svc');
  renderSvcAdmin();
  renderPOS();
  toast('ဖျက်ပြီးပါပြီ', 'ok');
}

window.setAdminView    = setAdminView;
window.triggerLogoUpload = triggerLogoUpload;
window.handleLogoUpload  = handleLogoUpload;
window.removeLogo      = removeLogo;
window.openEmpModal    = openEmpModal;
window.editEmp         = editEmp;
window.saveEmp         = saveEmp;
window.delEmp          = delEmp;
window.openSvcModal    = openSvcModal;
window.editSvc         = editSvc;
window.saveSvc         = saveSvc;
window.delSvc          = delSvc;
