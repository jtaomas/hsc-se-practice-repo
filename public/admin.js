var ADMIN = { data: null, msg: '', busy: false, detailUserId: null, detailBankId: null };

function adminApi(action, params) {
  var h={'content-type':'application/json'};if(S.tok)h.authorization='Bearer '+S.tok;
  return fetch('/api/admin',{method:'POST',headers:h,body:JSON.stringify(Object.assign({action:action},params||{}))}).then(function(r){
    return r.json().catch(function(){return {error:'The admin service sent an unreadable reply.'}}).then(function(j){
      if(!r.ok){var e=new Error(j.error||'Request failed ('+r.status+')');e.status=r.status;e.details=j;throw e}
      return j;
    });
  });
}

function adminPage() {
  if (S.ae !== 'thomas.lu@education.nsw.gov.au') {
    return frame('Admin', '<div class="pg"><h1 class="pt">Admin</h1><p>You do not have permission to view this page.</p></div>');
  }

  if (!ADMIN.data && !ADMIN.busy) {
    ADMIN.busy = true;
    adminApi('load_all').then(function(r) {
      ADMIN.data = r;
      ADMIN.busy = false;
      render();
    }).catch(function(e) {
      ADMIN.msg = e.message;
      ADMIN.busy = false;
      render();
    });
  }

  var h = '<div class="pg"><h1 class="pt">Admin Dashboard</h1>';
  if (ADMIN.msg) h += '<p class="acmsg" role="alert">' + esc(ADMIN.msg) + '</p>';
  if (ADMIN.busy) h += '<p>Loading data...</p>';
  else if (ADMIN.data) {
    if (ADMIN.detailUserId) {
        h += adminUserDetailHTML();
    } else {
        h += adminDashboardHTML();
    }
  }
  h += '</div>';
  return frame('Admin Dashboard', h, { nav: '<div class="band"><div class="tools"><div class="tb"><button class="tbb" data-act="adback">Home</button></div></div></div>' });
}

function adminDashboardHTML() {
  var d = ADMIN.data;
  var h = '<div class="acts"><button class="nb ol" data-act="adrefresh">Refresh</button></div>';

  h += '<table class="res" style="margin-top:20px;width:100%;text-align:left"><thead><tr><th>User</th><th>Email</th><th>Papers Started</th><th>Papers Completed</th><th>Action</th></tr></thead><tbody>';

  var users = d.users || [];
  users.forEach(function(u) {
    var meta = d.userMeta[u.id] || {};
    var started = 0, completed = 0;
    Object.keys(u.data.u || {}).forEach(function(k) {
       var p = u.data.u[k];
       if (p && /^(?:[1-9]|10)$/.test(k)) {
         started++;
         if (p.done) completed++;
       }
    });
    h += '<tr><td>' + esc(meta.name || u.id) + '</td><td>' + esc(meta.email || 'N/A') + '</td><td>' + started + '</td><td>' + completed + '</td><td><button class="nb sm" data-act="adviewuser" data-uid="' + u.id + '">View Details</button></td></tr>';
  });

  h += '</tbody></table>';
  return h;
}

function adminUserDetailHTML() {
  var uid = ADMIN.detailUserId;
  var d = ADMIN.data;
  var u = d.users.find(function(x) { return x.id === uid; });
  if (!u) return '<p>User not found.</p><button class="nb ol" data-act="addash">Back</button>';

  var meta = d.userMeta[uid] || {};
  var h = '<div class="acts"><button class="nb ol" data-act="addash">Back to Dashboard</button></div>';
  h += '<h2 style="margin-top:20px">User: ' + esc(meta.name || uid) + ' (' + esc(meta.email || 'N/A') + ')</h2>';

  if (ADMIN.detailBankId) {
     return h + adminUserPaperHTML(u, ADMIN.detailBankId);
  }

  h += '<table class="res" style="margin-top:20px;width:100%;text-align:left"><thead><tr><th>Paper</th><th>Status</th><th>Score</th><th>Action</th></tr></thead><tbody>';
  Object.keys(u.data.u || {}).forEach(function(k) {
     var p = u.data.u[k];
     var b = BANKS.find(function(x) { return x.id === k; });
     if (!p || !b || !/^(?:[1-9]|10)$/.test(k)) return;

     var status = p.done ? 'Completed' : (p.start ? 'In Progress' : 'Started');
     var score = p.done ? 'N/A' : '-';
     var hist = (u.data.hist || []).slice().reverse().find(function(x) { return x.id === k; });
     if (hist) score = hist.T + ' / ' + hist.M;

     h += '<tr><td>' + esc(b.name) + '</td><td>' + status + '</td><td>' + score + '</td><td><button class="nb sm" data-act="adviewpaper" data-uid="' + uid + '" data-bid="' + k + '">Inspect Responses</button></td></tr>';
  });
  h += '</tbody></table>';
  return h;
}

function adminUserPaperHTML(u, bid) {
  var p = (u.data.u || {})[bid];
  var b = BANKS.find(function(x) { return x.id === bid; });
  if (!p || !b) return '<p>Paper not found.</p>';

  var h = '<h3 style="margin-top:20px">Paper: ' + esc(b.name) + '</h3>';
  h += '<div class="acts"><button class="nb ol" data-act="adviewuser" data-uid="' + u.id + '">Back to User Papers</button></div>';

  h += '<div class="cvbox" style="margin-top:20px">';
  b.qs.forEach(function(q, qi) {
     q.it.forEach(function(it, pi) {
       var key = (qi + 1) + '.' + pi;
       var ans = p.ans && p.ans[key];
       if (ans !== undefined && ans !== '') {
          h += '<div class="cvhd" style="margin-top:10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;"><b>Question ' + (qi + 1) + (q.it.length > 1 ? ' part ' + (pi + 1) : '') + '</b></div>';
          h += '<div class="cvq" style="font-size:0.9em;color:#555; margin: 10px 0;">' + esc(cvPlain(it.q || '').slice(0, 200)) + '</div>';
          if (typeof ans === 'object') {
             h += '<div class="cvtxt" style="background:#f9f9f9; padding: 10px; border-radius: 4px;">' + esc(JSON.stringify(ans)) + '</div>';
          } else {
             h += '<div class="cvtxt" style="background:#f9f9f9; padding: 10px; border-radius: 4px;">' + esc(String(ans)).replace(/\n/g, '<br>') + '</div>';
          }
       }
     });
  });
  h += '</div>';

  return h;
}

document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-act]');
  if (!el) return;
  var a = el.dataset.act;
  if (a === 'adrefresh') {
    ADMIN.data = null;
    render();
  } else if (a === 'addash') {
    ADMIN.detailUserId = null;
    ADMIN.detailBankId = null;
    render();
  } else if (a === 'adviewuser') {
    ADMIN.detailUserId = el.dataset.uid;
    ADMIN.detailBankId = null;
    render();
  } else if (a === 'adviewpaper') {
    ADMIN.detailUserId = el.dataset.uid;
    ADMIN.detailBankId = el.dataset.bid;
    render();
  } else if (a === 'adback') {
      location.hash = '#/';
  }
});
