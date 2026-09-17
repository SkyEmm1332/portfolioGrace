// ===========================
// BACKUP — sauvegarde git de data.json + uploads/
// Usage        : node backup.js   (ou npm run backup)
// Déclenché automatiquement après chaque sauvegarde de l'admin (server.js)
//
// Comporte :
//   1. Copie data.json + tout le dossier uploads/ dans backups/<horodatage>/
//   2. Supprime les sauvegardes les plus anciennes (garde BACKUP_KEEP, défaut 5)
//   3. Commit dans git : backups/ + data.json + uploads/
// ===========================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const BACKUP_DIR = path.join(ROOT, 'backups');
const KEEP = parseInt(process.env.BACKUP_KEEP || '5', 10);

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      n += copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}

function prune() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const list = fs.readdirSync(BACKUP_DIR)
    .filter(n => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(n))
    .sort();
  while (list.length > KEEP) {
    const old = list.shift();
    fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true });
    console.log('  [backup] ancienne sauvegarde supprimée : ' + old);
  }
}

function git(args) {
  return execSync('git ' + args, {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

try {
  const ts = stamp();
  const dest = path.join(BACKUP_DIR, ts);
  fs.mkdirSync(dest, { recursive: true });

  let count = 0;
  if (fs.existsSync(path.join(ROOT, 'data.json'))) {
    fs.copyFileSync(path.join(ROOT, 'data.json'), path.join(dest, 'data.json'));
    count++;
  }
  count += copyDir(path.join(ROOT, 'uploads'), path.join(dest, 'uploads'));

  prune();

  try {
    git('add backups/ data.json uploads/');
    git(`commit -m "Sauvegarde automatique ${ts}" --quiet`);
    console.log(`[backup] OK ${ts} — ${count} fichier(s) copié(s) et commité(s)`);
  } catch (e) {
    const out = String(e.stdout || '') + String(e.stderr || '');
    if (/nothing to commit|no changes added/.test(out)) {
      console.log('[backup] ' + ts + ' — rien à commiter (fichiers identiques)');
    } else {
      console.log('[backup] commit git impossible : ' + out.split('\n')[0]);
    }
  }
} catch (e) {
  console.log('[backup] échec : ' + e.message);
}