/**
 * M/s Lee Enterprise — backend for the website & app (Google Apps Script)
 *  • Expense tally (Lee Enterprise + T.N Consultant)
 *  • Projects, progress updates and client messages (client portal)
 *  • Public portfolio shown on the website
 *  • Office Manager that can add items by chat or voice
 *
 * ONE-TIME SETUP — see SETUP-GUIDE.md:
 *  1. script.google.com → New project (or a Sheet → Extensions → Apps Script) → paste this file → Save.
 *  2. Run "setup" → allow → copy OWNER KEY and WORKER CODE from the log.
 *  3. (Office Manager) Project Settings ⚙ → Script properties → add ANTHROPIC_API_KEY.
 *  4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone → copy the /exec link.
 */

const TZ = 'Asia/Kolkata';
const COMPANIES = ['M/s Lee Enterprise', 'T.N Consultant'];
const AI_MODEL = 'claude-haiku-5-5';

const SHEETS = {
  Expenses: ['ID','Submitted','Expense Date','Company','Worker','Category','Project / Site','Description','Amount (Rs)','Paid By','Bill Photo','Status','Owner Note','Updated'],
  Projects: ['ID','Name','Client','Location','Company','Category','Status','Progress %','Client Code','Show on Website','Description','Cover Photo','Created','Updated'],
  Updates:  ['ID','Project ID','Date','Title','Details','Progress %','Photos','Visible to Client','Created'],
  Messages: ['ID','Project ID','Date','From','Name','Text','Photo','Read']
};

/* ───────────────────────── setup & helpers ───────────────────────── */

function setup() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('OWNER_KEY')) p.setProperty('OWNER_KEY', 'LEE-' + Utilities.getUuid().slice(0, 8).toUpperCase());
  if (!p.getProperty('WORKER_CODE')) p.setProperty('WORKER_CODE', String(Math.floor(100000 + Math.random() * 900000)));
  Object.keys(SHEETS).forEach(function (n) { sheet_(n); }); folder_();
  const s1 = ss_().getSheetByName('Sheet1'); if (s1 && ss_().getSheets().length > 1) ss_().deleteSheet(s1);
  Logger.log('SHEET: ' + ss_().getUrl());
  Logger.log('OWNER KEY  (only for you): ' + p.getProperty('OWNER_KEY'));
  Logger.log('WORKER CODE (give to staff): ' + p.getProperty('WORKER_CODE'));
}

function newWorkerCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  PropertiesService.getScriptProperties().setProperty('WORKER_CODE', code);
  Logger.log('NEW WORKER CODE: ' + code);
}

function ss_() {
  try { const a = SpreadsheetApp.getActiveSpreadsheet(); if (a) return a; } catch (e) {}
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const s = SpreadsheetApp.create('Lee Enterprise Office');
  p.setProperty('SHEET_ID', s.getId());
  return s;
}

function sheet_(name) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const h = SHEETS[name];
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#0a2350').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function folder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Lee Enterprise - App Photos');
  p.setProperty('FOLDER_ID', f.getId());
  return f;
}

function savePhoto_(dataUrl, name) {
  if (!dataUrl || !/^data:image\//.test(dataUrl)) return '';
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!m) return '';
  const file = folder_().createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name + '.jpg'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?sz=w1200&id=' + file.getId();
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function fmtDate_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v || ''); }
function newId_(prefix) { return prefix + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 100); }
function clientCode_() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

function rows_(name) {
  const sh = sheet_(name), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, SHEETS[name].length).getValues().map(function (r, i) { r._row = i + 2; return r; });
}
function rowById_(name, id) {
  const r = rows_(name).filter(function (x) { return String(x[0]) === String(id); });
  return r.length ? r[0] : null;
}
function withLock_(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }

/* ───────────────────────── router ───────────────────────── */

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'portfolio') return json_({ ok: true, items: portfolio_() });
  return json_({ ok: true, app: 'Lee Enterprise backend' });
}

