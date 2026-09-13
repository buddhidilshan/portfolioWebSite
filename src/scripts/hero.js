/**
 * Hero behaviour, ported from the React/Motion original to plain JS.
 * Same motion constants, same pointer maths, same demo path — the only
 * difference is that springs and transforms are hand-rolled instead of
 * coming from `motion/react`.
 */
import { createPortraitRenderer } from "./portrait-renderer.js";

const MOTION = {
  stiffness: 120,
  damping: 20,
  mass: 0.8,
  headTravel: 0.006,
  headTilt: 0.018,
  nodTravel: 0.008,
  idleStrength: 0.16,
  demoDuration: 6400,
};

const clamp = (n, min = -1, max = 1) => Math.max(min, Math.min(max, n));

function normalizePointer(clientX, clientY, rect, vw, vh) {
  // Aim relative to the head, NOT the midpoint of the browser window.
  const eyeX = rect.left + rect.width * 0.646;
  const eyeY = rect.top + rect.height * 0.245;
  return {
    x: clamp((clientX - eyeX) / Math.max(260, vw * 0.32)),
    y: clamp((clientY - eyeY) / Math.max(220, vh * 0.46)),
  };
}

const DEMO_STOPS = [
  [0, 0, 0],
  [0.18, -0.9, 0.1],
  [0.4, 0.95, -0.15],
  [0.58, 0.75, -0.65],
  [0.76, -0.6, 0.6],
  [1, 0, 0],
];

function demoPose(progress) {
  const p = clamp(progress, 0, 1);
  for (let i = 1; i < DEMO_STOPS.length; i++) {
    if (p <= DEMO_STOPS[i][0]) {
      const a = DEMO_STOPS[i - 1];
      const b = DEMO_STOPS[i];
      const t = (p - a[0]) / (b[0] - a[0]);
      const e = t * t * (3 - 2 * t);
      return { x: a[1] + (b[1] - a[1]) * e, y: a[2] + (b[2] - a[2]) * e };
    }
  }
  return { x: 0, y: 0 };
}

/** A critically-ish damped spring, stepped per frame. Mirrors motion's useSpring. */
function createSpring({ stiffness, damping, mass }) {
  let value = 0;
  let velocity = 0;
  let target = 0;
  return {
    set: (v) => { target = v; },
    jump: (v) => { target = v; value = v; velocity = 0; },
    get: () => value,
    step(dt) {
      const step = Math.min(dt, 1 / 30);
      const force = -stiffness * (value - target) - damping * velocity;
      velocity += (force / mass) * step;
      value += velocity * step;
      return value;
    },
  };
}

