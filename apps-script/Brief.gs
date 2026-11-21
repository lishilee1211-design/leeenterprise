/**
 * M/s Lee Enterprise — Client Requirement Form + Quotation (phase-wise payment)
 * Add this as a second file (Brief.gs) in the same Apps Script project.
 */

const BRIEF_SHEET = 'Requirements';
const BRIEF_HEADERS = ['Ref No','Submitted','Client','Phone','Email','Client Type','Organisation','Services','Location','Budget','Start','Summary (JSON)',
  'Requirement PDF','Payment Consent','Signature','Status','Site Verified On','Quote Amount (Rs)','Quote PDF','Quote Sent On','Owner Notes','Project ID'];
const SITE_URL = 'https://lishilee1211-design.github.io/leeenterprise/';
const FIRM = {
  name: 'M/s LEE ENTERPRISE',
  tag: 'Drone & LiDAR Survey · Civil Engineering Design · Construction',
  addr: 'Model Village, Naharlagun, Dist. Papum Pare, Arunachal Pradesh – 791110',
  phone: '+91 76288 90089 · +91 87318 70700',
  email: 'lishilee1211@gmail.com',
  gst: 'GSTIN: 12GVTPK8036A1ZK · Udyam: NLG(R)-213'
};
const DEFAULT_PHASES = [
  { pct: 40, label: 'Advance — on acceptance of quotation (work starts)' },
  { pct: 30, label: 'On submission of survey / draft design' },
  { pct: 30, label: 'Balance — on final submission approved by client' }
];

/** Run once after adding this file so Google asks permission to send email. */
function authorizeMail() {
  MailApp.getRemainingDailyQuota();
  briefSheet_();
  Logger.log('Email permission OK. Owner email: ' + ownerEmail_());
}

function ownerEmail_() {
  try { return Session.getEffectiveUser().getEmail() || FIRM.email; } catch (e) { return FIRM.email; }
}

function briefSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(BRIEF_SHEET);
  if (!sh) {
    sh = ss.insertSheet(BRIEF_SHEET);
    sh.getRange(1, 1, 1, BRIEF_HEADERS.length).setValues([BRIEF_HEADERS]).setFontWeight('bold').setBackground('#0a2350').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function briefRows_() {
  const sh = briefSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, BRIEF_HEADERS.length).getValues().map(function (r, i) { r._row = i + 2; return r; });
}

function briefObj_(r) {
  let data = {};
  try { data = JSON.parse(r[11] || '{}'); } catch (e) {}
  return { ref: r[0], submitted: r[1] instanceof Date ? r[1].toISOString() : r[1], client: r[2], phone: r[3], email: r[4], clientType: r[5],
    org: r[6], services: r[7], location: r[8], budget: r[9], start: r[10], data: data, pdf: r[12], consent: r[13], signature: r[14],
    status: r[15] || 'New', verifiedOn: fmtDate_(r[16]), amount: Number(r[17]) || 0, quotePdf: r[18], quoteSentOn: fmtDate_(r[19]), notes: r[20], projectId: r[21] };
}

/** Router hook called from doPost in Code.gs */
function briefRoute_(q, owner) {
  switch (q.action) {
    case 'briefAdd':    return briefAdd_(q.item);
    case 'briefList':   if (!owner) throw new Error('Owner key required'); return { ok: true, items: briefRows_().map(briefObj_).reverse() };
    case 'briefUpdate': if (!owner) throw new Error('Owner key required'); return briefUpdate_(q.ref, q.fields);
    case 'quoteSend':   if (!owner) throw new Error('Owner key required'); return quoteSend_(q.ref, q.amount, q.phases, q.notes, q.validDays);
    case 'briefToProject': if (!owner) throw new Error('Owner key required'); return briefToProject_(q.ref);
  }
  return filesRoute_(q, owner);
}

/* ───────── helpers ───────── */

