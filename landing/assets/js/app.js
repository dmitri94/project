(function() {
  'use strict';

  // Utils
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    // Year in footer
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Header nav smooth scroll and tracking
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id && id.startsWith('#') && id.length > 1) {
          const el = $(id);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            trackEvent('nav_click', { target: id.replace('#', '') });
          }
        }
      });
    });

    // Quiz state
    const quiz = $('.quiz');
    if (quiz) {
      const steps = $$('.quiz-step', quiz);
      let stepIndex = 0;
      const cityEl = $('#city');
      const billEl = $('#monthlyBill');
      const billValue = $('#billValue');
      const annualSavingEl = $('#annualSaving');
      const paybackEl = $('#payback');
      const energyEl = $('#energy');

      if (billEl && billValue) {
        billValue.textContent = `${billEl.value} MDL`;
        billEl.addEventListener('input', () => {
          billValue.textContent = `${billEl.value} MDL`;
        });
      }

      const showStep = (idx) => {
        steps.forEach((s, i) => {
          if (i === idx) s.removeAttribute('hidden'); else s.setAttribute('hidden', '');
        });
        stepIndex = idx;
        quiz.dataset.step = String(idx + 1);
        window.scrollTo({ top: quiz.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
      };

      const next = () => showStep(Math.min(stepIndex + 1, steps.length - 1));
      const back = () => showStep(Math.max(stepIndex - 1, 0));

      $$('.next', quiz).forEach(btn => btn.addEventListener('click', () => {
        if (stepIndex === 2) {
          // Calculate results before showing step 4
          const monthlyBill = Number(billEl?.value || 1500);
          const objectType = ($('input[name="objectType"]:checked')?.value) || 'home';
          const roofAge = $('#roofAge')?.value || '0-5';
          const shading = ($('input[name="shading"]:checked')?.value) || 'no';
          const city = cityEl?.value || 'Chisinau';

          const cityIrradiance = {
            Chisinau: 1.0,
            Balti: 0.94,
            Cahul: 1.02,
            Orhei: 0.98,
            Ungheni: 0.97
          };

          const tariff = 2.5; // MDL per kWh (placeholder)
          const baseFactor = cityIrradiance[city] || 1.0;
          const shadingFactor = shading === 'yes' ? 0.88 : 1.0;
          const roofPenalty = roofAge === '>10' ? 0.95 : 1.0;
          const segmentFactor = objectType === 'business' ? 1.08 : 1.0;

          const monthlySpend = monthlyBill;
          const annualSpend = monthlySpend * 12;
          const estimatedAnnualSaving = Math.round(annualSpend * 0.65 * baseFactor * shadingFactor * roofPenalty * segmentFactor);
          const estimatedEnergy = Math.round(estimatedAnnualSaving / tariff);

          const systemCost = Math.max(estimatedAnnualSaving * 4.3, 3500); // rough proxy
          const paybackYears = Math.max(3.2, Math.min(8.5, (systemCost / Math.max(estimatedAnnualSaving, 1))));

          if (annualSavingEl) annualSavingEl.textContent = `${formatNumber(estimatedAnnualSaving)} MDL`;
          if (paybackEl) paybackEl.textContent = `${paybackYears.toFixed(1)} лет`;
          if (energyEl) energyEl.textContent = `${formatNumber(estimatedEnergy)} кВт·ч`;

          trackEvent('quiz_result_shown', {
            monthlyBill, objectType, roofAge, shading, city,
            estimatedAnnualSaving, estimatedEnergy, paybackYears
          });
        }
        next();
      }));

      $$('.back', quiz).forEach(btn => btn.addEventListener('click', back));

      // Start at step 1
      showStep(0);
    }

    // Lead forms validation and submission stub
    const forms = $$('.lead-form');
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const nameInput = $('input[name="name"]', formEl);
        const phoneInput = $('input[name="phone"]', formEl);
        const nameError = nameInput?.parentElement?.querySelector('.error');
        const phoneError = phoneInput?.parentElement?.querySelector('.error');
        const note = formEl.querySelector('.form-note') || $('#leadNote');

        let valid = true;
        if (!nameInput || nameInput.value.trim().length < 2) { valid = false; if (nameError) nameError.hidden = false; }
        else if (nameError) nameError.hidden = true;

        const phonePattern = /^\+?\d[\d\s\-]{7,}$/;
        if (!phoneInput || !phonePattern.test(phoneInput.value.trim())) { valid = false; if (phoneError) phoneError.hidden = false; }
        else if (phoneError) phoneError.hidden = true;

        const consent = $('#leadConsent');
        if (consent && !consent.checked) { valid = false; }

        if (!valid) {
          if (note) note.textContent = 'Проверьте правильность заполнения полей.';
          return;
        }

        const payload = {
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          source: 'landing:eprime',
          url: location.href,
          ts: Date.now(),
        };

        try {
          // Replace with real endpoint or CRM webhook
          await fakeNetwork(payload);
          if (note) note.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
          trackEvent('lead_submit_success', payload);
          formEl.reset();
        } catch (err) {
          if (note) note.textContent = 'Ошибка отправки. Попробуйте ещё раз или позвоните нам.';
          trackEvent('lead_submit_error', { message: String(err) });
        }
      });
    });

    // CTA click tracking
    $$('[data-event]').forEach(el => {
      el.addEventListener('click', () => {
        const evt = el.getAttribute('data-event') || 'cta_click';
        trackEvent(evt, { text: el.textContent?.trim() });
      });
    });
  });

  function fakeNetwork(payload) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 600));
  }

  function trackEvent(name, params) {
    try {
      if (typeof gtag === 'function') gtag('event', name, params || {});
    } catch {}
    try {
      if (typeof ym === 'function' && window.YM_ID) ym(window.YM_ID, 'reachGoal', name, params || {});
    } catch {}
    try {
      if (typeof fbq === 'function') fbq('trackCustom', name, params || {});
    } catch {}
    // Fallback: console
    if (window.location.search.includes('debug')) {
      // eslint-disable-next-line no-console
      console.log('[track]', name, params || {});
    }
  }

  function formatNumber(n) {
    return new Intl.NumberFormat('ru-RU').format(Number(n || 0));
  }
})();