export function initHero(root) {
  if (!root) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stage = root.querySelector(".art-stage");
  const canvas = root.querySelector(".portrait-canvas");
  const image = root.querySelector(".portrait-image");
  const cards = Array.from(root.querySelectorAll(".feature-position"));

  let paused = false;
  let demo = false;
  let demoStart = 0;
  let lastInput = -10000;
  let nodAt = -10000;
  const disabled = () => paused || reduced.matches;

  const springX = createSpring(MOTION);
  const springY = createSpring(MOTION);

  function aim(clientX, clientY) {
    if (disabled() || !stage) return;
    const p = normalizePointer(
      clientX, clientY, stage.getBoundingClientRect(),
      window.innerWidth, window.innerHeight,
    );
    springX.set(p.x);
    springY.set(p.y);
    lastInput = performance.now();
  }

  function reset() {
    springX.set(0);
    springY.set(0);
    lastInput = performance.now();
  }

  function lookAt(element) {
    const r = element.getBoundingClientRect();
    aim(r.left + r.width / 2, r.top + r.height / 2);
    nodAt = performance.now();
  }

  // ---- Typewriter ------------------------------------------------------
  const line = root.querySelector(".typewriter-line");
  const caret = root.querySelector(".typewriter-caret");
  const HEADLINE = root.querySelector(".typewriter-measure")?.textContent ?? "";
  function typewrite() {
    if (!line) return;
    if (reduced.matches) {
      line.textContent = HEADLINE;
      if (caret) caret.hidden = true;
      return;
    }
    line.textContent = "";
    if (caret) caret.hidden = false;
    let index = 0;
    window.setTimeout(() => {
      const timer = window.setInterval(() => {
        index += 1;
        line.textContent = HEADLINE.slice(0, index);
        if (index >= HEADLINE.length) {
          window.clearInterval(timer);
          if (caret) caret.hidden = true;
        }
      }, 38);
    }, 600);
  }
  typewrite();

  // ---- Service pills ---------------------------------------------------
  const selected = new Set();
  const pills = Array.from(root.querySelectorAll(".service-pill"));
  const emptyNote = root.querySelector(".empty-feedback");
  const banner = root.querySelector(".feedback-banner-wrap");
  const bannerList = root.querySelector(".feedback-services");

  function syncServices() {
    pills.forEach((pill) => {
      pill.setAttribute("aria-pressed", selected.has(pill.dataset.pill) ? "true" : "false");
    });
    cards.forEach((position) => {
      const button = position.querySelector(".feature-card");
      button.setAttribute("aria-pressed", selected.has(button.dataset.service) ? "true" : "false");
    });
    const any = selected.size > 0;
    if (emptyNote) emptyNote.hidden = any;
    if (banner) banner.hidden = !any;
    if (bannerList) bannerList.textContent = Array.from(selected).join(", ");
  }

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const name = pill.dataset.pill;
      if (selected.has(name)) selected.delete(name);
      else selected.add(name);
      syncServices();
    });
  });

  cards.forEach((position) => {
    const button = position.querySelector(".feature-card");
    button.addEventListener("click", () => {
      lookAt(button);
      selected.add(button.dataset.service);
      syncServices();
    });
    button.addEventListener("focus", () => lookAt(button));
    button.addEventListener("blur", reset);
  });

  syncServices();

  // ---- Motion controls -------------------------------------------------
  const motionButton = root.querySelector('[data-action="motion"]');
  const demoButton = root.querySelector('[data-action="demo"]');

  function syncControls() {
    const off = disabled();
    if (motionButton) {
      motionButton.setAttribute("aria-pressed", off ? "false" : "true");
      motionButton.disabled = reduced.matches;
      motionButton.querySelector("span").textContent = reduced.matches
        ? "Reduced motion"
        : paused
          ? "Motion paused"
          : "Motion on";
    }
    if (demoButton) {
      demoButton.setAttribute("aria-pressed", demo ? "true" : "false");
      demoButton.disabled = off;
      demoButton.querySelector("span").textContent = demo ? "Stop demo" : "Play demo";
    }
    root.dataset.motion = off ? "off" : "on";
  }

  motionButton?.addEventListener("click", () => {
    paused = !paused;
    demo = false;
    if (paused) { springX.jump(0); springY.jump(0); }
    syncControls();
  });

  demoButton?.addEventListener("click", () => {
    demo = !demo;
    demoStart = performance.now();
    syncControls();
  });

  reduced.addEventListener("change", () => { syncControls(); typewrite(); });
  syncControls();

  // ---- Pointer ---------------------------------------------------------
  window.addEventListener("pointermove", (event) => {
    if (demo || event.pointerType === "touch") return;
    aim(event.clientX, event.clientY);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", reset);
  window.addEventListener("blur", reset);

  // ---- Nav dialogs -----------------------------------------------------
  const dialogs = new Map();
  document.querySelectorAll(".hero-dialog").forEach((dialog) => {
    dialogs.set(dialog.dataset.panel, dialog);

    dialog.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());

    // Click outside the panel closes it.
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const b = dialog.getBoundingClientRect();
      const outside =
        event.clientX < b.left || event.clientX > b.right ||
        event.clientY < b.top || event.clientY > b.bottom;
      if (outside) dialog.close();
    });

    dialog.addEventListener("close", () => { document.body.style.overflow = ""; });
  });

  root.querySelectorAll("[data-panel]").forEach((trigger) => {
    if (trigger.tagName === "DIALOG") return;
    trigger.addEventListener("click", (event) => {
      const dialog = dialogs.get(trigger.dataset.panel);
      if (!dialog) return;
      event.preventDefault();
      document.body.style.overflow = "hidden";
      dialog.showModal();
    });
  });

  // Contact form — builds a plain-text inquiry the visitor can copy or save.
  const contactForm = document.querySelector(".contact-form-dialog");
  if (contactForm) {
    const notice = document.querySelector(".dialog-notice");
    const inquiryText = () => {
      const data = new FormData(contactForm);
      const picked = selected.size ? Array.from(selected).join(", ") : "General enquiry";
      return `ENQUIRY FOR BUDDHI DILSHAN\n\nName: ${String(data.get("name")).trim()}\n` +
        `Email: ${String(data.get("email")).trim()}\nInterested in: ${picked}\n\n` +
        `${String(data.get("message")).trim()}\n`;
    };

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      try {
        await navigator.clipboard.writeText(inquiryText());
        notice.textContent = "Copied. Paste it into an email whenever you're ready.";
      } catch {
        notice.textContent = "Clipboard is blocked here — use Save enquiry instead.";
      }
    });

    document.querySelector('[data-action="save-enquiry"]')?.addEventListener("click", () => {
      if (!contactForm.reportValidity()) return;
      const blob = new Blob([inquiryText()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "enquiry.txt";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notice.textContent = "Saved as a text file. Nothing has been sent.";
    });
  }

  // ---- Mobile navigation -----------------------------------------------
  const toggle = root.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobile-navigation");

  function setMenu(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.dataset.open = open ? "true" : "false";
    mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
    // A menu choice can open a dialog, which owns the scroll lock from then on.
    if (open) mobileNav.querySelector("a, button")?.focus();
    else if (!document.querySelector(".hero-dialog[open]")) document.body.style.overflow = "";
    if (open) document.body.style.overflow = "hidden";
  }

  toggle?.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Any choice inside the sheet closes it; panel buttons then open their dialog.
  mobileNav?.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileNav?.dataset.open === "true") {
      setMenu(false);
      toggle?.focus();
    }
  });

  // A resize past the desktop breakpoint should never leave the sheet stuck open.
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  // ---- Selected work: reveal on scroll ---------------------------------
  const reveals = document.querySelectorAll("[data-work-reveal]");
  if (reveals.length) {
    reveals.forEach((el) => {
      el.style.setProperty("--reveal-delay", `${el.dataset.delay || 0}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        // The underline is a sibling of the word it belongs to.
        entry.target.closest(".work-word")?.querySelector(".work-underline")
          ?.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -24px 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  // ---- Selected work: card tilt and spotlight --------------------------
  document.querySelectorAll(".work-card").forEach((card) => {
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    function apply() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      card.style.transform =
        `perspective(1000px) rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(apply) : 0;
    }

    function start() { if (!raf) raf = requestAnimationFrame(apply); }

    card.addEventListener("pointermove", (event) => {
      if (disabled() || event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      tx = (0.5 - py) * 3;
      ty = (px - 0.5) * 3;
      card.style.setProperty("--spot-x", `${px * 100}%`);
      card.style.setProperty("--spot-y", `${py * 100}%`);
      start();
    });

    const rest = () => { tx = 0; ty = 0; start(); };
    card.addEventListener("pointerleave", rest);
    card.addEventListener("pointercancel", rest);
  });

  // ---- Render loop -----------------------------------------------------
  const renderer = createPortraitRenderer(canvas, canvas.dataset.src, {
    ...MOTION,
    onReady: () => { canvas.style.opacity = "1"; if (image) image.style.opacity = "0"; },
    onFallback: () => { canvas.style.opacity = "0"; if (image) image.style.opacity = "1"; },
  });

  let previous = performance.now();
  let visible = true;

  function frame(now) {
    const dt = (now - previous) / 1000;
    previous = now;

    if (visible && !document.hidden) {
      if (demo) {
        const progress = (now - demoStart) / MOTION.demoDuration;
        const pose = demoPose(progress);
        springX.set(pose.x);
        springY.set(pose.y);
        lastInput = now;
        if (progress >= 1) { demo = false; reset(); syncControls(); }
      }

      springX.step(dt);
      springY.step(dt);

      let x = 0;
      let y = 0;
      if (!disabled()) {
        const resting = now - lastInput > 1800;
        const t = now / 1000;
        const n = (now - nodAt) / 650;
        const nod = n > 0 && n < 1 ? Math.sin(n * Math.PI) * 0.22 : 0;
        x = springX.get() + (resting ? Math.sin(t * 0.5) * MOTION.idleStrength : 0);
        y = springY.get() + (resting ? Math.sin(t * 0.7) * MOTION.idleStrength * 0.6 : 0) + nod;
      }

      renderer.draw(x, y, now / 1000, disabled() ? 0 : 1);

      // Card parallax — same depth mapping as the original.
      cards.forEach((position) => {
        const depth = Number(position.dataset.depth) || 8;
        const float = disabled() ? 0 : Math.sin(now / 1000 / (5 + depth / 8) * Math.PI * 2) * 4;
        position.style.transform =
          `translate3d(${(-x * depth).toFixed(2)}px, ${(-y * depth * 0.55 + float).toFixed(2)}px, 0)` +
          ` rotate(${(x * 0.6).toFixed(3)}deg)`;
      });
    }

    requestAnimationFrame(frame);
  }

  if (stage) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; },
      { threshold: 0 }).observe(stage);
  }
  requestAnimationFrame(frame);
}
