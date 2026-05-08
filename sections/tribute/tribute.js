// sections/tribute/tribute.js
// Dépendances globales : aucune — vanilla JS pur

(function () {
  "use strict";

  if (!document.getElementById("tribute")) return;

  function tribute_init() {
    var section = document.getElementById("tribute");
    section.innerHTML =
      '<canvas id="tribute-canvas"></canvas>' +
      '<div id="tribute-content">' +
        '<p id="tribute-eyebrow">En mémoire</p>' +
        '<h2 id="tribute-title">À tous les passionnés que la montagne a pris</h2>' +
        '<p id="tribute-body">' +
          'Derrière chaque chiffre de cette visualisation, il y a une personne.' +
          ' Un randonneur parti au lever du soleil. Un alpiniste qui repoussait ses limites.' +
          ' Un skieur qui aimait la poudreuse.' +
          '<br><br>' +
          'Nous ne les oublions pas.' +
        '</p>' +
        '<div id="tribute-stat">' +
          '<span id="tribute-number">0</span>' +
          '<span id="tribute-stat-label">vies perdues en montagne en Suisse en 2024</span>' +
        '</div>' +
        '<p id="tribute-source">Source : Club Alpin Suisse, mars 2025</p>' +
      '</div>';

    tribute_initCanvas();
    tribute_animateContent();
  }

  function tribute_initCanvas() {
    var canvas = document.getElementById("tribute-canvas");
    var ctx = canvas.getContext("2d");

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Exactement 111 particules — une par vie perdue en 2024
    var particles = Array.from({ length: 111 }, function (_, i) {
      return {
        id:      i,
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        r:       Math.random() * 2 + 1,
        speedY:  Math.random() * 0.25 + 0.08,
        speedX:  (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.5 + 0.3,
        pulse:   Math.random() * Math.PI * 2,
        hovered: false
      };
    });

    canvas.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      particles.forEach(function (p) {
        p.hovered = Math.hypot(mx - p.x, my - p.y) < (p.r + 12);
      });
    });

    canvas.addEventListener("mouseleave", function () {
      particles.forEach(function (p) { p.hovered = false; });
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.pulse  += 0.012;
        p.y      -= p.speedY;
        p.x      += p.speedX;

        if (p.y < -6)                { p.y = canvas.height + 6; p.x = Math.random() * canvas.width; }
        if (p.x < -6)                p.x = canvas.width + 6;
        if (p.x > canvas.width + 6)  p.x = -6;

        if (p.hovered) {
          // Halo radial
          var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
          gradient.addColorStop(0, "rgba(192,132,252,0.6)");
          gradient.addColorStop(1, "rgba(192,132,252,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          // Point central agrandi
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        } else {
          var alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(192,132,252," + alpha + ")";
          ctx.fill();
        }
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  function tribute_animateContent() {
    var content = document.getElementById("tribute-content");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          content.classList.add("is-visible");
          tribute_countUp(document.getElementById("tribute-number"), 111, 2500);
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(content);
  }

  function tribute_countUp(el, target, duration) {
    if (!el) return;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(p * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  tribute_init();
})();
