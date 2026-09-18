// ===========================
// API PDF — génère le portfolio en PDF (rendu exact du navigateur)
// Fonction Vercel serverless : POST/GET /api/pdf
// Téléchargement direct : portfolio.graceouphouet.2026.pdf
// ===========================
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async function handler(req, res) {
  try {
    const host = req.headers.host || 'portfolio-grace.vercel.app';
    const target = 'https://' + host + '/print.html';

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.emulateMediaType('print');
    await page.goto(target, { waitUntil: 'networkidle0', timeout: 60000 });
    // Attend que toutes les images soient chargées (contenu Supabase inclus)
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
    });
    await new Promise(r => setTimeout(r, 600));

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="portfolio.graceouphouet.2026.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(pdf);
  } catch (e) {
    console.error('Erreur génération PDF :', e);
    res.status(500).json({ error: 'Génération du PDF impossible' });
  }
};