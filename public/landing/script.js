/* LoftDesk landing — Google Store slide format — interactions */

(() => {
  // ─── Nav: scroll class + burger ───
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  const navRight = document.getElementById('navRight');

  // Add .scrolled after 60px
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav?.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });

  // Burger toggle
  if (burger) {
    burger.addEventListener('click', () => {
      nav?.classList.toggle('open');
    });
  }

  // ─── Smooth scroll + close mobile menu ───
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    nav?.classList.remove('open');
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (nav?.classList.contains('open') && !e.target.closest('.nav')) {
      nav.classList.remove('open');
    }
  });

  // ─── Scroll reveal animations ───
  const animEls = document.querySelectorAll('.anim');
  if (animEls.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger siblings inside the same parent
          const parent = entry.target.parentElement;
          const siblings = parent ? [...parent.querySelectorAll('.anim')] : [entry.target];
          const idx = siblings.indexOf(entry.target);
          setTimeout(() => entry.target.classList.add('visible'), idx * 100);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    animEls.forEach((el) => obs.observe(el));
  }
})();
