// sections/behavior/behavior.js
// Dépendances globales : d3 (v7), scrollama — pas d'import/export

(function () {
  "use strict";

  if (!document.getElementById("behavior")) return;

  // ── Constantes ─────────────────────────────────────────────────────────────
  var BEHAVIOR_FRAME_KEYS = ["1_heliski", "2_pollution", "3_accidents"];

  var BEHAVIOR_LAYOUTS = [
    { left: "30%", right: "30%", imgPos: "center center" },
    { left: "60%", right: "0%",  imgPos: "right center"  },
    { left: "0%",  right: "60%", imgPos: "left center"   }
  ];

  // Position de la zone image pour chaque frame (image-zone wrapper)
  var BEHAVIOR_IMAGE_ZONES = [
    { left: '30%', width: '40%' },  // Frame 1 : image centre
    { left: '60%', width: '40%' },  // Frame 2 : image droite
    { left: '0%',  width: '40%' },  // Frame 3 : image gauche
  ];

  var BEHAVIOR_PADDING = "2.5rem 1.8rem";

  // Icônes SVG pour les stats contexte frame 2 (pollution)
  var BEHAVIOR_ICONS = {
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9 10h4.5a1.5 1.5 0 0 1 0 3H10a1.5 1.5 0 0 0 0 3H14"/></svg>',
    time:  '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    fish:  '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="18" height="18"><path d="M2 12c2-4 6-7 10-7s8 3 10 7c-2 4-6 7-10 7S4 16 2 12z"/><circle cx="17" cy="12" r="1.5" fill="#9333ea"/><path d="M2 12c-1-2-1-4 0-6"/></svg>',
    hut:   '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="18" height="18"><path d="M3 10.5L12 3l9 7.5"/><rect x="6" y="10" width="12" height="11" rx="1"/><path d="M10 21v-6h4v6"/></svg>'
  };
  var BEHAVIOR_ICON_MAP = ['money', 'time', 'fish', 'hut'];

  // Comparaisons contextuelles pour le hover héliski (frame 1)
  var BEHAVIOR_HELISKI_COMPARISONS = [
    'Le Valais concentre <strong>70% des vols héliski</strong> suisses.<br>' +
    'Les Grisons, pourtant aussi alpins, enregistrent <strong>12× moins</strong> de vols.' +
    '<span class="behavior-hover-source">Source : RTS Mise au Point, mai 2023</span>',

    'La Suisse compte <strong>40 places d\'atterrissage</strong> officielles en montagne.<br>' +
    'La France et l\'Allemagne : <strong>zéro</strong>. La pratique y est interdite.' +
    '<span class="behavior-hover-source">Source : OFAC — Mountain Wilderness CH</span>',

    'Plus de la moitié des places d\'atterrissage se trouvent dans ou aux abords de <strong>zones protégées d\'importance nationale</strong>.' +
    '<span class="behavior-hover-source">Source : Mountain Wilderness CH, 2024</span>',

    'Les vols héliski de 2019 ont émis <strong>550 tonnes de CO₂</strong>.<br>' +
    'Soit l\'équivalent de <strong>4 millions de km</strong> parcourus en voiture.' +
    '<span class="behavior-hover-source">Source : RTS Mise au Point, mai 2023</span>'
  ];

  // Comparaisons contextuelles pour le hover pollution (frame 2) — overlay
  var BEHAVIOR_POLLUTION_COMPARISONS = [
    'Le nettoyage des déchets sauvages coûte <strong>200 millions CHF/an</strong> en Suisse.<br>' +
    'Soit <strong>23 CHF par habitant</strong> — payés par les contribuables.' +
    '<span class="behavior-hover-source">Source : OFEV via SWI swissinfo</span>',

    'Un mégot met <strong>7 ans à se décomposer</strong> en montagne,<br>' +
    'libérant nicotine, métaux lourds et microplastiques dans les cours d\'eau.' +
    '<span class="behavior-hover-source">Source : CAS #cleanmountains</span>',

    'Un seul mégot dans un litre d\'eau suffit à tuer <strong>50% des poissons</strong>.<br>' +
    'Les torrents alpins sont les premiers touchés.' +
    '<span class="behavior-hover-source">Source : CAS #cleanmountains</span>',

    '<strong>1 cabane CAS sur 5</strong> est entourée de décharges héritées des années 1950–70.<br>' +
    'Des tonnes de déchets sortis à l\'hélicoptère par des bénévoles.' +
    '<span class="behavior-hover-source">Source : CAS — état des lieux cabanes</span>'
  ];

  // Comparaisons sourcées pour le hover accidents (frame 3)
  var BEHAVIOR_ACCIDENTS_COMPARISONS = [
    'Les accidents sont passés de <strong>4\'000 à 9\'000/an</strong> en 15 ans.<br>' +
    'Une hausse <strong>disproportionnée par rapport à la croissance démographique</strong>.' +
    '<span class="behavior-hover-source">Source : SUVA, octobre 2025</span>',

    'Plus de <strong>8 accidents sur 10</strong> sont causés par un trébuchement ou une chute.<br>' +
    'Cause principale : équipement inadapté ou <strong>surestimation de sa forme physique</strong>.' +
    '<span class="behavior-hover-source">Source : SUVA, octobre 2025</span>',

    'La Suisse compte environ <strong>3 millions de randonneurs actifs</strong>.<br>' +
    'La randonnée est le <strong>sport numéro 1</strong> du pays.' +
    '<span class="behavior-hover-source">Source : SuisseRando / OFS</span>',

    'Le Valais concentre environ <strong>50% des urgences montagne</strong> de toute la Suisse.<br>' +
    'Avec les 4 plus hauts sommets du pays, il reste le canton le plus exposé.' +
    '<span class="behavior-hover-source">Source : CAS, mars 2025</span>'
  ];

  // Icônes SVG pour les segments du donut
  var BEHAVIOR_DONUT_ICONS = {
    'Abrasion pneus':     '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/></svg>',
    'Littering':          '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
    'Granulés plastique': '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/></svg>',
    'Autres sources':     '<svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  // ── État ───────────────────────────────────────────────────────────────────
  var behavior_currentStep  = -1;
  var behavior_graphIndex   = 0;
  var behavior_data         = null;
  var behavior_donutCenter  = null;
  var behavior_donutTotal   = 0;
  var behavior_arcNormal    = null;
  var behavior_arcHover     = null;
  var behavior_donutPaths   = null;

  // ── Entrée ─────────────────────────────────────────────────────────────────
  d3.json("data/behavior/comportementsToxiques.json").then(function (data) {
    behavior_data = data;
    behavior_init(data);
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  function behavior_init(data) {
    var root = document.getElementById("behavior");
    root.innerHTML = behavior_buildShell(data);

    // Zone image : wrapper positionné sur la zone visible de l'image
    var imageZone = document.createElement('div');
    imageZone.id = 'behavior-image-zone';

    // Overlay overlay enfant de imageZone — jamais de #behavior-sticky directement
    var overlay = document.createElement('div');
    overlay.id = 'behavior-compare-overlay';
    overlay.innerHTML =
      '<div id="behavior-compare-content">' +
        '<p id="behavior-compare-text">Survole une statistique pour en savoir plus</p>' +
      '</div>';
    imageZone.appendChild(overlay);
    document.getElementById('behavior-sticky').appendChild(imageZone);
    behavior_updateImageZone(0); // position initiale : frame 0

    var pL = document.getElementById("behavior-panel-left");
    var pR = document.getElementById("behavior-panel-right");
    pL.innerHTML = behavior_buildLeft(0, data);
    pR.innerHTML = behavior_buildRight(0, data);
    behavior_applyLayout(pL, pR, 0);
    behavior_setupScrollama();
  }

  // ── Mise à jour de la position de la zone image ───────────────────────────
  function behavior_updateImageZone(index) {
    var zone = document.getElementById('behavior-image-zone');
    if (!zone) return;
    var pos = BEHAVIOR_IMAGE_ZONES[index];
    zone.style.left  = pos.left;
    zone.style.width = pos.width;
  }

  // ── Shell DOM ─────────────────────────────────────────────────────────────
  function behavior_buildShell(data) {
    var f0 = data.frames[BEHAVIOR_FRAME_KEYS[0]];
    return (
      '<div id="behavior-header">' +
        '<h2 id="behavior-title">Ces comportements toxiques à la montagne</h2>' +
      '</div>' +
      '<div id="behavior-scroll-container">' +
        '<div id="behavior-sticky">' +
          '<div id="behavior-bg">' +
            '<img id="behavior-bg-img" src="' + f0.image + '" ' +
                 'style="object-position:' + BEHAVIOR_LAYOUTS[0].imgPos + '" alt="">' +
          '</div>' +
          '<div id="behavior-panel-left"></div>' +
          '<div id="behavior-panel-right"></div>' +
        '</div>' +
        '<div id="behavior-scroll-driver">' +
          '<div class="behavior-step" data-step="0"></div>' +
          '<div class="behavior-step" data-step="1"></div>' +
          '<div class="behavior-step behavior-step--last" data-step="2"></div>' +
        '</div>' +
      '</div>'
    );
  }

  // ── Panneau gauche ────────────────────────────────────────────────────────
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
        '<div class="behavior-panel-zone">' +
          '<h2 class="behavior-panel-title">' + f.titre + '</h2>' +
          '<p class="behavior-panel-accroche">' + f.accroche + '</p>' +
        '</div>' +
        '<div class="behavior-panel-zone">' +
          '<div class="behavior-pollution-headline" id="behavior-pollution-countup">0 t</div>' +
          '<p class="behavior-stat-label">' + f.stat_principale.label + '</p>' +
        '</div>' +
        '<div class="behavior-panel-zone">' +
          '<svg id="behavior-donut" viewBox="0 0 360 280" width="100%" height="260"></svg>' +
        '</div>' +
        '<div class="behavior-panel-zone">' +
          behavior_statGrid(f.stats_contexte, BEHAVIOR_ICON_MAP, true) +
        '</div>'
      );
    }
    return '';
  }

  // Légende HTML du donut (liste à droite du SVG)
  function behavior_buildDonutLegend(segments) {
    var total = segments.reduce(function (a, s) { return a + s.valeur; }, 0);
    var html = '<ul class="behavior-donut-legend">';
    for (var j = 0; j < segments.length; j++) {
      var pct = Math.round(segments[j].valeur / total * 100);
      html += (
        '<li>' +
          '<span class="legend-color" style="background:' + segments[j].couleur + '"></span>' +
          '<span class="legend-label">' + segments[j].label + '</span>' +
          '<span class="legend-pct">' + pct + '%</span>' +
        '</li>'
      );
    }
    return html + '</ul>';
  }

  // ── Panneau droit ─────────────────────────────────────────────────────────
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
    return '';
  }

  // ── Grille stats ──────────────────────────────────────────────────────────
  function behavior_statGrid(items, iconKeys, compact) {
    var cls = 'behavior-stat-grid' + (compact ? ' behavior-stat-grid--compact' : '');
    var html = '<div class="' + cls + '">';
    for (var j = 0; j < items.length; j++) {
      var iconHtml = '';
      if (iconKeys && BEHAVIOR_ICONS[iconKeys[j]]) {
        iconHtml = '<span class="behavior-stat-grid-picto">' + BEHAVIOR_ICONS[iconKeys[j]] + '</span>';
      }
      html += (
        '<div class="behavior-stat-grid-item">' +
          iconHtml +
          '<div class="behavior-stat-grid-value">' + items[j].valeur + '</div>' +
          '<div class="behavior-stat-grid-label">' + items[j].label + '</div>' +
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

  // ── Layout — overrides inline selon la frame ──────────────────────────────
  function behavior_applyLayout(pL, pR, index) {
    var lo = BEHAVIOR_LAYOUTS[index];
    pL.style.width = lo.left;
    pR.style.width = lo.right;

    if (index === 1) {
      pL.style.padding        = "1.2rem";
      pL.style.justifyContent = "space-between";
      pL.style.overflowY      = "hidden";
    } else {
      pL.style.padding        = lo.left === "0%" ? "0" : BEHAVIOR_PADDING;
      pL.style.justifyContent = "center";
      pL.style.overflowY      = "";
    }

    if (index === 2) {
      pR.style.justifyContent = "flex-start";
      pR.style.overflowY      = "hidden"; // panneau garde hidden pour le layout
      pR.style.overflowX      = "visible";
    } else {
      pR.style.justifyContent = "center";
      pR.style.overflowY      = "";
      pR.style.overflowX      = "";
    }

    pR.style.padding = lo.right === "0%" ? "0" : BEHAVIOR_PADDING;
    if (index === 2) pR.style.paddingBottom = "1rem";
  }

  // ── Transition ────────────────────────────────────────────────────────────
  function behavior_transitionTo(newIndex) {
    var ov = document.getElementById('behavior-compare-overlay');
    if (ov) ov.classList.remove('is-visible');

    var pL    = document.getElementById("behavior-panel-left");
    var pR    = document.getElementById("behavior-panel-right");
    var bgImg = document.getElementById("behavior-bg-img");

    pL.classList.remove("slide-in");
    pR.classList.remove("slide-in");
    pL.classList.add("slide-out");
    pR.classList.add("slide-out");
    bgImg.style.opacity = "0";

    setTimeout(function () {
      var key = BEHAVIOR_FRAME_KEYS[newIndex];
      bgImg.src = behavior_data.frames[key].image;
      bgImg.style.objectPosition = BEHAVIOR_LAYOUTS[newIndex].imgPos;
      bgImg.style.opacity = "1";

      pL.innerHTML = behavior_buildLeft(newIndex, behavior_data);
      pR.innerHTML = behavior_buildRight(newIndex, behavior_data);
      behavior_applyLayout(pL, pR, newIndex);
      behavior_updateImageZone(newIndex);

      pL.classList.add("slide-in");
      pR.classList.add("slide-in");
      pL.getBoundingClientRect();
      pL.classList.remove("slide-out");
      pR.classList.remove("slide-out");

      behavior_renderEffects(newIndex);
    }, 350);
  }

  // ── Effets post-swap ──────────────────────────────────────────────────────
  function behavior_renderEffects(index) {
    if (index === 0) {
      behavior_animateCountup('behavior-countup', behavior_data.frames["1_heliski"].stat_principale.valeur, '', 2000);
      behavior_animateContextStats('#behavior-panel-left', behavior_data.frames["1_heliski"].stats_contexte);

      // Hover héliski → overlay centré
      var statItems = document.querySelectorAll('#behavior-panel-left .behavior-stat-grid-item');
      statItems.forEach(function (item, i) {
        item.addEventListener('mouseenter', function () {
          if (BEHAVIOR_HELISKI_COMPARISONS[i]) behavior_showComparison(0, BEHAVIOR_HELISKI_COMPARISONS[i]);
          item.style.borderColor = '#9333ea';
          item.style.background = 'rgba(147,51,234,0.15)';
        });
        item.addEventListener('mouseleave', function () {
          behavior_hideComparison();
          item.style.borderColor = '';
          item.style.background = '';
        });
      });
    }
    if (index === 1) {
      behavior_animateCountup('behavior-pollution-countup', behavior_data.frames["2_pollution"].stat_principale.valeur, ' t', 2000);
      behavior_renderDonut(behavior_data.frames["2_pollution"].donut.segments);
      behavior_animateContextStats('#behavior-panel-left', behavior_data.frames["2_pollution"].stats_contexte);

      // Hover pollution → overlay droite (sur l'image)
      var pollutionItems = document.querySelectorAll('#behavior-panel-left .behavior-stat-grid-item');
      pollutionItems.forEach(function (item, i) {
        item.addEventListener('mouseenter', function () {
          if (BEHAVIOR_POLLUTION_COMPARISONS[i]) behavior_showComparison(1, BEHAVIOR_POLLUTION_COMPARISONS[i]);
          item.style.borderColor = '#9333ea';
          item.style.background = 'rgba(147,51,234,0.15)';
        });
        item.addEventListener('mouseleave', function () {
          behavior_hideComparison();
          item.style.borderColor = '';
          item.style.background = '';
        });
      });
    }
    if (index === 2) {
      var gA = behavior_data.frames["3_accidents"].graphique_A;
      var gB = behavior_data.frames["3_accidents"].graphique_B;
      behavior_graphIndex = 0;
      behavior_renderLineChart(gA);
      behavior_renderBarChart(gB);
      behavior_bindGraphNav();
      behavior_updateGraph();
      behavior_animateContextStats('#behavior-panel-right', behavior_data.frames["3_accidents"].stats_contexte);

      // Hover accidents → overlay gauche (sur l'image)
      var accidentItems = document.querySelectorAll('#behavior-panel-right .behavior-stat-grid-item');
      accidentItems.forEach(function (item, i) {
        item.addEventListener('mouseenter', function () {
          if (BEHAVIOR_ACCIDENTS_COMPARISONS[i]) behavior_showComparison(2, BEHAVIOR_ACCIDENTS_COMPARISONS[i]);
          item.style.borderColor = '#9333ea';
          item.style.background = 'rgba(147,51,234,0.15)';
        });
        item.addEventListener('mouseleave', function () {
          behavior_hideComparison();
          item.style.borderColor = '';
          item.style.background = '';
        });
      });
    }
  }

  // ── Count-up animé (élément unique par id) ───────────────────────────────
  function behavior_animateCountup(id, target, suffix, duration) {
    var el = document.getElementById(id);
    if (!el) return;
    suffix = suffix || '';
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = behavior_fmtNum(Math.round(p * target)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Count-up animé pour les stats contexte ────────────────────────────────
  function behavior_animateContextStats(containerSelector, statsData) {
    var items = document.querySelectorAll(containerSelector + ' .behavior-stat-grid-value');
    items.forEach(function (el, i) {
      if (!statsData[i]) return;
      var raw = statsData[i].valeur;
      if (!/^\d/.test(raw)) { el.textContent = raw; return; }
      var num = parseFloat(raw);
      if (isNaN(num)) { el.textContent = raw; return; }
      var suffix = raw.replace(/^[\d.]+/, '');
      var start = null;
      var duration = 1200;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        el.textContent = behavior_fmtNum(Math.round(p * num)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // ── Overlay : la position est gérée par #behavior-image-zone ────────────
  function behavior_showComparison(stepIndex, html) {
    var overlay = document.getElementById('behavior-compare-overlay');
    if (!overlay) return;
    // stepIndex conservé pour compatibilité API — position gérée par image-zone
    var text = document.getElementById('behavior-compare-text');
    if (text) text.innerHTML = html;
    overlay.classList.add('is-visible');
  }

  function behavior_hideComparison() {
    var overlay = document.getElementById('behavior-compare-overlay');
    if (overlay) overlay.classList.remove('is-visible');
  }

  // ── Donut D3 : SVG 360×280 avec callout labels SVG ───────────────────────
  function behavior_renderDonut(segments) {
    var radius = 95, innerR = 58, outerRHover = 107;
    var cx = 160, cy = 130;
    behavior_donutTotal = segments.reduce(function (a, s) { return a + s.valeur; }, 0);

    var svg = d3.select("#behavior-donut");
    svg.selectAll("*").remove();

    var g  = svg.append("g").attr("transform", "translate(" + cx + "," + cy + ")");
    var cg = svg.append("g").attr("transform", "translate(" + cx + "," + cy + ")");

    behavior_arcNormal = d3.arc().innerRadius(innerR).outerRadius(radius);
    behavior_arcHover  = d3.arc().innerRadius(innerR).outerRadius(outerRHover);
    var outerArc = d3.arc().innerRadius(radius * 1.18).outerRadius(radius * 1.18);

    var pie = d3.pie().value(function (d) { return d.valeur; }).sort(null);
    var pieData = pie(segments);

    // Texte central
    behavior_donutCenter = cg.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");
    behavior_donutSetDefault();

    // Segments
    behavior_donutPaths = g.selectAll("path").data(pieData).enter()
      .append("path")
      .attr("class", "behavior-donut-arc")
      .attr("d", behavior_arcNormal)
      .attr("fill", function (d) { return d.data.couleur; })
      .style("cursor", "pointer");

    // Callout lignes + labels SVG
    var calloutG = svg.append("g").attr("transform", "translate(" + cx + "," + cy + ")");
    pieData.forEach(function (d, i) {
      var posA = behavior_arcNormal.centroid(d);
      var posB = outerArc.centroid(d);
      var posC = [posB[0], posB[1]];
      posC[0] = radius * 1.55 * (posB[0] > 0 ? 1 : -1);
      var pct = Math.round(d.data.valeur / behavior_donutTotal * 100);

      calloutG.append("polyline")
        .attr("class", "donut-callout-line")
        .attr("data-idx", i)
        .attr("points", [posA, posB, posC].map(function (p) { return p.join(","); }).join(" "))
        .attr("fill", "none")
        .attr("stroke", "#555555")
        .attr("stroke-width", 1);

      calloutG.append("text")
        .attr("class", "donut-callout-label")
        .attr("data-idx", i)
        .attr("transform", "translate(" + posC + ")")
        .attr("text-anchor", posB[0] > 0 ? "start" : "end")
        .attr("fill", "#cccccc")
        .attr("font-size", "0.9rem")
        .attr("font-family", "'SUSE', sans-serif")
        .attr("dy", "0.35em")
        .text(d.data.label + " — " + pct + "%");
    });

    // Hover segments → callout highlight + centre
    behavior_donutPaths
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("d", behavior_arcHover(d));
        behavior_donutPaths.filter(function (p) { return p !== d; })
          .transition().duration(150).style("opacity", 0.35);
        d3.selectAll(".donut-callout-line").filter(function () {
          return +d3.select(this).attr("data-idx") === d.index;
        }).attr("stroke", "#9333ea").attr("stroke-width", 2);
        d3.selectAll(".donut-callout-label").filter(function () {
          return +d3.select(this).attr("data-idx") === d.index;
        }).attr("fill", "#ffffff").attr("font-weight", "700");
        behavior_updateDonutCenter(d);
      })
      .on("mouseout", function () {
        behavior_donutPaths.transition().duration(150)
          .attr("d", function (d) { return behavior_arcNormal(d); })
          .style("opacity", 1);
        d3.selectAll(".donut-callout-line").attr("stroke", "#555555").attr("stroke-width", 1);
        d3.selectAll(".donut-callout-label").attr("fill", "#cccccc").attr("font-weight", "400");
        behavior_donutSetDefault();
      });
  }

  function behavior_donutSetDefault() {
    if (!behavior_donutCenter) return;
    behavior_donutCenter.html(
      '<tspan font-size="1rem" font-weight="900" fill="#9333ea">' +
      behavior_fmtNum(behavior_donutTotal) + ' t</tspan>'
    );
  }

  function behavior_updateDonutCenter(d) {
    if (!behavior_donutCenter) return;
    behavior_donutCenter.html(
      '<tspan x="0" dy="-0.9em" font-size="0.82rem" fill="#ffffff">' + d.data.label + '</tspan>' +
      '<tspan x="0" dy="1.25em" font-size="1rem" font-weight="700" fill="#9333ea">' +
        behavior_fmtNum(d.data.valeur) + ' t' +
      '</tspan>' +
      '<tspan x="0" dy="1.15em" font-size="0.8rem" fill="#aaaaaa">' +
        Math.round(d.data.valeur / behavior_donutTotal * 100) + '%' +
      '</tspan>'
    );
  }

  // ── Line chart — animation rejouée à chaque affichage ────────────────────
  function behavior_animateLineChart() {
    var pathNode = document.getElementById('behavior-line-path');
    if (!pathNode) return;
    var sel = d3.select(pathNode);
    var totalLength = pathNode.getTotalLength();
    sel
      .attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition().duration(1200).ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0);
  }

  // ── Line chart D3 ─────────────────────────────────────────────────────────
  function behavior_renderLineChart(chartData) {
    var container = document.getElementById("behavior-graph-0");
    if (!container) return;

    var hdr = document.createElement("p");
    hdr.className = "behavior-chart-title";
    hdr.textContent = chartData.titre;
    container.appendChild(hdr);

    if (chartData.sous_titre) {
      var sub = document.createElement("p");
      sub.className = "behavior-chart-subtitle";
      sub.textContent = chartData.sous_titre;
      container.appendChild(sub);
    }

    var panelEl     = document.querySelector('#behavior-panel-right') || {};
    var availableH  = panelEl.clientHeight || 500;
    var margin      = { top: 30, right: 20, bottom: 50, left: 55 };
    var usedH = 0;
    if (panelEl.querySelector) {
      ['.behavior-graph-nav', '.behavior-panel-title', '.behavior-panel-accroche', '.behavior-citation'].forEach(function (sel) {
        var el = panelEl.querySelector(sel);
        if (el) usedH += el.offsetHeight;
      });
    }
    var graphHeight = Math.floor(availableH * 0.38);
    var graphWidth  = (panelEl.clientWidth || 400) - margin.left - margin.right - 32;
    var donnees     = chartData.donnees;

    var svg = d3.select(container).append("svg")
      .attr("width",  graphWidth  + margin.left + margin.right)
      .attr("height", graphHeight + margin.top  + margin.bottom)
      .style("overflow", "visible")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scalePoint()
      .domain(donnees.map(function (d) { return d.periode; }))
      .range([0, graphWidth]).padding(0.5);
    var maxValL = d3.max(donnees, function (d) { return d.valeur; });
    var y = d3.scaleLinear()
      .domain([0, maxValL * 1.2])
      .range([graphHeight, 0]);

    // Zone colorée sous la ligne
    var areaGen = d3.area()
      .x(function (d) { return x(d.periode); })
      .y0(graphHeight)
      .y1(function (d) { return y(d.valeur); });

    svg.append("path").datum(donnees)
      .attr("fill", "rgba(147,51,234,0.15)")
      .attr("d", areaGen);

    svg.append("g").attr("class", "behavior-grid")
      .call(d3.axisLeft(y).ticks(4).tickSize(-graphWidth).tickFormat(""))
      .select(".domain").remove();

    // Axe X avec labels explicites
    svg.append("g")
      .attr("class", "behavior-axis-x")
      .attr("transform", "translate(0," + graphHeight + ")")
      .call(d3.axisBottom(x).tickSize(4))
      .selectAll("text")
      .style("fill", "#cccccc")
      .style("font-size", "0.72rem")
      .attr("dy", "1.2em");
    svg.selectAll(".behavior-axis-x path, .behavior-axis-x line")
      .attr("stroke", "rgba(255,255,255,0.35)");

    // Axe Y : domaine depuis 0 — référence sauvée pour éviter le bug de chaîne D3
    var yAxisGL = svg.append("g").attr("class", "behavior-axis-y");
    yAxisGL.call(d3.axisLeft(y)
      .tickValues([0, 3000, 6000, 9000, 12000].filter(function (v) { return v <= maxValL * 1.2; }))
      .tickFormat(function (d) {
        if (d === 0) return '0';
        return (d / 1000).toFixed(0) + "'000";
      })
    );
    yAxisGL.select(".domain").remove();
    yAxisGL.selectAll("text")
      .attr("fill", "#cccccc")
      .attr("font-family", "'SUSE', sans-serif")
      .attr("font-size", "0.7rem");
    yAxisGL.selectAll("line")
      .attr("stroke", "rgba(255,255,255,0.2)");

    // Ligne de base — rendue en dernier pour passer par-dessus les axes
    svg.append("line")
      .attr("class", "behavior-axis-baseline")
      .attr("x1", 0).attr("x2", graphWidth)
      .attr("y1", graphHeight).attr("y2", graphHeight)
      .attr("stroke", "rgba(255,255,255,0.4)")
      .attr("stroke-width", 2);

    // Note sous l'axe X
    svg.append("text")
      .attr("x", graphWidth / 2)
      .attr("y", graphHeight + margin.bottom - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "#555")
      .attr("font-size", "9px")
      .attr("font-style", "italic")
      .text("(moyenne annuelle par période)");

    // Ligne
    svg.append("path").datum(donnees)
      .attr("id", "behavior-line-path")
      .attr("fill", "none")
      .attr("stroke", "#9333ea")
      .attr("stroke-width", 2.5)
      .attr("d", d3.line()
        .x(function (d) { return x(d.periode); })
        .y(function (d) { return y(d.valeur); })
      );

    // Labels de valeur au-dessus de chaque point
    svg.selectAll(".b-label").data(donnees).enter()
      .append("text")
      .attr("class", "b-label")
      .attr("x", function (d) { return x(d.periode); })
      .attr("y", function (d) { return y(d.valeur) - 14; })
      .attr("text-anchor", "middle")
      .attr("fill", "#9333ea")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .text(function (d) { return behavior_fmtNum(d.valeur) + "/an"; });

    // Points visuels
    var dots = svg.selectAll(".b-dot").data(donnees).enter()
      .append("circle").attr("class", "b-dot")
      .attr("cx", function (d) { return x(d.periode); })
      .attr("cy", function (d) { return y(d.valeur); })
      .attr("r", 5).attr("fill", "#9333ea");

    // Zones de hit transparentes
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

    // Badge annotation entre les deux points
    if (chartData.annotation) {
      var x1 = x(donnees[0].periode);
      var x2 = x(donnees[1].periode);
      var midX = (x1 + x2) / 2;
      var midY = (y(donnees[0].valeur) + y(donnees[1].valeur)) / 2 - 8;
      var annotW = 134, annotH = 22;
      var badge = svg.append("g")
        .attr("transform", "translate(" + midX + "," + midY + ")");
      badge.append("rect")
        .attr("x", -annotW / 2).attr("y", -annotH / 2)
        .attr("width", annotW).attr("height", annotH)
        .attr("fill", "#9333ea").attr("rx", 4);
      badge.append("text")
        .attr("x", 0).attr("y", 0)
        .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
        .attr("fill", "#ffffff").attr("font-size", "11px").attr("font-weight", "bold")
        .text(chartData.annotation);
    }

    behavior_animateLineChart();
  }

  // ── Bar chart D3 ──────────────────────────────────────────────────────────
  function behavior_renderBarChart(chartData) {
    var container = document.getElementById("behavior-graph-1");
    if (!container) return;

    var hdr = document.createElement("p");
    hdr.className = "behavior-chart-title";
    hdr.textContent = chartData.titre;
    container.appendChild(hdr);

    if (chartData.sous_titre) {
      var sub = document.createElement("p");
      sub.className = "behavior-chart-subtitle";
      sub.textContent = chartData.sous_titre;
      container.appendChild(sub);
    }

    var panelEl     = document.querySelector('#behavior-panel-right') || {};
    var availableH  = panelEl.clientHeight || 500;
    var margin      = { top: 24, right: 16, bottom: 36, left: 52 };
    var usedH2 = 0;
    if (panelEl.querySelector) {
      ['.behavior-graph-nav', '.behavior-panel-title', '.behavior-panel-accroche', '.behavior-citation'].forEach(function (sel) {
        var el = panelEl.querySelector(sel);
        if (el) usedH2 += el.offsetHeight;
      });
    }
    var graphHeight = Math.floor(availableH * 0.38);
    var graphWidth  = (panelEl.clientWidth || 400) - margin.left - margin.right - 24;
    var donnees     = chartData.donnees;

    var svg = d3.select(container).append("svg")
      .attr("width",  graphWidth  + margin.left + margin.right)
      .attr("height", graphHeight + margin.top  + margin.bottom)
      .style("overflow", "visible")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
      .domain(donnees.map(function (d) { return d.annee; }))
      .range([0, graphWidth]).padding(0.3);
    var maxValB = d3.max(donnees, function (d) { return d.valeur; });
    var y = d3.scaleLinear()
      .domain([0, maxValB * 1.15])
      .range([graphHeight, 0]);

    svg.append("g").attr("class", "behavior-grid")
      .call(d3.axisLeft(y).ticks(4).tickSize(-graphWidth).tickFormat(""))
      .select(".domain").remove();

    // Barres
    var bars = svg.selectAll("rect").data(donnees).enter()
      .append("rect")
      .attr("x", function (d) { return x(d.annee); })
      .attr("y", function (d) { return y(d.valeur); })
      .attr("width", x.bandwidth())
      .attr("height", function (d) { return graphHeight - y(d.valeur); })
      .attr("fill", function (d) { return d.annee === chartData.pic ? "#9333ea" : "#555555"; })
      .style("cursor", "pointer");

    // Hover individuel
    bars
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(120).attr("fill", "#c084fc");
        behavior_showTooltip(event,
          '<strong>' + d.annee + '</strong><br>' +
          behavior_fmtNum(d.valeur) + ' urgences<br>' +
          behavior_getDelta(d, donnees)
        );
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(120)
          .attr("fill", d.annee === chartData.pic ? "#9333ea" : "#555555");
        behavior_hideTooltip();
      });

    // Labels de valeur au-dessus de chaque barre
    svg.selectAll(".bar-label").data(donnees).enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", function (d) { return x(d.annee) + x.bandwidth() / 2; })
      .attr("y", function (d) { return y(d.valeur) - 4; })
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "0.72rem")
      .text(function (d) { return behavior_fmtNum(d.valeur); });

    // Axe X au niveau y=0 — avec domain visible
    var axisXGroup = svg.append("g")
      .attr("class", "behavior-axis-x")
      .attr("transform", "translate(0," + graphHeight + ")")
      .call(
        d3.axisBottom(x)
          .tickFormat(function (d) { return d.toString(); })
          .tickSize(4)
      );
    axisXGroup.select(".domain")
      .attr("stroke", "rgba(255,255,255,0.4)")
      .attr("stroke-width", 2);
    axisXGroup.selectAll("text")
      .attr("fill", "#cccccc")
      .attr("font-size", "0.72rem")
      .attr("font-family", "'SUSE', sans-serif")
      .attr("dy", "1.3em");
    axisXGroup.selectAll("line")
      .attr("stroke", "rgba(255,255,255,0.35)");

    // Axe Y : tickValues depuis 0 — référence sauvée pour éviter le bug de chaîne D3
    var yAxisGB = svg.append("g").attr("class", "behavior-axis-y");
    yAxisGB.call(d3.axisLeft(y)
      .tickValues([0, 1000, 2000, 3000, 4000].filter(function (v) { return v <= maxValB * 1.15; }))
      .tickFormat(function (d) { return d === 0 ? '0' : d.toLocaleString('fr-CH'); })
    );
    yAxisGB.select(".domain").remove();
    yAxisGB.selectAll("text")
      .attr("fill", "#cccccc")
      .attr("font-size", "0.7rem")
      .attr("font-family", "'SUSE', sans-serif");
    yAxisGB.selectAll("line")
      .attr("stroke", "rgba(255,255,255,0.2)");

    // Ligne de base — rendue en dernier pour passer par-dessus tout
    svg.append("line")
      .attr("class", "behavior-axis-baseline")
      .attr("x1", -5).attr("x2", graphWidth)
      .attr("y1", graphHeight).attr("y2", graphHeight)
      .attr("stroke", "rgba(255,255,255,0.4)")
      .attr("stroke-width", 2);
  }

  // Variation vs barre précédente (2020 = creux COVID)
  function behavior_getDelta(d, data) {
    var idx = data.findIndex(function (x) { return x.annee === d.annee; });
    if (idx === 0) return '<span style="color:#888">Creux COVID (référence)</span>';
    var prev = data[idx - 1];
    var diff = d.valeur - prev.valeur;
    var sign = diff > 0 ? '+' : '';
    var color = diff > 0 ? '#9333ea' : '#4caf50';
    return '<span style="color:' + color + '">' + sign + behavior_fmtNum(diff) + ' vs ' + prev.annee + '</span>';
  }

  // ── Navigation graphiques ──────────────────────────────────────────────────
  function behavior_bindGraphNav() {
    var prev = document.getElementById("behavior-prev");
    var next = document.getElementById("behavior-next");
    if (prev) prev.addEventListener("click", function () {
      behavior_graphIndex = (behavior_graphIndex - 1 + 2) % 2;
      behavior_updateGraph();
      if (behavior_graphIndex === 0) behavior_animateLineChart();
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

  // ── Tooltip global (body-level) ───────────────────────────────────────────
  function behavior_showTooltip(event, html) {
    var tip = document.getElementById('behavior-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'behavior-tooltip';
      document.body.appendChild(tip);
    }
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = (event.pageX + 12) + 'px';
    tip.style.top  = (event.pageY - 28) + 'px';
  }

  function behavior_hideTooltip() {
    var tip = document.getElementById('behavior-tooltip');
    if (tip) tip.style.display = 'none';
  }

  // ── Scrollama ─────────────────────────────────────────────────────────────
  function behavior_setupScrollama() {
    var scroller = scrollama();
    scroller
      .setup({ step: ".behavior-step", offset: 0.5, debug: false })
      .onStepEnter(function (response) {
        var index = response.index;
        if (index === behavior_currentStep) return;
        var prev = behavior_currentStep;
        behavior_currentStep = index;
        if (prev === -1) {
          behavior_renderEffects(index);
          return;
        }
        behavior_transitionTo(index);
      });

    window.addEventListener("resize", scroller.resize);
  }

})();
