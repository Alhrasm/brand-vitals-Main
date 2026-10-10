/* ==========================================================================
   BRAND VITALS · Experience Engine v2.0
   Theme (dark/light) · i18n (EN/AR + RTL) · Motion system · Components
   ========================================================================== */
(() => {
  "use strict";

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------
     THEME — dark default, persisted
  ------------------------------------------------------------------ */
  const Theme = {
    init() {
      // Dark is the brand theme; light is opt-in via the toggle.
      this.set(localStorage.getItem("oso-theme") || "dark", false);
      document.querySelectorAll("[data-theme-toggle]").forEach(btn =>
        btn.addEventListener("click", () => this.set(doc.dataset.theme === "dark" ? "light" : "dark", true))
      );
    },
    set(mode, persist) {
      doc.dataset.theme = mode;
      if (persist) localStorage.setItem("oso-theme", mode);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = getComputedStyle(doc).getPropertyValue("--bg").trim() || (mode === "dark" ? "#05080B" : "#F5F7F9");
    }
  };

  /* ------------------------------------------------------------------
     I18N — EN/AR via data-en / data-ar attributes
  ------------------------------------------------------------------ */
  const I18n = {
    lang: "en",
    init() {
      this.lang = localStorage.getItem("oso-lang") || "en";
      this.apply(this.lang);
      document.querySelectorAll("[data-lang-toggle]").forEach(btn =>
        btn.addEventListener("click", () => {
          this.apply(this.lang === "en" ? "ar" : "en");
          localStorage.setItem("oso-lang", this.lang);
        })
      );
    },
    apply(lang) {
      this.lang = lang;
      doc.lang = lang;
      doc.dir = lang === "ar" ? "rtl" : "ltr";
      document.querySelectorAll("[data-en]").forEach(el => {
        const val = el.dataset[lang];
        if (val == null) return;
        if (el.dataset.i18nAttr) el.setAttribute(el.dataset.i18nAttr, val);
        else el.textContent = val;
      });
      document.querySelectorAll("[data-en-ph]").forEach(el => {
        el.placeholder = lang === "ar" ? (el.dataset.arPh || "") : (el.dataset.enPh || "");
      });
      document.querySelectorAll("[data-lang-toggle]").forEach(btn => {
        btn.textContent = lang === "en" ? "عربي" : "EN";
        btn.setAttribute("aria-label", lang === "en" ? "التبديل إلى العربية" : "Switch to English");
      });
      document.title = (lang === "ar" && doc.dataset.titleAr) ? doc.dataset.titleAr : (doc.dataset.titleEn || document.title);
    }
  };

  /* ------------------------------------------------------------------
     LOADER — brand ring, then hero choreography
  ------------------------------------------------------------------ */
  const Loader = {
    init() {
      const loader = document.querySelector(".loader");
      const done = () => {
        document.body.classList.add("is-loaded");
        if (loader) loader.classList.add("is-done");
      };
      if (!loader || reduceMotion) { done(); if (loader) loader.style.display = "none"; return; }
      // Full sequence on the first visit of a session, a short one afterwards.
      let quick = false;
      try { quick = sessionStorage.getItem("bv-intro") === "1"; sessionStorage.setItem("bv-intro", "1"); } catch (e) { /* ignore */ }
      if (quick) loader.classList.add("loader--quick");
      const dur = (quick ? 700 : 1600) + 150;
      const pct = loader.querySelector(".loader__pct b");
      let loaded = document.readyState === "complete";
      let finished = false;
      window.addEventListener("load", () => { loaded = true; }, { once: true });
      const finish = () => {
        if (finished) return;
        finished = true;
        if (pct) pct.textContent = "100";
        // Pulse flatlines into one bright line, then the screen splits open along it.
        loader.classList.add("is-flat");
        setTimeout(() => {
          done();
          setTimeout(() => { loader.style.display = "none"; }, 1200);
        }, quick ? 240 : 420);
      };
      const t0 = performance.now();
      const tick = now => {
        if (finished) return;
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        if (pct) pct.textContent = Math.round(e * (loaded ? 100 : 94));
        if (p >= 1 && loaded) { finish(); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(finish, quick ? 1600 : 3400); // hard cap so slow assets never trap the visitor
    }
  };

  /* ------------------------------------------------------------------
     NAV — glass on scroll, hide on scroll down, drawer, active link
  ------------------------------------------------------------------ */
  const Nav = {
    init() {
      const nav = document.querySelector(".nav");
      if (!nav) return;
      const onScroll = () => {
        const y = window.scrollY;
        // Keep the nav pinned and visible while scrolling (glass style once past the top).
        nav.classList.toggle("is-scrolled", y > 24);
        nav.classList.remove("is-hidden");
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      const burger = document.querySelector(".nav__burger");
      const drawer = document.querySelector(".drawer");
      if (burger && drawer) {
        burger.addEventListener("click", () => {
          const open = drawer.classList.toggle("is-open");
          burger.classList.toggle("is-open", open);
          burger.setAttribute("aria-expanded", open);
          document.body.classList.toggle("drawer-open", open);
          document.body.style.overflow = open ? "hidden" : "";
        });
        drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
          drawer.classList.remove("is-open");
          burger.classList.remove("is-open");
          document.body.classList.remove("drawer-open");
          document.body.style.overflow = "";
        }));
      }

      // Active link
      const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
      document.querySelectorAll(".nav__link, .drawer__link").forEach(a => {
        const href = (a.getAttribute("href") || "").toLowerCase();
        if (href === here) a.classList.add("is-active");
      });
    }
  };

  /* ------------------------------------------------------------------
     SCROLL PROGRESS + BACK TO TOP
  ------------------------------------------------------------------ */
  const Progress = {
    init() {
      const bar = document.querySelector(".progress");
      const top = document.querySelector(".to-top");
      const onScroll = () => {
        const h = doc.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
        if (top) top.classList.toggle("is-visible", window.scrollY > 900);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      if (top) top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
    }
  };

  /* ------------------------------------------------------------------
     REVEAL — IntersectionObserver
  ------------------------------------------------------------------ */
  const Reveal = {
    init() {
      const els = document.querySelectorAll("[data-reveal]");
      if (!els.length) return;
      if (reduceMotion) { els.forEach(el => el.classList.add("is-inview")); return; }
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add("is-inview"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      els.forEach(el => io.observe(el));
    }
  };

  /* ------------------------------------------------------------------
     COUNTERS — [data-count] count-up on view
  ------------------------------------------------------------------ */
  const Counters = {
    init() {
      const els = document.querySelectorAll("[data-count]");
      if (!els.length) return;
      const run = el => {
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split(".")[1] || "").length;
        const dur = 1800;
        const t0 = performance.now();
        const step = now => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(step);
        };
        if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
        requestAnimationFrame(step);
      };
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.5 });
      els.forEach(el => io.observe(el));
    }
  };

  /* ------------------------------------------------------------------
     SIGNAL LINES — draw when visible
  ------------------------------------------------------------------ */
  const Signals = {
    init() {
      const sigs = document.querySelectorAll(".signal[data-draw]");
      if (!sigs.length) return;
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("sig-draw"); io.unobserve(e.target); } });
      }, { threshold: 0.3 });
      sigs.forEach(s => io.observe(s));
    }
  };

  /* ------------------------------------------------------------------
     MAGNETIC BUTTONS
  ------------------------------------------------------------------ */
  const Magnetic = {
    init() {
      if (!finePointer || reduceMotion) return;
      document.querySelectorAll("[data-magnetic]").forEach(el => {
        const strength = 0.18;
        el.addEventListener("mousemove", e => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * strength;
          const y = (e.clientY - r.top - r.height / 2) * strength;
          el.style.transform = `translate(${x}px, ${y}px)`;
        });
        el.addEventListener("mouseleave", () => {
          el.style.transition = "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)";
          el.style.transform = "";
          setTimeout(() => (el.style.transition = ""), 600);
        });
      });
    }
  };

  /* ------------------------------------------------------------------
     RIPPLE
  ------------------------------------------------------------------ */
  const Ripple = {
    init() {
      document.addEventListener("click", e => {
        const btn = e.target.closest(".btn--primary, .btn--dark");
        if (!btn || reduceMotion) return;
        const r = btn.getBoundingClientRect();
        const d = Math.max(r.width, r.height);
        const span = document.createElement("span");
        span.className = "ripple";
        span.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
        btn.appendChild(span);
        setTimeout(() => span.remove(), 700);
      });
    }
  };

  /* ------------------------------------------------------------------
     SPOTLIGHT — cursor-following glow on [data-tilt] cards (no 3D tilt)
  ------------------------------------------------------------------ */
  const Tilt = {
    init() {
      if (!finePointer || reduceMotion) return;
      document.querySelectorAll("[data-tilt]").forEach(card => {
        card.addEventListener("mousemove", e => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
          card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        });
      });
    }
  };

  /* ------------------------------------------------------------------
     PARALLAX ORBS
  ------------------------------------------------------------------ */
  const Parallax = {
    init() {
      if (reduceMotion) return;
      const orbs = document.querySelectorAll(".orb[data-parallax]");
      if (!orbs.length) return;
      let ticking = false;
      window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          orbs.forEach(o => {
            const speed = parseFloat(o.dataset.parallax) || 0.1;
            o.style.transform = `translateY(${y * speed}px)`;
          });
          ticking = false;
        });
      }, { passive: true });
    }
  };

  /* ------------------------------------------------------------------
     ACCORDION
  ------------------------------------------------------------------ */
  const Accordion = {
    init() {
      document.querySelectorAll(".acc").forEach(acc => {
        acc.querySelectorAll(".acc-item__btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const item = btn.closest(".acc-item");
            const wasOpen = item.classList.contains("is-open");
            acc.querySelectorAll(".acc-item.is-open").forEach(i => {
              i.classList.remove("is-open");
              i.querySelector(".acc-item__btn").setAttribute("aria-expanded", "false");
            });
            if (!wasOpen) {
              item.classList.add("is-open");
              btn.setAttribute("aria-expanded", "true");
            }
          });
        });
      });
    }
  };

  /* ------------------------------------------------------------------
     TABS / FILTER
  ------------------------------------------------------------------ */
  const Filter = {
    init() {
      document.querySelectorAll("[data-filter-group]").forEach(group => {
        const tabs = group.querySelectorAll(".tab");
        const targetSel = group.dataset.filterTarget;
        const items = targetSel ? document.querySelectorAll(targetSel + " [data-cat]") : [];
        tabs.forEach(tab => {
          tab.addEventListener("click", () => {
            tabs.forEach(t => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
            tab.classList.add("is-active");
            tab.setAttribute("aria-selected", "true");
            const cat = tab.dataset.cat;
            items.forEach(item => {
              const show = cat === "all" || (item.dataset.cat || "").split(" ").includes(cat);
              item.classList.toggle("is-hidden", !show);
            });
          });
        });
      });
    }
  };

  /* ------------------------------------------------------------------
     FORMS — validate + simulated submit with loading/success states
  ------------------------------------------------------------------ */
  const Forms = {
    init() {
      document.querySelectorAll("form[data-validate]").forEach(form => {
        form.addEventListener("submit", e => {
          e.preventDefault();
          let valid = true;
          form.querySelectorAll("[required]").forEach(input => {
            const field = input.closest(".field");
            const bad = !input.value.trim() ||
              (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
            if (field) field.classList.toggle("is-error", bad);
            if (bad) valid = false;
          });
          if (!valid) return;
          const btn = form.querySelector('button[type="submit"]');
          const data = Forms.collect(form);
          // The visitor stays on the page: the result always appears as a popup notification.
          const succeed = () => {
            if (btn) btn.classList.remove("is-loading");
            if (form.closest("#consultModal")) ConsultModal.close();
            form.reset();
            Forms.successNotice(form);
          };
          // Bots fill the hidden honeypot field; the dashboard preview never sends anything.
          if (data.website || window.__BV_PREVIEW) { succeed(); return; }
          if (!Track.configured()) {
            // No database connected yet: offer to send the request on WhatsApp, from the popup.
            if (form.closest("#consultModal")) ConsultModal.close();
            Forms.whatsappNotice(form, data);
            return;
          }
          if (btn) btn.classList.add("is-loading");
          Track.lead(data).then(succeed).catch(() => {
            if (btn) btn.classList.remove("is-loading");
            Forms.errorNotice(data);
          });
        });
        form.querySelectorAll("input, select, textarea").forEach(input => {
          input.addEventListener("input", () => {
            const field = input.closest(".field");
            if (field) field.classList.remove("is-error");
          });
        });
      });
    },
    // Select values are stored with their English label so the dashboard reads them the same way.
    label(form, name) {
      const sel = form.querySelector('select[name="' + name + '"]');
      if (!sel || !sel.value) return "";
      const opt = sel.options[sel.selectedIndex];
      return (opt.getAttribute("data-en") || opt.textContent || sel.value).trim();
    },
    collect(form) {
      const fd = new FormData(form);
      const get = k => String(fd.get(k) || "").trim();
      // Any extra fields (event date, city, guests…) travel inside the message as "Label: value" lines.
      const known = ["name", "email", "phone", "company", "interest", "budget", "message", "website"];
      const extra = [];
      form.querySelectorAll("input[name], select[name], textarea[name]").forEach(el => {
        if (known.includes(el.name) || !String(el.value).trim()) return;
        const lab = el.id && form.querySelector('label[for="' + el.id + '"]');
        const label = ((lab && (lab.getAttribute("data-en") || lab.textContent)) || el.name).replace(/\s*\*\s*$/, "").trim();
        extra.push(label + ": " + (el.tagName === "SELECT" ? Forms.label(form, el.name) : String(el.value).trim()));
      });
      const msg = get("message");
      return {
        name: get("name"), email: get("email"), phone: get("phone"), company: get("company"),
        service: Forms.label(form, "interest"), budget: Forms.label(form, "budget"),
        message: extra.length ? extra.join("\n") + (msg ? "\n\n" + msg : "") : msg,
        website: get("website"), form: form.dataset.form || (form.closest("#consultModal") ? "consult" : "contact")
      };
    },
    waNumber() {
      const a = document.querySelector('a[href*="wa.me/"]');
      const m = a && a.getAttribute("href").match(/wa\.me\/(\d+)/);
      return m ? m[1] : "201090861397";
    },
    waLink(d) {
      const ar = I18n.lang === "ar";
      const rows = [
        ar ? "طلب جديد من الموقع" : "New inquiry from the website",
        (ar ? "الاسم: " : "Name: ") + d.name,
        d.company && (ar ? "الشركة: " : "Company: ") + d.company,
        d.email && (ar ? "البريد: " : "Email: ") + d.email,
        d.phone && (ar ? "الهاتف: " : "Phone: ") + d.phone,
        d.service && (ar ? "الخدمة: " : "Service: ") + d.service,
        d.budget && (ar ? "الميزانية: " : "Budget: ") + d.budget,
        d.message && (ar ? "الرسالة: " : "Message: ") + d.message
      ].filter(Boolean);
      return "https://wa.me/" + Forms.waNumber() + "?text=" + encodeURIComponent(rows.join("\n"));
    },
    // Reads the current-language text of an element from the page (so the dashboard can edit it).
    textOf(el) {
      if (!el) return "";
      const v = el.getAttribute("data-" + I18n.lang);
      return (v != null ? v : el.textContent).trim();
    },
    successNotice(form) {
      const ar = I18n.lang === "ar";
      const ok = form.dataset.success ? document.querySelector(form.dataset.success) : null;
      Notice.show({
        kind: "ok",
        title: Forms.textOf(ok && ok.querySelector("h3")) || (ar ? "استلمنا طلبك." : "Request received."),
        text: Forms.textOf(ok && ok.querySelector("p")) || (ar ? "سنتواصل معك خلال يوم عمل واحد." : "We'll reach out within one business day."),
        actions: [
          { label: ar ? "حسنًا" : "Done", primary: true },
          { label: ar ? "تحدّث معنا على واتساب" : "Chat on WhatsApp", href: "https://wa.me/" + Forms.waNumber() }
        ]
      });
    },
    whatsappNotice(form, d) {
      const ar = I18n.lang === "ar";
      Notice.show({
        kind: "wa",
        title: ar ? "خطوة أخيرة" : "One last step",
        text: ar ? "طلبك جاهز. أرسله عبر واتساب وسيرد عليك فريقنا مباشرة." : "Your request is ready. Send it on WhatsApp and our team will reply right away.",
        actions: [
          { label: ar ? "أرسل عبر واتساب" : "Send on WhatsApp", primary: true, href: Forms.waLink(d), onClick: () => setTimeout(() => { form.reset(); Forms.successNotice(form); }, 500) },
          { label: ar ? "إلغاء" : "Cancel" }
        ]
      });
    },
    errorNotice(d) {
      const ar = I18n.lang === "ar";
      Notice.show({
        kind: "err",
        title: ar ? "تعذّر الإرسال الآن" : "We couldn't send that",
        text: ar ? "حاول مرة أخرى بعد قليل، أو أرسل طلبك عبر واتساب." : "Please try again in a moment, or send your request on WhatsApp.",
        actions: [
          { label: ar ? "أرسل عبر واتساب" : "Send on WhatsApp", primary: true, href: Forms.waLink(d) },
          { label: ar ? "حاول مرة أخرى" : "Try again" }
        ]
      });
    }
  };

  /* ------------------------------------------------------------------
     NOTICE — popup notification shown after a form is sent
  ------------------------------------------------------------------ */
  const Notice = {
    el: null,
    last: null,
    icons: {
      ok: '<svg viewBox="0 0 46 32"><path pathLength="100" d="M1 18h7l3-6 4 12 3-6h4l5 5L43 7"/></svg>',
      wa: '<svg viewBox="0 0 46 32"><path pathLength="100" d="M34 15.5a11 11 0 0 1-16.8 9.4L11 27l1.9-6A11 11 0 1 1 34 15.5z"/></svg>',
      err: '<svg viewBox="0 0 46 32"><path pathLength="100" d="M23 6v13M23 25.5v.5"/></svg>'
    },
    build() {
      if (this.el) return this.el;
      const el = document.createElement("div");
      el.className = "modal-backdrop";
      el.id = "bvNotice";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-labelledby", "bvNoticeTitle");
      el.innerHTML = '<div class="modal modal--notice" role="document">' +
        '<button class="modal__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '<div class="notice__mark" aria-hidden="true"></div><h3 id="bvNoticeTitle"></h3><p class="notice__text" role="status"></p><div class="notice__actions"></div></div>';
      document.body.appendChild(el);
      el.querySelector(".modal__close").addEventListener("click", () => this.close());
      el.addEventListener("click", e => { if (e.target === el) this.close(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && el.classList.contains("is-open")) this.close(); });
      this.el = el;
      return el;
    },
    show({ kind = "ok", title, text, actions = [] }) {
      const el = this.build();
      if (!el.classList.contains("is-open")) this.last = document.activeElement;
      el.classList.remove("is-open");
      el.classList.toggle("notice--error", kind === "err");
      el.querySelector(".notice__mark").innerHTML = this.icons[kind] || this.icons.ok;
      el.querySelector("h3").textContent = title;
      el.querySelector(".notice__text").textContent = text;
      const box = el.querySelector(".notice__actions");
      box.replaceChildren();
      actions.forEach(a => {
        const b = document.createElement(a.href ? "a" : "button");
        b.className = "btn " + (a.primary ? "btn--primary" : "btn--ghost");
        if (a.href) { b.href = a.href; b.target = "_blank"; b.rel = "noopener"; } else b.type = "button";
        const s = document.createElement("span");
        s.textContent = a.label;
        b.appendChild(s);
        b.addEventListener("click", () => { if (a.onClick) a.onClick(); else if (!a.href) this.close(); });
        box.appendChild(b);
      });
      void el.offsetWidth; // restart the icon animation
      el.classList.add("is-open");
      document.body.classList.add("modal-open");
      setTimeout(() => { const f = box.querySelector(".btn--primary") || box.querySelector(".btn"); if (f) f.focus({ preventScroll: true }); }, 350);
    },
    close() {
      if (!this.el || !this.el.classList.contains("is-open")) return;
      this.el.classList.remove("is-open");
      if (!document.querySelector(".modal-backdrop.is-open")) document.body.classList.remove("modal-open");
      if (this.last && this.last.focus) { try { this.last.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }
  };

  /* ------------------------------------------------------------------
     TRACK — privacy-friendly visit counter + lead storage (Supabase).
     Configured from the dashboard; does nothing until a URL and key exist.
     No cookies: an anonymous random ID in localStorage counts unique visitors.
  ------------------------------------------------------------------ */
  /* @cms-backend-start */
  const BACKEND = {"url":"https://wisvxfckzwnubcnuciym.supabase.co","key":"sb_publishable_3uQeD9JauSXVJicCX3ZwLQ_PM-hbNbx"};
  /* @cms-backend-end */
  const Track = {
    configured() { return !!(BACKEND.url && BACKEND.key) && !window.__BV_PREVIEW; },
    trackable() {
      if (!this.configured()) return false;
      if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname)) return false;
      if (navigator.webdriver || navigator.doNotTrack === "1" || window.doNotTrack === "1") return false;
      try { if (localStorage.getItem("bv-no-track") === "1") return false; } catch (e) { /* ignore */ }
      return true;
    },
    send(table, row) {
      const headers = { apikey: BACKEND.key, "Content-Type": "application/json", Prefer: "return=minimal" };
      if (/^eyJ/.test(BACKEND.key)) headers.Authorization = "Bearer " + BACKEND.key;
      return fetch(BACKEND.url.replace(/\/+$/, "") + "/rest/v1/" + table, {
        method: "POST", headers, body: JSON.stringify(row), keepalive: true, credentials: "omit"
      }).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); });
    },
    uid() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); },
    visitor() {
      try {
        let id = localStorage.getItem("bv-vid"), fresh = false;
        if (!id) { id = this.uid(); localStorage.setItem("bv-vid", id); fresh = true; }
        return { id, fresh };
      } catch (e) { return { id: "", fresh: false }; }
    },
    session() {
      try { let s = sessionStorage.getItem("bv-sid"); if (!s) { s = this.uid(); sessionStorage.setItem("bv-sid", s); } return s; }
      catch (e) { return ""; }
    },
    // First touch of the visit: external referrer host and UTM tags.
    source() {
      try { const saved = sessionStorage.getItem("bv-src"); if (saved) return JSON.parse(saved); } catch (e) { /* ignore */ }
      const q = new URLSearchParams(location.search);
      let ref = "";
      try { if (document.referrer) { const u = new URL(document.referrer); if (u.host !== location.host) ref = u.host.replace(/^www\./, ""); } } catch (e) { /* ignore */ }
      const cut = (v, n) => String(v || "").slice(0, n);
      const src = { referrer: cut(ref, 300), utm_source: cut(q.get("utm_source"), 120), utm_medium: cut(q.get("utm_medium"), 120), utm_campaign: cut(q.get("utm_campaign"), 160) };
      try { sessionStorage.setItem("bv-src", JSON.stringify(src)); } catch (e) { /* ignore */ }
      return src;
    },
    page() {
      let p = "";
      try { p = decodeURIComponent(location.pathname.split("/").pop() || ""); } catch (e) { /* ignore */ }
      p = p || "index.html";
      if (!/\.html?$/i.test(p)) p += ".html";
      return p.slice(0, 300);
    },
    pageview() {
      if (!this.trackable()) return;
      const v = this.visitor(), w = window.innerWidth;
      let tz = "";
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
      this.send("bv_pageviews", Object.assign({
        path: this.page(), title: document.title.slice(0, 300), visitor: v.id, session: this.session(), is_new: v.fresh,
        lang: doc.lang || "en", device: w < 768 ? "mobile" : w < 1100 ? "tablet" : "desktop", tz: tz.slice(0, 64)
      }, this.source())).catch(() => { /* never block the page */ });
    },
    lead(d) {
      const cut = (v, n) => String(v || "").slice(0, n);
      return this.send("bv_leads", Object.assign({
        name: cut(d.name, 200), email: cut(d.email, 200), phone: cut(d.phone, 60), company: cut(d.company, 200),
        service: cut(d.service, 120), budget: cut(d.budget, 120), message: cut(d.message, 5000), form: d.form,
        page: this.page(), lang: doc.lang || "en", visitor: this.visitor().id
      }, this.source()));
    }
  };

  /* ------------------------------------------------------------------
     WHATSAPP — floating chat button, always in view while scrolling
  ------------------------------------------------------------------ */
  const WhatsAppFab = {
    init() {
      const a = document.createElement("a");
      a.className = "wa-fab";
      a.target = "_blank";
      a.rel = "noopener";
      a.href = "https://wa.me/" + Forms.waNumber();
      a.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-5.9C5 10 9.9 5.2 16 5.2S27 10 27 15.9 22.1 26.4 16 26.4zm6-7.8c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.3-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.5-.6-.8-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 2-.8 2.2-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z"/></svg>' +
        '<span class="wa-fab__label" data-en="Chat with us on WhatsApp" data-ar="تحدّث معنا على واتساب">Chat with us on WhatsApp</span>';
      // Opens the chat with a friendly first line in the visitor's language.
      a.addEventListener("click", () => {
        const msg = I18n.lang === "ar" ? "مرحبًا براند فايتلز، أود معرفة المزيد عن خدماتكم." : "Hi Brand Vitals, I'd like to know more about your services.";
        a.href = "https://wa.me/" + Forms.waNumber() + "?text=" + encodeURIComponent(msg);
      });
      document.body.appendChild(a);
      // Appear once the loader has finished, then show the label briefly.
      const show = () => {
        a.classList.add("is-in");
        if (reduceMotion) return;
        setTimeout(() => { a.classList.add("is-intro"); setTimeout(() => a.classList.remove("is-intro"), 3600); }, 1400);
      };
      const wait = () => (document.body.classList.contains("is-loaded") ? setTimeout(show, 500) : setTimeout(wait, 200));
      wait();
    }
  };

  /* ------------------------------------------------------------------
     CONSULT MODAL — glass overlay form, opens from any [data-consult]
  ------------------------------------------------------------------ */
  const ConsultModal = {
    injected: false,
    close() { /* replaced once the modal is injected */ },
    inject() {
      if (this.injected || !document.querySelector("[data-consult]")) return;
      const tpl = document.createElement("div");
      tpl.className = "modal-backdrop";
      tpl.id = "consultModal";
      tpl.setAttribute("role", "dialog");
      tpl.setAttribute("aria-modal", "true");
      tpl.innerHTML = `
        <div class="modal">
          <button class="modal__close" type="button" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <p class="eyebrow" data-en="Free consultation" data-ar="استشارة مجانية">Free consultation</p>
          <h3 style="margin-top:.6rem" data-en="Book your 30 minutes." data-ar="احجز الـ30 دقيقة الخاصة بك.">Book your 30 minutes.</h3>
          <p class="sub" data-en="A strategist, not a salesperson, will call you within one business day." data-ar="خبير استراتيجي، لا مندوب مبيعات، سيتصل بك خلال يوم عمل واحد.">A strategist, not a salesperson, will call you within one business day.</p>
          <form data-validate data-success="#modalSuccess" novalidate>
            <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
            <div class="form-grid">
              <div class="field">
                <label data-en="Full name *" data-ar="الاسم الكامل *">Full name *</label>
                <input name="name" type="text" required autocomplete="name" data-en-ph="Your name" data-ar-ph="اسمك" placeholder="Your name">
                <span class="err" data-en="Please enter your name." data-ar="يرجى إدخال اسمك.">Please enter your name.</span>
              </div>
              <div class="field">
                <label data-en="Phone / WhatsApp *" data-ar="الهاتف / واتساب *">Phone / WhatsApp *</label>
                <input name="phone" type="tel" required autocomplete="tel" dir="ltr" placeholder="+20 …">
                <span class="err" data-en="Please enter your number." data-ar="يرجى إدخال رقمك.">Please enter your number.</span>
              </div>
              <div class="field field--full">
                <label data-en="Business email *" data-ar="البريد الإلكتروني *">Business email *</label>
                <input name="email" type="email" required autocomplete="email" placeholder="you@company.com">
                <span class="err" data-en="Please enter a valid email." data-ar="يرجى إدخال بريد صحيح.">Please enter a valid email.</span>
              </div>
              <div class="field field--full">
                <label data-en="What do you want to grow?" data-ar="ما الذي تريد تنميته؟">What do you want to grow?</label>
                <textarea name="message" rows="3" data-en-ph="Tell us in one or two lines…" data-ar-ph="أخبرنا في سطر أو سطرين…" placeholder="Tell us in one or two lines…"></textarea>
              </div>
              <div class="field--full">
                <button class="btn btn--primary btn--lg" type="submit" style="width:100%">
                  <span class="spinner" aria-hidden="true"></span>
                  <span class="btn__label" data-en="Request my consultation" data-ar="اطلب استشارتي">Request my consultation</span>
                </button>
                <p class="mono" style="margin-top:.9rem; text-align:center; color:var(--text-3)" data-en="No obligation · No pitch deck" data-ar="بلا التزام · بلا عرض بيعي">No obligation · No pitch deck</p>
              </div>
            </div>
          </form>
          <div class="form-success" id="modalSuccess" role="status">
            <span class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
            <h3 data-en="Request received." data-ar="استلمنا طلبك.">Request received.</h3>
            <p style="color:var(--text-2)" data-en="We'll reach out within one business day." data-ar="سنتواصل معك خلال يوم عمل واحد.">We'll reach out within one business day.</p>
          </div>
        </div>`;
      document.body.appendChild(tpl);
      this.injected = true;

      const open = () => {
        tpl.classList.add("is-open");
        document.body.classList.add("modal-open");
        const first = tpl.querySelector("input");
        setTimeout(() => first && first.focus(), 420);
      };
      const close = () => {
        tpl.classList.remove("is-open");
        document.body.classList.remove("modal-open");
      };
      this.close = close;
      document.querySelectorAll("[data-consult]").forEach(el =>
        el.addEventListener("click", e => { e.preventDefault(); open(); })
      );
      tpl.querySelector(".modal__close").addEventListener("click", close);
      tpl.addEventListener("click", e => { if (e.target === tpl) close(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }
  };

  /* ------------------------------------------------------------------
     MOUSE PARALLAX — hero orbs & aurora drift with the cursor
  ------------------------------------------------------------------ */
  const MouseParallax = {
    init() {
      if (!finePointer || reduceMotion) return;
      const els = document.querySelectorAll("[data-mousepara]");
      if (!els.length) return;
      let mx = 0, my = 0, ticking = false;
      window.addEventListener("mousemove", e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            els.forEach(el => {
              const s = parseFloat(el.dataset.mousepara) || 14;
              el.style.translate = `${mx * s}px ${my * s}px`;
            });
            ticking = false;
          });
        }
      }, { passive: true });
    }
  };

  /* ------------------------------------------------------------------
     MISC — year, marquee duplication
  ------------------------------------------------------------------ */
  const Misc = {
    init() {
      document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
      // Duplicate marquee tracks for seamless loop
      document.querySelectorAll(".marquee").forEach(mq => {
        const track = mq.querySelector(".marquee__track");
        if (track && mq.children.length === 1) mq.appendChild(track.cloneNode(true));
      });
    }
  };

  /* ------------------------------------------------------------------
     BOOT
  ------------------------------------------------------------------ */
  const boot = () => {
    ConsultModal.inject();
    WhatsAppFab.init();
    Theme.init();
    I18n.init();
    MouseParallax.init();
    Loader.init();
    Nav.init();
    Progress.init();
    Reveal.init();
    Counters.init();
    Signals.init();
    Magnetic.init();
    Ripple.init();
    Tilt.init();
    Parallax.init();
    Accordion.init();
    Filter.init();
    Forms.init();
    Misc.init();
    Track.pageview();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
