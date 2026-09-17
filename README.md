# Portfolio — Grace Ouphouet · Créatrice de Contenu

## Guide d'installation & personnalisation

---

### 📁 Structure des fichiers

```
portfolio/
├── index.html        → Page principale du portfolio (contenu rendu depuis data.json)
├── style.css         → Tous les styles (responsive)
├── script.js         → Interactions & animations
├── render.js         → Charge data.json et construit le contenu des sections
├── data.json         → TOUT le contenu du site (texte, images, vidéos, tarifs…)
├── admin.html        → Page d'administration (changer/ajouter le contenu)
├── admin.css         → Styles du panneau d'administration
├── admin.js          → Logique du panneau (formulaires, uploads, sauvegarde)
├── server.js         → Mini serveur Node (zéro dépendance) : site + API data + uploads
├── uploads/          → Fichiers envoyés depuis l'admin (images, vidéos)
├── images/           → Dossier des images d'origine
└── README.md         → Ce fichier
```

---

### 🚀 Lancer le site + l'administration

Le projet inclut un mini serveur Node **sans aucune dépendance** :

```bash
node server.js
```

Puis ouvre :
- **Portfolio** : http://localhost:3000
- **Admin** : http://localhost:3000/admin.html

> 💡 Ouvert en double-clic (sans serveur), le site fonctionne quand même : il
> utilise les données par défaut intégrées dans `render.js`. Seules les
> modifications de l'admin nécessitent le serveur.

---

### 💾 Sauvegarde automatique (git)

À chaque clic sur **💾 Sauvegarder** dans l'admin, une sauvegarde git est déclenchée
automatiquement :

1. `data.json` + tout le dossier `uploads/` sont copiés dans `backups/<horodatage>/`
2. Le tout est **commité** dans le repo git (`backups/`, `data.json`, `uploads/`)
3. Seules les **5 dernières** sauvegardes sont conservées (`BACKUP_KEEP` pour changer)

Sauvegarde manuelle à tout moment :
```bash
npm run backup
```

> 💡 Chaque sauvegarde est donc **versionnée dans git** : tu peux restaurer
> n'importe quel état du contenu (et des médias) à tout moment, même après un
> crash de serveur ou un redéploiement.

---

### ☁️ Supabase — édition en ligne (sur Vercel par exemple)

Avec Supabase, l'admin fonctionne **directement sur le site déployé** :
plus besoin de serveur local ni de `git push` pour mettre à jour le contenu.

**Installation (une seule fois) :**

1. Crée un projet gratuit sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, colle et exécute ce script :

```sql
-- Table du contenu (une seule ligne : la config complète)
create table if not exists public.content (
  id text primary key,
  data jsonb,
  updated_at timestamptz default now()
);
alter table public.content enable row level security;

create policy "lecture publique" on public.content
  for select using (true);
create policy "ecriture authentifiee" on public.content
  for all to authenticated using (true) with check (true);

-- Bucket de stockage des médias
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 300000000, null)
on conflict (id) do nothing;

create policy "lecture publique" on storage.objects
  for select using (bucket_id = 'uploads');
create policy "ecriture authentifiee" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');
create policy "maj authentifiee" on storage.objects
  for update to authenticated using (bucket_id = 'uploads');
create policy "suppression authentifiee" on storage.objects
  for delete to authenticated using (bucket_id = 'uploads');
```

3. **Authentication → Users → Add user** : crée ton compte (e-mail + mot de passe)
4. **Authentication → Sign In / Up** : désactive "Allow new users to sign up"
5. **Settings → API** : copie **Project URL** et **anon public key**
6. Renseigne-les dans `supabase-config.js` :

```js
window.SUPABASE_CONFIG = {
  url: 'https://xxxxx.supabase.co',
  anonKey: 'eyJhbGciOi...'
};
```

7. **Pousse** sur GitHub (`git push`) → le portfolio et l'admin sont en ligne
8. Ouvre `https://ton-site.vercel.app/admin.html` → connecte-toi → édite → 💾 Sauvegarder

> 💡 La clé anon est publique par design : la sécurité est assurée par les
> politiques RLS (lecture publique, écriture réservée aux comptes connectés).

**Si Supabase n'est pas configuré** (`supabase-config.js` vide), tout fonctionne
comme avant : mode local `data.json` + serveur Node + sauvegarde git.

---

### 🛠️ Utiliser l'administration

Le panneau `admin.html` permet de modifier **tout le contenu** sans toucher au code :

- **Général** — titre SEO, meta description, e-mail, liens Instagram/TikTok, réseaux du footer
- **Hero** — sous-titre, lignes du titre, tags, photo, stats rapides
- **À propos** — texte, photo, étiquette, tags
- **Services** — ajouter/supprimer/modifier les cartes (fond rouge ou non)
- **Expérience** — texte, liste, photo
- **Travaux** — ajouter/supprimer des projets (photo, catégorie, description, tags, mise en page)
- **Vidéos** — vignettes + **upload de fichiers vidéo (mp4)** : la vidéo s'ouvre dans une fenêtre au clic
- **Stats** — nombres et libellés (animation au scroll)
- **Top posts** — images et métriques
- **Forfaits** — tarifs (une ligne par élément : `libellé | prix`)
- **Témoignages** — citations, auteurs, fond rouge

**Images & vidéos** : chaque média se choisit par upload local (copié dans `uploads/`)
ou en collant une URL.

**Sauvegarde permanente** : le bouton **💾 Sauvegarder** écrit les données dans
`data.json` sur le disque. Le portfolio relit `data.json` à chaque chargement.

---

### 🌍 Hébergement & sauvegarde des données

| Hébergeur | L'admin fonctionne en ligne ? | Comment faire |
|-----------|-------------------------------|---------------|
| **VPS / Railway / Render / Fly.io** (Node) | ✅ Oui — sauvegarde permanente | Déploie le dossier tel quel, `npm start` ou `node server.js` |
| **Vercel / Netlify** (fonctions) | ⚠️ Partiel — nécessite une petite adaptation (fonction serverless pour écrire data.json) | Le site lit `data.json` normalement |
| **GitHub Pages / hébergement statique** | ❌ Non — pas d'écriture sur le disque | Lance l'admin **en local** (`node server.js`), sauvegarde, puis **commit/push** le `data.json` modifié |

> 💡 En toutes circonstances : le site est un site statique qui lit `data.json`.
> Sur un hébergement statique, tant que `data.json` est versionné dans le repo,
> le contenu affiché est le dernier sauvegardé.

---

### 🖼️ Formats d'images recommandés

| Image | Ratio recommandé | Usage |
|-------|-----------------|-------|
| Hero | 3:4 (portrait) | Grand visuel hero |
| À propos | 4:5 (portrait) | Photo About |
| Expérience | 3:4 (portrait) | Section Experience |
| Travaux | 1:1 (carré), 2:3 (tall), 2:1 (wide) | Grille portfolio |
| Vignettes vidéo | 9:16 (vertical) | Vidéographie |
| Top posts | 1:1 (carré) | Meilleures publications |

---

### 🎨 Personnalisation du style

Dans `style.css`, en haut du fichier :

```css
:root {
  --red: #C8102E;        /* Couleur d'accent principale */
  --black: #0a0a0a;      /* Fond sombre */
  --off-white: #f5f4f0;  /* Fond clair */
}
```

---

### 📱 Responsive

- ✅ Desktop (1400px+)
- ✅ Laptop (900–1400px)
- ✅ Tablet (600–900px)
- ✅ Mobile (< 600px)

---

*Portfolio Grace Ouphouet · Palette : rouge #C8102E + noir + blanc cassé*