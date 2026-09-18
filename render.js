// ===========================
// RENDER — charge data.json et construit le contenu
// Repli automatique sur DEFAULT_DATA si data.json est inaccessible
// (ex : ouverture du fichier en double-clic, sans serveur)
//
// window.Renderers expose le rendu PAR SECTION, réutilisé par
// preview.html (aperçu en direct dans l'admin).
// ===========================

const DEFAULT_DATA = {
  "meta": {
    "title": "Portfolio — Grace Ouphouet | Créatrice de Contenu",
    "description": "Portfolio de Grace Ouphouet — créatrice de contenu, modèle photo, monteuse vidéo et infographe. Découvrez mes services UGC, Reels, carousels et partenariats de marque."
  },
  "hero": {
    "sub": "créatrice de contenu",
    "titleLines": ["PORT", "FOLIO"],
    "tags": ["CRÉATRICE DE CONTENU", "MODÈLE PHOTO", "ANIMATRICE", "MONTEUSE VIDEO", "INFOGRAPHE"],
    "image": "images/hero.jpeg",
    "imageAlt": "Grace Ouphouet – Créatrice de Contenu",
    "stats": [
      { "num": "62K", "label": "Abonnés" },
      { "num": "4.3K", "label": "Likes Moy." },
      { "num": "8%", "label": "Taux Eng." }
    ]
  },
  "about": {
    "eyebrow": "créatrice de contenu",
    "titleLines": ["À PROPOS", "DE MOI."],
    "image": "images/about.jpg",
    "imageAlt": "Portrait de Grace Ouphouet",
    "imageLabel": "faisons en sorte que\nvotre marque soit vue\n— mais surtout mémorisée",
    "body": [
      "Bonjour ! Je suis Grace Ouphouet, créatrice de contenu qui allie narration et visuels créatifs percutants.",
      "Je crée du contenu esthétique qui connecte — à travers la vidéo, la photographie et une direction artistique audacieuse.",
      "J'ai collaboré avec des marques dans les domaines du lifestyle, de la mode, de la tech et du bien-être, en les aidant à transformer leur identité en contenu visuel qui résonne."
    ],
    "tags": ["Lifestyle", "Mode", "Tech", "Bien-être", "Beauté"]
  },
  "services": [
    { "icon": "★", "title": "PHOTOS UGC", "desc": "Images lifestyle ou produit stylisées en haute résolution pour les réseaux sociaux et les publicités.", "red": false },
    { "icon": "★", "title": "VIDÉOS FORMAT COURT", "desc": "Voix off, unboxings, tutoriels, tendances — parfaits pour Reels et TikTok.", "red": true },
    { "icon": "★", "title": "AVIS PRODUITS", "desc": "Avis authentiques en caméra mettant en valeur les bénéfices de vos produits.", "red": false },
    { "icon": "★", "title": "CAROUSELS & REELS", "desc": "Publications carousel narratives et Reels esthétiques avec légendes et musique.", "red": true },
    { "icon": "★", "title": "PARTENARIATS DE MARQUE", "desc": "Collaborations à long terme pour du contenu sponsorisé et des rôles d'ambassadrice.", "red": false },
    { "icon": "★", "title": "DIRECTION ARTISTIQUE", "desc": "Moodboards, stylisme et direction de plateau pour les shootings de marque.", "red": true }
  ],
  "experience": {
    "eyebrow": "travaux",
    "title": "EXPÉRIENCE",
    "image": "images/experience.jpg",
    "imageAlt": "Création de contenu",
    "paragraphs": [
      "Au cours de ces dernières années, j'ai collaboré avec des marques dans les domaines du lifestyle, de la mode, de la tech et du bien-être — en les aidant à transformer leur voix en contenu visuel qui résonne.",
      "Des vidéos UGC aux carousels curatés, je me concentre sur ce qui compte le plus : la clarté, l'émotion et la précision esthétique."
    ],
    "listTitle": "CONTENU QUE J'AI CRÉÉ :",
    "list": [
      "Publicités vidéo UGC pour Instagram & TikTok",
      "Reels narratifs avec voix off",
      "Mises en valeur de produits en lumière naturelle",
      "Tutoriels format court",
      "Contenu photo lifestyle pour des lancements de produits",
      "Publications carousel à valeur éducative"
    ]
  },
  "work": [
    { "title": "Campagne de Lancement Produit", "cat": "LIFESTYLE", "desc": "Création d'une campagne visuelle complète pour le lancement d'une nouvelle gamme de produits lifestyle. Direction artistique, shooting photo et production de contenus pour les réseaux sociaux.", "tags": ["Photo", "Direction Artistique", "Réseaux Sociaux"], "image": "images/work1.jpg", "alt": "Campagne de lancement produit", "tall": true },
    { "title": "Unboxing Soin de la Peau", "cat": "UGC", "desc": "Vidéo UGC d'unboxing pour une marque de soin de la peau. Contenu authentique mettant en avant la texture, l'emballage et les bénéfices du produit.", "tags": ["Vidéo", "UGC", "Unboxing"], "image": "images/work2.jpg", "alt": "Unboxing soin de la peau", "tall": false },
    { "title": "Série Reels OOTD", "cat": "MODE", "desc": "Série de Reels Instagram mettant en valeur des tenues du jour. Montage dynamique avec transitions tendances et musique trendy.", "tags": ["Vidéo", "Mode", "Reels"], "image": "images/work3.jpg", "alt": "Série Reels OOTD", "tall": false },
    { "title": "Narration de Marque", "cat": "VIDÉOGRAPHIE", "desc": "Court-métrage de narration de marque alliant images cinématographiques et voix off immersive. Création d'un univers visuel fort pour renforcer l'identité de la marque.", "tags": ["Vidéographie", "Narration", "Cinématographie"], "image": "images/work4.jpg", "alt": "Narration de marque", "tall": false, "wide": true },
    { "title": "Routine Matinale", "cat": "BIEN-ÊTRE", "desc": "Série de contenus lifestyle mettant en scène une routine matinale apaisante. Photos et vidéos en lumière naturelle pour inspirer calme et bien-être.", "tags": ["Photo", "Lifestyle", "Bien-être"], "image": "images/work5.jpg", "alt": "Routine matinale lifestyle", "tall": false }
  ],
  "videos": [
    { "title": "Avis de Marque — Soin de la Peau", "thumb": "images/vid1.jpg", "video": "" },
    { "title": "Tutoriel — Look Naturel", "thumb": "images/vid2.jpg", "video": "" },
    { "title": "Lifestyle — Routine Matinale", "thumb": "images/vid3.jpg", "video": "" },
    { "title": "Unboxing — Haul Mode", "thumb": "images/vid4.jpg", "video": "" }
  ],
  "stats": {
    "titleLines": ["STATS", "RÉSEAUX", "SOCIAUX"],
    "items": [
      { "num": "62 000", "label": "Vues Totales" },
      { "num": "4 320", "label": "Likes en Moyenne" },
      { "num": "8,2%", "label": "Taux d'Engagement" },
      { "num": "12K", "label": "Abonnés Instagram" },
      { "num": "50K", "label": "Abonnés TikTok" },
      { "num": "300+", "label": "Marques Partenaires" }
    ]
  },
  "topPosts": [
    { "platform": "REEL INSTAGRAM", "image": "images/top1.jpg", "views": "62 000", "likes": "4 320", "comments": "312" },
    { "platform": "TIKTOK", "image": "images/top2.jpg", "views": "118K", "likes": "9 800", "comments": "540" },
    { "platform": "CAROUSEL IG", "image": "images/top3.jpg", "views": "28 000", "likes": "2 100", "comments": "189" }
  ],
  "packages": [
    { "title": "POST IG", "rows": [["1x Post IG", "100$"], ["1x Post Carousel IG", "150$"], ["3x Posts IG", "250$"]] },
    { "title": "STORIES IG", "rows": [["1x Story IG", "180$"], ["3x Posts Carousel IG", "190$"], ["1x Post + 3 Stories", "250$"]] },
    { "title": "REELS", "rows": [["1x Reel IG", "100$"], ["3x Reels", "150$"], ["3x Reels IG + 3 Stories", "250$"]] },
    { "title": "UGC", "rows": [["1x Photo", "120$"], ["1x Vidéo 30 sec", "120$"], ["3x Vidéos 60 sec", "150$"]] }
  ],
  "testimonials": [
    { "quote": "« Le contenu de Grace a dépassé toutes nos attentes. Les visuels étaient époustouflants et notre engagement a triplé. »", "author": "Glow Studio", "brand": "Marque de Soin de la Peau", "red": false },
    { "quote": "« Professionnelle, créative et incroyablement agréable à travailler. Nous collaborerons certainement à nouveau. »", "author": "NOVA Fashion", "brand": "Marque de Vêtements", "red": true },
    { "quote": "« Ses vidéos UGC étaient authentiques et parfaitement en accord avec notre image. Idéales pour notre campagne de lancement. »", "author": "Vivo Tech", "brand": "Startup Technologique", "red": false }
  ],
  "contact": {
    "email": "hello@graceouphouet.com",
    "instagram": "https://instagram.com/graceouphouet",
    "instagramLabel": "@graceouphouet",
    "tiktok": "https://tiktok.com/@graceouphouet",
    "tiktokLabel": "@graceouphouet"
  },
  "socials": [
    { "label": "IG", "aria": "Instagram", "url": "https://instagram.com/graceouphouet" },
    { "label": "TK", "aria": "TikTok", "url": "https://tiktok.com/@graceouphouet" },
    { "label": "YT", "aria": "YouTube", "url": "https://youtube.com/@graceouphouet" },
    { "label": "PT", "aria": "Pinterest", "url": "https://pinterest.com/graceouphouet" }
  ]
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===========================
// RENDU PAR SECTION (réutilisé par index.html ET preview.html)
// ===========================
window.Renderers = {

  meta(d) {
    if (!d.meta) return;
    if (d.meta.title) document.title = d.meta.title;
    const md = document.getElementById('metaDesc');
    if (md) md.setAttribute('content', d.meta.description || '');
    const mt = document.getElementById('pvMetaTitle');
    if (mt) mt.textContent = d.meta.title || '';
    const mdesc = document.getElementById('pvMetaDesc');
    if (mdesc) mdesc.textContent = d.meta.description || '';
  },

  hero(d) {
    const h = d.hero;
    if (!h) return;
    const heroText = document.getElementById('heroText');
    if (heroText) {
      const sub = heroText.querySelector('.hero__sub');
      if (sub) sub.textContent = h.sub || '';
      const title = heroText.querySelector('.hero__title');
      if (title) title.innerHTML = (h.titleLines || ['PORT', 'FOLIO']).map(l => esc(l)).join('<br/>');
      const meta = heroText.querySelector('.hero__meta');
      if (meta) meta.innerHTML = (h.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    }
    const img = document.getElementById('heroImg');
    if (img) { img.src = h.image || ''; img.alt = h.imageAlt || ''; }
    const stats = document.getElementById('heroStats');
    if (stats) {
      stats.innerHTML = (h.stats || []).map(s =>
        `<div class="stat"><span class="stat__num">${esc(s.num)}</span><span class="stat__label">${esc(s.label)}</span></div>`
      ).join('');
    }
  },

  about(d) {
    const a = d.about;
    if (!a) return;
    const img = document.getElementById('aboutImg');
    if (img) { img.src = a.image || ''; img.alt = a.imageAlt || ''; }
    const label = document.getElementById('aboutLabel');
    if (label) label.innerHTML = esc(a.imageLabel || '').replace(/\n/g, '<br/>');
    const eyebrow = document.getElementById('aboutEyebrow');
    if (eyebrow) eyebrow.textContent = a.eyebrow || '';
    const title = document.getElementById('aboutTitle');
    if (title) title.innerHTML = (a.titleLines || []).map(l => esc(l)).join('<br/>');
    const body = document.getElementById('aboutBody');
    if (body) body.innerHTML = (a.body || []).map(p => `<p class="about__body">${esc(p)}</p>`).join('');
    const tags = document.getElementById('aboutTags');
    if (tags) tags.innerHTML = (a.tags || []).map(t => `<span class="pill">${esc(t)}</span>`).join('');
  },

  services(d) {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    grid.innerHTML = (d.services || []).map(s =>
      `<div class="service-card${s.red ? ' service-card--red' : ''}">
        <span class="service-card__icon">${esc(s.icon || '★')}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
      </div>`
    ).join('');
  },

  experience(d) {
    const e = d.experience;
    if (!e) return;
    const img = document.getElementById('expImg');
    if (img) { img.src = e.image || ''; img.alt = e.imageAlt || ''; }
    const eyebrow = document.getElementById('expEyebrow');
    if (eyebrow) eyebrow.textContent = e.eyebrow || '';
    const title = document.getElementById('expTitle');
    if (title) title.textContent = e.title || '';
    const paras = document.getElementById('expParagraphs');
    if (paras) paras.innerHTML = (e.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join('');
    const listTitle = document.getElementById('expListTitle');
    if (listTitle) listTitle.textContent = e.listTitle || '';
    const list = document.getElementById('expList');
    if (list) list.innerHTML = (e.list || []).map(i => `<li>${esc(i)}</li>`).join('');
  },

  work(d) {
    const grid = document.getElementById('workGrid');
    if (!grid) return;
    grid.innerHTML = (d.work || []).map(w =>
      `<div class="work-item${w.tall ? ' work-item--tall' : ''}${w.wide ? ' work-item--wide' : ''}"
        data-title="${esc(w.title)}" data-cat="${esc(w.cat)}" data-desc="${esc(w.desc)}" data-tags="${esc((w.tags || []).join(','))}">
        <img src="${esc(w.image)}" alt="${esc(w.alt || w.title)}" loading="lazy" />
        <div class="work-item__overlay">
          <span class="work-item__cat">${esc(w.cat)}</span>
          <p class="work-item__title">${esc(w.title)}</p>
        </div>
      </div>`
    ).join('');
  },

  videos(d) {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    grid.innerHTML = (d.videos || []).map(v =>
      `<div class="video-thumb" data-video="${esc(v.video || '')}">
        <img src="${esc(v.thumb)}" alt="${esc(v.title)}" loading="lazy" />
        <div class="video-thumb__play">▶</div>
        <p>${esc(v.title)}</p>
      </div>`
    ).join('');
  },

  stats(d) {
    const s = d.stats;
    if (!s) return;
    const title = document.getElementById('statsTitle');
    if (title) title.innerHTML = (s.titleLines || []).map(l => esc(l)).join('<br/>');
    const grid = document.getElementById('statsGrid');
    if (grid) {
      grid.innerHTML = (s.items || []).map(x =>
        `<div class="big-stat"><span class="big-stat__num">${esc(x.num)}</span><span class="big-stat__label">${esc(x.label)}</span></div>`
      ).join('');
    }
  },

  top(d) {
    const grid = document.getElementById('topPerfGrid');
    if (!grid) return;
    grid.innerHTML = (d.topPosts || []).map(p =>
      `<div class="perf-card">
        <img src="${esc(p.image)}" alt="${esc(p.platform)}" loading="lazy" />
        <div class="perf-card__info">
          <span class="perf-card__platform">${esc(p.platform)}</span>
          <div class="perf-card__metrics">
            <span>👁 ${esc(p.views)} vues</span>
            <span>❤️ ${esc(p.likes)} likes</span>
            <span>💬 ${esc(p.comments)} commentaires</span>
          </div>
        </div>
      </div>`
    ).join('');
  },

  packages(d) {
    const grid = document.getElementById('packagesGrid');
    if (!grid) return;
    grid.innerHTML = (d.packages || []).map(p =>
      `<div class="pkg-col">
        <h3 class="pkg-col__title">${esc(p.title)}</h3>
        ${(p.rows || []).map(r => `<div class="pkg-row"><span>${esc(r[0])}</span><span class="price">${esc(r[1])}</span></div>`).join('')}
      </div>`
    ).join('');
  },

  testimonials(d) {
    const grid = document.getElementById('testiGrid');
    if (!grid) return;
    grid.innerHTML = (d.testimonials || []).map(t =>
      `<div class="testi-card${t.red ? ' testi-card--red' : ''}">
        <p class="testi-card__quote">${esc(t.quote)}</p>
        <div class="testi-card__author">
          <div class="testi-card__avatar">${esc((t.author || '?')[0])}</div>
          <div>
            <strong>${esc(t.author)}</strong>
            <span>${esc(t.brand)}</span>
          </div>
        </div>
      </div>`
    ).join('');
  },

  contact(d) {
    const links = document.getElementById('contactLinks');
    if (!links) return;
    const c = d.contact;
    if (!c) return;
    links.innerHTML =
      `<a href="mailto:${esc(c.email)}" class="contact__link">✉ ${esc(c.email)}</a>
       <a href="${esc(c.instagram)}" target="_blank" rel="noopener" class="contact__link">📸 ${esc(c.instagramLabel)}</a>
       <a href="${esc(c.tiktok)}" target="_blank" rel="noopener" class="contact__link">🎵 ${esc(c.tiktokLabel)}</a>`;
  },

  footer(d) {
    const social = document.getElementById('footerSocial');
    if (social) {
      social.innerHTML = (d.socials || []).map(s =>
        `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.aria)}">${esc(s.label)}</a>`
      ).join('');
    }
    const fy = document.getElementById('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();
  },

  general(d) {
    this.meta(d);
    this.contact(d);
    this.footer(d);
  },

  fichiers(d) {
    const f = d.fichiers;
    if (!f) return;
    // CV : branche les boutons « CV » du site sur le fichier en ligne s'il existe
    if (f.cv) {
      document.querySelectorAll('.cv-download').forEach(a => {
        a.href = f.cv;
      });
    }
    // Autres fichiers : affichés dans le pied de page
    const el = document.getElementById('footerFiles');
    if (el) {
      el.innerHTML = (f.others || []).map(x =>
        `<a href="${esc(x.url)}" target="_blank" rel="noopener" class="footer__admin">${esc(x.label)}</a>`
      ).join(' · ');
    }
  }
};

// ===========================
// RENDU COMPLET (page du portfolio)
// ===========================
function renderAll(data) {
  const R = window.Renderers;
  R.meta(data);
  R.hero(data);
  R.about(data);
  R.services(data);
  R.experience(data);
  R.work(data);
  R.videos(data);
  R.stats(data);
  R.top(data);
  R.packages(data);
  R.testimonials(data);
  R.contact(data);
  R.footer(data);
  R.fichiers(data);
}

async function loadContent() {
  // 1. Supabase si configuré (édition en ligne)
  if (window.Supabase && window.Supabase.isConfigured()) {
    try {
      const res = await window.Supabase.loadConfig();
      if (res && res.data) {
        window.CONTENT_VERSION = res.version || '';
        return res.data;
      }
    } catch (e) { /* repli sur data.json */ }
  }
  // 2. data.json (serveur local ou hébergement statique)
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) { /* fichier ouvert directement — on utilise les valeurs par défaut */ }
  // 3. Valeurs par défaut intégrées
  return DEFAULT_DATA;
}

loadContent().then(data => {
  window.CONTENT = data;
  renderAll(data);
  document.dispatchEvent(new CustomEvent('content-ready'));
});