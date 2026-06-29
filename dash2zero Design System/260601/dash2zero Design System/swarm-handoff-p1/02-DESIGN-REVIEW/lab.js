// dash2zero Senior Design Review — interactive lab
// Vanilla JS, runs on DOMContentLoaded.

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 1. Ripple effect on .btn
  // ─────────────────────────────────────────────────────────────
  function attachRipple(el) {
    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect();
      const r = document.createElement('span');
      r.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.2;
      r.style.width = r.style.height = size + 'px';
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top  = (e.clientY - rect.top)  + 'px';
      el.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    });
  }

  document.querySelectorAll('[data-ripple]').forEach(attachRipple);

  // ─────────────────────────────────────────────────────────────
  // 2. Audio button — toggle playing state
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-audio]').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('playing'));
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Play / pause icon morph
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-playpause]').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-playing'));
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Toggle switches
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-toggle]').forEach((t) => {
    t.addEventListener('click', () => t.classList.toggle('on'));
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Checkbox
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-check]').forEach((c) => {
    c.addEventListener('click', () => c.classList.toggle('checked'));
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Icon morph (heart-style)
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-iconmorph]').forEach((i) => {
    i.addEventListener('click', () => {
      i.classList.toggle('active');
      if (i.classList.contains('active')) {
        // burst particles
        const rect = i.getBoundingClientRect();
        for (let k = 0; k < 6; k++) {
          spawnBurstParticle(i, k);
        }
      }
    });
  });
  function spawnBurstParticle(host, idx) {
    const p = document.createElement('span');
    const angle = (Math.PI * 2 * idx) / 6;
    const dist = 36 + Math.random() * 10;
    p.style.cssText = `
      position: absolute; left: 50%; top: 50%;
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--neon-pink);
      box-shadow: 0 0 8px rgba(236,72,153,0.8);
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: burst-out 560ms cubic-bezier(0.16,1,0.3,1) forwards;
      --tx: ${Math.cos(angle) * dist}px;
      --ty: ${Math.sin(angle) * dist}px;
    `;
    host.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  // inject keyframes once
  (function injectBurstKeyframes() {
    if (document.getElementById('burst-keys')) return;
    const s = document.createElement('style');
    s.id = 'burst-keys';
    s.textContent = `
      @keyframes burst-out {
        0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
        100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.2); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  })();

  // ─────────────────────────────────────────────────────────────
  // 7. Progress bar — animate to a target value
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-progress-stage]').forEach((stage) => {
    const fill = stage.querySelector('.fill');
    const label = stage.querySelector('[data-progress-label]');
    let value = 0;
    const tick = () => {
      value = (value + 25) % 125;
      if (value > 100) value = 0;
      fill.style.width = value + '%';
      if (label) label.textContent = value + '%';
    };
    tick();
    setInterval(tick, 1400);
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Number counter (tick-up)
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-counter]').forEach((host) => {
    const target = parseInt(host.dataset.counter, 10);
    const dur = parseInt(host.dataset.dur || '900', 10);
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      host.textContent = Math.round(target * ease).toString();
      if (t < 1) requestAnimationFrame(step);
    }
    // animate on appear (use IntersectionObserver)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          requestAnimationFrame(step);
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(host);
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Choice card quiz state
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-quiz]').forEach((quiz) => {
    const correct = quiz.dataset.quiz;
    const choices = quiz.querySelectorAll('.choice');
    let resolved = false;
    choices.forEach((c) => {
      c.addEventListener('click', () => {
        if (resolved) {
          // reset
          resolved = false;
          choices.forEach((x) => x.classList.remove('selected','correct','incorrect'));
          return;
        }
        choices.forEach((x) => x.classList.remove('selected'));
        c.classList.add('selected');
        setTimeout(() => {
          resolved = true;
          choices.forEach((x) => {
            if (x.dataset.value === correct) x.classList.add('correct');
            else if (x === c) x.classList.add('incorrect');
          });
        }, 280);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Transition stage (slide / fade / push)
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-transition]').forEach((stage) => {
    const panels = Array.from(stage.querySelectorAll('.panel'));
    const tabs = stage.parentElement.querySelectorAll('[data-mode]');
    let idx = 0;
    let mode = 'slide';
    panels.forEach((p, i) => {
      if (i === 0) p.classList.add('in');
      else p.classList.add('right');
    });
    tabs.forEach((t) => {
      t.addEventListener('click', () => {
        tabs.forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        mode = t.dataset.mode;
      });
    });
    function go(next) {
      const cur = panels[idx];
      const nxt = panels[next];
      if (mode === 'fade') {
        cur.classList.remove('in'); cur.classList.add('fade-out');
        nxt.classList.remove('right','left','fade-out');
        nxt.classList.add('fade-in','in');
      } else {
        // slide
        const dir = next > idx ? 'left' : 'right';
        const fromDir = next > idx ? 'right' : 'left';
        cur.classList.remove('in','fade-out','fade-in');
        cur.classList.add(dir);
        nxt.classList.remove('right','left','fade-out','fade-in');
        // force reflow then animate in
        nxt.style.transition = 'none';
        nxt.classList.add(fromDir);
        void nxt.offsetWidth;
        nxt.style.transition = '';
        nxt.classList.remove(fromDir);
        nxt.classList.add('in');
      }
      idx = next;
    }
    const next = stage.parentElement.querySelector('[data-action="next"]');
    const prev = stage.parentElement.querySelector('[data-action="prev"]');
    if (next) next.addEventListener('click', () => go((idx + 1) % panels.length));
    if (prev) prev.addEventListener('click', () => go((idx - 1 + panels.length) % panels.length));
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Modal sheet
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-sheet-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.dataset.sheetToggle;
      const stage = document.querySelector(sel);
      if (stage) stage.classList.toggle('open');
    });
  });
  document.querySelectorAll('.sheet-stage .backdrop').forEach((bd) => {
    bd.addEventListener('click', () => bd.closest('.sheet-stage').classList.remove('open'));
  });

  // ─────────────────────────────────────────────────────────────
  // 12. Toasts
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-toast-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stage = document.querySelector(btn.dataset.toastTarget);
      if (!stage) return;
      const container = stage.querySelector('.toast-container');
      const variant = btn.dataset.toastVariant || 'ok';
      const msg = btn.dataset.toastMsg || 'Saved.';
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span class="dot ${variant}"></span><span>${msg}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('exit');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
      }, 2400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 13. Badge pop on demand
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('[data-pop-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stage = document.querySelector(btn.dataset.popTarget);
      if (!stage) return;
      const badges = stage.querySelectorAll('.badge-pop');
      badges.forEach((b, i) => {
        b.classList.remove('enter');
        void b.offsetWidth;
        setTimeout(() => b.classList.add('enter'), i * 80);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 14. Pull to refresh
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.ptr-stage').forEach((stage) => {
    const scroll = stage.querySelector('.scroll');
    const indicator = stage.querySelector('.indicator');
    const indSvg = indicator.querySelector('svg');
    let dragging = false;
    let startY = 0;
    let dy = 0;
    const threshold = 64;

    function setY(y) {
      const clamped = Math.max(0, Math.min(y, 120));
      scroll.style.transform = `translateY(${clamped}px)`;
      const progress = Math.min(1, clamped / threshold);
      indicator.style.transform = `translate(-50%, ${clamped - 60}px)`;
      indSvg.style.transform = `rotate(${progress * 360}deg)`;
    }

    stage.addEventListener('pointerdown', (e) => {
      dragging = true;
      stage.classList.add('dragging','pulling');
      startY = e.clientY;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dy = e.clientY - startY;
      if (dy > 0) setY(dy);
    });
    stage.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('dragging');
      if (dy > threshold) {
        // trigger refresh
        stage.classList.remove('pulling');
        stage.classList.add('refreshing');
        scroll.style.transform = 'translateY(48px)';
        indicator.style.transform = 'translate(-50%, -12px)';
        setTimeout(() => {
          stage.classList.remove('refreshing');
          scroll.style.transform = 'translateY(0)';
          indicator.style.transform = 'translate(-50%, -60px)';
        }, 1600);
      } else {
        stage.classList.remove('pulling');
        scroll.style.transform = 'translateY(0)';
        indicator.style.transform = 'translate(-50%, -60px)';
      }
      dy = 0;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 15. Smooth-scroll TOC
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.toc a').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
