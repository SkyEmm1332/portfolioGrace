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
const submitBtn = document.querySelector('.contact__form .btn');
if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.contact__form input, .contact__form textarea');
    let hasValue = false;
    inputs.forEach(i => { if (i.value.trim()) hasValue = true; });

    if (hasValue) {
      submitBtn.textContent = '✓ Message Sent!';
      submitBtn.style.background = '#2a9d5c';
      submitBtn.style.borderColor = '#2a9d5c';
      setTimeout(() => {
        submitBtn.textContent = 'Send Message ★';
        submitBtn.style.background = '';
        submitBtn.style.borderColor = '';
        inputs.forEach(i => i.value = '');
      }, 3000);
    } else {
      submitBtn.textContent = 'Please fill in the form ↑';
      setTimeout(() => { submitBtn.textContent = 'Send Message ★'; }, 2000);
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
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 120 + 200);
  });
});
