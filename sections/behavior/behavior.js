// sections/behavior/behavior.js
// Dépendances globales : d3 (v7), scrollama — pas d'import/export

(function () {
  "use strict";

  if (!document.getElementById("behavior")) return;

  // ── Constantes ─────────────────────────────────────────────────────────────
  var BEHAVIOR_FRAME_KEYS = ["1_heliski", "2_pollution", "3_accidents"];

  // Largeurs panneaux + objectPosition image par frame
  var BEHAVIOR_LAYOUTS = [
    { left: "30%", right: "30%", imgPos: "center center" }, // héliski   : image centre
    { left: "60%", right: "0%",  imgPos: "right center"  }, // pollution : panneau gauche, image droite
    { left: "0%",  right: "60%", imgPos: "left center"   }  // accidents : image gauche, panneau droit
  ];

  var BEHAVIOR_PADDING = "2.5rem 1.8rem";

  // ── État ───────────────────────────────────────────────────────────────────
  var behavior_currentStep = -1;
  var behavior_graphIndex  = 0;
  var behavior_data        = null;
  // Références aux textes SVG du centre du donut (mis à jour au hover)
  var behavior_donutCenter = null;
  var behavior_donutTotal  = 0;

  // ── Entrée ─────────────────────────────────────────────────────────────────
  d3.json("data/behavior/comportementsToxiques.json").then(function (data) {
    behavior_data = data;
    behavior_init(data);
  });

  // ── Init — construit le DOM, affiche frame 0 sans transition ──────────────
  function behavior_init(data) {
    var root = document.getElementById("behavior");
    root.innerHTML = behavior_buildShell(data);
    var pL = document.getElementById("behavior-panel-left");
    var pR = document.getElementById("behavior-panel-right");
    pL.innerHTML = behavior_buildLeft(0, data);
    pR.innerHTML = behavior_buildRight(0, data);
    behavior_applyLayout(pL, pR, 0);
    behavior_setupScrollama();
  }

  // ── Shell DOM — sticky + tooltip + scroll driver ───────────────────────────
  function behavior_buildShell(data) {
    var f0 = data.frames[BEHAVIOR_FRAME_KEYS[0]];
    return (
      '<div id="behavior-scroll-container">' +
        '<div id="behavior-sticky">' +
          '<div id="behavior-bg">' +
            '<img id="behavior-bg-img" src="' + f0.image + '" ' +
                 'style="object-position:' + BEHAVIOR_LAYOUTS[0].imgPos + '" alt="">' +
          '</div>' +
          '<div id="behavior-panel-left"></div>' +
          '<div id="behavior-panel-right"></div>' +
          '<div id="behavior-tooltip"></div>' +
        '</div>' +
        '<div id="behavior-scroll-driver">' +
          '<div class="behavior-step" data-step="0"></div>' +
          '<div class="behavior-step" data-step="1"></div>' +
          '<div class="behavior-step behavior-step--last" data-step="2"></div>' +
        '</div>' +
      '</div>'
    );
  }

  // ── Panneau gauche par frame ───────────────────────────────────────────────
  // Frame 0 : titre + accroche + grille stats héliski
  // Frame 1 : tout le contenu pollution (titre + accroche + countup + donut + grille)
  // Frame 2 : masqué (layout left: 0%)
  function behavior_buildLeft(i, data) {
    var f = data.frames[BEHAVIOR_FRAME_KEYS[i]];
    if (i === 0) {
      return (
        '<h2 class="behavior-panel-title">' + f.titre + '</h2>' +
        '<p class="behavior-panel-accroche">' + f.accroche + '</p>' +
        behavior_statGrid(f.stats_contexte)
      );
    }
    if (i === 1) {
      return (
        '<h2 class="behavior-panel-title">' + f.titre + '</h2>' +
        '<p class="behavior-panel-accroche">' + f.accroche + '</p>' +
        '<div class="behavior-stat-big" id="behavior-pollution-countup">0</div>' +
        '<p class="behavior-stat-label">' + f.stat_principale.label + '</p>' +
        '<div class="behavior-donut-container">' +
          '<svg id="behavior-donut" viewBox="0 0 160 160" width="160" height="160"></svg>' +
          behavior_donutLegendHTML(f.donut.segments) +
        '</div>' +
        behavior_statGrid(f.stats_contexte)
      );
    }
    return ''; // frame 2 masqué
  }

  // ── Panneau droit par frame ────────────────────────────────────────────────
  // Frame 0 : count-up héliski + chiffre secondaire
  // Frame 1 : masqué (layout right: 0%)
  // Frame 2 : tout le contenu accidents (titre + accroche + citation + grille + graphiques)
  function behavior_buildRight(i, data) {
    var f = data.frames[BEHAVIOR_FRAME_KEYS[i]];
    if (i === 0) {
      return (
        '<div class="behavior-stat-big" id="behavior-countup">0</div>' +
        '<p class="behavior-stat-label">' +
          f.stat_principale.label +
          '<br><span class="behavior-stat-precision">' + f.stat_principale.precision + '</span>' +
        '</p>' +
        '<div class="behavior-stat-secondary">' + behavior_fmtNum(f.stat_secondaire.valeur) + '</div>' +
        '<p class="behavior-stat-label">' + f.stat_secondaire.label + '</p>'
      );
    }
    if (i === 2) {
      return (
        '<h2 class="behavior-panel-title">' + f.titre + '</h2>' +
        '<p class="behavior-panel-accroche">' + f.accroche + '</p>' +
        '<blockquote class="behavior-citation">' +
          '« ' + f.citation.texte + ' »' +
          '<footer class="behavior-citation-auteur">— ' + f.citation.auteur + '</footer>' +
        '</blockquote>' +
        behavior_statGrid(f.stats_contexte) +
        behavior_chartNavHTML() +
        behavior_chartWrapperHTML()
      );
    }
    return ''; // frame 1 masqué
  }

  // ── Grille 2×2 stats (remplace l'ancienne liste compacte) ─────────────────
  function behavior_statGrid(items) {
    var html = '<div class="behavior-stat-grid">';
    for (var j = 0; j < items.length; j++) {
      var picto = items[j].picto
        ? '<span class="behavior-stat-grid-picto">' + items[j].picto + '</span>' : '';
      html += (
        '<div class="behavior-stat-grid-item">' +
          picto +
          '<div class="behavior-stat-grid-value">' + items[j].valeur + '</div>' +
          '<div class="behavior-stat-grid-label">' + items[j].label + '</div>' +
        '</div>'
      );
    }
    return html + '</div>';
  }

  // ── Légende donut avec data-label pour le hover ────────────────────────────
  function behavior_donutLegendHTML(segments) {
    var total = segments.reduce(function (acc, s) { return acc + s.valeur; }, 0);
    var html = '<div class="behavior-donut-legend">';
    for (var j = 0; j < segments.length; j++) {
      var pct = Math.round(segments[j].valeur / total * 100);
      html += (
        '<div class="behavior-donut-legend-item" data-label="' + segments[j].label + '">' +
          '<span class="behavior-donut-dot" style="background:' + segments[j].couleur + '"></span>' +
          (segments[j].picto ? '<span class="behavior-donut-picto">' + segments[j].picto + '</span> ' : '') +
          segments[j].label + ' — ' + behavior_fmtNum(segments[j].valeur) + ' t (' + pct + '%)' +
        '</div>'
      );
    }
    return html + '</div>';
  }

  function behavior_chartNavHTML() {
    return (
      '<div class="behavior-graph-nav">' +
        '<button id="behavior-prev">&#8249;</button>' +
        '<span class="behavior-graph-counter" id="behavior-graph-counter">1 / 2</span>' +
        '<button id="behavior-next">&#8250;</button>' +
      '</div>'
    );
  }

  function behavior_chartWrapperHTML() {
    return (
      '<div class="behavior-graph-wrapper">' +
        '<div class="behavior-graph-slide">' +
          '<div class="behavior-graph-item" id="behavior-graph-0"></div>' +
          '<div class="behavior-graph-item" id="behavior-graph-1"></div>' +
        '</div>' +
      '</div>'
    );
  }

  // Formatage nombre suisse : 4700 → "4'700"
  function behavior_fmtNum(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  }

  // ── Layout — largeurs + padding selon la frame ────────────────────────────
  function behavior_applyLayout(pL, pR, index) {
    var lo = BEHAVIOR_LAYOUTS[index];
    pL.style.width   = lo.left;
    pR.style.width   = lo.right;
    pL.style.padding = lo.left  === "0%" ? "0" : BEHAVIOR_PADDING;
    pR.style.padding = lo.right === "0%" ? "0" : BEHAVIOR_PADDING;
  }

  // ── Transition : slide-out → swap → slide-in ──────────────────────────────
  function behavior_transitionTo(newIndex) {
    var pL    = document.getElementById("behavior-panel-left");
    var pR    = document.getElementById("behavior-panel-right");
    var bgImg = document.getElementById("behavior-bg-img");

    // Phase 1 : sortie ease-in + fondu image
    pL.classList.remove("slide-in");
    pR.classList.remove("slide-in");
    pL.classList.add("slide-out");
    pR.classList.add("slide-out");
    bgImg.style.opacity = "0";

    setTimeout(function () {
      // Phase 2 : swap silencieux
      var key = BEHAVIOR_FRAME_KEYS[newIndex];
      bgImg.src = behavior_data.frames[key].image;
      bgImg.style.objectPosition = BEHAVIOR_LAYOUTS[newIndex].imgPos;
      bgImg.style.opacity = "1";

      pL.innerHTML = behavior_buildLeft(newIndex, behavior_data);
      pR.innerHTML = behavior_buildRight(newIndex, behavior_data);
      behavior_applyLayout(pL, pR, newIndex);

      // Phase 3 : retour ease-out
      pL.classList.add("slide-in");
      pR.classList.add("slide-in");
      pL.getBoundingClientRect(); // force reflow
      pL.classList.remove("slide-out");
      pR.classList.remove("slide-out");

      behavior_renderEffects(newIndex);
    }, 350);
  }

  // ── Effets post-swap — D3 (le count-up est géré par onStepProgress) ────────
  function behavior_renderEffects(index) {
    if (index === 1) {
      behavior_renderDonut(behavior_data.frames["2_pollution"].donut.segments);
    }
    if (index === 2) {
      var gA = behavior_data.frames["3_accidents"].graphique_A;
      var gB = behavior_data.frames["3_accidents"].graphique_B;
      behavior_graphIndex = 0;
      behavior_renderLineChart(gA);
      behavior_renderBarChart(gB);
      behavior_bindGraphNav();
      behavior_updateGraph();
    }
  }

  // ── Donut D3 avec hover interactif ────────────────────────────────────────
  function behavior_renderDonut(segments) {
    var outerR = 70, innerR = 42, outerRHover = 78;
    behavior_donutTotal = segments.reduce(function (a, s) { return a + s.valeur; }, 0);

    var svg = d3.select("#behavior-donut");
    var g = svg.append("g").attr("transform", "translate(80,80)");

    var arcNormal = d3.arc().innerRadius(innerR).outerRadius(outerR);
    var arcHover  = d3.arc().innerRadius(innerR).outerRadius(outerRHover);
    var pie = d3.pie().value(function (d) { return d.valeur; }).sort(null);

    // Textes centre — 4 lignes indépendantes pour mise à jour facile
    var cg = svg.append("g").attr("transform", "translate(80,80)");
    behavior_donutCenter = {
      picto: cg.append("text").attr("text-anchor", "middle").attr("y", "-20").attr("font-size", "18px"),
      label: cg.append("text").attr("text-anchor", "middle").attr("y", "-5") .attr("font-size", "10px").attr("fill", "#aaaaaa"),
      value: cg.append("text").attr("text-anchor", "middle").attr("y", "12") .attr("font-size", "14px").attr("fill", "#e85d04").attr("font-weight", "bold"),
      pct:   cg.append("text").attr("text-anchor", "middle").attr("y", "26") .attr("font-size", "10px").attr("fill", "#888888")
    };
    behavior_donutSetDefault();

    var paths = g.selectAll("path").data(pie(segments)).enter()
      .append("path")
      .attr("d", arcNormal)
      .attr("fill", function (d) { return d.data.couleur; })
      .style("cursor", "pointer");

    paths
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("d", arcHover(d));
        paths.filter(function (p) { return p !== d; })
          .transition().duration(150).style("opacity", 0.4);
        var pct = Math.round(d.data.valeur / behavior_donutTotal * 100);
        behavior_donutCenter.picto.text(d.data.picto || "");
        behavior_donutCenter.label.text(d.data.label);
        behavior_donutCenter.value.text(behavior_fmtNum(d.data.valeur) + " t");
        behavior_donutCenter.pct.text(pct + "%");
        d3.selectAll(".behavior-donut-legend-item")
          .classed("is-active", function () {
            return this.getAttribute("data-label") === d.data.label;
          });
      })
      .on("mouseout", function () {
        paths.transition().duration(150)
          .attr("d", function (d) { return arcNormal(d); })
          .style("opacity", 1);
        behavior_donutSetDefault();
        d3.selectAll(".behavior-donut-legend-item").classed("is-active", false);
      });
  }

  // Remet le texte par défaut au centre du donut
  function behavior_donutSetDefault() {
    if (!behavior_donutCenter) return;
    behavior_donutCenter.picto.text("");
    behavior_donutCenter.label.text("");
    behavior_donutCenter.value.text(behavior_fmtNum(behavior_donutTotal) + " t");
    behavior_donutCenter.pct.text("plastique/an");
  }

  // ── Line chart D3 : animation draw + hover + badge annotation ─────────────
  function behavior_renderLineChart(chartData) {
    var container = document.getElementById("behavior-graph-0");
    if (!container) return;

    var hdr = document.createElement("p");
    hdr.className = "behavior-chart-title";
    hdr.textContent = chartData.titre;
    container.appendChild(hdr);

    var totalW = Math.min(container.clientWidth || 300, 500);
    var margin = { top: 30, right: 24, bottom: 36, left: 56 };
    var w = totalW - margin.left - margin.right;
    var h = 175 - margin.top - margin.bottom;
    var donnees = chartData.donnees;

    var svg = d3.select(container).append("svg")
      .attr("width", totalW)
      .attr("height", h + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scalePoint()
      .domain(donnees.map(function (d) { return d.periode; }))
      .range([0, w]).padding(0.5);
    var y = d3.scaleLinear().domain([0, 10000]).range([h, 0]);

    svg.append("g").attr("class", "behavior-grid")
      .call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(""))
      .select(".domain").remove();
    svg.append("g").attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove();
    svg.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(",d")))
      .select(".domain").remove();

    // Ligne avec animation "draw" de gauche à droite
    var linePath = svg.append("path").datum(donnees)
      .attr("fill", "none").attr("stroke", "#e85d04").attr("stroke-width", 2.5)
      .attr("d", d3.line()
        .x(function (d) { return x(d.periode); })
        .y(function (d) { return y(d.valeur); })
      );
    var totalLength = linePath.node().getTotalLength();
    linePath
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition().duration(1200).ease(d3.easeQuadOut)
      .attr("stroke-dashoffset", 0);

    // Points visuels
    var dots = svg.selectAll(".b-dot").data(donnees).enter()
      .append("circle").attr("class", "b-dot")
      .attr("cx", function (d) { return x(d.periode); })
      .attr("cy", function (d) { return y(d.valeur); })
      .attr("r", 5).attr("fill", "#e85d04");

    // Zones de hit transparentes (plus larges pour faciliter le survol)
    svg.selectAll(".b-hit").data(donnees).enter()
      .append("circle").attr("class", "b-hit")
      .attr("cx", function (d) { return x(d.periode); })
      .attr("cy", function (d) { return y(d.valeur); })
      .attr("r", 16).attr("fill", "transparent").style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        dots.filter(function (p) { return p === d; })
          .transition().duration(100).attr("r", 9);
        behavior_showTooltip(event,
          d.periode + "<br>" + behavior_fmtNum(d.valeur) + " accidents/an");
      })
      .on("mouseout", function () {
        dots.transition().duration(100).attr("r", 5);
        behavior_hideTooltip();
      });

    // Badge annotation en haut à droite
    if (chartData.annotation) {
      var annotW = 132, annotH = 20;
      var last = donnees[donnees.length - 1];
      var badge = svg.append("g")
        .attr("transform", "translate(" + w + "," + (y(last.valeur) - 30) + ")");
      badge.append("rect")
        .attr("x", -annotW).attr("y", -annotH / 2)
        .attr("width", annotW).attr("height", annotH)
        .attr("fill", "#e85d04").attr("rx", 3);
      badge.append("text")
        .attr("x", -annotW / 2).attr("y", 0)
        .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
        .attr("fill", "#ffffff").attr("font-size", "11px").attr("font-weight", "bold")
        .text(chartData.annotation);
    }
  }

  // ── Bar chart D3 : hover couleur + tooltip avec delta ─────────────────────
  function behavior_renderBarChart(chartData) {
    var container = document.getElementById("behavior-graph-1");
    if (!container) return;

    var hdr = document.createElement("p");
    hdr.className = "behavior-chart-title";
    hdr.textContent = chartData.titre;
    container.appendChild(hdr);

    var totalW = Math.min(container.clientWidth || 300, 500);
    var margin = { top: 30, right: 24, bottom: 36, left: 56 };
    var w = totalW - margin.left - margin.right;
    var h = 175 - margin.top - margin.bottom;
    var donnees = chartData.donnees;

    var svg = d3.select(container).append("svg")
      .attr("width", totalW)
      .attr("height", h + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
      .domain(donnees.map(function (d) { return d.annee; }))
      .range([0, w]).padding(0.2);
    var y = d3.scaleLinear().domain([0, 4000]).range([h, 0]);

    svg.append("g").attr("class", "behavior-grid")
      .call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(""))
      .select(".domain").remove();
    svg.append("g").attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSize(0))
      .select(".domain").remove();
    svg.append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(",d")))
      .select(".domain").remove();

    // Barre pic = #e85d04, autres = #555 par défaut
    var bars = svg.selectAll("rect").data(donnees).enter()
      .append("rect")
      .attr("x", function (d) { return x(d.annee); })
      .attr("y", function (d) { return y(d.valeur); })
      .attr("width", x.bandwidth())
      .attr("height", function (d) { return h - y(d.valeur); })
      .attr("fill", function (d) { return d.annee === chartData.pic ? "#e85d04" : "#555"; })
      .style("cursor", "pointer");

    bars
      .on("mouseover", function (event, d) {
        // Toutes les barres passent en #e85d04, la survolée en #ff8c42
        bars.attr("fill", function (p) { return p === d ? "#ff8c42" : "#e85d04"; });
        var idx = donnees.indexOf(d);
        var deltaStr = "";
        if (idx > 0) {
          var delta = d.valeur - donnees[idx - 1].valeur;
          deltaStr = "<br>" + (delta >= 0 ? "+" : "") +
            behavior_fmtNum(delta) + " vs " + donnees[idx - 1].annee;
        }
        behavior_showTooltip(event,
          d.annee + " : " + behavior_fmtNum(d.valeur) + deltaStr);
      })
      .on("mouseout", function () {
        bars.attr("fill", function (d) {
          return d.annee === chartData.pic ? "#e85d04" : "#555";
        });
        behavior_hideTooltip();
      });
  }

  // ── Navigation graphiques ──────────────────────────────────────────────────
  function behavior_bindGraphNav() {
    var prev = document.getElementById("behavior-prev");
    var next = document.getElementById("behavior-next");
    if (prev) prev.addEventListener("click", function () {
      behavior_graphIndex = (behavior_graphIndex - 1 + 2) % 2;
      behavior_updateGraph();
    });
    if (next) next.addEventListener("click", function () {
      behavior_graphIndex = (behavior_graphIndex + 1) % 2;
      behavior_updateGraph();
    });
  }

  function behavior_updateGraph() {
    var counter = document.getElementById("behavior-graph-counter");
    if (counter) counter.textContent = (behavior_graphIndex + 1) + " / 2";
    var slide = document.querySelector(".behavior-graph-slide");
    if (slide) slide.style.transform = "translateX(-" + (behavior_graphIndex * 100) + "%)";
  }

  // ── Tooltip flottant positionné dans #behavior-sticky ─────────────────────
  function behavior_showTooltip(event, html) {
    var tt = document.getElementById("behavior-tooltip");
    if (!tt) return;
    tt.innerHTML = html;
    var sticky = document.getElementById("behavior-sticky");
    var rect = sticky.getBoundingClientRect();
    tt.style.left    = (event.clientX - rect.left + 14) + "px";
    tt.style.top     = (event.clientY - rect.top  - 44) + "px";
    tt.style.opacity = "1";
  }

  function behavior_hideTooltip() {
    var tt = document.getElementById("behavior-tooltip");
    if (tt) tt.style.opacity = "0";
  }

  // ── Scrollama avec progress pour les count-ups liés au scroll ─────────────
  function behavior_setupScrollama() {
    var scroller = scrollama();
    scroller
      .setup({ step: ".behavior-step", offset: 0.5, progress: true, debug: false })
      .onStepEnter(function (response) {
        var index = response.index;
        if (index === behavior_currentStep) return;
        var prev = behavior_currentStep;
        behavior_currentStep = index;
        if (prev === -1) {
          // Première activation — frame 0 déjà visible, juste déclencher les effets
          behavior_renderEffects(index);
          return;
        }
        behavior_transitionTo(index);
      })
      .onStepProgress(function (response) {
        var index    = response.index;
        var progress = response.progress;
        var el;
        // Count-up héliski lié au scroll (step 0)
        if (index === 0) {
          el = document.getElementById("behavior-countup");
          if (el) el.textContent = behavior_fmtNum(
            Math.round(progress * behavior_data.frames["1_heliski"].stat_principale.valeur)
          );
        }
        // Count-up pollution lié au scroll (step 1)
        if (index === 1) {
          el = document.getElementById("behavior-pollution-countup");
          if (el) el.textContent = behavior_fmtNum(
            Math.round(progress * behavior_data.frames["2_pollution"].stat_principale.valeur)
          );
        }
      });

    window.addEventListener("resize", scroller.resize);
  }

})();