function doPost(e) {
  let q;
  try { q = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Bad request' }); }
  const p = PropertiesService.getScriptProperties();
  const owner = q.key && q.key === p.getProperty('OWNER_KEY');
  const worker = owner || (q.code && String(q.code) === p.getProperty('WORKER_CODE'));
  const need = function (ok, msg) { if (!ok) throw new Error(msg); };
  try {
    switch (q.action) {
      case 'ping': return json_({ ok: true, role: owner ? 'owner' : worker ? 'worker' : 'none', ai: !!p.getProperty('ANTHROPIC_API_KEY') });
      case 'portfolio': return json_({ ok: true, items: portfolio_() });
      // expenses
      case 'add':    need(worker, 'Wrong worker code'); return json_(addExpense_(q.item));
      case 'mine':   need(worker, 'Wrong worker code'); return json_(mine_(q.worker));
      case 'list':   need(owner, 'Owner key required'); return json_({ ok: true, items: expenses_() });
      case 'update': need(owner, 'Owner key required'); return json_(updateExpense_(q.id, q.fields));
      case 'delete': need(owner, 'Owner key required'); return json_(deleteRow_('Expenses', q.id));
      // projects (owner)
      case 'projList':  need(owner, 'Owner key required'); return json_({ ok: true, items: projects_(true) });
      case 'projSave':  need(owner, 'Owner key required'); return json_(saveProject_(q.item));
      case 'projDelete':need(owner, 'Owner key required'); return json_(deleteRow_('Projects', q.id));
      case 'projDetail':need(owner, 'Owner key required'); return json_(projectDetail_(q.id, true));
      case 'updAdd':    need(owner, 'Owner key required'); return json_(addUpdate_(q.item));
      case 'updDelete': need(owner, 'Owner key required'); return json_(deleteRow_('Updates', q.id));
      case 'msgList':   need(owner, 'Owner key required'); return json_({ ok: true, items: messages_() });
      case 'msgSend':   need(owner, 'Owner key required'); return json_(addMessage_(q.projectId, 'Owner', 'M/s Lee Enterprise', q.text, q.photo));
      case 'msgRead':   need(owner, 'Owner key required'); return json_(markRead_(q.projectId));
      // client portal
      case 'client':    return json_(clientView_(q.clientCode));
      case 'clientMsg': return json_(clientMessage_(q.clientCode, q.name, q.text, q.photo));
      // AI manager
      case 'ai':        need(owner, 'Owner key required'); return json_(ai_(q.messages, q.photo));
      default: {
        // Client requirement form & quotations (Brief.gs)
        const br = typeof briefRoute_ === 'function' ? briefRoute_(q, owner) : null;
        if (br) return json_(br);
      }
    }
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ───────────────────────── expenses ───────────────────────── */

function addExpense_(it) {
  if (!it) return { ok: false, error: 'No data' };
  const amount = Number(it.amount);
  if (!(amount > 0)) return { ok: false, error: 'Amount must be more than 0' };
  const company = COMPANIES.indexOf(it.company) >= 0 ? it.company : COMPANIES[0];
  return withLock_(function () {
    const sh = sheet_('Expenses');
    if (it.cid && rowById_('Expenses', it.cid)) return { ok: true, id: it.cid, duplicate: true };
    const id = it.cid || newId_('E');
    const photo = it.photoUrl || savePhoto_(it.photo, id);
    const now = new Date();
    sh.appendRow([id, now, it.date || today_(), company, String(it.worker || 'Owner').slice(0, 60), String(it.category || 'Other').slice(0, 40),
      String(it.project || '').slice(0, 120), String(it.desc || '').slice(0, 500), amount, String(it.paidBy || '').slice(0, 40),
      photo, it.status || 'Pending', '', now]);
    return { ok: true, id: id };
  });
}

function expenses_() {
  return rows_('Expenses').map(function (r) {
    return { id: r[0], submitted: r[1] instanceof Date ? r[1].toISOString() : r[1], date: fmtDate_(r[2]), company: r[3], worker: r[4],
      category: r[5], project: r[6], desc: r[7], amount: Number(r[8]) || 0, paidBy: r[9], photo: r[10], status: r[11], note: r[12] };
  });
}

function mine_(worker) {
  const w = String(worker || '').trim().toLowerCase();
  return { ok: true, items: expenses_().filter(function (x) { return String(x.worker).trim().toLowerCase() === w; }).slice(-30)
    .map(function (x) { delete x.photo; return x; }) };
}

function updateExpense_(id, f) {
  return withLock_(function () {
    const r = rowById_('Expenses', id); if (!r) return { ok: false, error: 'Not found' };
    const sh = sheet_('Expenses');
    const map = { date: 3, company: 4, worker: 5, category: 6, project: 7, desc: 8, amount: 9, paidBy: 10, status: 12, note: 13 };
    Object.keys(f || {}).forEach(function (k) {
      if (!map[k]) return;
      let v = f[k];
      if (k === 'amount') v = Number(v) || 0;
      if (k === 'status' && ['Pending', 'Approved', 'Rejected', 'Paid'].indexOf(v) < 0) return;
      sh.getRange(r._row, map[k]).setValue(v);
    });
    sh.getRange(r._row, 14).setValue(new Date());
    return { ok: true };
  });
}

function deleteRow_(name, id) {
  return withLock_(function () {
    const r = rowById_(name, id); if (!r) return { ok: false, error: 'Not found' };
    sheet_(name).deleteRow(r._row);
    return { ok: true };
  });
}

/* ───────────────────────── projects & client portal ───────────────────────── */

function projObj_(r, withCode) {
  const o = { id: r[0], name: r[1], client: r[2], location: r[3], company: r[4], category: r[5], status: r[6], progress: Number(r[7]) || 0,
    public: String(r[9]).toUpperCase() === 'YES', desc: r[10], cover: r[11], created: fmtDate_(r[12]), updated: fmtDate_(r[13]) };
  if (withCode) o.code = r[8];
  return o;
}
function projects_(withCode) { return rows_('Projects').map(function (r) { return projObj_(r, withCode); }); }

function findProject_(ref) {
  const s = String(ref || '').trim().toLowerCase();
  if (!s) return null;
  const all = projects_(true);
  return all.filter(function (p) { return String(p.id).toLowerCase() === s; })[0]
    || all.filter(function (p) { return String(p.name).toLowerCase() === s; })[0]
    || all.filter(function (p) { return String(p.name).toLowerCase().indexOf(s) >= 0 || s.indexOf(String(p.name).toLowerCase()) >= 0; })[0]
    || null;
}

function saveProject_(it) {
  if (!it || !it.name) return { ok: false, error: 'Project name required' };
  return withLock_(function () {
    const sh = sheet_('Projects'); const now = new Date();
    const cover = it.coverPhoto ? savePhoto_(it.coverPhoto, 'cover_' + Date.now()) : (it.cover || '');
    if (it.id) {
      const r = rowById_('Projects', it.id); if (!r) return { ok: false, error: 'Not found' };
      const vals = [it.id, it.name, it.client || '', it.location || '', it.company || COMPANIES[0], it.category || '', it.status || 'Ongoing',
        Math.max(0, Math.min(100, Number(it.progress) || 0)), r[8] || clientCode_(), it.public ? 'YES' : 'NO', it.desc || '', cover || r[11], r[12], now];
      sh.getRange(r._row, 1, 1, vals.length).setValues([vals]);
      return { ok: true, id: it.id, code: vals[8] };
    }
    const id = newId_('P'), code = clientCode_();
    sh.appendRow([id, it.name, it.client || '', it.location || '', it.company || COMPANIES[0], it.category || '', it.status || 'Ongoing',
      Math.max(0, Math.min(100, Number(it.progress) || 0)), code, it.public ? 'YES' : 'NO', it.desc || '', cover, now, now]);
    return { ok: true, id: id, code: code };
  });
}

function addUpdate_(it) {
  const p = findProject_(it && (it.projectId || it.project));
  if (!p) return { ok: false, error: 'Project not found' };
  return withLock_(function () {
    const id = newId_('U');
    const urls = (it.photoUrls || []).concat((it.photos || []).map(function (d, i) { return savePhoto_(d, id + '_' + i); })).filter(String);
    const prog = it.progress === undefined || it.progress === '' ? '' : Math.max(0, Math.min(100, Number(it.progress) || 0));
    sheet_('Updates').appendRow([id, p.id, it.date || today_(), it.title || 'Progress update', it.text || '', prog, urls.join(' '),
      it.visible === false ? 'NO' : 'YES', new Date()]);
    const r = rowById_('Projects', p.id); const sh = sheet_('Projects');
    if (prog !== '') sh.getRange(r._row, 8).setValue(prog);
    if (it.status) sh.getRange(r._row, 7).setValue(it.status);
    if (!r[11] && urls.length) sh.getRange(r._row, 12).setValue(urls[0]);
    sh.getRange(r._row, 14).setValue(new Date());
    return { ok: true, id: id, project: p.name };
  });
}

function updates_(projectId, clientOnly) {
  return rows_('Updates').filter(function (r) { return String(r[1]) === String(projectId) && (!clientOnly || String(r[7]).toUpperCase() !== 'NO'); })
    .map(function (r) { return { id: r[0], date: fmtDate_(r[2]), title: r[3], text: r[4], progress: r[5] === '' ? null : Number(r[5]),
      photos: String(r[6] || '').split(/\s+/).filter(String), visible: String(r[7]).toUpperCase() !== 'NO' }; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}

function messages_(projectId) {
  return rows_('Messages').filter(function (r) { return !projectId || String(r[1]) === String(projectId); })
    .map(function (r) { return { id: r[0], projectId: r[1], date: r[2] instanceof Date ? r[2].toISOString() : r[2], from: r[3], name: r[4], text: r[5], photo: r[6], read: String(r[7]).toUpperCase() === 'YES' }; });
}

function addMessage_(projectId, from, name, text, photo) {
  if (!String(text || '').trim() && !photo) return { ok: false, error: 'Empty message' };
  const id = newId_('M');
  sheet_('Messages').appendRow([id, projectId, new Date(), from, String(name || '').slice(0, 60), String(text || '').slice(0, 2000),
    savePhoto_(photo, id), from === 'Owner' ? 'YES' : 'NO']);
  return { ok: true, id: id };
}

function markRead_(projectId) {
  const sh = sheet_('Messages');
  rows_('Messages').forEach(function (r) { if (String(r[1]) === String(projectId) && String(r[7]).toUpperCase() !== 'YES') sh.getRange(r._row, 8).setValue('YES'); });
  return { ok: true };
}

function projectDetail_(id, owner) {
  const r = rowById_('Projects', id); if (!r) return { ok: false, error: 'Not found' };
  return { ok: true, project: projObj_(r, owner), updates: updates_(id, !owner), messages: messages_(id) };
}

function byClientCode_(code) {
  const c = String(code || '').trim().toUpperCase(); if (c.length < 4) return null;
  return rows_('Projects').filter(function (r) { return String(r[8]).toUpperCase() === c; })[0] || null;
}

function clientView_(code) {
  const r = byClientCode_(code); if (!r) return { ok: false, error: 'Project code not found' };
  return projectDetail_(r[0], false);
}

function clientMessage_(code, name, text, photo) {
  const r = byClientCode_(code); if (!r) return { ok: false, error: 'Project code not found' };
  return addMessage_(r[0], 'Client', name, text, photo);
}

function portfolio_() {
  return projects_(false).filter(function (p) { return p.public; }).map(function (p) {
    const u = updates_(p.id, true);
    const photos = [].concat.apply([], u.map(function (x) { return x.photos; })).slice(0, 8);
    const vids = [].concat.apply([], u.map(function (x) { return (String(x.text || '').match(/VIDEO:\s*(\S+)/g) || []).map(function (s) { return s.replace(/VIDEO:\s*/, ''); }); }));
    return { id: p.id, name: p.name, client: p.client || '', location: p.location, company: p.company, category: p.category, status: p.status,
      progress: p.progress, desc: p.desc, cover: p.cover || photos[0] || '', photos: photos, video: vids[0] || '', updated: p.updated };
  });
}

/* ───────────────────────── Office Manager ───────────────────────── */

const AI_TOOLS = [
  { name: 'add_expense', description: 'Record an expense in the tally.',
    input_schema: { type: 'object', properties: {
      company: { type: 'string', enum: COMPANIES }, amount: { type: 'number' }, category: { type: 'string', description: 'Fuel, Travel / Fare, Food, Materials, Hardware, Labour, Equipment / Repair, Stationery, Printing, Mobile / Internet, Accommodation, Other' },
      project: { type: 'string' }, desc: { type: 'string' }, date: { type: 'string', description: 'YYYY-MM-DD' }, paidBy: { type: 'string' }, worker: { type: 'string' },
      status: { type: 'string', enum: ['Pending', 'Approved', 'Paid'] }, attach_photo: { type: 'boolean', description: 'Attach the photo the owner sent with this message' } },
      required: ['amount', 'desc'] } },
  { name: 'create_project', description: 'Create a new project. Returns the client code the owner can give the client.',
    input_schema: { type: 'object', properties: {
      name: { type: 'string' }, client: { type: 'string' }, location: { type: 'string' }, company: { type: 'string', enum: COMPANIES },
      category: { type: 'string', description: 'Survey, Infrastructure, Building, Sports, Water Supply, Other' }, desc: { type: 'string' },
      status: { type: 'string' }, progress: { type: 'number' }, show_on_website: { type: 'boolean' }, attach_photo: { type: 'boolean' } }, required: ['name'] } },
  { name: 'add_project_update', description: 'Post a progress update on a project (clients see it in their portal).',
    input_schema: { type: 'object', properties: {
      project: { type: 'string', description: 'Project name or ID' }, title: { type: 'string' }, text: { type: 'string' },
      progress: { type: 'number', description: '0-100' }, status: { type: 'string' }, visible_to_client: { type: 'boolean' }, attach_photo: { type: 'boolean' } },
      required: ['project', 'title'] } },
  { name: 'set_project', description: 'Change project status, progress, description, or whether it shows on the public website.',
    input_schema: { type: 'object', properties: {
      project: { type: 'string' }, status: { type: 'string' }, progress: { type: 'number' }, show_on_website: { type: 'boolean' }, desc: { type: 'string' }, location: { type: 'string' }, client: { type: 'string' } },
      required: ['project'] } },
  { name: 'list_projects', description: 'List all projects with status, progress and client codes.', input_schema: { type: 'object', properties: {} } },
  { name: 'expense_summary', description: 'Totals of expenses, optionally for a month (YYYY-MM), company or status.',
    input_schema: { type: 'object', properties: { month: { type: 'string' }, company: { type: 'string' }, status: { type: 'string' } } } },
  { name: 'set_expense_status', description: 'Approve, reject or mark paid an expense by its ID.',
    input_schema: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected', 'Paid'] }, note: { type: 'string' } }, required: ['id', 'status'] } },
  { name: 'pending_expenses', description: 'List expenses waiting for approval.', input_schema: { type: 'object', properties: {} } },
  { name: 'client_messages', description: 'List unread client messages (or all for one project).',
    input_schema: { type: 'object', properties: { project: { type: 'string' } } } },
  { name: 'reply_to_client', description: 'Send a message to the client of a project (shows in their portal).',
    input_schema: { type: 'object', properties: { project: { type: 'string' }, text: { type: 'string' } }, required: ['project', 'text'] } }
];

function runTool_(name, a, photoUrl) {
  a = a || {};
  const ph = a.attach_photo && photoUrl ? photoUrl : '';
  switch (name) {
    case 'add_expense':
      return addExpense_({ company: a.company, amount: a.amount, category: a.category, project: a.project, desc: a.desc, date: a.date,
        paidBy: a.paidBy || '', worker: a.worker || 'Owner', status: a.status || 'Approved', photoUrl: ph });
    case 'create_project':
      return saveProject_({ name: a.name, client: a.client, location: a.location, company: a.company, category: a.category, desc: a.desc,
        status: a.status, progress: a.progress, public: !!a.show_on_website, cover: ph });
    case 'add_project_update':
      return addUpdate_({ project: a.project, title: a.title, text: a.text, progress: a.progress, status: a.status,
        visible: a.visible_to_client !== false, photoUrls: ph ? [ph] : [] });
    case 'set_project': {
      const p = findProject_(a.project); if (!p) return { ok: false, error: 'Project not found' };
      return saveProject_({ id: p.id, name: p.name, client: a.client !== undefined ? a.client : p.client, location: a.location !== undefined ? a.location : p.location,
        company: p.company, category: p.category, status: a.status || p.status, progress: a.progress !== undefined ? a.progress : p.progress,
        public: a.show_on_website !== undefined ? a.show_on_website : p.public, desc: a.desc !== undefined ? a.desc : p.desc, cover: p.cover });
    }
    case 'list_projects':
      return { ok: true, projects: projects_(true).map(function (p) { return { id: p.id, name: p.name, client: p.client, status: p.status, progress: p.progress, code: p.code, on_website: p.public }; }) };
    case 'expense_summary': {
      const e = expenses_().filter(function (x) { return (!a.month || String(x.date).indexOf(a.month) === 0) && (!a.company || x.company === a.company) && (!a.status || x.status === a.status) && x.status !== 'Rejected'; });
      const sum = function (k) { return e.reduce(function (m, x) { m[x[k]] = (m[x[k]] || 0) + x.amount; return m; }, {}); };
      return { ok: true, count: e.length, total: e.reduce(function (s, x) { return s + x.amount; }, 0), by_company: sum('company'), by_category: sum('category'), by_worker: sum('worker'), by_status: sum('status') };
    }
    case 'set_expense_status': {
      const f = { status: a.status }; if (a.note) f.note = a.note;
      return updateExpense_(a.id, f);
    }
    case 'pending_expenses':
      return { ok: true, items: expenses_().filter(function (x) { return x.status === 'Pending'; }).map(function (x) { return { id: x.id, date: x.date, worker: x.worker, company: x.company, amount: x.amount, desc: x.desc }; }) };
    case 'client_messages': {
      const p = a.project ? findProject_(a.project) : null;
      const names = {}; projects_(false).forEach(function (x) { names[x.id] = x.name; });
      return { ok: true, items: messages_(p ? p.id : null).filter(function (m) { return p || (!m.read && m.from === 'Client'); }).slice(-20)
        .map(function (m) { return { project: names[m.projectId], from: m.from, name: m.name, text: m.text, date: m.date }; }) };
    }
    case 'reply_to_client': {
      const p = findProject_(a.project); if (!p) return { ok: false, error: 'Project not found' };
      markRead_(p.id);
      return addMessage_(p.id, 'Owner', 'M/s Lee Enterprise', a.text, '');
    }
  }
  return { ok: false, error: 'Unknown tool' };
}

function ai_(history, photo) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, error: 'AI is not set up: add ANTHROPIC_API_KEY in Apps Script → Project Settings → Script properties.' };
  const photoUrl = photo ? savePhoto_(photo, 'ai_' + Date.now()) : '';
  const msgs = (history || []).slice(-16).map(function (m) { return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.text || '') }; })
    .filter(function (m) { return m.content; });
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return { ok: false, error: 'No message' };
  if (photoUrl) msgs[msgs.length - 1].content += '\n[The owner attached a photo with this message. Use attach_photo: true on the item it belongs to.]';
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();

  const projectNames = projects_(false).map(function (p) { return p.name; }).slice(0, 60).join('; ');
  const system = 'You are the AI office manager for M/s Lee Enterprise (survey, design & construction firm, Naharlagun, Arunachal Pradesh; proprietor Er. Lishi Kuli), ' +
    'who also supervises T.N Consultant. Today is ' + today_() + ' (India). Currency is Indian Rupees. ' +
    'You help the owner by recording expenses, creating projects, posting progress updates for clients, putting projects on the public website, and replying to clients, using the tools. ' +
    'The owner may write or speak in English, Hindi or Hinglish; reply in the same language, short and clear (it may be read aloud). ' +
    'If a needed detail is missing (e.g. amount, or which project), ask one short question instead of guessing. Company defaults to M/s Lee Enterprise unless T.N is mentioned. ' +
    'After acting, confirm exactly what you saved (amount, project, client code etc.). Never invent IDs or codes — use tool results. ' +
    'Existing projects: ' + (projectNames || 'none yet') + '.';

  const actions = [];
  for (let round = 0; round < 6; round++) {
    const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: AI_MODEL, max_tokens: 1024, system: system, tools: AI_TOOLS, messages: msgs })
    });
    const body = JSON.parse(res.getContentText() || '{}');
    if (res.getResponseCode() !== 200) return { ok: false, error: 'AI error: ' + ((body.error && body.error.message) || res.getResponseCode()) };
    msgs.push({ role: 'assistant', content: body.content });
    const uses = (body.content || []).filter(function (c) { return c.type === 'tool_use'; });
    if (!uses.length || body.stop_reason !== 'tool_use') {
      const text = (body.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('\n').trim();
      return { ok: true, reply: text || 'Done.', actions: actions };
    }
    const results = uses.map(function (u) {
      let out;
      try { out = runTool_(u.name, u.input, photoUrl); } catch (e) { out = { ok: false, error: String(e.message || e) }; }
      actions.push({ tool: u.name, input: u.input, ok: out && out.ok !== false });
      return { type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out).slice(0, 6000) };
    });
    msgs.push({ role: 'user', content: results });
  }
  return { ok: true, reply: 'I did several steps; please check the results.', actions: actions };
}
