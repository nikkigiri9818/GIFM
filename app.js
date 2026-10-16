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




/* =========================================================
   Paste this at the END of app.js
   - Counts the stats up (8, 5,000, 90) when they scroll into view
   - Fades the new cards in (steps, reviews, stats, mentor facts)
   ========================================================= */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduce) return;

  const format = (n) => n.toLocaleString("en-IN");

  function countUp(el) {
    const end = Number(el.dataset.count);
    const duration = 1400;
    const start = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      el.textContent = format(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        if (entry.target.dataset.count) countUp(entry.target);
        else entry.target.classList.add("in");
      });
    },
    { threshold: 0.25 },
  );

  document.querySelectorAll("[data-count]").forEach((el) => {
    el.textContent = "0";
    io.observe(el);
  });

  document
    .querySelectorAll(
      ".steps li, .review-card, .stats > div, .mentor-facts li",
    )
    .forEach((el) => {
      const index = [...el.parentElement.children].indexOf(el);
      el.style.setProperty("--d", index * 0.09 + "s");
      el.classList.add("reveal");
      io.observe(el);
    });
})();





"use strict";
document.documentElement.classList.add("js");

/* =========================================================
   EDIT THESE VALUES FOR EACH WEBINAR
   ========================================================= */
const WEBINAR = {
  // Start of the live session, in Indian time (IST = +05:30).
  // Format: YYYY-MM-DDTHH:MM:SS+05:30   (leave "" if the date is not fixed yet)
  startISO: "2026-11-08T19:00:00+05:30",

  // WhatsApp number that receives registrations (country code, no + or spaces)
  whatsapp: "917357114500",

  // Optional: a Google Apps Script / form endpoint that also saves each lead.
  // Leave "" to use WhatsApp only.
  leadEndpoint: "",
};

/* ---------- Mobile menu ---------- */
const menu = document.querySelector(".menu");
const nav = document.querySelector("#navigation");
if (menu && nav) {
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
}

/* ---------- Dialogs ---------- */
const registerDialog = document.querySelector("#register-dialog");
const privacyDialog = document.querySelector("#privacy-dialog");
let lastFocus;

function openDialog(dialog) {
  if (!dialog) return;
  lastFocus = document.activeElement;
  dialog.showModal();
  document.body.style.overflow = "hidden";
}
[registerDialog, privacyDialog].forEach((dialog) => {
  if (!dialog) return;
  dialog.querySelector(".close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    lastFocus?.focus();
  });
});
document
  .querySelectorAll("[data-register]")
  .forEach((b) => b.addEventListener("click", () => openDialog(registerDialog)));
document
  .querySelector("#privacy-open")
  ?.addEventListener("click", () => openDialog(privacyDialog));

/* ---------- Webinar date, time and countdown ---------- */
const start = WEBINAR.startISO ? new Date(WEBINAR.startISO) : null;
const hasDate = start && !Number.isNaN(start.getTime());

if (hasDate) {
  const date = start.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const time =
    start
      .toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
      .toUpperCase() + " IST";
  document.querySelectorAll("[data-wb-date]").forEach((el) => (el.textContent = date));
  document.querySelectorAll("[data-wb-time]").forEach((el) => (el.textContent = time));
}

