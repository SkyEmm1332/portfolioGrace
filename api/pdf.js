// ===========================
// API PDF — téléchargement direct du portfolio en PDF
// Fonction Vercel serverless (GET ou POST /api/pdf)
// Rendu EXACT : navigateur headless (Chromium) en mode impression
// Sortie : portfolio.graceouphouet.2026.pdf (16:9, une section par page)
// ===========================
let chromium = null;
let puppeteer = null;

async function loadModules() {
  if (chromium && puppeteer) return;
  const c = await import('@sparticuz/chromium');
  const p = await import('puppeteer-core');
  chromium = c.default || c;
  puppeteer = p.default || p;
}

module.exports = async function handler(req, res) {
  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }
  let browser;
  try {
    await loadModules();

    const host = req.headers.host || 'portfolio-grace.vercel.app';
    const target = 'https://' + host + '/print.html';

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.emulateMediaType('print');

    await page.goto(target, { waitUntil: 'networkidle0', timeout: 60000 });

    // Attend le contenu (Supabase) puis la construction des diapositives
    await page.waitForFunction(() => window.CONTENT !== undefined, { timeout: 20000 });
    await page.waitForFunction(
      () => document.querySelectorAll('#pvContent .pv-section').length > 0,
      { timeout: 20000 }
    );

    // Attend que toutes les images soient chargées
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
    });
    await new Promise(r => setTimeout(r, 800));

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="portfolio.graceouphouet.2026.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(pdf);
  } catch (e) {
    console.error('Erreur génération PDF :', e);
    res.status(500).json({ error: 'Génération du PDF impossible', detail: String(e.message || e).slice(0, 300) });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};