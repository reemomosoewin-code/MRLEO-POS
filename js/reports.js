// ============================================================
//  reports.js — Date-range reports, export to CSV
// ============================================================
import * as C from './config.js';
import { fmtK, fmt, getT, sum, init, parseItems,
         getEmpNameForDetail, calcCommission, toast, todayStr, getExpDate } from './utils.js';

export function setRptRange(r) {
  const today = new Date(); const t = todayStr();
  let from = t, to = t;
  if (r === 'week')  { const d = new Date(today); d.setDate(today.getDate() - ((today.getDay() + 6) % 7)); from = d.toISOString().split('T')[0]; }
  else if (r === 'month') { from = t.substring(0, 7) + '-01'; }
  else if (r === 'year')  { from = t.substring(0, 4) + '-01-01'; }
  document.getElementById('rpt-from').value = from;
  document.getElementById('rpt-to').value   = to;
  document.querySelectorAll('[id^="rpt-sc-"]').forEach(b => b.classList.remove('on'));
  const btn = document.getElementById('rpt-sc-' + r);
  if (btn) btn.classList.add('on');
  renderReport();
}

export function populateRptEmpFilter() {
  const sel = document.getElementById('rpt-emp-filter'); if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="all">👥 ဝန်ထမ်းအားလုံး (All Stylists)</option>' +
    C.employees.filter(e => e.status === 'active').map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  if (prev) sel.value = prev;
}

export function renderReport() {
  const from      = document.getElementById('rpt-from').value;
  const to        = document.getElementById('rpt-to').value;
  const empFilter = document.getElementById('rpt-emp-filter')?.value || 'all';

  let fTxn = C.transactions;
  let fExp = C.expenses;

  if (from) fTxn = fTxn.filter(t => getT(t).split('T')[0] >= from);
  if (to)   fTxn = fTxn.filter(t => getT(t).split('T')[0] <= to);
  if (empFilter !== 'all') fTxn = fTxn.filter(t => t.employee_id === empFilter || (!t.employee_id && empFilter === 'admin'));
  if (from) fExp = fExp.filter(e => getExpDate(e) >= from);
  if (to)   fExp = fExp.filter(e => getExpDate(e) <= to);

  const tSales    = sum(fTxn);
  const tCash     = sum(fTxn.filter(t => t.payment_method === 'cash'));
  const tQR       = sum(fTxn.filter(t => t.payment_method === 'mmqr'));
  const tExp      = fExp.reduce((s, e) => s + (e.amount || 0), 0);
  const tComm     = fTxn.reduce((s, t) => s + (Number(t.commission) || calcCommission(t)), 0);
  const netProfit = tSales - tExp - tComm;
  const label     = from && to ? `${from} မှ ${to}` : 'ရက်စွဲ မရွေးရသေးပါ';

  document.getElementById('rpt-summary').innerHTML = `
    <div style="font-weight:700;color:var(--gold);margin-bottom:12px;font-size:13px;text-align:center;padding:0 4px">${label}</div>
    <div class="sg" style="margin-bottom:4px">
      <div class="sc"><div class="sl">ရောင်းရငွေ</div><div class="sv c-gold">${fmtK(tSales)}</div></div>
      <div class="sc" style="background:rgba(46,160,67,.05);border-color:var(--g)"><div class="sl" style="color:var(--g)">အသားတင် Profit</div><div class="sv c-green">${fmtK(netProfit)}</div></div>
      <div class="sc"><div class="sl">💵 ငွေသား</div><div class="sv c-green" style="font-size:16px">${fmtK(tCash)}</div></div>
      <div class="sc"><div class="sl">📱 KPay/QR</div><div class="sv" style="color:var(--b);font-size:16px">${fmtK(tQR)}</div></div>
      <div class="sc"><div class="sl">အသုံးစရိတ်</div><div class="sv c-red" style="font-size:16px">${fmtK(tExp)}</div></div>
      <div class="sc"><div class="sl">ကော်မရှင်</div><div class="sv c-red" style="font-size:16px">${fmtK(Math.round(tComm))}</div></div>
    </div>`;

  // Top services
  const svcCount = {};
  fTxn.forEach(t => parseItems(t.items).forEach(i => {
    const k = i.name;
    if (!svcCount[k]) svcCount[k] = { name: i.name, emoji: i.emoji || '✂️', count: 0, rev: 0 };
    svcCount[k].count += Number(i.qty) || 1;
    svcCount[k].rev   += (Number(i.price) || 0) * (Number(i.qty) || 1);
  }));
  const topSvc = Object.values(svcCount).sort((a, b) => b.count - a.count).slice(0, 5);
  document.getElementById('rpt-top-services').innerHTML = topSvc.length
    ? `<div class="ctitle">🏆 Top Services</div>` + topSvc.map((s, i) =>
      `<div class="list-row" style="margin-bottom:8px">
        <div class="lr-icon" style="background:var(--gold-sub);color:var(--gold);font-size:18px">${s.emoji}</div>
        <div class="lr-info"><div class="lr-title">${s.name}</div><div class="lr-sub">${s.count} ကြိမ် · ${fmtK(s.rev)}</div></div>
        <div class="lr-right"><div style="font-size:20px;font-weight:800;color:var(--gold)">#${i + 1}</div></div>
      </div>`).join('')
    : '';

  // Top stylists
  const stylistData = {};
  C.employees.filter(e => e.status === 'active').forEach(e => {
    stylistData[e.id] = { name: e.name, color: e.color, count: 0, rev: 0, comm: 0 };
  });
  stylistData['admin'] = { name: 'Admin/Cashier', color: 'var(--gold)', count: 0, rev: 0, comm: 0 };
  fTxn.forEach(t => {
    const key = t.employee_id || 'admin';
    if (!stylistData[key]) stylistData[key] = { name: 'Unknown', color: '#888', count: 0, rev: 0, comm: 0 };
    stylistData[key].count++;
    stylistData[key].rev  += Number(t.total) || 0;
    stylistData[key].comm += Number(t.commission) || calcCommission(t);
  });
  const topStylists = Object.values(stylistData).filter(s => s.count > 0).sort((a, b) => b.rev - a.rev);
  document.getElementById('rpt-top-stylists').innerHTML = topStylists.length
    ? `<div class="ctitle">💇 Stylist အကောင်းဆုံး</div>` + topStylists.map(s =>
      `<div class="list-row" style="margin-bottom:8px">
        <div class="lr-icon" style="background:${s.color}">${init(s.name)}</div>
        <div class="lr-info"><div class="lr-title">${s.name}</div><div class="lr-sub">${s.count} clients · Comm: ${fmtK(Math.round(s.comm))}</div></div>
        <div class="lr-right"><div class="lr-val">${fmtK(s.rev)}</div></div>
      </div>`).join('')
    : '';
}

