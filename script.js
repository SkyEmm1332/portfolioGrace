// ===========================
// SCRIPT — interactions (lancé après le rendu du contenu)
// ===========================
document.addEventListener('content-ready', function init() {

  // ===========================
  // NAV — scroll effect + mobile
  // ===========================
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  function closeMobile() {
    mobileMenu.classList.remove('open');
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeMobile();
  });

  // ===========================
  // SCROLL REVEAL
  // ===========================
  const revealEls = document.querySelectorAll(
    '.section__title, .about__body, .service-card, .work-item, .perf-card, ' +
    '.pkg-col, .testi-card, .form-group, .hero__text > *, .big-stat, ' +
    '.video-thumb, .content-list, .contact__left > *, .experience__content > *, ' +
    '.hero__stats .stat'
  );

  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    const delay = i % 4;
    if (delay) el.classList.add(`reveal-delay-${delay}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  // ===========================
  // CONTACT FORM (demo)
  // ===========================
  const contactForm = document.querySelector('.contact__form');
  const submitBtn = document.querySelector('.contact__form .btn');
  if (submitBtn && contactForm) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const inputs = contactForm.querySelectorAll('input[required], textarea[required], select[required]');
      let allValid = true;

      inputs.forEach(input => {
        if (!input.value.trim()) {
          allValid = false;
          input.style.borderColor = 'var(--red)';
          input.addEventListener('input', () => {
            input.style.borderColor = input.value.trim() ? '#2a9d5c' : '';
          }, { once: true });
        }
      });

      if (allValid) {
        submitBtn.textContent = '✓ Message Envoyé !';
        submitBtn.style.background = '#2a9d5c';
        submitBtn.style.borderColor = '#2a9d5c';
        setTimeout(() => {
          submitBtn.textContent = 'Envoyer le Message ★';
          submitBtn.style.background = '';
          submitBtn.style.borderColor = '';
          inputs.forEach(i => i.value = '');
        }, 3000);
      } else {
        submitBtn.textContent = 'Veuillez remplir les champs obligatoires ↑';
        setTimeout(() => { submitBtn.textContent = 'Envoyer le Message ★'; }, 2000);
      }
    });
  }

  // ===========================
  // SMOOTH SCROLL for nav links
  // ===========================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===========================
  // HERO: trigger reveals on load
  // ===========================
  function revealHero() {
    document.querySelectorAll('.hero .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120 + 200);
    });
  }
  if (document.readyState === 'complete') {
    revealHero();
  } else {
    window.addEventListener('load', revealHero);
  }

  // ===========================
  // WORK EXPANDED — dépliage fluide
  // ===========================
  const workSection = document.querySelector('.work');
  const workExpanded = document.getElementById('workExpanded');
  const workExpandedInfo = workExpanded.querySelector('.work-expanded__info');
  const workItems = document.querySelectorAll('.work-item');
  const workRemaining = document.getElementById('workRemaining');
  const workClose = document.getElementById('workClose');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const detailImg = document.getElementById('detailImg');
  const detailCat = document.getElementById('detailCat');
  const detailTitle = document.getElementById('detailTitle');
  const detailDesc = document.getElementById('detailDesc');
  const detailTags = document.getElementById('detailTags');

  let currentIndex = -1;
  let isAnimating = false;
  const WORK_ANIM_MS = 560;
  const items = Array.from(workItems);

  workExpanded.inert = true;

  const softRise = [
    { opacity: .35, transform: 'translateY(12px)' },
    { opacity: 1, transform: 'none' }
  ];
  const softOpts = { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' };

  let fadeToken = 0;
  function crossfadeImage(src, alt) {
    const token = ++fadeToken;
    const parent = detailImg.parentElement;
    const old = parent.querySelector('.work-expanded__fade');
    if (old) old.remove();

    const overlay = document.createElement('img');
    overlay.className = 'work-expanded__fade';
    overlay.alt = '';
    overlay.src = src;
    parent.appendChild(overlay);

    const reveal = () => {
      if (token !== fadeToken) return;
      overlay.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' }
      ).onfinish = () => {
        if (token !== fadeToken) return;
        detailImg.src = src;
        detailImg.alt = alt;
        overlay.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 160, easing: 'ease-out' }
        ).onfinish = () => overlay.remove();
      };
    };

    if (overlay.complete) requestAnimationFrame(reveal);
    else overlay.onload = reveal;
  }

  function updateDetail(index, animate) {
    const item = items[index];
    const img = item.querySelector('img');
    if (animate) {
      crossfadeImage(img.src, img.alt);
    } else {
      detailImg.src = img.src;
      detailImg.alt = img.alt;
    }
    detailCat.textContent = item.dataset.cat;
    detailTitle.textContent = item.dataset.title;
    detailDesc.textContent = item.dataset.desc;

    detailTags.innerHTML = '';
    item.dataset.tags.split(',').forEach(tag => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = tag.trim();
      detailTags.appendChild(span);
    });

    workRemaining.innerHTML = '';
    let remIndex = 0;
    items.forEach((el, i) => {
      if (i === index) return;
      const div = document.createElement('div');
      div.className = 'rem-item';
      div.innerHTML = `
        <img src="${el.querySelector('img').src}" alt="${el.querySelector('img').alt}" />
        <div class="rem-item__overlay">
          <span class="rem-item__cat">${el.dataset.cat}</span>
          <p class="rem-item__title">${el.dataset.title}</p>
        </div>`;
      div.addEventListener('click', () => openDetail(i));
      if (animate) {
        div.animate(softRise, { ...softOpts, delay: 30 + remIndex * 35 });
      }
      remIndex++;
      workRemaining.appendChild(div);
    });

    if (animate) workExpandedInfo.animate(softRise, softOpts);
  }

  function openDetail(index) {
    if (isAnimating) return;
    if (!workSection.classList.contains('is-expanded')) {
      isAnimating = true;
      currentIndex = index;
      updateDetail(index, false);
      workExpanded.inert = false;
      workSection.classList.add('is-expanded');
      setTimeout(() => { isAnimating = false; }, WORK_ANIM_MS);
    } else if (index !== currentIndex) {
      currentIndex = index;
      updateDetail(index, true);
    }
  }

  function collapseDetail() {
    if (isAnimating || currentIndex === -1) return;
    isAnimating = true;
    workExpanded.inert = true;
    workSection.classList.remove('is-expanded');
    setTimeout(() => {
      isAnimating = false;
      currentIndex = -1;
    }, WORK_ANIM_MS);
  }

  workItems.forEach((item, i) => {
    item.addEventListener('click', () => openDetail(i));
  });

  prevBtn.addEventListener('click', () => {
    if (isAnimating) return;
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateDetail(currentIndex, true);
  });

  nextBtn.addEventListener('click', () => {
    if (isAnimating) return;
    currentIndex = (currentIndex + 1) % items.length;
    updateDetail(currentIndex, true);
  });

  workClose.addEventListener('click', collapseDetail);

  // ===========================
  // VIDEO MODAL
  // ===========================
  const videoModal = document.getElementById('videoModal');
  const videoModalPlayer = document.getElementById('videoModalPlayer');
  const videoModalClose = document.getElementById('videoModalClose');

  if (videoModal && videoModalPlayer && videoModalClose) {
    document.querySelectorAll('.video-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.video;
        if (!src) return;
        videoModalPlayer.src = src;
        videoModal.classList.add('open');
        videoModalPlayer.load();
        videoModalPlayer.play();
      });
    });

    videoModalPlayer.addEventListener('error', () => {
      // Fermeture silencieuse : les visiteurs n'ont pas besoin de détails internes
      closeVideoModal();
    });

    function closeVideoModal() {
      videoModal.classList.remove('open');
      videoModalPlayer.pause();
      videoModalPlayer.src = '';
    }

    videoModalClose.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeVideoModal();
    });
  }

  // ===========================
  // PDF — téléchargement direct uniquement (aucune page externe)
  // ===========================
  function showNotice(msg) {
    let t = document.getElementById('pdfNotice');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pdfNotice';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#0a0a0a;color:#fff;padding:12px 18px;border-left:4px solid var(--red,#C8102E);z-index:2000;font-family:var(--font-body,sans-serif);font-size:.85rem;border-radius:2px;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:320px;';
    clearTimeout(showNotice._t);
    showNotice._t = setTimeout(() => t.remove(), 4500);
  }

  document.querySelectorAll('.pdf-download').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (link.dataset.busy) return;
      link.dataset.busy = '1';
      const label = link.textContent;
      link.textContent = 'Génération…';
      try {
        const version = window.CONTENT_VERSION || '0';
        const r = await fetch('/api/pdf?v=' + encodeURIComponent(version));
        if (!r.ok) throw new Error('http ' + r.status);
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio.graceouphouet.2026.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } catch (err) {
        showNotice('Téléchargement impossible pour le moment — réessayez dans un instant.');
      } finally {
        link.textContent = label;
        delete link.dataset.busy;
      }
    });
  });

  // ===========================
  // BACK TO TOP
  // ===========================
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===========================
  // ANIMATED COUNTERS
  // ===========================
  function animateCounter(el, target, suffix = '') {
    const duration = 2000;
    const start = performance.now();
    const isFloat = String(target).includes('.');

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = isFloat
        ? (target * eased).toFixed(1)
        : Math.floor(target * eased);

      el.textContent = current.toLocaleString('fr-FR') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const text = entry.target.textContent.trim();
        const num = parseFloat(text.replace(/[^0-9.,]/g, '').replace(',', '.'));
        const suffix = text.replace(/[0-9., ]/g, '').trim();
        if (!isNaN(num)) animateCounter(entry.target, num, suffix);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.big-stat__num').forEach(el => counterObserver.observe(el));
});