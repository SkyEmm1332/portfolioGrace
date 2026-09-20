// ===========================
// ADMIN — panneau d'administration
// ===========================

// ---------- API ----------
async function apiGetData() {
  const r = await fetch('/api/data', { cache: 'no-store' });
  if (r.status === 404) throw new Error('STATIC');
  if (!r.ok) throw new Error('Serveur inaccessible');
  return r.json();
}

async function apiSaveData(data) {
  const r = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('Échec de la sauvegarde');
  return r.json();
}

async function apiUpload(name, base64Data) {
  const r = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data: base64Data })
  });
  const res = await r.json();
  if (!res.ok) throw new Error(res.error || 'Upload échoué');
  return res.path;
}

// Upload routé : Supabase (en ligne) ou serveur local (data.json)
async function uploadMedia(name, base64Data) {
  if (window.Supabase && window.Supabase.isConfigured()) {
    return window.Supabase.upload(name, base64Data);
  }
  return apiUpload(name, base64Data);
}

// Upload vers une clé fixe (Supabase uniquement) — le fichier persiste
async function uploadMediaAs(name, base64Data, fixedKey) {
  if (window.Supabase && window.Supabase.isConfigured() && fixedKey) {
    return window.Supabase.uploadAs(fixedKey, base64Data);
  }
  return uploadMedia(name, base64Data);
}

// ---------- Utilitaires ----------
const $ = (id) => document.getElementById(id);

function toast(msg, isError = false) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

function splitLines(text) {
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

function splitCommas(text) {
  return text.split(',').map(s => s.trim()).filter(Boolean);
}

// ---------- Média picker ----------
function createMediaPicker(container, value, accept = 'image/*') {
  container.innerHTML = `
    <img class="media-picker__preview" src="" alt="Aperçu" />
    <div class="media-picker__row">
      <label class="media-picker__upload">Choisir un fichier<input type="file" accept="${accept}" /></label>
      <button type="button" class="media-picker__url-toggle">ou coller une URL</button>
    </div>
    <input type="text" class="media-picker__path" placeholder="Collez l'URL du média ici" hidden />
    <span class="media-picker__status"></span>
  `;
  const preview = container.querySelector('.media-picker__preview');
  const pathInput = container.querySelector('.media-picker__path');
  const fileInput = container.querySelector('input[type="file"]');
  const status = container.querySelector('.media-picker__status');
  const urlToggle = container.querySelector('.media-picker__url-toggle');

  function setPath(p) {
    pathInput.value = p || '';
    preview.src = p || '';
    preview.style.opacity = p ? '1' : '.25';
  }

  setPath(value);
  if (accept.startsWith('video')) {
    preview.style.display = 'none';
  }

  urlToggle.addEventListener('click', () => {
    pathInput.hidden = false;
    pathInput.focus();
    urlToggle.style.display = 'none';
  });

  pathInput.addEventListener('input', () => {
    const p = pathInput.value.trim();
    preview.src = p || '';
    preview.style.opacity = p ? '1' : '.25';
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 290 * 1024 * 1024) {
      status.textContent = 'Fichier trop volumineux (max 290 Mo)';
      status.classList.add('error');
      return;
    }
    status.textContent = 'Envoi en cours…';
    status.classList.remove('error');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(',')[1];
        const path = await uploadMedia(file.name, base64);
        // Vérifie que le fichier est bien accessible avant de le référencer
        let ok = true;
        if (window.Supabase && window.Supabase.isConfigured()) {
          ok = await window.Supabase.checkExists(path);
        }
        if (!ok) throw new Error('fichier introuvable après l\'envoi (trop volumineux ?)');
        setPath(path);
        status.textContent = '✓ Média envoyé — cliquez sur 💾 Sauvegarder pour l\'appliquer';
      } catch (e) {
        status.textContent = 'Échec de l\'envoi : ' + e.message;
        status.classList.add('error');
      }
    };
    reader.readAsDataURL(file);
  });

  return { getValue: () => pathInput.value.trim() };
}

// ---------- État ----------
let config = null;
let mediaPickers = {};

const SECTIONS_VISIBILITY = [
  ['hero', 'Hero'], ['about', 'À propos'], ['services', 'Services'],
  ['experience', 'Expérience'], ['work', 'Travaux'], ['videos', 'Vidéos'],
  ['stats', 'Stats'], ['top', 'Meilleures publications'],
  ['packages', 'Forfaits'], ['testimonials', 'Témoignages'], ['contact', 'Contact']
];

function fillVisibility() {
  const list = $('visibilityList');
  list.innerHTML = '';
  SECTIONS_VISIBILITY.forEach(([key, label]) => {
    const show = config.visibility ? config.visibility[key] !== false : true;
    const item = document.createElement('label');
    item.className = 'vis-check';
    item.innerHTML = `<input type="checkbox" class="f-vis" data-key="${key}" ${show ? 'checked' : ''} /> ${label}`;
    list.appendChild(item);
  });
}