export function exportReportExcel() {
  const from = document.getElementById('rpt-from').value;
  const to   = document.getElementById('rpt-to').value;
  if (!from || !to) { toast('ရက်စွဲ ရွေးပါ', 'err'); return; }
  let fTxn = C.transactions.filter(t => getT(t).split('T')[0] >= from && getT(t).split('T')[0] <= to);
  let fExp = C.expenses.filter(e => getExpDate(e) >= from && getExpDate(e) <= to);
  if (!fTxn.length && !fExp.length) { toast('ဒေတာမရှိပါ', 'err'); return; }
  const BOM = '\uFEFF';
  let csv = BOM + 'Type,Date,Time,Total,Payment,Employee,Items,Commission,Category\n';
  fTxn.forEach(t => {
    const dt    = new Date(getT(t));
    const items = parseItems(t.items).map(i => `${i.name}(x${i.qty})`).join(';');
    csv += `Sale,${dt.toLocaleDateString()},${dt.toLocaleTimeString()},${t.total},${t.payment_method},${getEmpNameForDetail(t.employee_id)},"${items}",${Math.round(Number(t.commission) || calcCommission(t))},\n`;
  });
  fExp.forEach(e => { csv += `Expense,${getExpDate(e)},,${e.amount},,Admin,"${e.description}",,${e.category || 'other'}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `MRLEO_Report_${from}_to_${to}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('✅ Export ပြီးပါပြီ', 'ok');
}

export function exportFullDatabase() {
  if (C.transactions.length === 0 && C.expenses.length === 0) return toast('No data to export', 'err');
  const BOM = '\uFEFF';
  let csv = BOM + 'Type,ID,Date,Time,Total,Payment Method,Employee,Items/Description,Session ID\n';
  C.transactions.forEach(t => {
    const dt      = new Date(getT(t));
    const empName = getEmpNameForDetail(t.employee_id);
    const items   = parseItems(t.items).map(i => `${i.name} (x${i.qty})`).join('; ');
    csv += `Sale,${t.id},${dt.toLocaleDateString()},${dt.toLocaleTimeString()},${t.total},${t.payment_method},${empName},"${items}",${t.session_id}\n`;
  });
  C.expenses.forEach(e => {
    const dt = new Date(getT(e));
    csv += `Expense,${e.id},${dt.toLocaleDateString()},${dt.toLocaleTimeString()},-${e.amount},Cash,Admin,"${e.description}",${e.session_id}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `MRLEO_Full_Database_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('✅ Full Database Excel ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ', 'ok');
}

window.setRptRange        = setRptRange;
window.renderReport       = renderReport;
window.exportReportExcel  = exportReportExcel;
window.exportFullDatabase = exportFullDatabase;
