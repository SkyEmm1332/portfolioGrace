# Portfolio — Arden Vale · Content Creator
## Guide d'installation & personnalisation

---

### 📁 Structure des fichiers

```
portfolio/
├── index.html        → Page principale du portfolio
├── style.css         → Tous les styles (responsive)
├── script.js         → Interactions & animations
├── images/           → Dossier des images (à remplacer)
│   ├── hero.jpg      → Photo principale (format portrait, ~3:4)
│   ├── about.jpg     → Section "About Me" (format portrait)
│   ├── experience.jpg → Section Experience (format portrait)
│   ├── work1.jpg     → Grille portfolio — image tall (portrait)
│   ├── work2.jpg     → Grille portfolio (carré)
│   ├── work3.jpg     → Grille portfolio (carré)
│   ├── work4.jpg     → Grille portfolio — wide (paysage)
│   ├── work5.jpg     → Grille portfolio (carré)
│   ├── vid1.jpg      → Vignette vidéo (format 9:16)
│   ├── vid2.jpg      → Vignette vidéo (format 9:16)
│   ├── vid3.jpg      → Vignette vidéo (format 9:16)
│   ├── vid4.jpg      → Vignette vidéo (format 9:16)
│   ├── top1.jpg      → Top post 1 (carré)
│   ├── top2.jpg      → Top post 2 (carré)
│   └── top3.jpg      → Top post 3 (carré)
└── README.md         → Ce fichier
```

---

### 🖼️ Remplacement des images

Remplace chaque fichier `images/XXXXX.jpg` par ta propre photo **en conservant le même nom de fichier**.

**Sources d'images gratuites recommandées :**
- [Unsplash](https://unsplash.com) — Photos HD libres de droits
- [Pexels](https://pexels.com) — Photos & vidéos gratuites
- [Pixabay](https://pixabay.com) — Images libres

**Formats recommandés :**
| Image | Ratio recommandé | Usage |
|-------|-----------------|-------|
| hero.jpg | 3:4 (portrait) | Grand visuel hero |
| about.jpg | 4:5 (portrait) | Photo About Me |
| experience.jpg | 3:4 (portrait) | Section Experience |
| work1.jpg | 2:3 (portrait) | Portfolio grille tall |
| work2-3, work5 | 1:1 (carré) | Portfolio grille |
| work4.jpg | 2:1 (paysage) | Portfolio grille wide |
| vid1–4.jpg | 9:16 (vertical) | Vignettes vidéo |
| top1–3.jpg | 1:1 (carré) | Top posts |

---

### 🎨 Personnalisation rapide

Dans `style.css`, en haut du fichier, modifie les variables CSS :

```css
:root {
  --red: #C8102E;        /* Couleur d'accent principale */
  --black: #0a0a0a;      /* Fond sombre */
  --off-white: #f5f4f0;  /* Fond clair */
}
```

**Changer la couleur d'accent** (ex. passer en bleu marine) :
```css
--red: #1a3a5c;
```

---

### ✏️ Modifier le contenu

Ouvre `index.html` et cherche/remplace :
- `Arden Vale` → ton nom
- `@ardenvale` → ton handle Instagram/TikTok
- `hello@ardenvale.com` → ton email
- Les prix dans la section **Packages**
- Les stats dans la section **Social Media Stats**

---

### 🚀 Mise en ligne

Le portfolio est un site statique — aucun serveur requis.

Options d'hébergement gratuit :
- **Netlify** — Glisse le dossier sur [netlify.com/drop](https://netlify.com/drop)
- **GitHub Pages** — Push sur GitHub, active Pages dans Settings
- **Vercel** — `vercel deploy` via CLI

---

### 📱 Responsive

Le portfolio est entièrement responsive :
- ✅ Desktop (1400px+)
- ✅ Laptop (900–1400px)
- ✅ Tablet (600–900px)
- ✅ Mobile (< 600px)

---

*Portfolio template by Claude · Palette : rouge #C8102E + noir + blanc cassé*
