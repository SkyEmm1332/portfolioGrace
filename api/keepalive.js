// ===========================
// KEEP-ALIVE — garde le projet Supabase éveillé
// Vercel Cron (plan Hobby : 1 exécution/jour maximum) appelle cette fonction
// chaque jour à 06:00 UTC. Elle exécute une vraie requête sur la table
// content : ce trafic base de données empêche la mise en pause automatique
// des projets gratuits (7 jours sans activité = projet en pause, DNS retiré).
// URL + clé anon : mêmes valeurs publiques que supabase-config.js
// ===========================
const SUPABASE_URL = 'https://vrehbipqeqhnotixqkyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWhiaXBxZXFobm90aXhxa3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzYzMjgsImV4cCI6MjEwNTI1MjMyOH0.CDnLqT0Wet82l-ihYVgBWfZUV503qLcjfoywNTj3sIs';

module.exports = async function handler(req, res) {
  const started = Date.now();
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/content?select=id&limit=1', {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    res.status(r.ok ? 200 : 502).json({
      ok: r.ok,
      supabase: r.status,
      ms: Date.now() - started,
      at: new Date().toISOString()
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message, at: new Date().toISOString() });
  }
};
