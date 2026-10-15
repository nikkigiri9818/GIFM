(function () {
  /* ====== SETTINGS ====== */
  var HOUR = 19;      // 24-hour format: 19 = 7 PM
  var MIN = 0;        // minutes
  var DAY = 0;        // 0 = Sunday
  var DURATION = 90;  // webinar length in minutes
  /* ====================== */

  var IST = 5.5 * 3600 * 1000;
  var DAY_MS = 864e5;

  function nextStart() {
    var now = Date.now();
    var ist = new Date(now + IST);
    var add = (DAY - ist.getUTCDay() + 7) % 7;
    var t = Date.UTC(
      ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + add, HOUR, MIN
    ) - IST;
    if (t + DURATION * 60000 <= now) t += 7 * DAY_MS;
    return t;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function paint(t) {
    var now = Date.now();
    var diff = t - now;
    var live = diff <= 0;
    if (live) diff = 0;

    var d = Math.floor(diff / DAY_MS);
    var h = Math.floor((diff % DAY_MS) / 36e5);
    var m = Math.floor((diff % 36e5) / 6e4);
    var s = Math.floor((diff % 6e4) / 1e3);

    document.querySelectorAll("[data-cd]").forEach(function (box) {
      box.hidden = false;
      var set = function (sel, v) {
        var el = box.querySelector(sel);
        if (el) el.textContent = pad(v);
      };
      set("[data-cd-d]", d);
      set("[data-cd-h]", h);
      set("[data-cd-m]", m);
      set("[data-cd-s]", s);
    });

    document.querySelectorAll(".reg-sub").forEach(function (el) {
      el.textContent = live ? "Live now" : "Starts in";
    });
  }

  function fillDateTime(t) {
    var dt = new Date(t);
    var date = dt.toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata"
    });
    var time = dt.toLocaleTimeString("en-IN", {
      hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
    }).toUpperCase() + " IST";

    document.querySelectorAll("[data-wb-date]").forEach(function (el) { el.textContent = date; });
    document.querySelectorAll("[data-wb-time]").forEach(function (el) { el.textContent = time; });
  }

  function start() {
    var target = nextStart();
    fillDateTime(target);
    paint(target);
    setInterval(function () {
      var nt = nextStart();
      if (nt !== target) { target = nt; fillDateTime(target); }
      paint(target);
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();