function esc_(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inr_(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }

function logoData_() {
  const c = CacheService.getScriptCache(); const hit = c.get('logo');
  if (hit) return hit;
  try {
    const b = UrlFetchApp.fetch(SITE_URL + 'icons/icon-192.png').getBlob();
    const d = 'data:image/png;base64,' + Utilities.base64Encode(b.getBytes());
    c.put('logo', d, 21600);
    return d;
  } catch (e) { return ''; }
}

function letterhead_(title, ref, dateStr) {
  const logo = logoData_();
  return '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,Helvetica,sans-serif;color:#0e1a2b;font-size:11px;margin:0}' +
    '.hd{border-bottom:3px solid #0a2350;padding-bottom:8px;margin-bottom:10px}' +
    '.hd table{width:100%}.hd td{vertical-align:middle}' +
    '.firm{font-size:22px;font-weight:bold;color:#0a2350;letter-spacing:1px}.tag{font-size:10px;color:#1a5fd0}' +
    '.small{font-size:9.5px;color:#46566f}' +
    '.title{background:#0a2350;color:#fff;font-size:14px;font-weight:bold;padding:7px 10px;margin:10px 0 6px}' +
    'h3{font-size:12px;color:#0a2350;border-bottom:1px solid #c9d6ea;padding-bottom:3px;margin:12px 0 5px}' +
    'table.kv{width:100%;border-collapse:collapse}table.kv td{border:1px solid #d9e2ef;padding:4px 6px;vertical-align:top}' +
    'table.kv td.k{width:34%;background:#f3f6fb;font-weight:bold;color:#33445e}' +
    'table.pay{width:100%;border-collapse:collapse;margin-top:4px}table.pay th{background:#0a2350;color:#fff;padding:6px;text-align:left}' +
    'table.pay td{border:1px solid #d9e2ef;padding:6px}.r{text-align:right}' +
    '.box{border:1px solid #c9d6ea;background:#f7f9fd;padding:8px;margin-top:8px}' +
    '.ft{margin-top:16px;border-top:1px solid #c9d6ea;padding-top:6px;font-size:9px;color:#5d6b82;text-align:center}' +
    '.wm{position:fixed;top:40%;left:12%;font-size:60px;color:rgba(10,35,80,0.05);transform:rotate(-25deg);font-weight:bold}' +
    '</style></head><body><div class="wm">M/s LEE ENTERPRISE</div><div class="hd"><table><tr>' +
    (logo ? '<td style="width:70px"><img src="' + logo + '" style="width:62px;height:62px"></td>' : '') +
    '<td><div class="firm">' + FIRM.name + '</div><div class="tag">' + FIRM.tag + '</div>' +
    '<div class="small">' + FIRM.addr + '<br>' + FIRM.phone + ' · ' + FIRM.email + '<br>' + FIRM.gst + '</div></td>' +
    '<td style="text-align:right" class="small"><b>Ref:</b> ' + esc_(ref) + '<br><b>Date:</b> ' + esc_(dateStr) + '</td></tr></table></div>' +
    '<div class="title">' + esc_(title) + '</div>';
}

function kvTable_(obj) {
  const rows = Object.keys(obj).filter(function (k) { const v = obj[k]; return v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && !v.length); })
    .map(function (k) { const v = obj[k]; return '<tr><td class="k">' + esc_(k) + '</td><td>' + esc_(Array.isArray(v) ? v.join(', ') : v).replace(/\n/g, '<br>') + '</td></tr>'; });
  return rows.length ? '<table class="kv">' + rows.join('') + '</table>' : '';
}

function savePdf_(html, name) {
  const blob = HtmlService.createHtmlOutput(html).getBlob().getAs('application/pdf').setName(name + '.pdf');
  const f = folder_().createFile(blob);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: 'https://drive.google.com/file/d/' + f.getId() + '/view', blob: blob };
}

function phasesHtml_(amount, phases) {
  let sum = 0;
  const rows = phases.map(function (p, i) {
    const amt = Math.round(amount * p.pct) / 100; sum += amt;
    return '<tr><td>Phase ' + (i + 1) + '</td><td>' + esc_(p.label) + '</td><td class="r">' + p.pct + '%</td><td class="r">' + (amount ? inr_(amt) : '—') + '</td></tr>';
  }).join('');
  const pctTotal = phases.reduce(function (s, p) { return s + Number(p.pct || 0); }, 0);
  return '<table class="pay"><tr><th>Phase</th><th>Stage</th><th class="r">%</th><th class="r">Amount</th></tr>' + rows +
    '<tr><td colspan="2"><b>Total</b></td><td class="r"><b>' + pctTotal + '%</b></td><td class="r"><b>' + (amount ? inr_(sum) : 'To be confirmed') + '</b></td></tr></table>';
}

