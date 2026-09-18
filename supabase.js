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
    return fetch(URL + path, opts).then(async (r) => {
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
  async function upload(name, base64Data, prefix = '') {
    const clean = String(name || '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = prefix + Date.now() + '_' + clean;
    const bin = atob(base64Data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const r = await fetch(URL + '/storage/v1/object/uploads/uploads/' + key, {
      method: 'POST',
      headers: {
        apikey: ANON,
        Authorization: 'Bearer ' + getToken(),
        'Content-Type': 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: bytes
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('Upload Supabase ' + r.status + ' : ' + t.slice(0, 120));
    }
    return URL + '/storage/v1/object/public/uploads/' + key;
  }

  function publicUrl(key) {
    return URL + '/storage/v1/object/public/uploads/' + String(key).replace(/^\/+/, '');
  }

  // Upload vers une clé FIXE (persistance + écrasement propre du fichier)
  async function uploadAs(key, base64Data) {
    const cleanKey = String(key || '').replace(/^\/+/, '');
    const bin = atob(base64Data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const r = await fetch(URL + '/storage/v1/object/uploads/uploads/' + cleanKey, {
      method: 'POST',
      headers: {
        apikey: ANON,
        Authorization: 'Bearer ' + getToken(),
        'Content-Type': 'application/octet-stream',
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
    deleteFile
  };
})();