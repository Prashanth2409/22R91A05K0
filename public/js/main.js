/* ============================================================
   FLIQ® — interactions
   loader · cursor · mobile menu · scroll reveals · hero parallax
   collection filters · page transitions
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader (once per session) ---------- */
  const loader = document.getElementById('loader');
  if (loader) {
    let seen = false;
    try { seen = sessionStorage.getItem('fliq-loaded'); } catch {}
    if (seen || reduced) {
      loader.remove();
      document.body.classList.add('loaded');
    } else {
      const pct = loader.querySelector('.pct');
      let n = 0;
      const tick = setInterval(() => {
        n = Math.min(100, n + Math.ceil(Math.random() * 18));
        if (pct) pct.textContent = String(n).padStart(3, '0') + '%';
        if (n >= 100) {
          clearInterval(tick);
          setTimeout(() => {
            loader.classList.add('done');
            document.body.classList.add('loaded');
            setTimeout(() => loader.remove(), 1000);
          }, 250);
        }
      }, 110);
      try { sessionStorage.setItem('fliq-loaded', '1'); } catch {}
    }
  }

  /* ---------- Original single-circle desktop cursor ---------- */
  const cursor = document.getElementById('cursor');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (cursor) {
    const hoverTarget = target => target instanceof Element && !!target.closest('a,button,.card,.product-card,.look');
    addEventListener('pointermove', e => {
      if (!finePointer.matches || e.pointerType !== 'mouse') return;
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      cursor.classList.add('visible');
      cursor.classList.toggle('grow', hoverTarget(e.target));
    }, { passive:true });
    document.addEventListener('pointerover', e => cursor.classList.toggle('grow', hoverTarget(e.target)));
    document.addEventListener('pointerout', e => cursor.classList.toggle('grow', hoverTarget(e.relatedTarget)));
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
    addEventListener('blur', () => cursor.classList.remove('visible'));
    finePointer.addEventListener('change', () => cursor.classList.remove('visible','grow'));
  }

  /* ---------- Lookbook wheel momentum; native horizontal touch scrolling ---------- */
  document.querySelectorAll('.look-strip').forEach(strip => {
    let target = 0, raf = 0;
    const clamp = value => Math.max(0, Math.min(value, strip.scrollWidth - strip.clientWidth));
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      strip.classList.remove('is-scrolling');
    };
    const animate = () => {
      target = clamp(target);
      const delta = target - strip.scrollLeft;
      if (Math.abs(delta) < .7) {
        strip.scrollLeft = target;
        stop();
        return;
      }
      const previous = strip.scrollLeft;
      strip.scrollLeft += delta * .18;
      // Fractional browser zoom may round subpixel steps to zero.
      if (strip.scrollLeft === previous) { strip.scrollLeft = target; stop(); return; }
      raf = requestAnimationFrame(animate);
    };
    strip.addEventListener('wheel', e => {
      if (!finePointer.matches || e.ctrlKey) return;
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) { stop(); return; }
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? strip.clientWidth : 1);
      const current = raf ? target : strip.scrollLeft;
      const next = clamp(current + delta);
      // Release page scrolling at either end instead of trapping the wheel.
      if (Math.abs(next - current) < .5) return;
      e.preventDefault();
      target = next;
      strip.classList.add('is-scrolling');
      if (reduced) { strip.scrollLeft = target; stop(); }
      else if (!raf) raf = requestAnimationFrame(animate);
    }, { passive:false });
    strip.addEventListener('pointerdown', stop, { passive:true });
  });

  /* ---------- Header + hero entrance ---------- */
  const hero = document.querySelector('.home-hero');
  if (hero) {
    const start = () => hero.classList.add('ready');
    document.body.classList.contains('loaded') ? requestAnimationFrame(start) : setTimeout(start, 1400);
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn = mobileMenu ? mobileMenu.querySelector('.close-btn') : null;
  const openMenu = (open) => {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('open', open);
    mobileMenu.inert = !open;
    menuBtn?.setAttribute('aria-expanded', String(open));
    if (open) closeBtn?.focus(); else menuBtn?.focus();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn) menuBtn.addEventListener('click', () => openMenu(true));
  if (closeBtn) closeBtn.addEventListener('click', () => openMenu(false));
  if (mobileMenu) mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => openMenu(false)));

  document.addEventListener('keydown',e=>{
    if(!mobileMenu?.classList.contains('open'))return;
    if(e.key==='Escape'){openMenu(false);return;}
    if(e.key==='Tab'){
      const nodes=[...mobileMenu.querySelectorAll('a,button')],first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  document.querySelectorAll('.product-lane').forEach(lane=>lane.classList.add('reveal'));
  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal, .stagger');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Hero parallax ---------- */
  const heroImg = document.querySelector('.hero-background');
  if (heroImg && !reduced && matchMedia('(pointer: fine)').matches) {
    let raf = null;
    const update = () => {
      const y = Math.min(scrollY, innerHeight);
      heroImg.style.transform = `translateY(${y * 0.08}px) scale(1.02)`;
      raf = null;
    };
    addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ---------- Collection filters ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.card').forEach((card) => {
          const show = f === 'all' || card.dataset.cat === f;
          card.classList.toggle('is-hidden', !show);
          if (show) {
            card.classList.remove('in');
            requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in')));
          }
        });
      });
    });
  }

  /* ---------- Page transition curtain ---------- */
  const curtain = document.getElementById('curtain');
  if (curtain && !reduced) {
    document.querySelectorAll('a[href$=".html"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const target = new URL(link.href, location.href);
        if (target.pathname === location.pathname) return; // same page
        e.preventDefault();
        curtain.classList.add('cover');
        setTimeout(() => { location.href = link.href; }, 420);
      });
    });
  }


  /* ---------- Back to top ---------- */
  document.querySelectorAll('[data-back-to-top]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Contact form → WhatsApp ---------- */
  const form = document.getElementById('dm-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const msg = `Hi FLIQ! I'm ${d.get('name')}. ${d.get('message')}`;
      const wa = form.dataset.wa; // number set in HTML
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }
})();
