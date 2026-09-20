// ===========================
// SUPABASE — couche d'accès (API REST, zéro dépendance)
// Auth + données (table content) + Storage (bucket uploads)
// Utilisé par le portfolio (lecture) et l'admin (lecture/écriture).
// ===========================
window.Supabase = (() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const URL = (cfg.url || '').replace(/\/+$/, '');
  const ANON = cfg.anonKey || '';

  const TOKEN_KEY = 'supabase_access_token';
  const REFRESH_KEY = 'supabase_refresh_token';

  function isConfigured() {
    return !!(URL && ANON);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function api(path, opts = {}) {
    const options = { ...opts, cache: 'no-store' };
    return fetch(URL + path, options).then(async (r) => {
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        const err = new Error('Supabase ' + r.status + ' : ' + t.slice(0, 120));
        err.status = r.status;
        throw err;
      }
      const t = await r.text();
      if (!t) return null;
      try {
        return JSON.parse(t);
      } catch (e) {
        return null;
      }
    });
  }

  function authHeaders() {
    const h = { apikey: ANON, 'Content-Type': 'application/json' };
    const t = getToken();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  // ---------- AUTH ----------
  async function login(email, password) {
    const res = await api('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(REFRESH_KEY, res.refresh_token);
    return res.user;
  }

  async function signup(email, password) {
    return api('/auth/v1/signup', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });
  }

  async function tryRefresh() {
    const rt = localStorage.getItem(REFRESH_KEY);
    if (!rt) return false;
    try {
      const res = await api('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ refresh_token: rt })
      });
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(REFRESH_KEY, res.refresh_token);
      return true;
    } catch (e) {
      return false;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  function hasSession() {
    return !!getToken();
  }

  // ---------- DONNÉES (table content, ligne id='config') ----------
  async function loadConfig() {
    const res = await api('/rest/v1/content?select=data,updated_at&id=eq.config&limit=1', {
      headers: authHeaders()
    });
    if (!res || !res.length) return null;
    return { data: res[0].data, version: res[0].updated_at || '' };
  }

  async function saveConfig(data) {
    return api('/rest/v1/content?on_conflict=id', {
      method: 'POST',
      headers: { ...authHeaders(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: 'config', data, updated_at: new Date().toISOString() })
    });
  }

  // ---------- STORAGE (bucket public uploads) ----------
  function mimeFromName(name) {
    const ext = String(name || '').split('.').pop().toLowerCase();
    const map = {
      mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip: 'application/zip'
    };
    return map[ext] || 'application/octet-stream';
  }

  function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // Upload résumable TUS (fichiers > 50 Mo — limite de l'upload direct Supabase)
  function tusUpload(key, bytes) {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(new Blob([bytes]), {
        endpoint: URL + '/storage/v1/upload/resumable',
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 6 * 1024 * 1024,
        headers: {
          authorization: 'Bearer ' + getToken(),
          'x-upsert': 'true'
        },
        metadata: {
          bucketName: 'uploads',
          objectName: key,
          contentType: mimeFromName(key),
          cacheControl: '3600'
        },
        onError: (e) => reject(e),
        onSuccess: () => resolve(publicUrl(key))
      });
      upload.start();
    });
  }

  async function upload(name, base64Data, prefix = '') {
    const clean = String(name || '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = prefix + Date.now() + '_' + clean;
    const bytes = base64ToBytes(base64Data);
    // Fichiers volumineux : upload résumable TUS
    if (bytes.length > 50 * 1024 * 1024) {
      if (!window.tus) throw new Error('fichier trop volumineux pour l\'upload direct (max 50 Mo)');
      return tusUpload(key, bytes);
    }
    const r = await fetch(URL + '/storage/v1/object/uploads/uploads/' + key, {
      method: 'POST',
      headers: {
        apikey: ANON,
        Authorization: 'Bearer ' + getToken(),
        'Content-Type': mimeFromName(name),
        'x-upsert': 'true'
      },
      body: bytes
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('Upload Supabase ' + r.status + ' : ' + t.slice(0, 120));
    }
    return publicUrl(key);
  }

  function publicUrl(key) {
    return URL + '/storage/v1/object/public/uploads/' + String(key).replace(/^\/+/, '');
  }

  // Upload vers une clé FIXE (persistance + écrasement propre du fichier)
  async function uploadAs(key, base64Data) {
    const cleanKey = String(key || '').replace(/^\/+/, '');
    const bytes = base64ToBytes(base64Data);
    // Fichiers volumineux : upload résumable TUS
    if (bytes.length > 50 * 1024 * 1024) {
      if (!window.tus) throw new Error('fichier trop volumineux pour l\'upload direct (max 50 Mo)');
      return tusUpload(cleanKey, bytes);
    }
    const r = await fetch(URL + '/storage/v1/object/uploads/uploads/' + cleanKey, {
      method: 'POST',
      headers: {
        apikey: ANON,
        Authorization: 'Bearer ' + getToken(),
        'Content-Type': mimeFromName(cleanKey),
        'x-upsert': 'true'
      },
      body: bytes
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('Upload Supabase ' + r.status + ' : ' + t.slice(0, 120));
    }
    return publicUrl(cleanKey);
  }

  // Vérifie qu'un objet public existe réellement dans le stockage
  // (GET partiel : Supabase ne gère pas les HEAD sur les objets publics)
  async function checkExists(publicUrl) {
    try {
      const r = await fetch(publicUrl, { headers: { Range: 'bytes=0-0' } });
      return r.status === 200 || r.status === 206;
    } catch (e) {
      return false;
    }
  }

  async function deleteFile(publicUrl) {
    const prefix = URL + '/storage/v1/object/public/uploads/';
    if (typeof publicUrl !== 'string' || !publicUrl.startsWith(prefix)) return false;
    const key = publicUrl.slice(prefix.length);
    await api('/storage/v1/object/uploads/' + key, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return true;
  }

  return {
    isConfigured,
    login,
    signup,
    logout,
    tryRefresh,
    hasSession,
    loadConfig,
    saveConfig,
    upload,
    uploadAs,
    publicUrl,
    checkExists,
    deleteFile
  };
})();