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
  // WORK EXPANDED — FLIP animation
  // ===========================
  const workSection = document.querySelector('.work');
  const workGrid = document.querySelector('.work__grid');
  const workItems = document.querySelectorAll('.work-item');
  const workExpanded = document.getElementById('workExpanded');
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
  let savedItemRect = null;
  let isAnimating = false;
  const items = Array.from(workItems);

  function createClone(imgSrc, rect) {
    const clone = document.createElement('div');
    clone.className = 'work-clone';
    clone.style.cssText = `
      position: fixed;
      z-index: 1000;
      overflow: hidden;
      pointer-events: none;
      background: #e8e6e2;
      transition: all .5s cubic-bezier(.4,0,.2,1);
    `;
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    clone.appendChild(img);
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    document.body.appendChild(clone);
    return clone;
  }

  function updateDetail(index) {
    const item = items[index];
    detailImg.src = item.querySelector('img').src;
    detailImg.alt = item.querySelector('img').alt;
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
      div.addEventListener('click', () => {
        if (isAnimating) return;
        currentIndex = i;
        const remRect = div.getBoundingClientRect();
        openWithAnimation(currentIndex, remRect);
      });
      workRemaining.appendChild(div);
    });
  }

  function openWithAnimation(index, sourceRect) {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex = index;
    savedItemRect = sourceRect;

    updateDetail(index);

    workSection.classList.add('is-expanded');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetImg = detailImg.getBoundingClientRect();
        const clone = createClone(items[index].querySelector('img').src, sourceRect);

        requestAnimationFrame(() => {
          clone.style.left = targetImg.left + 'px';
          clone.style.top = targetImg.top + 'px';
          clone.style.width = targetImg.width + 'px';
          clone.style.height = targetImg.height + 'px';
        });

        setTimeout(() => {
          clone.remove();
          isAnimating = false;
        }, 520);
      });
    });
  }

  function collapseDetail() {
    if (isAnimating || currentIndex === -1) return;
    isAnimating = true;

    const targetRect = savedItemRect;
    const currentImgRect = detailImg.getBoundingClientRect();

    const clone = createClone(detailImg.src, currentImgRect);
    workSection.classList.remove('is-expanded');

    requestAnimationFrame(() => {
      clone.style.left = targetRect.left + 'px';
      clone.style.top = targetRect.top + 'px';
      clone.style.width = targetRect.width + 'px';
      clone.style.height = targetRect.height + 'px';
    });

    setTimeout(() => {
      clone.remove();
      isAnimating = false;
      currentIndex = -1;
    }, 520);
  }

  workItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      const rect = item.getBoundingClientRect();
      openWithAnimation(i, rect);
    });
  });

  prevBtn.addEventListener('click', () => {
    if (isAnimating) return;
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateDetail(currentIndex);
  });

  nextBtn.addEventListener('click', () => {
    if (isAnimating) return;
    currentIndex = (currentIndex + 1) % items.length;
    updateDetail(currentIndex);
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
        videoModalPlayer.play();
      });
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
  // PDF — téléchargement direct via /api/pdf
  // (repli : ouverture de print.html dans un nouvel onglet)
  // ===========================
  document.querySelectorAll('.pdf-download').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const r = await fetch('/api/pdf');
        if (r.ok) {
          const blob = await r.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'portfolio.graceouphouet.2026.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } else {
          window.open('print.html', '_blank');
        }
      } catch (err) {
        window.open('print.html', '_blank');
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