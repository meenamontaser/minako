// قسم الحسابات (خاص بالأدمن فقط) — بيتحمّل لما تفتحه بس
import { collection, doc, getDocs, getDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const A = window.APP, db = A.db, esc = A.esc, $ = id => document.getElementById(id);
const fmt = n => Math.round(+n || 0).toLocaleString('en');
const CATS = { finishing: ['مواد', 'عمالة', 'نقل', 'مقاول باطن', 'أخرى'], sale: ['سمسار / مندوب', 'إعلان', 'رسوم ومصروفات', 'أخرى'] };
const MODES = {
  finishing: [['cost_plus', 'مصروفات + نسبة إشراف %'], ['contract', 'مبلغ تعاقد ثابت (الإشراف داخله)'], ['contract_pct', 'تعاقد + نسبة إشراف % من التعاقد']],
  sale: [['pct', 'عمولة نسبة % من قيمة الصفقة'], ['fixed', 'عمولة مبلغ ثابت']]
};
const KIND = { finishing: 'التشطيبات', sale: 'البيع' };
let P = [], E = [], tab = 'finishing', cur = null, loaded = false, fk = 'finishing', editP = null, eType = 'expense';

const css = `.acc{position:fixed;inset:0;z-index:9000;background:#0a0a0f;color:#f0ead8;overflow:auto;direction:rtl;font-family:'Tajawal',sans-serif;padding-bottom:90px}
.acc *{box-sizing:border-box;font-family:inherit}
.acc .ah{position:sticky;top:0;background:#0a0a0f;display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #26263a;z-index:2}
.acc .ah b{color:#e3c56e;font-size:17px}.acc button{cursor:pointer}
.acc .ib{background:#131320;border:1px solid #26263a;color:#f0ead8;border-radius:10px;padding:7px 12px;font-size:14px}
.acc .tabs{display:flex;gap:8px;padding:12px 14px}.acc .tabs button{flex:1;padding:10px;border-radius:12px;border:1px solid #26263a;background:#131320;color:#8a8aa0;font-weight:700;font-size:14px}
.acc .tabs button.on{background:linear-gradient(135deg,#c9a84c,#a88a35);color:#0a0a0f;border-color:#c9a84c}
.acc .wrap{padding:0 14px}
.acc .card{background:#131320;border:1px solid #26263a;border-radius:14px;padding:12px;margin-bottom:10px}
.acc .card h4{font-size:15px;margin-bottom:2px}.acc .sub{font-size:12px;color:#8a8aa0}
.acc .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.acc .n{background:#0d0d17;border-radius:10px;padding:8px;text-align:center}.acc .n i{display:block;font-style:normal;font-size:11px;color:#8a8aa0}.acc .n b{font-size:15px}
.acc .pos{color:#4ade80}.acc .neg{color:#f87171}.acc .gold{color:#e3c56e}
.acc .add{width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#c9a84c,#a88a35);color:#0a0a0f;font-weight:800;font-size:15px;margin-bottom:12px}
.acc .row2{display:flex;gap:8px;margin:10px 0}.acc .row2 button{flex:1;padding:11px;border-radius:12px;border:none;font-weight:800;font-size:14px}
.acc .ent{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #1d1d2e;font-size:13px}.acc .ent .m{flex:1}.acc .ent small{display:block;color:#8a8aa0;font-size:11px}
.acc .chip{display:inline-block;font-size:11px;padding:2px 8px;border-radius:20px;background:#1d1d2e;color:#8a8aa0;margin-right:6px}
.acc .mod{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9500;display:flex;align-items:flex-end}
.acc .mb{background:#131320;width:100%;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px}
.acc label{display:block;font-size:12px;color:#8a8aa0;margin:10px 0 4px}
.acc input,.acc select,.acc textarea{width:100%;padding:11px;border-radius:10px;border:1px solid #26263a;background:#0d0d17;color:#f0ead8;font-size:15px}
.acc .bar{height:6px;border-radius:4px;background:#1d1d2e;overflow:hidden;margin-top:4px}.acc .bar i{display:block;height:100%;background:#c9a84c}
#accinv{position:fixed;inset:0;background:#000;z-index:9600;display:none;align-items:center;justify-content:center}#accinv.show{display:flex}#accinv img{max-width:100%;max-height:100%}`;

// ───── الحسابات ─────
const sum = (es, t) => es.filter(e => e.type === t).reduce((a, e) => a + (+e.amount || 0), 0);
function calc(p) {
  const es = E.filter(e => e.pid === p.id), exp = sum(es, 'expense'), pay = sum(es, 'payment');
  const c = +p.contract || 0, v = +p.val || 0;
  let fee = 0, due = 0, profit = 0;
  if (p.kind === 'sale') { fee = p.mode === 'fixed' ? v : c * v / 100; due = c; profit = fee - exp; }
  else if (p.mode === 'contract') { due = c; profit = c - exp; }
  else if (p.mode === 'contract_pct') { fee = c * v / 100; due = c + fee; profit = due - exp; }
  else { fee = exp * v / 100; due = exp + fee; profit = fee; }
  const cats = {}; es.filter(e => e.type === 'expense').forEach(e => cats[e.cat] = (cats[e.cat] || 0) + (+e.amount || 0));
  return { exp, pay, fee, due, remain: due - pay, profit, cash: pay - exp, cats };
}
const cl = n => n < 0 ? 'neg' : 'pos';

async function load() {
  A.showSync();
  try {
    const [a, b] = await Promise.all([getDocs(collection(db, 'acc_projects')), getDocs(collection(db, 'acc_entries'))]);
    P = a.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => y.createdAt - x.createdAt);
    E = b.docs.map(d => ({ id: d.id, ...d.data() }));
    loaded = true;
  } catch (e) { A.toast('❌ تعذر تحميل الحسابات (راجع قواعد Firebase)'); }
  A.hideSync();
}