const countdowns = document.querySelectorAll("[data-cd]");
function tick() {
  const diff = hasDate ? start.getTime() - Date.now() : -1;
  if (diff <= 0) {
    countdowns.forEach((c) => (c.hidden = true));
    document.querySelectorAll(".reg-sub").forEach((el) => {
      el.hidden = !hasDate ? true : false;
      if (hasDate) el.textContent = "Registrations are open. Ask the team for the next session.";
    });
    return false;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  countdowns.forEach((c) => {
    c.querySelector("[data-cd-d]").textContent = pad(d);
    c.querySelector("[data-cd-h]").textContent = pad(h);
    c.querySelector("[data-cd-m]").textContent = pad(m);
    c.querySelector("[data-cd-s]").textContent = pad(s);
  });
  return true;
}
if (tick()) {
  const timer = setInterval(() => {
    if (!tick()) clearInterval(timer);
  }, 1000);
}

/* ---------- Registration form → WhatsApp (+ optional lead endpoint) ---------- */
document.querySelectorAll(".wb-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const city = String(data.get("city") || "").trim();
    const experience = String(data.get("experience") || "");
    const question = String(data.get("question") || "").trim();
    const status = form.querySelector(".form-status");

    if (name.length < 2) {
      form.elements.name.setCustomValidity("Please enter your name.");
      form.elements.name.reportValidity();
      return;
    }
    if (!city) {
      form.elements.city.setCustomValidity("Please enter your city.");
      form.elements.city.reportValidity();
      return;
    }

    const when = hasDate
      ? `\nWebinar: ${document.querySelector("[data-wb-date]").textContent}, ${document.querySelector("[data-wb-time]").textContent}`
      : "";
    const message =
      `Hello GIFM Traders Academy, I would like to register for the free 90-minute ATP Strategy Webinar.${when}\n\n` +
      `Name: ${name}\nCity: ${city}\nExperience: ${experience}` +
      (question ? `\nQuestion: ${question}` : "") +
      `\n\nPlease share the joining details.`;
    const url =
      "https://wa.me/" + WEBINAR.whatsapp + "?text=" + encodeURIComponent(message);

    if (WEBINAR.leadEndpoint) {
      fetch(WEBINAR.leadEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          name,
          city,
          experience,
          question,
          source: "atp-webinar",
          at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    window.open(url, "_blank", "noopener,noreferrer");
    status.replaceChildren(
      document.createTextNode("Send the draft in WhatsApp to confirm your seat. "),
    );
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open WhatsApp again ↗";
    status.append(link);
  });
  form
    .querySelectorAll("input")
    .forEach((i) => i.addEventListener("input", () => i.setCustomValidity("")));
});

document.querySelector("#year").textContent = new Date().getFullYear();

/* =========================================================
   Trading animations
   ========================================================= */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Scrolling candlestick background (decorative) */
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
    let c = o + (Math.random() - 0.5) * 0.2 - o * 0.04;
    c = Math.max(-1, Math.min(1, c));
    const h = Math.max(o, c) + Math.random() * 0.08;
    const l = Math.min(o, c) - Math.random() * 0.08;
    price = c;
    return { o, c, h, l };
  }
  const y = (p) => H * 0.5 - p * H * 0.36;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.5;
    candles.forEach((k, i) => {
      const x = i * step - offset;
      const color = k.c >= k.o ? "rgba(34,211,138,.8)" : "rgba(255,93,108,.75)";
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

/* Count-up numbers, scroll reveals, chart / agenda / CTA draw-in */
const drawTargets = document.querySelectorAll(
  ".wb-chart, .agenda-bar, .final-cta",
);
if ("IntersectionObserver" in window && !reduceMotion) {
  const format = (n) => n.toLocaleString("en-IN");
  function countUp(el) {
    const end = Number(el.dataset.count);
    const t0 = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - t0) / 1400);
      el.textContent = format(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        if (entry.target.dataset.count) countUp(entry.target);
        else entry.target.classList.add("in");
      });
    },
    { threshold: 0.2 },
  );

  document.querySelectorAll("[data-count]").forEach((el) => {
    el.textContent = "0";
    io.observe(el);
  });
  document
    .querySelectorAll(
      ".section-heading, .problem, .atp-point, .benefit, .ag-item, .who, .no-adv, .bonus, .stats > div",
    )
    .forEach((el) => {
      const index = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty("--d", Math.min(index, 7) * 0.08 + "s");
      el.classList.add("reveal");
      io.observe(el);
    });
  drawTargets.forEach((el) => io.observe(el));
} else {
  drawTargets.forEach((el) => el.classList.add("in"));
}











// agenda script



(function () {
  var wrap = document.getElementById("tlWrap");
  if (!wrap) return;

  var items = wrap.querySelectorAll(".tl-item");
  var segs = wrap.querySelectorAll(".tl-bar span");

  /* scroll-in animation */
  wrap.classList.add("ready");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          wrap.classList.add("in");
          io.disconnect();
        }
      });
    }, { threshold: 0.15 });
    io.observe(wrap);
  } else {
    wrap.classList.add("in");
  }

  /* link bar segments and cards (hover on one lights up the other) */
  function setOn(i, on) {
    if (items[i]) items[i].classList.toggle("on", on);
    if (segs[i]) segs[i].classList.toggle("on", on);
  }
  items.forEach(function (el) {
    var i = +el.dataset.i;
    el.addEventListener("mouseenter", function () { setOn(i, true); });
    el.addEventListener("mouseleave", function () { setOn(i, false); });
  });
  segs.forEach(function (el) {
    var i = +el.dataset.i;
    el.addEventListener("mouseenter", function () { setOn(i, true); });
    el.addEventListener("mouseleave", function () { setOn(i, false); });
    el.addEventListener("click", function () {
      items[i].scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();










