// ============================================================
//  utils.js — Pure helper functions (no DOM, no Supabase)
// ============================================================
import { employees } from './config.js';

// ── Formatting ────────────────────────────────────────────────
export const fmt  = n => Number(n).toLocaleString('en-US');
export const fmtK = n => fmt(n) + ' Ks';
export const sum  = arr => arr.reduce((s, x) => s + (Number(x.total) || 0), 0);

export function init(n) {
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Date helpers ──────────────────────────────────────────────
export const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export const getT = obj =>
  obj ? (obj.created_at || obj.timestamp || obj.opened_at || new Date().toISOString()) : new Date().toISOString();

export const fTm = d => {
  if (!d || d === 'null') return 'No Time';
  const dt = new Date(d);
  if (isNaN(dt)) return 'No Time';
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const startD  = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const isDay   = (a, b) => startD(new Date(a)).getTime() === startD(new Date(b)).getTime();
export const isWk    = (a, b) => {
  const da = new Date(a), db = new Date(b);
  const ma = new Date(da); ma.setDate(da.getDate() - ((da.getDay() + 6) % 7)); ma.setHours(0, 0, 0, 0);
  const mb = new Date(db); mb.setDate(db.getDate() - ((db.getDay() + 6) % 7)); mb.setHours(0, 0, 0, 0);
  return ma.getTime() === mb.getTime();
};
export const isMo    = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
};

export const getExpDate = e =>
  e.expense_date || (e.created_at ? e.created_at.split('T')[0] : todayStr());

// ── Data helpers ──────────────────────────────────────────────
export function parseItems(raw) {
  try { return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []); }
  catch (e) { return []; }
}

export function getEmpNameForDetail(id) {
  if (!id) return 'Admin';
  const e = employees.find(x => x.id === id);
  return e ? e.name : 'Unknown';
}

export function calcCommission(t) {
  const items = parseItems(t.items);
  return items.reduce((s, i) => s + (Number(i.price) * Number(i.qty) * (Number(i.savedRate) || 0.4)), 0);
}

// ── Toast ─────────────────────────────────────────────────────
export function toast(m, t = '') {
  const el = document.getElementById('toast');
  el.textContent = m;
  el.className = 'show ' + t;
  setTimeout(() => el.className = '', 4000);
}

// ── Modal helpers ─────────────────────────────────────────────
export const cls = id => document.getElementById(id).classList.remove('open');
export const opn = id => document.getElementById(id).classList.add('open');