// ---------- Remplissage des formulaires ----------
function fillGeneral() {
  fillVisibility();
  $('metaTitle').value = config.meta.title || '';
  $('metaDesc').value = config.meta.description || '';
  $('contactEmail').value = config.contact.email || '';
  $('contactInstaUrl').value = config.contact.instagram || '';
  $('contactInstaLabel').value = config.contact.instagramLabel || '';
  $('contactTiktokUrl').value = config.contact.tiktok || '';
  $('contactTiktokLabel').value = config.contact.tiktokLabel || '';

  const list = $('socialsList');
  list.innerHTML = '';
  (config.socials || []).forEach(s => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Réseau</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Libellé (ex: IG)</label><input type="text" class="f-label" value="${s.label || ''}" /></div>
        <div><label>Nom complet (accessibilité)</label><input type="text" class="f-aria" value="${s.aria || ''}" /></div>
        <div class="full"><label>URL</label><input type="url" class="f-url" value="${s.url || ''}" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillHero() {
  $('heroSub').value = config.hero.sub || '';

  const tl = $('heroTitleLines');
  tl.innerHTML = '';
  (config.hero.titleLines || []).forEach(line => addLineInput(tl, line));

  $('heroTags').value = (config.hero.tags || []).join(', ');
  mediaPickers.heroImage = createMediaPicker($('heroImagePicker'), config.hero.image);
  $('heroImageAlt').value = config.hero.imageAlt || '';

  const hs = $('heroStatsList');
  hs.innerHTML = '';
  (config.hero.stats || []).forEach(s => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Stat</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Nombre (ex: 62K)</label><input type="text" class="f-num" value="${s.num || ''}" /></div>
        <div><label>Libellé (ex: Abonnés)</label><input type="text" class="f-label" value="${s.label || ''}" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    hs.appendChild(item);
  });
}

function fillAbout() {
  $('aboutEyebrow').value = config.about.eyebrow || '';

  const tl = $('aboutTitleLines');
  tl.innerHTML = '';
  (config.about.titleLines || []).forEach(line => addLineInput(tl, line));

  mediaPickers.aboutImage = createMediaPicker($('aboutImagePicker'), config.about.image);
  $('aboutImageAlt').value = config.about.imageAlt || '';
  $('aboutLabel').value = (config.about.imageLabel || '').replace(/\n/g, '\n');
  $('aboutBody').value = (config.about.body || []).join('\n\n');
  $('aboutTags').value = (config.about.tags || []).join(', ');
}

function fillServices() {
  const list = $('servicesList');
  list.innerHTML = '';
  (config.services || []).forEach(s => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Service</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Icône</label><input type="text" class="f-icon" value="${s.icon || '★'}" /></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-red" ${s.red ? 'checked' : ''} /> Fond rouge</label></div>
        <div><label>Titre</label><input type="text" class="f-title" value="${s.title || ''}" /></div>
        <div><label>Description</label><input type="text" class="f-desc" value="${s.desc || ''}" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillExperience() {
  $('expEyebrow').value = config.experience.eyebrow || '';
  $('expTitle').value = config.experience.title || '';
  mediaPickers.expImage = createMediaPicker($('expImagePicker'), config.experience.image);
  $('expImageAlt').value = config.experience.imageAlt || '';
  $('expParagraphs').value = (config.experience.paragraphs || []).join('\n\n');
  $('expListTitle').value = config.experience.listTitle || '';
  $('expList').value = (config.experience.list || []).join('\n');
}

function fillWork() {
  const list = $('workList');
  list.innerHTML = '';
  (config.work || []).forEach((w, i) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Travail ${i + 1}</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Titre</label><input type="text" class="f-title" value="${w.title || ''}" /></div>
        <div><label>Catégorie (ex: UGC)</label><input type="text" class="f-cat" value="${w.cat || ''}" /></div>
        <div class="full"><label>Description</label><textarea class="f-desc" rows="3">${w.desc || ''}</textarea></div>
        <div class="full"><label>Tags (séparés par des virgules)</label><input type="text" class="f-tags" value="${(w.tags || []).join(', ')}" /></div>
        <div class="full"><label>Image</label><div class="media-picker-wrap"></div></div>
        <div><label>Texte alternatif</label><input type="text" class="f-alt" value="${w.alt || ''}" /></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-tall" ${w.tall ? 'checked' : ''} /> Grande carte (2 rangées)</label></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-wide" ${w.wide ? 'checked' : ''} /> Carte large (2 colonnes)</label></div>
      </div>`;
    item._picker = createMediaPicker(item.querySelector('.media-picker-wrap'), w.image);
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillVideos() {
  const list = $('videosList');
  list.innerHTML = '';
  (config.videos || []).forEach((v, i) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Vidéo ${i + 1}</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div class="full"><label>Titre</label><input type="text" class="f-title" value="${v.title || ''}" /></div>
        <div class="full"><label>Image de couverture</label><div class="media-picker-wrap"></div></div>
        <div class="full"><label>Fichier vidéo (mp4) — facultatif</label><div class="media-picker-video-wrap"></div></div>
      </div>`;
    item._picker = createMediaPicker(item.querySelector('.media-picker-wrap'), v.thumb);
    item._pickerVideo = createMediaPicker(item.querySelector('.media-picker-video-wrap'), v.video, 'video/*');
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillStats() {
  const tl = $('statsTitleLines');
  tl.innerHTML = '';
  (config.stats.titleLines || []).forEach(line => addLineInput(tl, line));

  const list = $('statsItemsList');
  list.innerHTML = '';
  (config.stats.items || []).forEach(s => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Statistique</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Nombre (ex: 62 000, 8,2%)</label><input type="text" class="f-num" value="${s.num || ''}" /></div>
        <div><label>Libellé</label><input type="text" class="f-label" value="${s.label || ''}" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillTop() {
  const list = $('topList');
  list.innerHTML = '';
  (config.topPosts || []).forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Publication ${i + 1}</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Plateforme (ex: TIKTOK)</label><input type="text" class="f-platform" value="${p.platform || ''}" /></div>
        <div><label>Image</label><div class="media-picker-wrap"></div></div>
        <div><label>Vues</label><input type="text" class="f-views" value="${p.views || ''}" /></div>
        <div><label>Likes</label><input type="text" class="f-likes" value="${p.likes || ''}" /></div>
        <div><label>Commentaires</label><input type="text" class="f-comments" value="${p.comments || ''}" /></div>
      </div>`;
    item._picker = createMediaPicker(item.querySelector('.media-picker-wrap'), p.image);
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillPackages() {
  const list = $('packagesList');
  list.innerHTML = '';
  (config.packages || []).forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Forfait ${i + 1}</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Titre (ex: REELS)</label><input type="text" class="f-title" value="${p.title || ''}" /></div>
        <div class="full list-item__rows"><label>Tarifs — une ligne par élément : libellé | prix</label><textarea class="f-rows" rows="4">${(p.rows || []).map(r => r[0] + ' | ' + r[1]).join('\n')}</textarea></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function fillTestimonials() {
  const list = $('testiList');
  list.innerHTML = '';
  (config.testimonials || []).forEach(t => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Témoignage</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div class="full"><label>Citation</label><textarea class="f-quote" rows="3">${t.quote || ''}</textarea></div>
        <div><label>Auteur</label><input type="text" class="f-author" value="${t.author || ''}" /></div>
        <div><label>Marque</label><input type="text" class="f-brand" value="${t.brand || ''}" /></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-red" ${t.red ? 'checked' : ''} /> Fond rouge</label></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

// ---------- Lignes de titre (listes de champs simples) ----------
function addLineInput(container, value) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.5rem;';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'f-line';
  input.value = value || '';
  input.placeholder = 'Ligne du titre…';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'list-item__remove';
  btn.textContent = '✕';
  btn.addEventListener('click', () => wrap.remove());
  wrap.appendChild(input);
  wrap.appendChild(btn);
  container.appendChild(wrap);
}

function collectLines(container) {
  return Array.from(container.querySelectorAll('.f-line')).map(i => i.value.trim()).filter(Boolean);
}

// ---------- Fichier picker (PDF et autres) ----------
function createFilePicker(container, value, fixedKey) {
  container.innerHTML = `
    <div class="media-picker__row">
      <a class="media-picker__file-link" href="" target="_blank" rel="noopener" hidden>Voir le fichier ↗</a>
      <label class="media-picker__upload">Choisir un fichier<input type="file" accept=".pdf,.doc,.docx,.pptx,.zip,.png,.jpg,.jpeg,.mp4" /></label>
      <button type="button" class="media-picker__url-toggle">ou coller une URL</button>
    </div>
    <input type="text" class="media-picker__path" placeholder="Collez l'URL du fichier ici" hidden />
    <span class="media-picker__status"></span>
  `;
  const pathInput = container.querySelector('.media-picker__path');
  const fileInput = container.querySelector('input[type="file"]');
  const status = container.querySelector('.media-picker__status');
  const urlToggle = container.querySelector('.media-picker__url-toggle');
  const fileLink = container.querySelector('.media-picker__file-link');

  function setPath(p) {
    pathInput.value = p || '';
    if (p) {
      fileLink.href = p;
      fileLink.hidden = false;
    } else {
      fileLink.hidden = true;
    }
  }

  setPath(value);

  // Clé fixe : vérifie si le fichier existe déjà dans le stockage et préremplit
  if (!value && fixedKey && window.Supabase && window.Supabase.isConfigured()) {
    const url = window.Supabase.publicUrl(fixedKey);
    window.Supabase.checkExists(url).then(ok => {
      if (ok && !pathInput.value) setPath(url);
    }).catch(() => {});
  }

  urlToggle.addEventListener('click', () => {
    pathInput.hidden = false;
    pathInput.focus();
    urlToggle.style.display = 'none';
  });

  fileLink.addEventListener('click', (e) => {
    e.preventDefault();
    showFilePreview(pathInput.value.trim());
  });

  pathInput.addEventListener('input', () => setPath(pathInput.value.trim()));

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 290 * 1024 * 1024) {
      status.textContent = 'Fichier trop volumineux (max 290 Mo)';
      status.classList.add('error');
      return;
    }
    status.textContent = 'Envoi en cours…';
    status.classList.remove('error');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(',')[1];
        const url = await uploadMediaAs(file.name, base64, fixedKey);
        let ok = true;
        if (window.Supabase && window.Supabase.isConfigured()) {
          ok = await window.Supabase.checkExists(url);
        }
        if (!ok) throw new Error('fichier introuvable après l\'envoi (trop volumineux ?)');
        setPath(url);
        status.textContent = '✓ Fichier envoyé — cliquez sur 💾 Sauvegarder pour l\'appliquer' + (fixedKey ? ' (permanent)' : '');
      } catch (e) {
        status.textContent = 'Échec de l\'envoi : ' + e.message;
        status.classList.add('error');
      }
    };
    reader.readAsDataURL(file);
  });

  return { getValue: () => pathInput.value.trim() };
}

// ---------- Fichiers ----------
const CV_STORAGE_KEY = 'fichiers/cv.graceouphouet.2026.pdf';

function fillFiles() {
  if (!config.fichiers) config.fichiers = { cv: '', others: [] };
  mediaPickers.cvFile = createFilePicker($('cvFilePicker'), config.fichiers.cv, CV_STORAGE_KEY);

  const list = $('filesList');
  list.innerHTML = '';
  (config.fichiers.others || []).forEach(f => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Fichier</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Libellé (ex: Dossier de presse)</label><input type="text" class="f-label" value="${esc(f.label || '')}" /></div>
        <div><label>Fichier</label><div class="file-picker-wrap"></div></div>
      </div>`;
    item._picker = createFilePicker(item.querySelector('.file-picker-wrap'), f.url);
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    list.appendChild(item);
  });
}

function addFileItem() {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <div class="list-item__head"><strong>Fichier</strong><button type="button" class="list-item__remove">✕</button></div>
    <div class="list-item__grid">
      <div><label>Libellé (ex: Dossier de presse)</label><input type="text" class="f-label" /></div>
      <div><label>Fichier</label><div class="file-picker-wrap"></div></div>
    </div>`;
  item._picker = createFilePicker(item.querySelector('.file-picker-wrap'));
  item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
  $('filesList').appendChild(item);
}

// ---------- Remplissage global ----------
function fillAll() {
  fillGeneral();
  fillHero();
  fillAbout();
  fillServices();
  fillExperience();
  fillWork();
  fillVideos();
  fillStats();
  fillTop();
  fillPackages();
  fillTestimonials();
  fillFiles();
}

// ---------- Collecte + sauvegarde ----------
function collectConfig() {
  const c = JSON.parse(JSON.stringify(config));

  c.meta.title = $('metaTitle').value.trim();
  c.meta.description = $('metaDesc').value.trim();
  c.contact.email = $('contactEmail').value.trim();
  c.contact.instagram = $('contactInstaUrl').value.trim();
  c.contact.instagramLabel = $('contactInstaLabel').value.trim();
  c.contact.tiktok = $('contactTiktokUrl').value.trim();
  c.contact.tiktokLabel = $('contactTiktokLabel').value.trim();

  c.socials = Array.from($('socialsList').querySelectorAll('.list-item')).map(item => ({
    label: item.querySelector('.f-label').value.trim(),
    aria: item.querySelector('.f-aria').value.trim(),
    url: item.querySelector('.f-url').value.trim()
  })).filter(s => s.url);

  const vis = {};
  document.querySelectorAll('#visibilityList .f-vis').forEach(cb => {
    vis[cb.dataset.key] = cb.checked;
  });
  c.visibility = vis;

  c.hero.sub = $('heroSub').value.trim();
  c.hero.titleLines = collectLines($('heroTitleLines'));
  c.hero.tags = splitCommas($('heroTags').value);
  c.hero.image = mediaPickers.heroImage.getValue();
  c.hero.imageAlt = $('heroImageAlt').value.trim();
  c.hero.stats = Array.from($('heroStatsList').querySelectorAll('.list-item')).map(item => ({
    num: item.querySelector('.f-num').value.trim(),
    label: item.querySelector('.f-label').value.trim()
  }));

  c.about.eyebrow = $('aboutEyebrow').value.trim();
  c.about.titleLines = collectLines($('aboutTitleLines'));
  c.about.image = mediaPickers.aboutImage.getValue();
  c.about.imageAlt = $('aboutImageAlt').value.trim();
  c.about.imageLabel = $('aboutLabel').value.replace(/\n+$/, '');
  c.about.body = splitLines($('aboutBody').value);
  c.about.tags = splitCommas($('aboutTags').value);

  c.services = Array.from($('servicesList').querySelectorAll('.list-item')).map(item => ({
    icon: item.querySelector('.f-icon').value.trim() || '★',
    title: item.querySelector('.f-title').value.trim(),
    desc: item.querySelector('.f-desc').value.trim(),
    red: item.querySelector('.f-red').checked
  }));

  c.experience.eyebrow = $('expEyebrow').value.trim();
  c.experience.title = $('expTitle').value.trim();
  c.experience.image = mediaPickers.expImage.getValue();
  c.experience.imageAlt = $('expImageAlt').value.trim();
  c.experience.paragraphs = splitLines($('expParagraphs').value);
  c.experience.listTitle = $('expListTitle').value.trim();
  c.experience.list = splitLines($('expList').value);

  c.work = Array.from($('workList').querySelectorAll('.list-item')).map(item => ({
    title: item.querySelector('.f-title').value.trim(),
    cat: item.querySelector('.f-cat').value.trim(),
    desc: item.querySelector('.f-desc').value.trim(),
    tags: splitCommas(item.querySelector('.f-tags').value),
    image: item._picker.getValue(),
    alt: item.querySelector('.f-alt').value.trim(),
    tall: item.querySelector('.f-tall').checked,
    wide: item.querySelector('.f-wide').checked
  }));

  c.videos = Array.from($('videosList').querySelectorAll('.list-item')).map(item => ({
    title: item.querySelector('.f-title').value.trim(),
    thumb: item._picker.getValue(),
    video: item._pickerVideo.getValue()
  }));

  c.stats.titleLines = collectLines($('statsTitleLines'));
  c.stats.items = Array.from($('statsItemsList').querySelectorAll('.list-item')).map(item => ({
    num: item.querySelector('.f-num').value.trim(),
    label: item.querySelector('.f-label').value.trim()
  }));

  c.topPosts = Array.from($('topList').querySelectorAll('.list-item')).map(item => ({
    platform: item.querySelector('.f-platform').value.trim(),
    image: item._picker.getValue(),
    views: item.querySelector('.f-views').value.trim(),
    likes: item.querySelector('.f-likes').value.trim(),
    comments: item.querySelector('.f-comments').value.trim()
  }));

  c.packages = Array.from($('packagesList').querySelectorAll('.list-item')).map(item => ({
    title: item.querySelector('.f-title').value.trim(),
    rows: splitLines(item.querySelector('.f-rows').value).map(line => {
      const [label, price] = line.split('|');
      return [label.trim(), (price || '').trim()];
    })
  }));

  c.testimonials = Array.from($('testiList').querySelectorAll('.list-item')).map(item => ({
    quote: item.querySelector('.f-quote').value.trim(),
    author: item.querySelector('.f-author').value.trim(),
    brand: item.querySelector('.f-brand').value.trim(),
    red: item.querySelector('.f-red').checked
  }));

  c.fichiers = {
    cv: mediaPickers.cvFile ? mediaPickers.cvFile.getValue() : '',
    others: Array.from($('filesList').querySelectorAll('.list-item')).map(item => ({
      label: item.querySelector('.f-label').value.trim(),
      url: item._picker.getValue()
    })).filter(f => f.label && f.url)
  };

  return c;
}

// ---------- Restauration (annuler les modifications non sauvegardées) ----------
const TAB_FILLERS = {
  general: fillGeneral,
  hero: fillHero,
  about: fillAbout,
  services: fillServices,
  experience: fillExperience,
  work: fillWork,
  videos: fillVideos,
  stats: fillStats,
  top: fillTop,
  packages: fillPackages,
  testimonials: fillTestimonials,
  files: fillFiles
};

function restoreAll() {
  if (!config) return;
  fillAll();
  updatePreview();
  toast('↺ Modifications annulées — contenu restauré depuis la dernière sauvegarde');
}

function restoreTab(name) {
  if (!config) return;
  const fn = TAB_FILLERS[name];
  if (!fn) return;
  fn();
  updatePreview();
  toast('↺ Section restaurée depuis la dernière sauvegarde');
}

// Remplit la section courante depuis le data.json déployé
// (utile pour récupérer une section effacée en ligne, puis Sauvegarder)
async function restoreTabFromDataJson(name) {
  const fn = TAB_FILLERS[name];
  if (!fn) return;
  try {
    const r = await fetch('data.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('data.json introuvable');
    const ref = await r.json();
    const saved = config;
    config = ref;
    fn();
    config = saved;
    updatePreview();
    toast('↺ Section remplie depuis data.json — vérifiez puis sauvegardez');
  } catch (e) {
    toast('Impossible de charger data.json : ' + e.message, true);
  }
}

// ---------- Diff : récapitulatif des modifications ----------
const SECTION_LABELS = {
  meta: 'Général (SEO)', hero: 'Hero', about: 'À propos', services: 'Services',
  experience: 'Expérience', work: 'Travaux', videos: 'Vidéos', stats: 'Stats',
  topPosts: 'Top posts', packages: 'Forfaits', testimonials: 'Témoignages',
  contact: 'Contact', socials: 'Réseaux sociaux'
};

const FIELD_LABELS = {
  sub: 'sous-titre', titleLines: 'titre', tags: 'tags', image: 'image',
  imageAlt: 'texte alternatif', stats: 'stats', title: 'titre', description: 'description',
  eyebrow: 'sur-titre', body: 'paragraphes', imageLabel: 'étiquette', paragraphs: 'paragraphes',
  listTitle: 'titre de liste', list: 'liste', cat: 'catégorie', desc: 'description',
  alt: 'texte alternatif', thumb: 'vignette', video: 'vidéo', platform: 'plateforme',
  views: 'vues', likes: 'likes', comments: 'commentaires', quote: 'citation',
  author: 'auteur', brand: 'marque', red: 'fond rouge', rows: 'tarifs',
  label: 'libellé', num: 'nombre', email: 'e-mail', instagram: 'Instagram',
  instagramLabel: 'libellé Instagram', tiktok: 'TikTok', tiktokLabel: 'libellé TikTok',
  aria: 'nom', url: 'URL', icon: 'icône', tall: 'grande carte', wide: 'carte large',
  items: 'statistiques'
};

function labelPath(path) {
  const parts = [];
  let section = '';
  path.forEach((p, i) => {
    if (i === 0) { section = SECTION_LABELS[p] || p; return; }
    if (typeof p === 'number') parts.push('#' + (p + 1));
    else parts.push(FIELD_LABELS[p] || p);
  });
  return section + (parts.length ? ' › ' + parts.join(' › ') : '');
}

function fmtVal(v) {
  if (Array.isArray(v)) return v.map(fmtVal).join(' · ');
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  const s = String(v == null ? '' : v).replace(/\n/g, ' ⏎ ');
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

function itemName(x) {
  if (!x || typeof x !== 'object') return '';
  return x.title || x.author || x.platform || x.label || '';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function diffConfig(a, b, path, changes) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const A = Array.isArray(a) ? a : [];
    const B = Array.isArray(b) ? b : [];
    if (JSON.stringify(A) === JSON.stringify(B)) return;
    const maxN = Math.max(A.length, B.length);
    for (let i = 0; i < maxN; i++) {
      if (!A[i] && B[i]) changes.push({ text: labelPath(path) + ' : « ' + (itemName(B[i]) || '#' + (i + 1)) + ' » ajouté' });
      else if (A[i] && !B[i]) changes.push({ text: labelPath(path) + ' : « ' + (itemName(A[i]) || '#' + (i + 1)) + ' » supprimé' });
    }
    for (let i = 0; i < Math.min(A.length, B.length); i++) {
      diffConfig(A[i], B[i], path.concat(i), changes);
    }
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => diffConfig(a[k], b[k], path.concat(k), changes));
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    changes.push({ text: labelPath(path) + ' : « ' + fmtVal(a) + ' » → « ' + fmtVal(b) + ' »' });
  }
}

// ---------- Sauvegarde avec récapitulatif ----------
let pendingSaveData = null;

function openSaveConfirm() {
  const data = collectConfig();
  if (!config) {
    doSave(data);
    return;
  }
  const changes = [];
  diffConfig(config, data, [], changes);
  if (!changes.length) {
    toast('Aucune modification à sauvegarder');
    return;
  }
  pendingSaveData = data;
  const list = $('confirmList');
  list.innerHTML = changes.slice(0, 60).map(c => `<li>${esc(c.text)}</li>`).join('');
  if (changes.length > 60) {
    list.innerHTML += `<li>… et ${changes.length - 60} autre(s) modification(s)</li>`;
  }
  $('confirmCount').textContent = changes.length + ' modification(s) détectée(s)';
  $('confirmModal').hidden = false;
}

function closeSaveConfirm() {
  $('confirmModal').hidden = true;
  pendingSaveData = null;
}

async function doSave(data) {
  try {
    if (window.Supabase && window.Supabase.isConfigured()) {
      await window.Supabase.saveConfig(data);
      config = data;
      toast('✓ Sauvegardé dans Supabase — le portfolio en ligne est à jour');
    } else {
      await apiSaveData(data);
      config = data;
      toast('✓ Données sauvegardées dans data.json');
    }
  } catch (e) {
    const extra = (window.Supabase && window.Supabase.isConfigured())
      ? ' — reconnectez-vous si la session a expiré'
      : ' — le serveur est-il lancé ? (node server.js)';
    toast('Erreur : ' + e.message + extra, true);
  }
}

// ---------- Aperçu en direct ----------
const previewFrame = $('previewFrame');
const previewFrameWrap = $('previewFrameWrap');
const previewToggle = $('previewToggle');
let currentTab = 'general';
let previewReady = false;
let previewPending = false;
let previewNaturalH = 720;

// Le contenu se rend en largeur desktop fixe (1280px) puis est mis à l'échelle
// pour tenir dans le panneau — rendu identique au site sur desktop.
const PREVIEW_DESKTOP_W = 1280;

function applyPreviewScale() {
  if (!previewFrameWrap || !previewFrame) return;
  const pane = $('previewPane');
  if (pane.classList.contains('collapsed')) return;
  const w = previewFrameWrap.clientWidth || 1;
  const scale = w / PREVIEW_DESKTOP_W;
  previewFrame.style.transform = 'scale(' + scale + ')';
  previewFrame.style.width = PREVIEW_DESKTOP_W + 'px';
  previewFrameWrap.style.height = Math.round(previewNaturalH * scale) + 'px';
}

function showFilePreview(url) {
  if (!previewReady) return;
  // Mode fichier : pas de mise à l'échelle desktop, hauteur adaptée au document
  previewFrame.style.transform = 'none';
  previewFrame.style.width = '100%';
  previewFrameWrap.style.height = '740px';
  previewFrame.contentWindow.postMessage({ type: 'file', url: url || '' }, '*');
}

function updatePreview() {
  if (!previewReady) { previewPending = true; return; }
  try {
    if (currentTab === 'files') {
      const cv = mediaPickers.cvFile ? mediaPickers.cvFile.getValue() : '';
      showFilePreview(cv);
      return;
    }
    applyPreviewScale();
    const config = collectConfig();
    previewFrame.contentWindow.postMessage({ type: 'preview', section: currentTab, config }, '*');
  } catch (e) { /* silencieux */ }
}

previewFrame.addEventListener('load', () => {
  previewReady = true;
  applyPreviewScale();
  if (previewPending) {
    previewPending = false;
    updatePreview();
  }
});

previewToggle.addEventListener('click', () => {
  const pane = $('previewPane');
  pane.classList.toggle('collapsed');
  previewToggle.textContent = pane.classList.contains('collapsed') ? 'Afficher' : 'Masquer';
  if (!pane.classList.contains('collapsed')) applyPreviewScale();
});

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'preview-resize') {
    previewNaturalH = e.data.height || previewNaturalH;
    applyPreviewScale();
  }
});

if (window.ResizeObserver && previewFrameWrap) {
  new ResizeObserver(applyPreviewScale).observe(previewFrameWrap);
}

let pvTimer = null;
$('adminForm').addEventListener('input', () => {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(updatePreview, 400);
});
$('adminForm').addEventListener('change', () => {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(updatePreview, 400);
});

// ---------- Navigation par onglets ----------
function switchTab(name) {
  document.querySelectorAll('.admin__nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.admin__tab').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === name);
  });
  const titles = {
    general: 'Général', hero: 'Hero', about: 'À propos', services: 'Services',
    experience: 'Expérience', work: 'Travaux', videos: 'Vidéos', stats: 'Stats',
    top: 'Top posts', packages: 'Forfaits', testimonials: 'Témoignages', files: 'Fichiers'
  };
  const kickers = {
    general: 'ÉDITION 01', hero: 'ÉDITION 02', about: 'ÉDITION 03', services: 'ÉDITION 04',
    experience: 'ÉDITION 05', work: 'ÉDITION 06', videos: 'ÉDITION 07', stats: 'ÉDITION 08',
    top: 'ÉDITION 09', packages: 'ÉDITION 10', testimonials: 'ÉDITION 11', files: 'ÉDITION 12'
  };
  $('tabTitle').textContent = titles[name] || name;
  const k = $('tabKicker');
  if (k) k.textContent = kickers[name] || '';
  currentTab = name;
  updatePreview();
}

// ---------- Boutons "Ajouter" ----------
function bindAddButtons() {
  $('addSocial').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Réseau</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Libellé (ex: IG)</label><input type="text" class="f-label" /></div>
        <div><label>Nom complet (accessibilité)</label><input type="text" class="f-aria" /></div>
        <div class="full"><label>URL</label><input type="url" class="f-url" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('socialsList').appendChild(item);
  });

  $('addHeroLine').addEventListener('click', () => addLineInput($('heroTitleLines')));
  $('addAboutLine').addEventListener('click', () => addLineInput($('aboutTitleLines')));
  $('addStatsLine').addEventListener('click', () => addLineInput($('statsTitleLines')));

  $('addHeroStat').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Stat</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Nombre (ex: 62K)</label><input type="text" class="f-num" /></div>
        <div><label>Libellé (ex: Abonnés)</label><input type="text" class="f-label" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('heroStatsList').appendChild(item);
  });

  $('addService').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Service</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Icône</label><input type="text" class="f-icon" value="★" /></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-red" /> Fond rouge</label></div>
        <div><label>Titre</label><input type="text" class="f-title" /></div>
        <div><label>Description</label><input type="text" class="f-desc" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('servicesList').appendChild(item);
  });

  $('addWork').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Travail</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Titre</label><input type="text" class="f-title" /></div>
        <div><label>Catégorie (ex: UGC)</label><input type="text" class="f-cat" /></div>
        <div class="full"><label>Description</label><textarea class="f-desc" rows="3"></textarea></div>
        <div class="full"><label>Tags (séparés par des virgules)</label><input type="text" class="f-tags" /></div>
        <div class="full"><label>Image</label><div class="media-picker-wrap"></div></div>
        <div><label>Texte alternatif</label><input type="text" class="f-alt" /></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-tall" /> Grande carte (2 rangées)</label></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-wide" /> Carte large (2 colonnes)</label></div>
      </div>`;
    item._picker = createMediaPicker(item.querySelector('.media-picker-wrap'));
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('workList').appendChild(item);
  });

  $('addVideo').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Vidéo</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div class="full"><label>Titre</label><input type="text" class="f-title" /></div>
        <div class="full"><label>Image de couverture</label><div class="media-picker-wrap"></div></div>
        <div class="full"><label>Fichier vidéo (mp4) — facultatif</label><div class="media-picker-video-wrap"></div></div>
      </div>`;
    item._picker = createMediaPicker(item.querySelector('.media-picker-wrap'));
    item._pickerVideo = createMediaPicker(item.querySelector('.media-picker-video-wrap'), '', 'video/*');
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('videosList').appendChild(item);
  });

  $('addStatsItem').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Statistique</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Nombre (ex: 62 000, 8,2%)</label><input type="text" class="f-num" /></div>
        <div><label>Libellé</label><input type="text" class="f-label" /></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('statsItemsList').appendChild(item);
  });

  $('addTop').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Publication</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Plateforme (ex: TIKTOK)</label><input type="text" class="f-platform" /></div>
        <div><label>Image</label><div class="media-picker-wrap"></div></div>
        <div><label>Vues</label><input type="text" class="f-views" /></div>
        <div><label>Likes</label><input type="text" class="f-likes" /></div>
        <div><label>Commentaires</label><input type="text" class="f-comments" /></div>
      </div>`;
    item._picker = createMediaPicker(item.querySelector('.media-picker-wrap'));
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('topList').appendChild(item);
  });

  $('addPackage').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Forfait</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div><label>Titre (ex: REELS)</label><input type="text" class="f-title" /></div>
        <div class="full list-item__rows"><label>Tarifs — une ligne par élément : libellé | prix</label><textarea class="f-rows" rows="4" placeholder="1x Reel IG | 100$"></textarea></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('packagesList').appendChild(item);
  });

  $('addTesti').addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item__head"><strong>Témoignage</strong><button type="button" class="list-item__remove">✕</button></div>
      <div class="list-item__grid">
        <div class="full"><label>Citation</label><textarea class="f-quote" rows="3"></textarea></div>
        <div><label>Auteur</label><input type="text" class="f-author" /></div>
        <div><label>Marque</label><input type="text" class="f-brand" /></div>
        <div class="list-item__check"><label><input type="checkbox" class="f-red" /> Fond rouge</label></div>
      </div>`;
    item.querySelector('.list-item__remove').addEventListener('click', () => item.remove());
    $('testiList').appendChild(item);
  });

  $('addFile').addEventListener('click', addFileItem);
}

// ---------- Mode Supabase (édition en ligne) ----------
async function initSupabaseMode() {
  const loginScreen = $('loginScreen');
  const logoutBtn = $('logoutBtn');

  async function loadFromSupabase() {
    try {
      const res = await window.Supabase.loadConfig();
      let data = res && res.data;
      if (!data) {
        // Première connexion : initialise la table depuis data.json déployé
        const r = await fetch('data.json', { cache: 'no-store' });
        const seed = r.ok ? await r.json() : null;
        if (seed) {
          try {
            await window.Supabase.saveConfig(seed);
            toast('✓ Première connexion : contenu initialisé dans Supabase');
          } catch (e2) {
            toast('Initialisation : ' + e2.message, true);
          }
          data = seed;
        }
      }
      if (!data) {
        toast('Aucune donnée trouvée dans Supabase — créez le projet puis poussez le contenu.', true);
        return false;
      }
      config = data;
      $('statusDot').classList.add('online');
      fillAll();
      // Sections vides dans Supabase → remplies automatiquement depuis data.json déployé
      let restoredSections = [];
      try {
        const r = await fetch('data.json', { cache: 'no-store' });
        if (r.ok) {
          const ref = await r.json();
          Object.keys(ref).forEach(k => {
            const cur = data[k];
            const empty = cur === undefined || cur === null || (Array.isArray(cur) && cur.length === 0);
            if (empty && TAB_FILLERS[k]) {
              const saved = config;
              config = ref;
              TAB_FILLERS[k]();
              config = saved;
              restoredSections.push(SECTION_LABELS[k] || k);
            }
          });
        }
      } catch (e2) { /* silencieux */ }
      updatePreview();
      if (restoredSections.length) {
        toast('↺ Sections restaurées depuis data.json : ' + restoredSections.join(', ') + ' — cliquez 💾 Sauvegarder puis Confirmer');
      } else {
        toast('✓ Contenu chargé depuis Supabase');
      }
      return true;
    } catch (e) {
      $('statusDot').classList.add('offline');
      toast('Erreur de chargement Supabase : ' + e.message, true);
      return false;
    }
  }

  function showLogin() {
    loginScreen.hidden = false;
  }

  $('loginBtn').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    const pass = $('loginPassword').value;
    const msg = $('loginMsg');
    msg.textContent = '';
    msg.classList.remove('ok');
    if (!email || !pass) {
      msg.textContent = 'Renseignez votre e-mail et votre mot de passe.';
      return;
    }
    try {
      await window.Supabase.login(email, pass);
      loginScreen.hidden = true;
      logoutBtn.hidden = false;
      await loadFromSupabase();
    } catch (e) {
      msg.textContent = 'Connexion impossible : ' + (e.message || '').slice(0, 100);
    }
  });

  $('signupBtn').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    const pass = $('loginPassword').value;
    const msg = $('loginMsg');
    msg.textContent = '';
    msg.classList.remove('ok');
    if (!email || !pass) {
      msg.textContent = 'Renseignez votre e-mail et votre mot de passe.';
      return;
    }
    try {
      await window.Supabase.signup(email, pass);
      msg.textContent = 'Compte créé ! Confirmez votre e-mail puis connectez-vous (ou désactivez la confirmation e-mail dans Supabase).';
      msg.classList.add('ok');
    } catch (e) {
      msg.textContent = 'Échec : ' + (e.message || '').slice(0, 100);
    }
  });

  logoutBtn.addEventListener('click', () => {
    window.Supabase.logout();
    logoutBtn.hidden = true;
    showLogin();
    toast('Déconnecté');
  });

  const refreshed = await window.Supabase.tryRefresh();
  if (refreshed) {
    loginScreen.hidden = true;
    logoutBtn.hidden = false;
    await loadFromSupabase();
  } else {
    showLogin();
  }
}

// ---------- Mode serveur local (data.json) ----------
async function initServerMode() {
  try {
    config = await apiGetData();
    $('statusDot').classList.add('online');
    fillAll();
    updatePreview();
    toast('✓ Contenu chargé depuis data.json');
  } catch (e) {
    $('statusDot').classList.add('offline');
    if (e.message === 'STATIC') {
      $('saveBtn').disabled = true;
      $('saveBtn').style.opacity = '.4';
      $('saveBtn').style.cursor = 'not-allowed';
      toast('Déploiement statique : l\'édition en ligne n\'est pas disponible ici. Lancez l\'admin en local (node server.js), sauvegardez, puis poussez avec git.', true);
    } else {
      toast('Serveur inaccessible. Lancez : node server.js', true);
    }
  }
}

// ---------- Initialisation ----------
async function init() {
  $('saveBtn').addEventListener('click', openSaveConfirm);
  $('restoreBtn').addEventListener('click', restoreAll);

  const confirmModal = $('confirmModal');
  $('confirmCancel').addEventListener('click', closeSaveConfirm);
  $('confirmSave').addEventListener('click', async () => {
    const d = pendingSaveData;
    closeSaveConfirm();
    if (d) await doSave(d);
  });
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeSaveConfirm();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !confirmModal.hidden) closeSaveConfirm();
  });

  document.querySelectorAll('.admin__nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  bindAddButtons();

  // Boutons "Restaurer" au-dessus de chaque formulaire
  document.querySelectorAll('.admin__tab').forEach(panel => {
    const name = panel.dataset.panel;
    const wrap = document.createElement('div');
    wrap.className = 'admin__tab-actions';
    const btn1 = document.createElement('button');
    btn1.type = 'button';
    btn1.className = 'admin__btn admin__btn--ghost admin__btn--restore';
    btn1.textContent = '↺ Restaurer cette section';
    btn1.addEventListener('click', () => restoreTab(name));
    const btn2 = document.createElement('button');
    btn2.type = 'button';
    btn2.className = 'admin__btn admin__btn--ghost admin__btn--restore';
    btn2.textContent = '↺ Depuis data.json';
    btn2.title = 'Remplir cette section avec le contenu de data.json (version déployée)';
    btn2.addEventListener('click', () => restoreTabFromDataJson(name));
    wrap.appendChild(btn1);
    wrap.appendChild(btn2);
    const h2 = panel.querySelector('h2');
    if (h2) h2.after(wrap);
  });

  if (window.Supabase && window.Supabase.isConfigured()) {
    await initSupabaseMode();
  } else {
    await initServerMode();
  }
}

init();