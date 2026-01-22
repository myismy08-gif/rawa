/* =========================================================
   NAHJ Website Script
   - Typing effect
   - Tracks (beneficiaries) expand/collapse
   - Footer Newsletter -> EmailJS
========================================================= */

// =========================
// Typing effect (Hero)
// =========================
(() => {
  const typingEl = document.getElementById("typing-text");
  if (!typingEl) return;

  const phrases = [
    "Training & Health Education",
    "التدريب والتثقيف الصحي",
    "For Business Services",
  ];

  let p = 0;
  let i = 0;
  let deleting = false;

  function typeLoop() {
    const current = phrases[p];

    typingEl.textContent = deleting
      ? current.slice(0, i--)
      : current.slice(0, i++);

    if (!deleting && i > current.length + 12) {
      deleting = true;
    }

    if (deleting && i < 0) {
      deleting = false;
      p = (p + 1) % phrases.length;
      i = 0;
    }

    setTimeout(typeLoop, deleting ? 45 : 65);
  }

  typeLoop();
})();

// =========================
// Tracks expand/collapse
// =========================
(() => {
  const tracks = document.querySelectorAll(".track");
  if (!tracks.length) return;

  tracks.forEach((card) => {
    card.addEventListener("click", () => {
      tracks.forEach((c) => {
        if (c !== card) c.classList.remove("active");
      });
      card.classList.toggle("active");
    });
  });
})();

// =========================
// Newsletter -> EmailJS
// =========================
(() => {
  const newsletterForm = document.getElementById("newsletter-form");
  if (!newsletterForm) return;

  const success = document.getElementById("success");
  const error = document.getElementById("error");

  // ✅ Your EmailJS configuration
  const EMAILJS_PUBLIC_KEY = "KObVMqi571bw1E-YV"; // ✅ Public Key
  const EMAILJS_SERVICE_ID = "service_vo34r5q"; // 🔴 Replace with your Service ID
  const EMAILJS_TEMPLATE_ID = "template_eemy0hr"; // ✅ Template ID

  // Hide messages at start
  if (success) success.style.display = "none";
  if (error) error.style.display = "none";

  function showMessage(el, ms = 2500) {
    if (!el) return;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, ms);
  }

  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide previous state
    if (success) success.style.display = "none";
    if (error) error.style.display = "none";

    const btn = newsletterForm.querySelector("button[type='submit']");
    const oldText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جارٍ الإرسال...";
    }

    try {
      // Check library loaded
      if (typeof emailjs === "undefined") {
        throw new Error("EmailJS library not loaded");
      }

      // Init EmailJS (safe to call multiple times)
      emailjs.init(EMAILJS_PUBLIC_KEY);

      // Send form fields (name="email" and name="message")
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        newsletterForm
      );

      showMessage(success, 2500);
      newsletterForm.reset();
    } catch (err) {
      console.error("EmailJS Error:", err);
      showMessage(error, 3000);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText || "إرسال";
      }
    }
  });
})();

// =========================
// Navbar Axes Dropdown (محاورنا)
// =========================
(() => {
  const dropdown = document.querySelector(".nav-dropdown");
  const btn = document.querySelector(".nav-dropbtn");
  const menu = document.querySelector(".nav-dropdown-menu");

  if (!dropdown || !btn || !menu) return;

  function closeMenu() {
    dropdown.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    dropdown.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }

  // ✅ Mobile / touch: open by click
  btn.addEventListener("click", (e) => {
    // On desktop we prefer hover behavior (CSS)
    const isMobile = window.matchMedia("(max-width: 980px)").matches;
    if (!isMobile) return;

    e.preventDefault();
    e.stopPropagation();

    const isOpen = dropdown.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Prevent closing when tapping inside menu (mobile)
  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close on outside click
  document.addEventListener("click", () => closeMenu());

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // If screen resized to desktop: close "open" state
  window.addEventListener("resize", () => {
    const isMobile = window.matchMedia("(max-width: 980px)").matches;
    if (!isMobile) closeMenu();
  });
})();

/* =========================
   Nahj Mobile Navbar Toggle
========================= */
(() => {
  const nav = document.querySelector(".navbar");
  const btn = document.querySelector(".nav-toggle-btn");
  if (!nav || !btn) return;

  function setExpanded(isOpen){
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = nav.classList.toggle("nav-open");
    setExpanded(isOpen);
  });

  // Close on outside click (mobile)
  document.addEventListener("click", () => {
    if (!window.matchMedia("(max-width: 980px)").matches) return;
    nav.classList.remove("nav-open");
    setExpanded(false);
  });

  // Prevent closing when clicking inside navbar
  nav.addEventListener("click", (e) => e.stopPropagation());

  // Close after clicking a link (mobile)
  nav.querySelectorAll(".nav-links a").forEach(a => {
    a.addEventListener("click", () => {
      if (!window.matchMedia("(max-width: 980px)").matches) return;
      nav.classList.remove("nav-open");
      setExpanded(false);
    });
  });

  // Close on resize to desktop
  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 980px)").matches) {
      nav.classList.remove("nav-open");
      setExpanded(false);
    }
  });
})();