// ───── العرض ─────
function render() {
  const el = $('acc');
  const head = `<div class="ah"><button class="ib" onclick="AC.close()">✕ إغلاق</button><b>📒 الحسابات</b><button class="ib" onclick="AC.reload()">🔄</button></div>`;
  if (cur) { const p = P.find(x => x.id === cur); if (p) { el.innerHTML = head + detail(p); return } cur = null; }
  const tabs = `<div class="tabs">${['finishing', 'sale', 'sum'].map(t => `<button class="${tab === t ? 'on' : ''}" onclick="AC.tab('${t}')">${t === 'sum' ? '📊 الملخص' : KIND[t]}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'sum') body = summary();
  else {
    const list = P.filter(p => p.kind === tab);
    body = `<div class="wrap"><button class="add" onclick="AC.pForm('${tab}')">➕ ${tab === 'sale' ? 'صفقة بيع جديدة' : 'مشروع تشطيب جديد'}</button>` +
      (list.length ? list.map(p => { const c = calc(p); return `<div class="card" onclick="AC.open('${p.id}')"><h4>${esc(p.title)}${p.status === 'done' ? '<span class="chip">منتهي</span>' : ''}</h4><div class="sub">${esc(p.client || '')}</div>
        <div class="grid"><div class="n"><i>${tab === 'sale' ? 'قيمة الصفقة' : 'المطلوب من العميل'}</i><b>${fmt(c.due)}</b></div><div class="n"><i>المتبقي</i><b class="${c.remain > 0 ? 'gold' : 'pos'}">${fmt(c.remain)}</b></div>
        <div class="n"><i>المصروفات</i><b>${fmt(c.exp)}</b></div><div class="n"><i>الربح</i><b class="${cl(c.profit)}">${fmt(c.profit)}</b></div></div></div>` }).join('') : '<div class="sub" style="text-align:center;padding:30px">لا يوجد شيء بعد</div>') + '</div>';
  }
  el.innerHTML = head + tabs + body;
}
function summary() {
  const t = k => P.filter(p => !k || p.kind === k).map(calc).reduce((a, c) => ({ due: a.due + c.due, pay: a.pay + c.pay, remain: a.remain + c.remain, exp: a.exp + c.exp, profit: a.profit + c.profit }), { due: 0, pay: 0, remain: 0, exp: 0, profit: 0 });
  const box = (title, c) => `<div class="card"><h4>${title}</h4><div class="grid"><div class="n"><i>المطلوب</i><b>${fmt(c.due)}</b></div><div class="n"><i>المدفوع</i><b class="pos">${fmt(c.pay)}</b></div><div class="n"><i>المتبقي</i><b class="gold">${fmt(c.remain)}</b></div><div class="n"><i>المصروفات</i><b>${fmt(c.exp)}</b></div></div><div class="n" style="margin-top:8px"><i>الربح</i><b class="${cl(c.profit)}" style="font-size:19px">${fmt(c.profit)}</b></div></div>`;
  return `<div class="wrap">${box('الإجمالي', t())}${box('التشطيبات', t('finishing'))}${box('البيع', t('sale'))}<div class="sub" style="text-align:center">الأرقام بالجنيه. الربح = العمولة أو الإشراف أو التعاقد ناقص المصروفات حسب طريقة كل ملف.</div></div>`;
}
function detail(p) {
  const c = calc(p), es = E.filter(e => e.pid === p.id).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
  const mode = (MODES[p.kind].find(m => m[0] === p.mode) || [0, ''])[1];
  const catRows = Object.entries(c.cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div style="margin-top:8px;font-size:13px;display:flex;justify-content:space-between"><span>${esc(k)}</span><b>${fmt(v)} <small class="sub">(${c.exp ? Math.round(v / c.exp * 100) : 0}%)</small></b></div><div class="bar"><i style="width:${c.exp ? v / c.exp * 100 : 0}%"></i></div>`).join('');
  return `<div class="wrap" style="padding-top:12px"><button class="ib" onclick="AC.back()">← رجوع</button> <button class="ib" onclick="AC.pForm('${p.kind}','${p.id}')">✏️ تعديل</button> <button class="ib" onclick="AC.csv('${p.id}')">⬇️ إكسل</button> <button class="ib" onclick="AC.delP('${p.id}')">🗑️</button>
  <div class="card" style="margin-top:10px"><h4>${esc(p.title)}</h4><div class="sub">${esc(p.client || '')} • ${esc(mode)}${p.mode !== 'contract' ? ' • ' + (p.mode === 'fixed' ? fmt(p.val) : (+p.val || 0) + '%') : ''}</div>${p.note ? `<div class="sub" style="margin-top:4px">${esc(p.note)}</div>` : ''}
  <div class="grid"><div class="n"><i>${p.kind === 'sale' ? 'قيمة الصفقة' : 'المطلوب من العميل'}</i><b>${fmt(c.due)}</b></div><div class="n"><i>المدفوع</i><b class="pos">${fmt(c.pay)}</b></div>
  <div class="n"><i>المتبقي</i><b class="gold">${fmt(c.remain)}</b></div><div class="n"><i>المصروفات</i><b>${fmt(c.exp)}</b></div>
  <div class="n"><i>${p.kind === 'sale' ? 'العمولة' : 'الإشراف'}</i><b>${fmt(c.fee)}</b></div><div class="n"><i>الربح</i><b class="${cl(c.profit)}">${fmt(c.profit)}</b></div></div>
  <div class="n" style="margin-top:8px"><i>صافي النقدية (المدفوع − المصروفات)</i><b class="${cl(c.cash)}">${fmt(c.cash)}</b></div></div>
  <div class="row2"><button style="background:#7f1d1d;color:#fff" onclick="AC.eForm('expense')">➖ مصروف</button><button style="background:#14532d;color:#fff" onclick="AC.eForm('payment')">➕ ${p.kind === 'sale' ? 'دفعة مشتري' : 'دفعة عميل'}</button></div>
  ${catRows ? `<div class="card"><h4>المصروفات حسب القسم</h4>${catRows}</div>` : ''}
  <div class="card"><h4>الحركات (${es.length})</h4>${es.map(e => `<div class="ent"><div class="m"><b>${esc(e.cat)}</b> <small>${esc(e.date || '')}${e.note ? ' • ' + esc(e.note) : ''}</small></div><b class="${e.type === 'payment' ? 'pos' : 'neg'}">${e.type === 'payment' ? '+' : '−'}${fmt(e.amount)}</b>${e.hasInv ? `<button class="ib" onclick="AC.inv('${e.id}')">🧾</button>` : ''}<button class="ib" onclick="AC.delE('${e.id}')">🗑️</button></div>`).join('') || '<div class="sub">لا توجد حركات</div>'}</div></div>`;
}

// ───── النماذج ─────
function modal(html) { const m = document.createElement('div'); m.className = 'mod'; m.id = 'accm'; m.innerHTML = `<div class="mb">${html}</div>`; $('acc').appendChild(m); }
const closeM = () => { const m = $('accm'); if (m) m.remove(); };
const opts = a => a.map(x => Array.isArray(x) ? `<option value="${x[0]}">${x[1]}</option>` : `<option>${x}</option>`).join('');

const AC = {
  close() { $('acc').style.display = 'none'; },
  async reload() { await load(); render(); },
  tab(t) { tab = t; cur = null; render(); },
  open(id) { cur = id; render(); $('acc').scrollTop = 0; },
  back() { cur = null; render(); },
  pForm(kind, id) {
    fk = kind; editP = id || null; const p = id ? P.find(x => x.id === id) : {};
    const sale = kind === 'sale';
    modal(`<h3 style="color:#e3c56e">${id ? 'تعديل' : 'جديد'}: ${sale ? 'صفقة بيع' : 'مشروع تشطيب'}</h3>
    <label>${sale ? 'اسم العقار / الوحدة' : 'اسم المشروع'} *</label><input id="fT" value="${esc(p.title || '')}">
    <label>${sale ? 'المشتري' : 'العميل'}</label><input id="fC" value="${esc(p.client || '')}">
    <label>${sale ? 'قيمة الصفقة (سعر البيع)' : 'قيمة التعاقد (لو في تعاقد)'}</label><input id="fK" type="number" inputmode="decimal" value="${p.contract || ''}">
    <label>طريقة الحساب</label><select id="fM">${opts(MODES[kind])}</select>
    <label>${sale ? 'نسبة العمولة % أو مبلغها' : 'نسبة الإشراف %'}</label><input id="fV" type="number" inputmode="decimal" value="${p.val || ''}">
    <label>الحالة</label><select id="fS"><option value="active">جاري</option><option value="done">منتهي</option></select>
    <label>ملاحظات</label><textarea id="fN" rows="2">${esc(p.note || '')}</textarea>
    <div class="row2"><button style="background:#c9a84c;color:#0a0a0f" onclick="AC.saveP()">💾 حفظ</button><button style="background:#26263a;color:#f0ead8" onclick="AC.closeM()">إلغاء</button></div>`);
    if (p.mode) $('fM').value = p.mode; if (p.status) $('fS').value = p.status;
  },
  closeM,
  async saveP() {
    const t = $('fT').value.trim(); if (!t) { A.toast('اكتب الاسم'); return }
    const id = editP || String(Date.now()), old = P.find(x => x.id === id);
    const d = { kind: fk, title: t, client: $('fC').value.trim(), contract: +$('fK').value || 0, mode: $('fM').value, val: +$('fV').value || 0, status: $('fS').value, note: $('fN').value.trim(), createdAt: old ? old.createdAt : Date.now() };
    A.showSync();
    try { const b = writeBatch(db); b.set(doc(db, 'acc_projects', id), d); await b.commit(); const i = P.findIndex(x => x.id === id); if (i >= 0) P[i] = { id, ...d }; else P.unshift({ id, ...d }); closeM(); render(); A.toast('✅ تم الحفظ'); }
    catch (e) { A.toast('❌ فشل الحفظ'); }
    A.hideSync();
  },
  eForm(type) {
    eType = type; const p = P.find(x => x.id === cur);
    modal(`<h3 style="color:#e3c56e">${type === 'expense' ? '➖ مصروف جديد' : '➕ دفعة جديدة'}</h3>
    ${type === 'expense' ? `<label>القسم</label><select id="eC">${opts(CATS[p.kind])}</select>` : ''}
    <label>المبلغ *</label><input id="eA" type="number" inputmode="decimal">
    <label>التاريخ</label><input id="eD" type="date" value="${new Date().toISOString().slice(0, 10)}">
    <label>ملاحظة</label><input id="eN">
    ${type === 'expense' ? '<label>🧾 صورة الفاتورة</label><input id="eF" type="file" accept="image/*">' : ''}
    <div class="row2"><button style="background:#c9a84c;color:#0a0a0f" onclick="AC.saveE()">💾 حفظ</button><button style="background:#26263a;color:#f0ead8" onclick="AC.closeM()">إلغاء</button></div>`);
  },
  async saveE() {
    const amt = +$('eA').value; if (!(amt > 0)) { A.toast('اكتب المبلغ'); return }
    const id = String(Date.now()); A.showSync();
    try {
      const f = $('eF') && $('eF').files[0];
      const img = f ? await A.shrink(await A.readFile(f), 900, 80 * 1024) : null;
      const d = { pid: cur, type: eType, cat: eType === 'expense' ? $('eC').value : 'دفعة', amount: amt, date: $('eD').value, note: $('eN').value.trim(), hasInv: !!img, createdAt: Date.now() };
      const b = writeBatch(db); b.set(doc(db, 'acc_entries', id), d); if (img) b.set(doc(db, 'acc_inv', id), { img }); await b.commit();
      E.push({ id, ...d }); closeM(); render(); A.toast('✅ تم الحفظ');
    } catch (e) { A.toast('❌ فشل الحفظ'); }
    A.hideSync();
  },
  async delE(id) {
    if (!confirm('حذف الحركة دي؟')) return; A.showSync();
    try { const b = writeBatch(db); b.delete(doc(db, 'acc_entries', id)); b.delete(doc(db, 'acc_inv', id)); await b.commit(); E = E.filter(e => e.id !== id); render(); }
    catch (e) { A.toast('❌ فشل الحذف'); }
    A.hideSync();
  },
  async delP(id) {
    const p = P.find(x => x.id === id); if (!confirm(`حذف "${p.title}" وكل حركاته؟`)) return; A.showSync();
    try {
      const es = E.filter(e => e.pid === id).slice(0, 220), b = writeBatch(db);
      es.forEach(e => { b.delete(doc(db, 'acc_entries', e.id)); b.delete(doc(db, 'acc_inv', e.id)); }); b.delete(doc(db, 'acc_projects', id)); await b.commit();
      P = P.filter(x => x.id !== id); E = E.filter(e => e.pid !== id); cur = null; render();
    } catch (e) { A.toast('❌ فشل الحذف'); }
    A.hideSync();
  },
  async inv(id) {
    try {
      const d = await getDoc(doc(db, 'acc_inv', id)); if (!d.exists()) { A.toast('لا توجد صورة'); return }
      let v = $('accinv'); if (!v) { v = document.createElement('div'); v.id = 'accinv'; v.onclick = () => v.classList.remove('show'); v.innerHTML = '<img>'; document.body.appendChild(v) }
      v.firstChild.src = d.data().img; v.classList.add('show');
    } catch (e) { A.toast('❌ تعذر فتح الفاتورة') }
  },
  csv(id) {
    const p = P.find(x => x.id === id), c = calc(p), q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const rows = [['التاريخ', 'النوع', 'القسم', 'المبلغ', 'ملاحظة'], ...E.filter(e => e.pid === id).sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(e => [e.date, e.type === 'payment' ? 'دفعة' : 'مصروف', e.cat, e.amount, e.note]),
      [], ['المطلوب', c.due], ['المدفوع', c.pay], ['المتبقي', c.remain], ['المصروفات', c.exp], ['الربح', c.profit]];
    const blob = new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (p.title || 'account') + '.csv'; a.click();
  }
};
window.AC = AC;

export async function open() {
  if (!A.getUser()) { A.toast('سجّل دخول الأدمن الأول'); return }
  if (!$('acc')) {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const d = document.createElement('div'); d.id = 'acc'; d.className = 'acc'; document.body.appendChild(d);
  }
  $('acc').style.display = 'block';
  if (!loaded) { $('acc').innerHTML = '<div class="ah"><b>⏳ جاري التحميل...</b></div>'; await load(); }
  render();
}