/* ───────── client submits requirement ───────── */

function briefAdd_(it) {
  if (!it || !it.client || !it.client.name || !it.client.phone) return { ok: false, error: 'Name and phone are required' };
  if (!it.consent || !it.consent.payment || !it.consent.correct) return { ok: false, error: 'Please tick the consent boxes' };
  const res = withLock_(function () {
    const now = new Date();
    const ref = 'LE/REQ/' + Utilities.formatDate(now, TZ, 'yyMMdd') + '-' + String(briefSheet_().getLastRow()).padStart(3, '0');
    const c = it.client, s = it.site || {}, b = it.budget || {};
    // photos
    const photoUrls = (it.photos || []).slice(0, 6).map(function (d, i) { return savePhoto_(d, ref.replace(/\//g, '-') + '_' + i); }).filter(String);

    // PDF
    let html = letterhead_('CLIENT REQUIREMENT FORM', ref, Utilities.formatDate(now, TZ, 'dd MMM yyyy, hh:mm a'));
    html += '<h3>1. Client details</h3>' + kvTable_({ 'Name': c.name, 'Phone / WhatsApp': c.phone, 'Email': c.email, 'Client type': c.type,
      'Organisation / Department': c.org, 'Designation': c.designation, 'Address': c.address, 'Preferred contact': c.contactPref });
    html += '<h3>2. Services required</h3><p>' + esc_((it.services || []).join(', ')) + '</p>';
    html += '<h3>3. Site details</h3>' + kvTable_({ 'Site location / address': s.location, 'District': s.district, 'Google Maps / GPS': s.gps,
      'Plot / area': s.area ? (s.area + ' ' + (s.areaUnit || '')) : '', 'Land documents': s.docs, 'Ownership': s.ownership, 'Road access': s.access,
      'Terrain': s.terrain, 'Existing structures / trees': s.existing, 'Electricity / water at site': s.utilities, 'Site notes': s.notes });
    (it.sections || []).forEach(function (sec, i) {
      html += '<h3>' + (4 + i) + '. ' + esc_(sec.title) + '</h3>' + kvTable_(sec.answers || {});
    });
    const n = 4 + (it.sections || []).length;
    html += '<h3>' + n + '. Budget & timeline</h3>' + kvTable_({ 'Budget range': b.range, 'Preferred start': b.start, 'Target completion': b.finish,
      'Top priority': b.priority, 'How did you hear about us': b.source, 'Anything else': b.notes });
    if (photoUrls.length) html += '<h3>Site photos</h3><p class="small">' + photoUrls.map(function (u, i) { return 'Photo ' + (i + 1) + ': ' + u; }).join('<br>') + '</p>';
    html += '<h3>' + (n + 1) + '. Payment terms & consent</h3>' +
      '<div class="box">The fee/amount for this work will be sent by M/s Lee Enterprise <b>after a physical site verification</b>, which is done after all the above requirements are received. Payment is phase-wise:</div>' +
      phasesHtml_(0, DEFAULT_PHASES) +
      '<p>☑ I confirm that the information given above is correct.<br>☑ I agree to pay in phases as above, of the amount that M/s Lee Enterprise will send me after physical verification. Work starts after the first phase payment.</p>' +
      kvTable_({ 'Signed (typed name)': it.consent.signature, 'Date': Utilities.formatDate(now, TZ, 'dd MMM yyyy') });
    html += '<div class="ft">This is a computer-generated requirement record. ' + FIRM.name + ' · ' + SITE_URL + '</div></body></html>';
    const pdf = savePdf_(html, ref.replace(/\//g, '-') + ' Requirement - ' + c.name);

    briefSheet_().appendRow([ref, now, c.name, "'" + c.phone, c.email || '', c.type || '', c.org || '', (it.services || []).join(', '),
      [s.location, s.district].filter(String).join(', '), b.range || '', b.start || '', JSON.stringify(it).slice(0, 45000),
      pdf.url, 'YES — phase-wise after physical verification', it.consent.signature || '', 'New', '', '', '', '', '', '']);

    return { ok: true, ref: ref, pdf: pdf.url, blob: pdf.blob, row: briefSheet_().getLastRow(), c: c, s: s, b: b, services: (it.services || []).join(', ') };
  });
  if (!res.ok) return res;
  // Private client section: a project page only this client (with the code) and the company can see
  const c = res.c, s = res.s, b = res.b;
  const pj = saveProject_({ name: res.services + ' — ' + c.name, client: c.name, location: [s.location, s.district].filter(String).join(', '),
    company: COMPANIES[0], category: /survey/i.test(res.services) ? 'Survey' : /road|water/i.test(res.services) ? 'Infrastructure' : 'Building',
    status: 'Requirement received', progress: 0, public: false, desc: 'Client requirement ' + res.ref });
  if (pj.ok) {
    briefSheet_().getRange(res.row, 22).setValue(pj.id);
    addUpdate_({ projectId: pj.id, title: 'Requirement received (' + res.ref + ')',
      text: 'Thank you. We have your requirement form: ' + res.pdf + '\nNext: we will contact you to fix a physical site visit. After verification you will receive the quotation here, by email and on WhatsApp.' });
  }
  const portal = SITE_URL + 'work.html?code=' + (pj.code || '');
  const subj = 'Client requirement received — ' + res.ref;
  const body = 'Dear ' + c.name + ',\n\nThank you for sharing your requirements with M/s Lee Enterprise. Your reference number is ' + res.ref + '.\n\n' +
    'Your PRIVATE client page (only you and M/s Lee Enterprise can see it):\n' + portal + '\nClient code: ' + (pj.code || '-') + '\n' +
    'There you can follow progress, see your quotation and chat with us privately. Please do not share this code.\n\n' +
    'Next steps:\n1. We will contact you to fix a physical site visit.\n2. After verification we will send the quotation with phase-wise payment (40% / 30% / 20% / 10%).\n\n' +
    'Your requirement form (PDF) is attached.\n\nRegards,\nEr. Lishi Kuli\nM/s Lee Enterprise\n' + FIRM.phone + '\n' + SITE_URL;
  try { if (c.email) MailApp.sendEmail({ to: c.email, subject: subj, body: body, attachments: [res.blob], name: 'M/s Lee Enterprise', replyTo: ownerEmail_() }); } catch (e) {}
  try { MailApp.sendEmail({ to: ownerEmail_(), subject: 'NEW REQUIREMENT ' + res.ref + ' — ' + c.name + ' (' + res.services + ')',
    body: 'New client requirement.\n\nClient: ' + c.name + '\nPhone: ' + c.phone + '\nEmail: ' + (c.email || '-') + '\nServices: ' + res.services +
      '\nSite: ' + (s.location || '-') + '\nBudget: ' + (b.range || '-') + '\nClient code: ' + (pj.code || '-') + '\n\nPDF: ' + res.pdf + '\nOpen owner panel: ' + SITE_URL + 'work.html#owner',
    attachments: [res.blob], name: 'Lee Enterprise Website' }); } catch (e) {}
  return { ok: true, ref: res.ref, pdf: res.pdf, code: pj.code || '', portal: portal };
}

/* ───────── owner actions ───────── */

function briefFind_(ref) { return briefRows_().filter(function (r) { return String(r[0]) === String(ref); })[0] || null; }

function briefUpdate_(ref, f) {
  const r = briefFind_(ref); if (!r) return { ok: false, error: 'Not found' };
  const sh = briefSheet_(); f = f || {};
  if (f.status) sh.getRange(r._row, 16).setValue(f.status);
  if (f.verifiedOn !== undefined) sh.getRange(r._row, 17).setValue(f.verifiedOn);
  if (f.notes !== undefined) sh.getRange(r._row, 21).setValue(f.notes);
  return { ok: true };
}

function quoteSend_(ref, amount, phases, notes, validDays) {
  const r = briefFind_(ref); if (!r) return { ok: false, error: 'Requirement not found' };
  amount = Number(amount); if (!(amount > 0)) return { ok: false, error: 'Enter the amount' };
  phases = (phases && phases.length ? phases : DEFAULT_PHASES).map(function (p) { return { pct: Number(p.pct) || 0, label: String(p.label || '') }; });
  const pctTotal = phases.reduce(function (s, p) { return s + p.pct; }, 0);
  if (pctTotal !== 100) return { ok: false, error: 'Phases must add up to 100% (now ' + pctTotal + '%)' };
  const b = briefObj_(r), now = new Date();
  const qref = String(ref).replace('/REQ/', '/QTN/');
  let html = letterhead_('QUOTATION & PAYMENT SCHEDULE', qref, Utilities.formatDate(now, TZ, 'dd MMM yyyy'));
  html += kvTable_({ 'To': b.client + (b.org ? ', ' + b.org : ''), 'Phone': String(b.phone).replace(/^'/, ''), 'Email': b.email,
    'Requirement ref': ref, 'Services': b.services, 'Site': b.location, 'Site verified on': b.verifiedOn || Utilities.formatDate(now, TZ, 'dd MMM yyyy') });
  html += '<h3>Total amount</h3><p style="font-size:18px;font-weight:bold;color:#0a2350">' + inr_(amount) + '</p>';
  if (notes) html += '<h3>Scope & notes</h3><p>' + esc_(notes).replace(/\n/g, '<br>') + '</p>';
  html += '<h3>Phase-wise payment</h3>' + phasesHtml_(amount, phases);
  html += '<div class="box">• Work starts after receipt of Phase 1 payment.<br>• Each later phase is payable on completion of that stage.<br>' +
    '• This quotation is based on the physical site verification and the requirement form ' + esc_(ref) + '.<br>' +
    '• Valid for ' + (Number(validDays) || 30) + ' days from the date above.<br>• Payments to M/s Lee Enterprise (' + FIRM.gst + ').</div>';
  html += '<table style="width:100%;margin-top:30px"><tr><td class="small">Accepted by client: ____________________</td>' +
    '<td style="text-align:right" class="small">For M/s LEE ENTERPRISE<br><br><br>Proprietor / Authorised Signatory<br>Er. Lishi Kuli, B.Tech (Civil)</td></tr></table>';
  html += '<div class="ft">' + FIRM.name + ' · ' + FIRM.addr + ' · ' + SITE_URL + '</div></body></html>';
  const pdf = savePdf_(html, qref.replace(/\//g, '-') + ' Quotation - ' + b.client);
  const sh = briefSheet_();
  sh.getRange(r._row, 16).setValue('Quoted');
  if (!r[16]) sh.getRange(r._row, 17).setValue(now);
  sh.getRange(r._row, 18).setValue(amount);
  sh.getRange(r._row, 19).setValue(pdf.url);
  sh.getRange(r._row, 20).setValue(now);
  if (notes) sh.getRange(r._row, 21).setValue(notes);
  let emailed = false;
  const lines = phases.map(function (p, i) { return 'Phase ' + (i + 1) + ' (' + p.pct + '%): ' + inr_(Math.round(amount * p.pct) / 100) + ' — ' + p.label; }).join('\n');
  try {
    if (b.email) {
      MailApp.sendEmail({ to: b.email, cc: ownerEmail_(), subject: 'Quotation ' + qref + ' — M/s Lee Enterprise',
        body: 'Dear ' + b.client + ',\n\nFollowing the site verification, please find our quotation attached.\n\nTotal: ' + inr_(amount) + '\n\n' + lines +
          '\n\nWork starts after the Phase 1 payment.\n\nRegards,\nEr. Lishi Kuli\nM/s Lee Enterprise\n' + FIRM.phone,
        attachments: [pdf.blob], name: 'M/s Lee Enterprise', replyTo: ownerEmail_() });
      emailed = true;
    } else {
      MailApp.sendEmail({ to: ownerEmail_(), subject: 'Quotation ' + qref + ' (client has no email)', body: 'Quotation PDF: ' + pdf.url, attachments: [pdf.blob] });
    }
  } catch (e) {}
  let portal = '';
  if (b.projectId) {
    try {
      addUpdate_({ projectId: b.projectId, title: 'Quotation sent (' + qref + ') — ' + inr_(amount), status: 'Quotation sent',
        text: 'After the site verification, our quotation is ready: ' + pdf.url + '\n\n' + lines + '\n\nWork starts after the Phase 1 payment.' });
      const pr = rowById_('Projects', b.projectId); if (pr) portal = SITE_URL + 'work.html?code=' + pr[8];
    } catch (e) {}
  }
  const wa = 'Dear ' + b.client + ',\nQuotation from M/s Lee Enterprise (' + qref + ').\nTotal: ' + inr_(amount) + '\n' + lines + '\n\nPDF: ' + pdf.url +
    (portal ? '\nYour private page: ' + portal : '') + '\n\n— Er. Lishi Kuli, M/s Lee Enterprise, ' + FIRM.phone;
  return { ok: true, pdf: pdf.url, emailed: emailed, waText: wa, phone: String(b.phone).replace(/\D/g, '') };
}

function briefToProject_(ref) {
  const r = briefFind_(ref); if (!r) return { ok: false, error: 'Not found' };
  const b = briefObj_(r);
  if (b.projectId) {
    briefSheet_().getRange(r._row, 16).setValue('Accepted / Project');
    try { addUpdate_({ projectId: b.projectId, title: 'Quotation accepted — work started', status: 'Ongoing', progress: 5, text: 'Thank you for confirming. Phase 1 has started.' }); } catch (e) {}
    return { ok: true, id: b.projectId, existing: true };
  }
  const res = saveProject_({ name: (b.services || 'Project') + ' — ' + b.client, client: b.client, location: b.location,
    company: COMPANIES[0], category: /survey/i.test(b.services) ? 'Survey' : /road|water/i.test(b.services) ? 'Infrastructure' : 'Building',
    status: 'Survey', progress: 0, public: false, desc: 'From requirement ' + ref });
  if (res.ok) { briefSheet_().getRange(r._row, 22).setValue(res.id); briefSheet_().getRange(r._row, 16).setValue('Accepted / Project'); }
  return res;
}

/* ───────── documents, 3D models & client approvals (private per project) ───────── */

const FILES_SHEET = 'Files';
const FILES_HEADERS = ['ID','Project ID','Kind','Name','URL','Drive ID','Added','Approval','Client Comment','Decided By','Decided On','Final'];
const MAX_PROXY_MB = 30;

function filesSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(FILES_SHEET);
  if (!sh) {
    sh = ss.insertSheet(FILES_SHEET);
    sh.getRange(1, 1, 1, FILES_HEADERS.length).setValues([FILES_HEADERS]).setFontWeight('bold').setBackground('#0a2350').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function fileRows_() {
  const sh = filesSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, FILES_HEADERS.length).getValues().map(function (r, i) { r._row = i + 2; return r; });
}
function fileObj_(r) {
  return { id: r[0], projectId: r[1], kind: r[2], name: r[3], url: r[4], driveId: r[5], added: fmtDate_(r[6]),
    approval: r[7] || '', comment: r[8], decidedBy: r[9], decidedOn: fmtDate_(r[10]), final: String(r[11]).toUpperCase() === 'YES' };
}
function projectByCode_(code) {
  const c = String(code || '').trim().toUpperCase(); if (c.length < 4) return null;
  return rows_('Projects').filter(function (r) { return String(r[8]).toUpperCase() === c; })[0] || null;
}

function filesRoute_(q, owner) {
  switch (q.action) {
    case 'fileAdd':  if (!owner) throw new Error('Owner key required'); return fileAdd_(q.item);
    case 'fileDel':  if (!owner) throw new Error('Owner key required'); return fileDel_(q.id);
    case 'files': {
      let pid = q.projectId;
      if (!owner) { const p = projectByCode_(q.clientCode); if (!p) throw new Error('Project code not found'); pid = p[0]; }
      return { ok: true, items: fileRows_().filter(function (r) { return String(r[1]) === String(pid); }).map(fileObj_) };
    }
    case 'fileGet':  return fileGet_(q.id, owner, q.clientCode);
    case 'decide':   return decide_(q.clientCode, q.id, q.decision, q.comment, q.name);
  }
  return null;
}

function fileAdd_(it) {
  if (!it || !it.projectId || !it.name) return { ok: false, error: 'Project and name required' };
  const p = rowById_('Projects', it.projectId); if (!p) return { ok: false, error: 'Project not found' };
  let url = it.url || '', driveId = '';
  if (it.data) {
    const m = String(it.data).match(/^data:([^;]*);base64,(.*)$/);
    if (!m) return { ok: false, error: 'Bad file data' };
    const f = folder_().createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1] || 'application/octet-stream', it.fileName || it.name));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    driveId = f.getId(); url = 'https://drive.google.com/file/d/' + driveId + '/view';
  }
  if (!url) return { ok: false, error: 'Attach a file or paste a link' };
  const id = newId_('F');
  const approval = it.forApproval ? 'Pending' : '';
  filesSheet_().appendRow([id, it.projectId, it.kind || 'doc', it.name, url, driveId, new Date(), approval, '', '', '', it.final ? 'YES' : 'NO']);
  const kindTxt = it.kind === 'model' ? '3D model' : 'document';
  addUpdate_({ projectId: it.projectId, title: (it.final ? 'FINAL SUBMISSION — ' : '') + 'New ' + kindTxt + ': ' + it.name + (it.forApproval ? ' (please approve)' : ''),
    text: it.note || (it.forApproval ? 'Please review it in the Documents section and Approve or Request changes.' : 'Shared in your Documents section.'),
    status: it.final ? 'Final submission — awaiting approval' : undefined });
  return { ok: true, id: id, url: url };
}

function fileGet_(id, owner, code) {
  const r = fileRows_().filter(function (x) { return String(x[0]) === String(id); })[0];
  if (!r) return { ok: false, error: 'File not found' };
  if (!owner) { const p = projectByCode_(code); if (!p || String(p[0]) !== String(r[1])) return { ok: false, error: 'Not allowed' }; }
  if (!r[5]) return { ok: true, url: r[4] };
  const f = DriveApp.getFileById(r[5]);
  if (f.getSize() > MAX_PROXY_MB * 1048576) return { ok: false, error: 'File is larger than ' + MAX_PROXY_MB + ' MB — please ask us for a lighter (subsampled) 3D file.' };
  return { ok: true, name: f.getName(), b64: Utilities.base64Encode(f.getBlob().getBytes()) };
}

function decide_(code, id, decision, comment, name) {
  const p = projectByCode_(code); if (!p) return { ok: false, error: 'Project code not found' };
  const r = fileRows_().filter(function (x) { return String(x[0]) === String(id) && String(x[1]) === String(p[0]); })[0];
  if (!r) return { ok: false, error: 'Document not found' };
  if (['Approved', 'Changes requested'].indexOf(decision) < 0) return { ok: false, error: 'Bad decision' };
  if (!String(name || '').trim()) return { ok: false, error: 'Type your name' };
  if (decision === 'Changes requested' && !String(comment || '').trim()) return { ok: false, error: 'Please write what to change' };
  const sh = filesSheet_(), now = new Date();
  sh.getRange(r._row, 8, 1, 4).setValues([[decision, String(comment || '').slice(0, 2000), String(name).slice(0, 80), now]]);
  const fo = fileObj_(r);
  addMessage_(p[0], 'Client', name, (decision === 'Approved' ? '✅ APPROVED: ' : '✏️ CHANGES REQUESTED: ') + fo.name + (comment ? '\n' + comment : ''), '');
  if (fo.final && decision === 'Approved') {
    const ps = sheet_('Projects');
    ps.getRange(p._row, 7).setValue('Completed — approved by client');
    ps.getRange(p._row, 8).setValue(100);
    ps.getRange(p._row, 14).setValue(now);
    addUpdate_({ projectId: p[0], title: 'Final work approved by ' + name, progress: 100, status: 'Completed — approved by client',
      text: 'Thank you! The final submission "' + fo.name + '" has been approved. The balance phase payment is now due as per the quotation.' });
  }
  try {
    MailApp.sendEmail({ to: ownerEmail_(), subject: (decision === 'Approved' ? 'APPROVED' : 'CHANGES REQUESTED') + (fo.final ? ' (FINAL)' : '') + ' — ' + p[1],
      body: 'Project: ' + p[1] + '\nDocument: ' + fo.name + '\nDecision: ' + decision + '\nBy: ' + name + '\nComment: ' + (comment || '-') +
        '\n\nOpen owner panel: ' + SITE_URL + 'work.html#owner', name: 'Lee Enterprise Website' });
  } catch (e) {}
  return { ok: true, decision: decision, final: fo.final };
}

function fileDel_(id) {
  const r = fileRows_().filter(function (x) { return String(x[0]) === String(id); })[0];
  if (!r) return { ok: false, error: 'Not found' };
  filesSheet_().deleteRow(r._row);
  return { ok: true };
}
