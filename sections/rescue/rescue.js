// sections/rescue/rescue.js
// Dépendances globales : d3 (v7), topojson (v3), scrollama (v3)
// Chargés via lib/ dans index.html — pas d'import

(function () {
  "use strict";

  // ── Guard ──────────────────────────────────────────────────────────────────
  // Si la section n'existe pas dans le DOM, on sort sans rien faire
  if (!document.getElementById("rescue-map-container")) return;

  // ── Données ────────────────────────────────────────────────────────────────

  const YEARS = [2020, 2021, 2022, 2023, 2024];

  const SAS_DATA = {
    SARO: { name: "Secours Alpin Romand", values: [160, 165, 175, 217, 190] },
    ARBE: { name: "Secours Alpin Bernois", values: [234, 240, 292, 287, 262] },
    ARZ: { name: "Suisse centrale", values: [153, 147, 178, 199, 177] },
    SATI: { name: "Tessin", values: [108, 101, 122, 144, 156] },
    ARGL: { name: "Glaris", values: [51, 46, 65, 53, 50] },
    ARO: { name: "Suisse orientale", values: [100, 116, 146, 136, 164] },
    ARG: { name: "Grisons", values: [193, 256, 314, 439, 484] },
  };

  const OCVS_BASES = [
    {
      id: "amb_monthey",
      nom: "Amb. Monthey",
      type: "ambulance",
      lng: 6.909,
      lat: 46.255,
      total: 3224,
      delai: 10.6,
      ti: 50,
      dispo: 55.0,
    },
    {
      id: "amb_entremont",
      nom: "Amb. Entremont",
      type: "ambulance",
      lng: 7.154,
      lat: 46.0,
      total: 1034,
      delai: 11.0,
      ti: 68,
      dispo: 74.2,
    },
    {
      id: "amb_martigny",
      nom: "Amb. Martigny",
      type: "ambulance",
      lng: 7.073,
      lat: 46.101,
      total: 5135,
      delai: 10.6,
      ti: 47,
      dispo: 59.0,
    },
    {
      id: "amb_sion",
      nom: "Amb. Sion",
      type: "ambulance",
      lng: 7.36,
      lat: 46.233,
      total: 4231,
      delai: 10.5,
      ti: 40,
      dispo: 57.6,
    },
    {
      id: "amb_sierre",
      nom: "Amb. Sierre",
      type: "ambulance",
      lng: 7.534,
      lat: 46.294,
      total: 2763,
      delai: 10.3,
      ti: 47,
      dispo: 61.8,
    },
    {
      id: "amb_visp",
      nom: "Amb. Visp",
      type: "ambulance",
      lng: 7.882,
      lat: 46.294,
      total: 2930,
      delai: 10.9,
      ti: 48,
      dispo: 69.2,
    },
    {
      id: "amb_saastal",
      nom: "Amb. Saastal",
      type: "ambulance",
      lng: 7.935,
      lat: 46.14,
      total: 779,
      delai: 10.2,
      ti: 67,
      dispo: 82.9,
    },
    {
      id: "amb_zermatt",
      nom: "Amb. Zermatt",
      type: "ambulance",
      lng: 7.749,
      lat: 46.02,
      total: 1492,
      delai: 9.47,
      ti: 69,
      dispo: 77.0,
    },
    {
      id: "amb_gampel",
      nom: "Amb. Gampel",
      type: "ambulance",
      lng: 7.742,
      lat: 46.32,
      total: 904,
      delai: 10.4,
      ti: 52,
      dispo: 55.1,
    },
    {
      id: "amb_fiesch",
      nom: "Amb. Fiesch",
      type: "ambulance",
      lng: 8.127,
      lat: 46.398,
      total: 800,
      delai: 10.4,
      ti: 51,
      dispo: 77.0,
    },
    {
      id: "heli_sion",
      nom: "Héli Air-Glaciers",
      type: "helicoptere",
      lng: 7.326,
      lat: 46.219,
      total: 2225,
      delai: 19.4,
      ti: 52,
      dispo: null,
    },
    {
      id: "heli_zermatt",
      nom: "Héli Air Zermatt",
      type: "helicoptere",
      lng: 7.749,
      lat: 46.06,
      total: 2443,
      delai: 17.9,
      ti: 51,
      dispo: null,
    },
    {
      id: "smur_chablais",
      nom: "SMUR Chablais",
      type: "smur",
      lng: 6.893,
      lat: 46.302,
      total: 1070,
      delai: null,
      ti: null,
      dispo: 92.9,
    },
    {
      id: "smur_martigny",
      nom: "SMUR Martigny",
      type: "smur",
      lng: 7.043,
      lat: 46.121,
      total: 1115,
      delai: null,
      ti: null,
      dispo: 82.1,
    },
    {
      id: "smur_sion",
      nom: "SMUR Sion",
      type: "smur",
      lng: 7.39,
      lat: 46.253,
      total: 722,
      delai: null,
      ti: null,
      dispo: 84.2,
    },
    {
      id: "nef_visp",
      nom: "NEF Visp",
      type: "smur",
      lng: 7.912,
      lat: 46.274,
      total: 183,
      delai: null,
      ti: null,
      dispo: 87.3,
    },
  ];

  const TYPE_COLOR = {
    ambulance: "#2196F3",
    helicoptere: "#FF9800",
    smur: "#9C27B0",
  };

  const SAS_PALETTE = [
    "#2196F3",
    "#FF9800",
    "#4CAF50",
    "#E91E63",
    "#9C27B0",
    "#00BCD4",
    "#1a6b3a",
  ];

  // ── État local ─────────────────────────────────────────────────────────────
  let currentYearIdx = 4; // 2024 par défaut
  let currentTab = "nombre";

  // ── Scales ─────────────────────────────────────────────────────────────────
  const colorScale = d3
    .scaleSequential()
    .domain([40, 490])
    .interpolator(d3.interpolate("#c8e6c9", "#1a6b3a"));

  const rScale = d3.scaleSqrt().domain([183, 5135]).range([5, 22]);

  // ── SVG ────────────────────────────────────────────────────────────────────
  const W = 860;
  const H = 400;

  const projection = d3
    .geoMercator()
    .center([8.2, 46.82])
    .scale(6200)
    .translate([W / 2, H / 2]);

  const pathGen = d3.geoPath().projection(projection);

  const mapContainer = document.getElementById("rescue-map-container");

  // Contrôles au-dessus de la carte
  const controls = document.createElement("div");
  controls.id = "rescue-controls";
  controls.innerHTML = `
    <h2>Interventions de sauvetage — Suisse</h2>
    <div id="rescue-year-wrap">
      <span>2020</span>
      <input type="range" id="rescue-year-slider" min="0" max="4" value="4">
      <span id="rescue-year-label">2024</span>
    </div>
  `;
  mapContainer.appendChild(controls);

  const svg = d3
    .select(mapContainer)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Légende
  const legend = document.createElement("div");
  legend.id = "rescue-legend";
  legend.innerHTML = `
    <span class="rescue-legend-item">
      <span class="rescue-legend-dot" style="background:#1a6b3a"></span>
      SAS — régions (interventions/an)
    </span>
    <span class="rescue-legend-item">
      <span class="rescue-legend-dot" style="background:#2196F3"></span>Ambulance
    </span>
    <span class="rescue-legend-item">
      <span class="rescue-legend-dot" style="background:#FF9800"></span>Hélicoptère
    </span>
    <span class="rescue-legend-item">
      <span class="rescue-legend-dot" style="background:#9C27B0"></span>SMUR
    </span>
  `;
  mapContainer.appendChild(legend);

  // Tooltip (dans le body pour éviter les overflow cachés)
  const tooltip = d3.select("body").append("div").attr("id", "rescue-tooltip");

  function showTip(evt, name, val) {
    tooltip
      .style("opacity", 1)
      .style("left", evt.clientX + 14 + "px")
      .style("top", evt.clientY - 32 + "px")
      .html(`<strong>${name}</strong><br>${val}`);
  }

  function hideTip() {
    tooltip.style("opacity", 0);
  }

  // ── Chargement ─────────────────────────────────────────────────────────────
  // ✓ Clé corrigée : topo.objects.cantons (swiss-maps@4 / 2021)
  // ✓ Propriété abréviation : feature.properties.abbr
  Promise.all([
    d3.json("geo/switzerland-cantons.topojson"),
    d3.json("data/rescue/canton-region-mapping.json"),
  ])
    .then(([topo, mapping]) => {
      const cantons = topojson.feature(topo, topo.objects.cantons);

      drawCantons(cantons, mapping);
      drawBubbles();
      buildPanel();
      buildSASChart();
    })
    .catch((err) => {
      console.error("[rescue] Erreur de chargement :", err);
      mapContainer.innerHTML += `
      <p style="color:red;font-size:12px;text-align:center">
        Erreur de chargement — vérifier les chemins geo/ et data/rescue/
      </p>`;
    });

  // ── Dessin cantons ─────────────────────────────────────────────────────────
  function getAbbr(feature) {
    return String(feature.properties.id || "");
  }

  function getCantonFill(id, mapping) {
    const region = mapping[id];
    if (!region) return "#e8f5e9";
    if (region === "VALAIS") return "#1a6b3a";
    const val = SAS_DATA[region]?.values[currentYearIdx];
    return val ? colorScale(val) : "#e8f5e9";
  }

  function drawCantons(cantons, mapping) {
    const layer = svg.append("g").attr("class", "cantons-layer");

    layer
      .selectAll("path")
      .data(cantons.features)
      .join("path")
      .attr("class", (d) =>
        getAbbr(d) === "VS" ? "canton-valais" : "canton-path",
      )
      .attr("d", pathGen)
      .attr("fill", (d) => getCantonFill(getAbbr(d), mapping))
      .on("mousemove", (evt, d) => {
        const id = getAbbr(d);
        const region = mapping[id];
        if (region === "VALAIS") {
          showTip(
            evt,
            "Valais",
            "29'194 interventions OCVS · cliquer pour le détail",
          );
        } else if (region && SAS_DATA[region]) {
          const r = SAS_DATA[region];
          showTip(
            evt,
            r.name,
            `${r.values[currentYearIdx]} interventions SAS — ${YEARS[currentYearIdx]}`,
          );
        }
      })
      .on("mouseleave", hideTip)
      .on("click", (evt, d) => {
        if (mapping[getAbbr(d)] === "VALAIS") openPanel();
      });

    // Slider année
    document
      .getElementById("rescue-year-slider")
      .addEventListener("input", function () {
        currentYearIdx = +this.value;
        document.getElementById("rescue-year-label").textContent =
          YEARS[currentYearIdx];
        layer
          .selectAll("path")
          .attr("fill", (d) => getCantonFill(getAbbr(d), mapping));
      });
  }

  // ── Bulles OCVS ────────────────────────────────────────────────────────────
  function drawBubbles() {
    svg
      .append("g")
      .attr("class", "bubbles-layer")
      .selectAll("circle")
      .data(OCVS_BASES)
      .join("circle")
      .attr("class", "base-bubble")
      .attr("cx", (d) => projection([d.lng, d.lat])[0])
      .attr("cy", (d) => projection([d.lng, d.lat])[1])
      .attr("r", (d) => rScale(d.total))
      .attr("fill", (d) => TYPE_COLOR[d.type])
      .attr("fill-opacity", 0.72)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .on("mousemove", (evt, d) => {
        showTip(
          evt,
          d.nom,
          `${d.total.toLocaleString()} interventions` +
            (d.delai ? ` · délai médian ${d.delai.toFixed(1)}'` : ""),
        );
      })
      .on("mouseleave", hideTip)
      .on("click", openPanel);
  }

  // ── Panel OCVS ─────────────────────────────────────────────────────────────
  function buildPanel() {
    const panel = document.createElement("div");
    panel.id = "rescue-ocvs-panel";
    mapContainer.after(panel);
  }

  function openPanel() {
    const panel = document.getElementById("rescue-ocvs-panel");
    panel.classList.add("visible");
    renderPanel();
  }

  function renderPanel() {
    const panel = document.getElementById("rescue-ocvs-panel");
    if (!panel) return;

    const TABS = [
      { id: "nombre", label: "Nombre" },
      { id: "delai", label: "Délai réponse" },
      { id: "dispo", label: "Disponibilité" },
    ];

    // Contenu de l'onglet actif
    let tabContent = "";

    if (currentTab === "nombre") {
      const sorted = [...OCVS_BASES].sort((a, b) => b.total - a.total);
      tabContent = sorted
        .map(
          (b) => `
        <div class="rescue-base-row">
          <span style="width:10px;height:10px;border-radius:50%;background:${TYPE_COLOR[b.type]};display:inline-block"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.nom}</span>
          <strong>${b.total.toLocaleString()}</strong>
        </div>`,
        )
        .join("");
    } else if (currentTab === "delai") {
      const list = OCVS_BASES.filter((b) => b.delai).sort(
        (a, b) => a.delai - b.delai,
      );
      const maxTI = Math.max(...list.map((b) => b.ti));
      tabContent = `<p style="font-size:11px;color:#666;margin:0 0 10px">
        Délai réponse P1 médian (DR) · Temps d'intervention médian (TI)</p>`;
      tabContent += list
        .map(
          (b) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
            <span style="display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:50%;
                           background:${TYPE_COLOR[b.type]};display:inline-block"></span>
              ${b.nom}
            </span>
            <span style="color:#666">DR ${b.delai.toFixed(1)}' · TI ${b.ti}'</span>
          </div>
          <div class="rescue-bar-track">
            <div class="rescue-bar-fill"
                 style="width:${Math.round((b.ti / maxTI) * 100)}%;
                        background:${TYPE_COLOR[b.type]}"></div>
          </div>
        </div>`,
        )
        .join("");
    } else if (currentTab === "dispo") {
      const list = OCVS_BASES.filter((b) => b.dispo !== null).sort(
        (a, b) => b.dispo - a.dispo,
      );
      tabContent = `<p style="font-size:11px;color:#666;margin:0 0 10px">
        Taux de disponibilité des véhicules (hors missions et entretien)</p>`;
      tabContent += list
        .map(
          (b) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
            <span style="display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:50%;
                           background:${TYPE_COLOR[b.type]};display:inline-block"></span>
              ${b.nom}
            </span>
            <strong>${b.dispo.toFixed(1)} %</strong>
          </div>
          <div class="rescue-bar-track">
            <div class="rescue-bar-fill"
                 style="width:${b.dispo}%;background:${TYPE_COLOR[b.type]}"></div>
          </div>
        </div>`,
        )
        .join("");
    }

    panel.innerHTML = `
      <div class="rescue-panel-header">
        <p class="rescue-panel-title">
          Valais — Services d'urgence 2024
          <span style="font-size:11px;font-weight:400;color:#666">(OCVS)</span>
        </p>
        <button class="rescue-panel-close"
                onclick="document.getElementById('rescue-ocvs-panel')
                           .classList.remove('visible')">×</button>
      </div>

      <div class="rescue-panel-grid">
        <div class="rescue-metric">
          <p class="rescue-metric-val">21'438</p>
          <p class="rescue-metric-lbl">Ambulances</p>
        </div>
        <div class="rescue-metric">
          <p class="rescue-metric-val">4'668</p>
          <p class="rescue-metric-lbl">Hélicoptères</p>
        </div>
        <div class="rescue-metric">
          <p class="rescue-metric-val">3'088</p>
          <p class="rescue-metric-lbl">SMUR</p>
        </div>
        <div class="rescue-metric">
          <p class="rescue-metric-val" style="color:#1a6b3a">73.4 %</p>
          <p class="rescue-metric-lbl">Dispo. véhicules</p>
        </div>
      </div>

      <div class="rescue-tab-row">
        ${TABS.map(
          (t) => `
          <button class="rescue-tab ${currentTab === t.id ? "active" : ""}"
                  onclick="rescueSetTab('${t.id}')">${t.label}</button>
        `,
        ).join("")}
      </div>

      ${tabContent}
    `;
  }

  // Exposé globalement avec préfixe rescue — pas de collision avec Ana
  window.rescueSetTab = function (tab) {
    currentTab = tab;
    renderPanel();
  };

  // ── Graphique comparatif SAS 2020–2024 ────────────────────────────────────
  function buildSASChart() {
    const container = document.getElementById("rescue-chart-container");
    if (!container) return;

    const title = document.createElement("p");
    title.className = "rescue-chart-title";
    title.textContent = "Interventions SAS par région — 2020 à 2024";
    container.appendChild(title);

    const margin = { top: 16, right: 100, bottom: 28, left: 36 };
    const CW = 860 - margin.left - margin.right;
    const CH = 200 - margin.top - margin.bottom;

    const svgChart = d3
      .select(container)
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${CW + margin.left + margin.right} ${CH + margin.top + margin.bottom}`,
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(YEARS).range([0, CW]).padding(0.1);

    const allVals = Object.values(SAS_DATA).flatMap((r) => r.values);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allVals) * 1.1])
      .range([CH, 0]);

    // Axes
    svgChart
      .append("g")
      .attr("transform", `translate(0,${CH})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(6))
      .select(".domain")
      .remove();

    svgChart
      .append("g")
      .call(d3.axisLeft(y).ticks(4).tickSize(-CW))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "#e5e5e5")
          .attr("stroke-dasharray", "2,2"),
      );

    // Lignes + points par région
    const lineGen = d3
      .line()
      .x((_, i) => x(YEARS[i]))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    Object.entries(SAS_DATA).forEach(([code, r], i) => {
      const color = SAS_PALETTE[i];

      // Ligne
      svgChart
        .append("path")
        .datum(r.values)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", lineGen);

      // Points interactifs
      svgChart
        .selectAll(`.dot-${code}`)
        .data(r.values)
        .join("circle")
        .attr("class", `dot-${code}`)
        .attr("cx", (_, j) => x(YEARS[j]))
        .attr("cy", (d) => y(d))
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mousemove", (evt, d) =>
          showTip(
            evt,
            `${r.name} — ${YEARS[r.values.indexOf(d)]}`,
            `${d} interventions`,
          ),
        )
        .on("mouseleave", hideTip);

      // Label en bout de ligne
      svgChart
        .append("text")
        .attr("x", x(2024) + 8)
        .attr("y", y(r.values[4]))
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .attr("fill", color)
        .text(code);
    });
  }
})(); // Fin IIFE — rien ne fuite dans le scope global
