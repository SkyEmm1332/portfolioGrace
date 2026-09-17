// ===========================
// PORTFOLIO — Mini serveur Node (zéro dépendance)
// Lancement : node server.js
// Routes :
//   GET  /            → index.html (le portfolio)
//   GET  /admin.html  → page d'administration
//   GET  /api/data    → renvoie data.json
//   POST /api/data    → enregistre data.json
//   POST /api/upload  → enregistre un fichier (JSON { name, data(base64) }) dans uploads/
//   GET  /*           → fichiers statiques (css, js, images, uploads, pdf...)
// ===========================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MAX_BODY = 300 * 1024 * 1024; // 300 Mo max pour les uploads

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

function log(msg) {
  const t = new Date().toLocaleTimeString('fr-FR');
  console.log(`[${t}] ${msg}`);
}

// Sauvegarde git automatique après une sauvegarde de l'admin
function triggerBackup() {
  exec('node backup.js', { cwd: ROOT, timeout: 180000 }, (err, stdout, stderr) => {
    if (stdout) log(stdout.trim());
    if (stderr && err) log('backup: ' + stderr.trim());
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Fichier trop volumineux (max 300 Mo)'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sanitizeName(name) {
  let base = path.basename(String(name || '').replace(/\\/g, '/'));
  base = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return base || 'fichier';
}

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8');
}

function serveFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, '404 — Fichier introuvable');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const method = req.method;

  // ---------- API : lire les données ----------
  if (method === 'GET' && url === '/api/data') {
    serveFile(res, path.join(ROOT, 'data.json'));
    return;
  }

  // ---------- API : sauvegarder les données ----------
  if (method === 'POST' && url === '/api/data') {
    try {
      const raw = await readBody(req);
      const data = JSON.parse(raw.toString('utf-8'));
      const json = JSON.stringify(data, null, 2);
      fs.writeFile(path.join(ROOT, 'data.json'), json, 'utf-8', err => {
        if (err) {
          log('ERREUR sauvegarde data.json : ' + err.message);
          sendJson(res, 500, { ok: false, error: 'Impossible d\'écrire data.json' });
          return;
        }
        log('data.json enregistré (' + json.length + ' octets)');
        sendJson(res, 200, { ok: true });
        triggerBackup();
      });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: 'JSON invalide : ' + e.message });
    }
    return;
  }

  // ---------- API : upload de fichier ----------
  if (method === 'POST' && url === '/api/upload') {
    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf-8'));
      if (!body.data) {
        sendJson(res, 400, { ok: false, error: 'Données manquantes' });
        return;
      }
      const buffer = Buffer.from(body.data, 'base64');
      const ext = path.extname(sanitizeName(body.name)).toLowerCase() || '.bin';
      const finalName = Date.now() + '_' + sanitizeName(body.name);
      const dest = path.join(ROOT, 'uploads', finalName);
      fs.writeFile(dest, buffer, err => {
        if (err) {
          sendJson(res, 500, { ok: false, error: 'Écriture impossible : ' + err.message });
          return;
        }
        const urlPath = 'uploads/' + finalName;
        log('Upload : ' + urlPath + ' (' + buffer.length + ' octets)');
        sendJson(res, 200, { ok: true, path: urlPath });
      });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: 'Upload invalide : ' + e.message });
    }
    return;
  }

  // ---------- Fichiers statiques ----------
  let filePath = path.join(ROOT, url === '/' ? 'index.html' : url);

  // Empêcher les traversées de répertoire
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(ROOT))) {
    send(res, 403, '403 — Accès refusé');
    return;
  }

  fs.stat(resolved, (err, stat) => {
    if (!err && stat.isDirectory()) {
      serveFile(res, path.join(resolved, 'index.html'));
      return;
    }
    serveFile(res, resolved);
  });
});

server.listen(PORT, () => {
  log('Serveur démarré :');
  log('  Portfolio  : http://localhost:' + PORT);
  log('  Admin      : http://localhost:' + PORT + '/admin.html');
});