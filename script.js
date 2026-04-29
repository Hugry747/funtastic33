/* =====================================================================
   FUNTASTIC33 — JS GLOBAL
   --------------------------------------------------------------------
   Fonctionnalités :
   1. Header sticky avec ombre au scroll
   2. Menu burger mobile (ouverture/fermeture, sous-menus)
   3. Animations d'apparition au scroll (Intersection Observer)
   4. Validation formulaire de contact
   5. Année dynamique du footer
   ===================================================================== */

(function () {
  'use strict';

  /* =================================================================
     1. HEADER STICKY — ombre au scroll
     ================================================================= */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* =================================================================
     2. MENU BURGER MOBILE
     ================================================================= */
  const burger = document.querySelector('.nav__burger');
  const navMenu = document.querySelector('.nav__menu');

  if (burger && navMenu) {
    burger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      burger.classList.toggle('is-active');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      // Bloquer le scroll quand menu ouvert
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Sous-menus mobiles : tap sur l'item parent → expand
    document.querySelectorAll('.nav__item--has-submenu').forEach((item) => {
      const link = item.querySelector('.nav__link');
      if (!link) return;
      link.addEventListener('click', (e) => {
        // Sur mobile uniquement (largeur ≤ 768)
        if (window.innerWidth <= 768) {
          e.preventDefault();
          item.classList.toggle('is-expanded');
        }
      });
    });

    // Fermer le menu si on clique sur un lien interne (sauf parent de sous-menu)
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        const parent = link.closest('.nav__item--has-submenu');
        // Ne pas fermer si c'est juste pour ouvrir un sous-menu sur mobile
        if (parent && window.innerWidth <= 768 && link === parent.querySelector('.nav__link')) {
          return;
        }
        navMenu.classList.remove('is-open');
        burger.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    });

    // Fermer le menu si on redimensionne au-dessus de 768px
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navMenu.classList.contains('is-open')) {
        navMenu.classList.remove('is-open');
        burger.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });
  }


  /* =================================================================
     3. APPARITION AU SCROLL (Intersection Observer)
     ================================================================= */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback : tout afficher immédiatement
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }


  /* =================================================================
     4. VALIDATION FORMULAIRE DE CONTACT
     ================================================================= */
  const contactForm = document.querySelector('form[name="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      // Honeypot : si le champ caché est rempli, c'est probablement un bot
      const honeypot = contactForm.querySelector('input[name="bot-field"]');
      if (honeypot && honeypot.value) {
        e.preventDefault();
        return;
      }

      // Validation HTML5 native gérée par le navigateur
      // On vérifie juste qu'on a coché le RGPD
      const rgpd = contactForm.querySelector('input[name="rgpd"]');
      if (rgpd && !rgpd.checked) {
        e.preventDefault();
        alert('Merci d\'accepter le traitement de vos données pour pouvoir envoyer le formulaire.');
        rgpd.focus();
        return;
      }

      // Animation du bouton pendant l'envoi
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Envoi en cours...';
      }

      // Le formulaire est envoyé naturellement à Netlify (action="/merci.html")
    });
  }


  /* =================================================================
     5. ANNÉE DYNAMIQUE DU FOOTER
     ================================================================= */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* =================================================================
     6. ACCESSIBILITÉ — focus visible au clavier uniquement
     ================================================================= */
  document.body.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.remove('using-mouse');
  });

  /* =================================================================
     7. SLIDER HERO (page d'accueil) — auto-play + crossfade + dots
     ================================================================= */
  const slider = document.querySelector('.hero-slider');
  if (slider) {
    const slides = slider.querySelectorAll('.hero-slider__slide');
    const dotsContainer = slider.querySelector('.hero-slider__dots');
    const total = slides.length;

    if (total > 1) {
      const INTERVAL = 2500;
      let current = 0;
      let timer = null;

      // Création des dots (un par slide)
      const dots = [];
      if (dotsContainer) {
        for (let i = 0; i < total; i++) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'hero-slider__dot' + (i === 0 ? ' is-active' : '');
          dot.setAttribute('aria-label', `Afficher l'image ${i + 1} sur ${total}`);
          dot.addEventListener('click', () => {
            goTo(i);
            restart();
          });
          dotsContainer.appendChild(dot);
          dots.push(dot);
        }
      }

      const goTo = (index) => {
        slides[current].classList.remove('is-active');
        slides[current].setAttribute('aria-hidden', 'true');
        if (dots[current]) dots[current].classList.remove('is-active');

        current = (index + total) % total;

        slides[current].classList.add('is-active');
        slides[current].setAttribute('aria-hidden', 'false');
        if (dots[current]) dots[current].classList.add('is-active');
      };

      const next = () => goTo(current + 1);

      const start = () => {
        // Respect de prefers-reduced-motion : pas d'auto-play
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        stop();
        timer = setInterval(next, INTERVAL);
      };
      const stop = () => {
        if (timer) { clearInterval(timer); timer = null; }
      };
      const restart = () => { stop(); start(); };

      // Pause au survol/focus, et quand l'onglet n'est plus visible
      slider.addEventListener('mouseenter', stop);
      slider.addEventListener('mouseleave', start);
      slider.addEventListener('focusin', stop);
      slider.addEventListener('focusout', start);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
      });

      start();
    }
  }


})();
