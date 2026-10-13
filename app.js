"use strict";
document.documentElement.classList.add("js");

const menu = document.querySelector(".menu");
const nav = document.querySelector("#navigation");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  }),
);
const enquiry = document.querySelector("#enquiry-dialog");
const privacy = document.querySelector("#privacy-dialog");
let lastFocus;
function openDialog(dialog) {
  lastFocus = document.activeElement;
  dialog.showModal();
  document.body.style.overflow = "hidden";
}
document.querySelectorAll("[data-enquire]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelector('[name="interest"]').value =
      button.dataset.interest || "Demo class";
    document.querySelector("#form-status").textContent = "";
    openDialog(enquiry);
  }),
);
document
  .querySelector("#privacy-open")
  .addEventListener("click", () => openDialog(privacy));
[enquiry, privacy].forEach((dialog) => {
  dialog
    .querySelector(".close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    lastFocus?.focus();
  });
});
document.querySelector("#enquiry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name;
  const city = form.elements.city;
  if (name.value.trim().length < 2) {
    name.setCustomValidity("Please enter your name.");
    name.reportValidity();
    return;
  }
  if (!city.value.trim()) {
    city.setCustomValidity("Please enter your city.");
    city.reportValidity();
    return;
  }
  const data = new FormData(form);
  const message = `Hello GIFM Traders Academy, I would like to enquire about ${data.get("interest")}.\n\nName: ${data.get("name").trim()}\nCity: ${data.get("city").trim()}\nExperience: ${data.get("experience")}${data.get("question").trim() ? "\nQuestion: " + data.get("question").trim() : ""}\n\nPlease share the available schedule, format, language, fees and course details.`;
  const url = "https://wa.me/917357114500?text=" + encodeURIComponent(message);
  window.open(url, "_blank", "noopener,noreferrer");
  const status = document.querySelector("#form-status");
  status.replaceChildren(
    document.createTextNode(
      "Send the draft in WhatsApp to complete your enquiry. ",
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open WhatsApp again ↗";
  status.append(link);
});
document
  .querySelectorAll("input")
  .forEach((input) =>
    input.addEventListener("input", () => input.setCustomValidity("")),
  );
document.querySelector("#year").textContent = new Date().getFullYear();

/* =========================================================
   Trading animations
   ========================================================= */
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* Scrolling candlestick chart (decorative) with a moving-average line */
function initCandles(canvas, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const bodyW = opts.width || 12;
  const step = bodyW + (opts.gap || 9);
  const speed = opts.speed || 0.3;
  const maPeriod = 8;
  let W = 0;
  let H = 0;
  let offset = 0;
  let price = 0;
  let raf = 0;
  const candles = [];

  function nextCandle() {
    const o = price;
    let c = o + (Math.random() - 0.5) * 0.2 - o * 0.04; // mean-reverting walk
    c = Math.max(-1, Math.min(1, c));
    const h = Math.max(o, c) + Math.random() * 0.08;
    const l = Math.min(o, c) - Math.random() * 0.08;
    price = c;
    return { o, c, h, l };
  }
  const y = (p) => H * 0.5 - p * H * 0.36;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const need = Math.ceil(W / step) + 3;
    while (candles.length < need) candles.push(nextCandle());
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.5;
    candles.forEach((k, i) => {
      const x = i * step - offset;
      const color =
        k.c >= k.o ? "rgba(34,211,138,.8)" : "rgba(255,93,108,.75)";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + bodyW / 2, y(k.h));
      ctx.lineTo(x + bodyW / 2, y(k.l));
      ctx.stroke();
      ctx.fillRect(
        x,
        y(Math.max(k.o, k.c)),
        bodyW,
        Math.max(2, Math.abs(y(k.o) - y(k.c))),
      );
    });
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,182,30,.85)";
    ctx.lineWidth = 2;
    for (let i = maPeriod; i < candles.length; i++) {
      let sum = 0;
      for (let j = i - maPeriod + 1; j <= i; j++) sum += candles[j].c;
      const px = i * step - offset + bodyW / 2;
      const py = y(sum / maPeriod);
      i === maPeriod ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function loop() {
    offset += speed;
    if (offset >= step) {
      offset -= step;
      candles.shift();
      candles.push(nextCandle());
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);
  if (reduceMotion) return;

  // animate only while the canvas is on screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }).observe(canvas);
  } else {
    raf = requestAnimationFrame(loop);
  }
}
initCandles(document.querySelector("#hero-candles"));
initCandles(document.querySelector("#footer-candles"), {
  width: 10,
  gap: 8,
  speed: 0.2,
});

/* Scroll reveals: cards fade up, "From" lines get struck through, CTA chart draws */
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  document
    .querySelectorAll(
      ".learning-grid article, .batch-grid article, .audience-grid article, .faqs details, .community, .section-heading, .gallery figure",
    )
    .forEach((el) => {
      const siblings = el.parentElement ? [...el.parentElement.children] : [];
      el.style.setProperty("--d", siblings.indexOf(el) * 0.09 + "s");
      el.classList.add("reveal");
      io.observe(el);
    });

  document
    .querySelectorAll(".comparison-list article, .final-cta")
    .forEach((el) => io.observe(el));
} else {
  document
    .querySelectorAll(".comparison-list article, .final-cta")
    .forEach((el) => el.classList.add("in"));
}