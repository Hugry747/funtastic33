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
     4. FORMULAIRE DE DEVIS — Validation + envoi AJAX vers Formspree
     -----------------------------------------------------------------
     - Aucune adresse mail ni secret SMTP côté frontend : Formspree
       transmet le message à funtastic33@yahoo.com depuis son backend.
     - Honeypot anti-spam (_gotcha) : si rempli, on simule un succès
       sans rien envoyer pour ne pas alerter le bot.
     - Désactivation du bouton + libellé "Envoi en cours…" pendant
       l'envoi pour éviter les doubles soumissions.
     - Messages de succès / erreur affichés inline (sans alert).
     - Si l'endpoint n'est pas encore configuré, on prévient
       l'utilisateur via la zone de feedback (et la console).
     ================================================================= */
  const quoteForms = document.querySelectorAll('form[data-formspree-endpoint]');
  quoteForms.forEach((form) => initQuoteForm(form));

  function initQuoteForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnLabel = submitBtn ? submitBtn.querySelector('.btn__label') : null;
    const defaultLabel = submitBtn ? (submitBtn.dataset.defaultLabel || (btnLabel ? btnLabel.textContent : submitBtn.textContent)) : '';
    const feedback = form.querySelector('.form-feedback');
    const endpoint = form.getAttribute('data-formspree-endpoint');
    const endpointConfigured = endpoint && endpoint.indexOf('FORMSPREE_ENDPOINT_HERE') === -1 && /^https?:\/\//.test(endpoint);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1. Honeypot : si rempli → on simule le succès sans rien envoyer
      const honeypot = form.querySelector('input[name="_gotcha"], input[name="bot-field"]');
      if (honeypot && honeypot.value) {
        showFeedback(feedback, 'success', 'Merci, votre demande a bien été envoyée !');
        form.reset();
        return;
      }

      // 2. Validation HTML5 native (champs requis, type email, etc.)
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // 3. Vérification email plus stricte que celle du navigateur
      const emailField = form.querySelector('input[type="email"]');
      if (emailField && !isValidEmail(emailField.value)) {
        showFeedback(feedback, 'error', 'Merci de saisir une adresse email valide.');
        emailField.focus();
        return;
      }

      // 4. Consentement RGPD obligatoire
      const rgpd = form.querySelector('input[name="rgpd"]');
      if (rgpd && !rgpd.checked) {
        showFeedback(feedback, 'error', 'Merci d\'accepter le traitement de vos données pour envoyer le formulaire.');
        rgpd.focus();
        return;
      }

      // 5. Bouton désactivé + libellé "Envoi en cours…"
      setSubmitting(submitBtn, btnLabel, true);
      hideFeedback(feedback);

      // 6. Si l'endpoint Formspree n'est pas configuré, on évite un envoi
      //    cassé et on prévient le développeur en console.
      if (!endpointConfigured) {
        console.warn('[Funtastic] Endpoint Formspree non configuré. Remplacez "FORMSPREE_ENDPOINT_HERE" dans contact.html.');
        showFeedback(feedback, 'error', 'Le formulaire n\'est pas encore activé. Merci de nous contacter par téléphone au 06 18 37 93 19.');
        setSubmitting(submitBtn, btnLabel, false, defaultLabel);
        return;
      }

      // 7. Envoi via fetch (HTTPS uniquement, pas de secret côté client)
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form),
        });

        if (response.ok) {
          showFeedback(
            feedback,
            'success',
            'Merci ! Votre demande a bien été envoyée. Nous revenons vers vous sous 24 à 48 heures.'
          );
          form.reset();
        } else {
          // Formspree renvoie un JSON { errors: [...] } en cas de souci
          let detail = '';
          try {
            const data = await response.json();
            if (data && Array.isArray(data.errors) && data.errors.length) {
              detail = ' (' + data.errors.map((er) => er.message).join(', ') + ')';
            }
          } catch (_) { /* corps non JSON, on ignore */ }
          showFeedback(
            feedback,
            'error',
            'Une erreur est survenue lors de l\'envoi' + detail + '. Merci de réessayer ou de nous appeler au 06 18 37 93 19.'
          );
        }
      } catch (err) {
        showFeedback(
          feedback,
          'error',
          'Impossible d\'envoyer le message (problème de connexion). Merci de réessayer ou de nous appeler au 06 18 37 93 19.'
        );
      } finally {
        setSubmitting(submitBtn, btnLabel, false, defaultLabel);
      }
    });
  }

  function isValidEmail(value) {
    // RFC 5322 simplifié : suffisant pour une validation client
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
  }

  function setSubmitting(btn, labelEl, isSubmitting, defaultLabel) {
    if (!btn) return;
    btn.disabled = isSubmitting;
    btn.classList.toggle('is-loading', isSubmitting);
    if (labelEl) {
      labelEl.textContent = isSubmitting ? 'Envoi en cours…' : (defaultLabel || labelEl.textContent);
    } else {
      btn.textContent = isSubmitting ? 'Envoi en cours…' : (defaultLabel || btn.textContent);
    }
  }

  function showFeedback(el, type, message) {
    if (!el) return;
    el.hidden = false;
    el.className = 'form-feedback form-feedback--' + type;
    el.textContent = message;
    // Scroll doux pour rendre le message visible sur mobile
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function hideFeedback(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
    el.className = 'form-feedback';
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
