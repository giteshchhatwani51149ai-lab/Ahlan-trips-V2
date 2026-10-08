(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function reveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return;
    if (reduce) { nodes.forEach(function (n) { n.style.opacity = "1"; n.style.transform = "none"; }); return; }
    nodes = nodes.filter(function (n) { if (n.__am) return false; n.__am = 1; return true; });
    if (!nodes.length) return;
    nodes.forEach(function (n) {
      var d = (parseInt(n.getAttribute("data-reveal"), 10) || 1) - 1;
      var mode = n.getAttribute("data-reveal-mode") || "up";
      var from = mode === "left" ? "perspective(1200px) translateX(-34px) rotateY(9deg)" : mode === "right" ? "perspective(1200px) translateX(34px) rotateY(-9deg)" : mode === "scale" ? "perspective(1200px) rotateX(12deg) scale(.94) translateY(30px)" : "perspective(1000px) rotateX(14deg) translateY(34px)";
      n.style.transformOrigin = "50% 100%";
      n.style.opacity = "0";
      n.style.transform = from;
      n.style.willChange = "opacity, transform";
      n.style.transition = "opacity .9s cubic-bezier(.16,1,.3,1) " + d * 110 + "ms, transform 1.1s cubic-bezier(.16,1,.3,1) " + d * 110 + "ms";
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.opacity = "1";
        e.target.style.transform = "none";
        io.unobserve(e.target);
        setTimeout(function () { e.target.style.willChange = "auto"; e.target.style.transition = ""; e.target.__revealed = 1; }, 1500);
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0.06 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  // auto-stagger direct children of [data-stagger]
  function stagger() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-stagger]"), function (wrap) {
      Array.prototype.forEach.call(wrap.children, function (child, i) {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", String((i % 4) + 1));
      });
    });
  }

  function counters() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-count]")).filter(function (n) {
      if (n.__amc) return false; n.__amc = 1; return true;
    });
    if (!nodes.length || reduce) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        var raw = el.getAttribute("data-count");
        var target = parseFloat(raw.replace(/[^0-9.]/g, ""));
        if (!isFinite(target)) return;
        var pre = el.getAttribute("data-count-pre") || "";
        var suf = el.getAttribute("data-count-suf") || "";
        var grouped = target >= 1000;
        var t0 = performance.now(), dur = 1250;
        (function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.textContent = pre + (grouped ? v.toLocaleString("en-US") : v) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  var parallaxBound = false;
  function parallax() {
    if (parallaxBound || reduce) return;
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!nodes.length) return;
    parallaxBound = true;
    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      nodes.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var amt = parseFloat(n.getAttribute("data-parallax")) || 12;
        var mid = r.top + r.height / 2;
        var off = ((mid - vh / 2) / vh) * amt;
        n.style.transform = "translate3d(0," + off.toFixed(2) + "%,0) scale(1.08)";
      });
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    window.addEventListener("resize", frame);
    frame();
  }

  function rails() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-rail-btn]"), function (btn) {
      if (btn.__amr) return; btn.__amr = 1;
      btn.addEventListener("click", function () {
        var rail = document.querySelector('[data-rail="' + btn.getAttribute("data-rail-btn") + '"]');
        if (!rail) return;
        var step = Math.max(240, rail.clientWidth * 0.7);
        rail.scrollBy({ left: btn.getAttribute("data-rail-dir") === "prev" ? -step : step, behavior: reduce ? "auto" : "smooth" });
      });
    });
  }

  // 3D pointer tilt + glare on image cards
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function tilt() {
    if (reduce || !fine) return;
    var cands = Array.prototype.slice.call(document.querySelectorAll("[data-tilt], [data-zoom], [data-reveal]"));
    cands.forEach(function (el) {
      if (el.__amt) return;
      if (!el.hasAttribute("data-tilt")) {
        if (!el.querySelector("img")) return;
        var cs = getComputedStyle(el);
        if (cs.overflow !== "hidden" || parseFloat(cs.borderTopLeftRadius) < 8) return;
        var w = el.getBoundingClientRect().width;
        if (w < 160 || w > 900) return;
      }
      el.__amt = 1;
      var max = parseFloat(el.getAttribute("data-tilt")) || 7;
      var glare = document.createElement("span");
      glare.setAttribute("aria-hidden", "true");
      glare.style.cssText = "position:absolute;inset:0;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity .4s;mix-blend-mode:soft-light;z-index:3;";
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.appendChild(glare);
      var raf = 0, rx = 0, ry = 0;
      function apply() {
        raf = 0;
        el.style.transform = "perspective(1000px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateZ(0)";
      }
      el.addEventListener("pointerenter", function () {
        el.style.transition = "transform .18s ease-out, box-shadow .4s";
        el.style.boxShadow = "0 30px 60px -20px rgba(17,17,17,.35)";
        glare.style.opacity = "1";
      });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry = (px - .5) * 2 * max; rx = (.5 - py) * 2 * max;
        glare.style.background = "radial-gradient(circle at " + (px * 100) + "% " + (py * 100) + "%, rgba(255,255,255,.55), rgba(255,255,255,0) 55%)";
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener("pointerleave", function () {
        rx = ry = 0;
        el.style.transition = "transform .7s cubic-bezier(.16,1,.3,1), box-shadow .5s";
        el.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
        el.style.boxShadow = "";
        glare.style.opacity = "0";
      });
    });
  }

  // mouse-driven depth on hero photos (Ken Burns images)
  var depthBound = false;
  function depth() {
    if (depthBound || reduce || !fine) return;
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-depth-layer]"));
    if (!layers.length) return;
    layers.forEach(function (n) { n.style.willChange = "transform"; });
    depthBound = true;
    var tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - .5); ty = (e.clientY / window.innerHeight - .5);
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      layers.forEach(function (p) {
        var r = p.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        p.style.transform = "perspective(1600px) rotateY(" + (cx * 3).toFixed(3) + "deg) rotateX(" + (-cy * 2).toFixed(3) + "deg) translate3d(" + (-cx * 22).toFixed(2) + "px," + (-cy * 14).toFixed(2) + "px,0) scale(1.06)";
      });
      requestAnimationFrame(loop);
    })();
  }

  function start() { stagger(); reveal(); counters(); parallax(); rails(); tilt(); depth(); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  // DC templates stream in; re-scan a few times as content lands
  var tries = 0;
  var iv = setInterval(function () { start(); if (++tries > 8) clearInterval(iv); }, 500);
  window.addEventListener("load", function () { setTimeout(function () { start(); clearInterval(iv); }, 1200); });
})();
