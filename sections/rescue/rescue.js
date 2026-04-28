// sections/rescue/rescue.js
// Dépendances globales : d3 (v7), topojson (v3), mapboxgl (v3.3.0)
// Chargés via lib/ et CDN dans index.html — pas d'import

(function () {
  "use strict";

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!document.getElementById("rescue-map-container")) return;
  if (typeof mapboxgl === "undefined") {
    console.error("[rescue] mapboxgl non disponible — vérifier le CDN dans <head>");
    return;
  }

  // ── Constantes ─────────────────────────────────────────────────────────────

  // ← Remplacer par ton token Mapbox (https://account.mapbox.com)
  mapboxgl.accessToken = MAPBOX_TOKEN;

  const YEARS = [2020, 2021, 2022, 2023, 2024];

  const SAS_DATA = {
    SARO: { name: "Secours Alpin Romand",  values: [160, 165, 175, 217, 190] },
    ARBE: { name: "Secours Alpin Bernois", values: [234, 240, 292, 287, 262] },
    ARZ:  { name: "Suisse centrale",       values: [153, 147, 178, 199, 177] },
    SATI: { name: "Tessin",                values: [108, 101, 122, 144, 156] },
    ARGL: { name: "Glaris",                values: [ 51,  46,  65,  53,  50] },
    ARO:  { name: "Suisse orientale",      values: [100, 116, 146, 136, 164] },
    ARG:  { name: "Grisons",               values: [193, 256, 314, 439, 484] },
  };

  const TYPE_COLOR = {
    ambulance:   "#2196F3",
    helicoptere: "#FF9800",
    smur:        "#9C27B0",
  };

  const SAS_PALETTE = [
    "#2196F3", "#FF9800", "#4CAF50", "#E91E63",
    "#9C27B0", "#00BCD4", "#1a6b3a",
  ];

  // Coordonnées GPS par code OCVS (données géographiques absentes du JSON de rapport)
  const OCVS_COORD_MAP = {
    33: { nom: "Amb. Monthey",           type: "ambulance",   lng: 6.909, lat: 46.255 },
    68: { nom: "Amb. Entremont",         type: "ambulance",   lng: 7.154, lat: 46.000 },
    66: { nom: "Amb. Martigny",          type: "ambulance",   lng: 7.073, lat: 46.101 },
    65: { nom: "Amb. Sion",              type: "ambulance",   lng: 7.360, lat: 46.233 },
    61: { nom: "Amb. Sierre",            type: "ambulance",   lng: 7.534, lat: 46.294 },
    55: { nom: "Amb. Visp",              type: "ambulance",   lng: 7.882, lat: 46.294 },
    53: { nom: "Amb. Saastal",           type: "ambulance",   lng: 7.935, lat: 46.140 },
    57: { nom: "Amb. Zermatt",           type: "ambulance",   lng: 7.749, lat: 46.020 },
    70: { nom: "Amb. Gampel",            type: "ambulance",   lng: 7.742, lat: 46.320 },
    75: { nom: "Amb. Fiesch",            type: "ambulance",   lng: 8.127, lat: 46.398 },
    82: { nom: "Rapid Resp. St-Niklaus", type: "ambulance",   lng: 7.794, lat: 46.178 },
    60: { nom: "Héli Air-Glaciers",      type: "helicoptere", lng: 7.326, lat: 46.219 },
    59: { nom: "Héli Air Zermatt",       type: "helicoptere", lng: 7.749, lat: 46.060 },
    42: { nom: "SMUR Chablais",          type: "smur",        lng: 6.893, lat: 46.302 },
    43: { nom: "SMUR Martigny",          type: "smur",        lng: 7.043, lat: 46.121 },
    44: { nom: "SMUR Sion",              type: "smur",        lng: 7.390, lat: 46.253 },
    45: { nom: "NEF Visp",               type: "smur",        lng: 7.912, lat: 46.274 },
  };

  // Mapping correct canton (TopoJSON id) → région SAS + nom d'organisme lisible
  // Source : structure officielle SAS / Schweizerische Alpine Rettung
  const CANTON_INFO = {
    "1":  { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // ZH
    "2":  { region: "ARBE",   org: "Secours Alpin Bernois"             }, // BE
    "3":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  }, // LU
    "4":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  }, // UR
    "5":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  }, // SZ
    "6":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  }, // OW
    "7":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  }, // NW
    "8":  { region: "ARGL",   org: "Secours Alpin Glaronnais"          }, // GL
    "9":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  }, // ZG
    "10": { region: "SARO",   org: "Secours Alpin Romand"              }, // FR
    "11": { region: null,      org: null                                }, // SO
    "12": { region: null,      org: null                                }, // BS
    "13": { region: null,      org: null                                }, // BL
    "14": { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // SH
    "15": { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // AR
    "16": { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // AI
    "17": { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // SG
    "18": { region: "ARG",    org: "Secours Alpin des Grisons"         }, // GR
    "19": { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // AG
    "20": { region: "ARO",    org: "Secours Alpin de Suisse orientale" }, // TG
    "21": { region: "SATI",   org: "Secours Alpin Tessinois"           }, // TI
    "22": { region: "SARO",   org: "Secours Alpin Romand"              }, // VD
    "23": { region: "VALAIS", org: null                                 }, // VS — OCVS
    "24": { region: "SARO",   org: "Secours Alpin Romand"              }, // NE
    "25": { region: null,      org: null                                }, // GE
    "26": { region: "SARO",   org: "Secours Alpin Romand"              }, // JU
  };

  // ID TopoJSON du Valais (id=22 = Vaud, id=23 = Valais/Wallis)
  const VALAIS_ID = "23";

  // Vue initiale Mapbox — Suisse
  const CH_VIEW = { center: [8.2275, 46.8182], zoom: 7,  pitch: 45, bearing:   0 };
  // Vue focus Valais
  const VS_VIEW = { center: [7.60,   46.20  ], zoom: 9,  pitch: 55, bearing: -10 };

  // ── État ───────────────────────────────────────────────────────────────────
  const currentYearIdx = 4; // 2024 — fixé
  let currentTab = "nombre";
  let cachedData = null;     // { cantons, ocvsBases, ocvsTotals }
  let mapObj     = null;     // instance Mapbox GL
  let mapReady   = false;    // événement 'load' Mapbox reçu
  let dataReady  = false;    // Promise.all résolu
  let redrawFn   = null;     // fonction de redessin D3 pour la vue courante
  let svgLayer   = null;     // sélection D3 du SVG overlay persistant

  // ── Échelle choroplèthe ────────────────────────────────────────────────────
  const colorScale = d3
    .scaleSequential()
    .domain([40, 490])
    .interpolator(d3.interpolate("#c8e6c9", "#1a6b3a"));

  // ── DOM partagé ────────────────────────────────────────────────────────────
  const mapContainer = document.getElementById("rescue-map-container");
  const tooltip = d3.select("body").append("div").attr("id", "rescue-tooltip");

  // ── Helpers module ─────────────────────────────────────────────────────────
  function showTip(evt, name, val) {
    tooltip
      .style("opacity", 1)
      .style("left", evt.clientX + 14 + "px")
      .style("top",  evt.clientY - 32 + "px")
      .html(`<strong>${name}</strong><br>${val}`);
  }
  function hideTip() { tooltip.style("opacity", 0); }

  function getId(feature) { return String(feature.properties.id || ""); }

  function getCantonFill(id) {
    if (id === VALAIS_ID) return "#1a6b3a";
    const region = CANTON_INFO[id]?.region;
    if (!region) return "#e8f5e9";
    const val = SAS_DATA[region]?.values[currentYearIdx];
    return val ? colorScale(val) : "#e8f5e9";
  }

  // ── Éléments DOM liés à une vue ────────────────────────────────────────────
  function createVueEl(tag) {
    const el = document.createElement(tag);
    el.classList.add("rescue-view-el");
    return el;
  }
  function clearVueElements() {
    mapContainer.querySelectorAll(".rescue-view-el").forEach(el => el.remove());
  }

  // ── Initialisation Mapbox ──────────────────────────────────────────────────

  /** Crée le backdrop Mapbox et le SVG overlay persistants, démarre la carte */
  function initMapbox() {
    const backdrop = document.createElement("div");
    backdrop.id = "mapbox-backdrop";
    mapContainer.appendChild(backdrop);

    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.id = "d3-overlay";
    mapContainer.appendChild(svgEl);
    svgLayer = d3.select(svgEl);

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapObj = new mapboxgl.Map({
      container:   "mapbox-backdrop",
      style:       "mapbox://styles/mapbox/outdoors-v12",
      center:      CH_VIEW.center,
      zoom:        CH_VIEW.zoom,
      pitch:       CH_VIEW.pitch,
      bearing:     CH_VIEW.bearing,
      interactive: false,
    });

    mapObj.on("load", () => {
      mapObj.addSource("mapbox-dem", {
        type:    "raster-dem",
        url:     "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom:  14,
      });
      mapObj.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      mapObj.addLayer({
        id:   "sky",
        type: "sky",
        paint: {
          "sky-type":                   "atmosphere",
          "sky-atmosphere-sun":         [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });
      mapReady = true;
      tryStart();
    });

    // Redessine D3 à chaque frame Mapbox (flyTo inclus)
    mapObj.on("render", () => {
      if (redrawFn && mapReady) redrawFn();
    });
  }

  // ── Projection D3 ↔ Mapbox ─────────────────────────────────────────────────

  /** Renvoie un d3.geoPath dont la projection délègue à map.project() */
  function makePathGen() {
    return d3.geoPath().projection(
      d3.geoTransform({
        point: function (lon, lat) {
          const p = mapObj.project([lon, lat]);
          this.stream.point(p.x, p.y);
        },
      })
    );
  }

  // ── Parsing OCVS JSON ──────────────────────────────────────────────────────

  /** Construit un tableau normalisé de bases à partir du JSON OCVS brut */
  function parseOCVS(ocvsData) {
    const bases = [];
    const dispoAmb  = ocvsData.disponibilite_vehicules_2024?.ambulances || {};
    const dispoSMUR = ocvsData.disponibilite_vehicules_2024?.SMUR        || {};

    function findDispo(section, code) {
      const entry = Object.entries(section).find(([k]) => k.startsWith(code + "_"));
      const raw   = entry?.[1]?.total?.taux_dispo;
      return raw ? parseFloat(raw) : null;
    }

    (ocvsData.services_ambulances?.bases || []).forEach(b => {
      const coord = OCVS_COORD_MAP[b.code];
      if (!coord) return;
      bases.push({
        id: "amb_" + b.code, ...coord,
        total: b.interventions?.total?.total          ?? 0,
        delai: b.delai_reponse_P1?.total?.mediane     ?? null,
        dispo: findDispo(dispoAmb, b.code),
      });
    });

    (ocvsData.services_helicopteres?.bases || []).forEach(b => {
      const coord = OCVS_COORD_MAP[b.code];
      if (!coord) return;
      bases.push({
        id: "heli_" + b.code, ...coord,
        total: b.interventions_2024?.total?.total     ?? 0,
        delai: b.delai_reponse_P1?.total?.mediane     ?? null,
        dispo: null,
      });
    });

    (ocvsData.services_SMUR?.bases || []).forEach(b => {
      const coord = OCVS_COORD_MAP[b.code];
      if (!coord) return;
      bases.push({
        id: "smur_" + b.code, ...coord,
        total: b.interventions_2024?.total            ?? 0,
        delai: null,
        dispo: findDispo(dispoSMUR, b.code),
      });
    });

    return bases;
  }

  /** Extrait les totaux globaux depuis le JSON OCVS */
  function parseOCVSTotals(ocvsData) {
    const rawDispo = ocvsData.disponibilite_vehicules_2024
      ?.ambulances?.total_ambulances?.total?.taux_dispo;
    return {
      ambulances:   ocvsData.services_ambulances?.total_interventions   ?? 0,
      helicopteres: ocvsData.services_helicopteres?.total_interventions ?? 0,
      smur:         ocvsData.services_SMUR?.total_interventions_2024    ?? 0,
      dispo:        rawDispo ? parseFloat(rawDispo) : 73.4,
    };
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────
  initMapbox();

  Promise.all([
    d3.json("geo/switzerland-cantons.topojson"),
    d3.json("data/rescue/OCVS_annual-report-rescue_2024.json"),
  ])
    .then(([topo, ocvsData]) => {
      const cantons = topojson.feature(topo, topo.objects.cantons);
      cachedData = {
        cantons,
        ocvsBases:  parseOCVS(ocvsData),
        ocvsTotals: parseOCVSTotals(ocvsData),
      };
      dataReady = true;
      tryStart();
    })
    .catch(err => {
      console.error("[rescue] Erreur chargement données :", err);
    });

  function tryStart() {
    if (!mapReady || !dataReady) return;
    drawVue1();
    buildSASChart();
  }

  // ── VUE 1 — Carte nationale ────────────────────────────────────────────────

  /** Choroplèthe SAS national avec badge Valais, sur fond Mapbox terrain */
  function drawVue1() {
    clearVueElements();
    svgLayer.selectAll("*").remove();
    redrawFn = null;

    const { cantons, ocvsTotals } = cachedData;
    let pathGen = makePathGen();

    mapObj.flyTo({ ...CH_VIEW, duration: 900 });

    // ── Cantons ──
    const cantonsG = svgLayer.append("g").attr("class", "cantons-layer");

    cantonsG
      .selectAll("path")
      .data(cantons.features)
      .join("path")
      .attr("class", d =>
        getId(d) === VALAIS_ID
          ? "canton-valais canton-valais-pulse"
          : "canton-path"
      )
      .attr("d", pathGen)
      .attr("fill", d => getCantonFill(getId(d)))
      .attr("fill-opacity", d => getId(d) === VALAIS_ID ? 0.75 : 0.6)
      .style("pointer-events", "all")
      .on("mousemove", (evt, d) => {
        const id         = getId(d);
        const cantonName = d.properties.name.split(" / ")[0];

        if (id === VALAIS_ID) {
          const total = ocvsTotals.ambulances + ocvsTotals.helicopteres + ocvsTotals.smur;
          showTip(evt, cantonName,
            `${total.toLocaleString("fr-CH")} interventions OCVS · cliquer pour le détail`
          );
          return;
        }

        const info = CANTON_INFO[id];
        if (!info || !info.region) {
          showTip(evt, cantonName, "Pas de données de secours alpin disponibles");
          return;
        }

        const sasData = SAS_DATA[info.region];
        if (!sasData) {
          showTip(evt, cantonName, "Pas de données de secours alpin disponibles");
          return;
        }

        showTip(evt, cantonName,
          `${info.org}<br>${sasData.values[currentYearIdx].toLocaleString("fr-CH")} interventions SAS 2024`
        );
      })
      .on("mouseleave", hideTip)
      .on("click", (evt, d) => {
        if (getId(d) === VALAIS_ID) switchToVue2();
      });

    // ── Badge SVG sur le Valais ──
    const valaisFeature = cantons.features.find(
      f => String(f.properties.id) === VALAIS_ID
    );
    const badgeG = svgLayer.append("g")
      .attr("class", "rescue-badge-group")
      .style("pointer-events", "all")
      .on("click", switchToVue2);
    badgeG.append("rect")
      .attr("width", 126).attr("height", 28).attr("rx", 14)
      .attr("fill", "rgba(255,255,255,0.92)")
      .attr("stroke", "#1a6b3a").attr("stroke-width", 1.5);
    badgeG.append("text")
      .attr("x", 63).attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px").attr("font-weight", "600")
      .attr("fill", "#1a6b3a")
      .attr("font-family", "Inter, Helvetica Neue, Arial, sans-serif")
      .text("Voir le détail →");

    // ── Redessin synchronisé avec Mapbox ──
    redrawFn = () => {
      pathGen = makePathGen();
      cantonsG.selectAll("path").attr("d", pathGen);
      if (valaisFeature) {
        const [bx, by] = pathGen.centroid(valaisFeature);
        if (isFinite(bx) && isFinite(by)) {
          badgeG.attr("transform", `translate(${bx - 63}, ${by + 12})`);
        }
      }
    };
    redrawFn(); // position initiale avant le premier render event

    // ── Titre (overlay absolu) ──
    const controls = createVueEl("div");
    controls.id = "rescue-controls";
    controls.innerHTML = `<h2>Interventions de sauvetage — Suisse 2024</h2>`;
    mapContainer.appendChild(controls);

    // ── Légende (overlay absolu) ──
    const legend = createVueEl("div");
    legend.id = "rescue-legend";
    legend.innerHTML = `
      <span class="rescue-legend-item">
        <span class="rescue-legend-dot rescue-legend-gradient"></span>
        Interventions SAS — faible à élevé
      </span>
      <span class="rescue-legend-item">
        <span class="rescue-legend-dot" style="background:#1a6b3a"></span>
        Valais (OCVS) — cliquer pour le détail
      </span>`;
    mapContainer.appendChild(legend);
  }

  // ── Transitions de vue ─────────────────────────────────────────────────────

  /** Passe en Vue 2 — flyTo Valais, redessin bulles OCVS */
  function switchToVue2() {
    hideTip();
    drawVue2();
  }

  /** Revient en Vue 1 — flyTo Suisse, redessin choroplèthe */
  function switchToVue1() {
    hideTip();
    drawVue1();
  }

  // ── VUE 2 — Focus Valais ───────────────────────────────────────────────────

  /** Zoom Mapbox sur le Valais, bulles OCVS + panneau métriques en overlay */
  function drawVue2() {
    clearVueElements();
    svgLayer.selectAll("*").remove();
    redrawFn = null;

    const { cantons, ocvsBases, ocvsTotals } = cachedData;
    let pathGen = makePathGen();

    mapObj.flyTo({ ...VS_VIEW, duration: 1200 });

    const valaisFeature = cantons.features.find(
      f => String(f.properties.id) === VALAIS_ID
    );

    // ── Contour du Valais ──
    let valaisPath = null;
    if (valaisFeature) {
      valaisPath = svgLayer.append("path")
        .datum(valaisFeature)
        .attr("d", pathGen)
        .attr("fill", "#e8f5e9")
        .attr("fill-opacity", 0.22)
        .attr("stroke", "#1a6b3a")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.7);
    }

    // ── Bulles OCVS ──
    const maxTotal = d3.max(ocvsBases, d => d.total) || 1;
    const rScale = d3.scaleSqrt().domain([0, maxTotal]).range([5, 22]);

    const bubblesG = svgLayer.append("g").attr("class", "bubbles-layer");
    bubblesG
      .selectAll("circle")
      .data(ocvsBases)
      .join("circle")
      .attr("class", "rescue-bubble base-bubble")
      .attr("cx", d => mapObj.project([d.lng, d.lat]).x)
      .attr("cy", d => mapObj.project([d.lng, d.lat]).y)
      .attr("r",  d => rScale(d.total))
      .attr("fill", d => TYPE_COLOR[d.type])
      .attr("fill-opacity", 0.82)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("pointer-events", "all")
      .on("mousemove", (evt, d) =>
        showTip(evt, d.nom,
          `${d.total.toLocaleString("fr-CH")} interventions` +
          (d.delai ? ` · délai médian ${d.delai.toFixed(1)}'` : "")
        )
      )
      .on("mouseleave", hideTip);

    // ── Redessin synchronisé avec Mapbox ──
    redrawFn = () => {
      pathGen = makePathGen();
      if (valaisPath && valaisFeature) valaisPath.attr("d", pathGen);
      bubblesG.selectAll("circle")
        .attr("cx", d => mapObj.project([d.lng, d.lat]).x)
        .attr("cy", d => mapObj.project([d.lng, d.lat]).y);
    };

    // ── Légende bulles (overlay absolu) ──
    const legend = createVueEl("div");
    legend.id = "rescue-legend";
    legend.innerHTML = Object.entries(TYPE_COLOR).map(([type, color]) => `
      <span class="rescue-legend-item">
        <span class="rescue-legend-dot" style="background:${color}"></span>
        ${type.charAt(0).toUpperCase() + type.slice(1)}
      </span>`).join("");
    mapContainer.appendChild(legend);

    // ── Bouton retour (overlay absolu) ──
    const backBtn = createVueEl("button");
    backBtn.className = "rescue-back-btn";
    backBtn.textContent = "← Vue nationale";
    backBtn.addEventListener("click", switchToVue1);
    mapContainer.appendChild(backBtn);

    // ── Panneau métriques OCVS (overlay absolu) ──
    const panel = createVueEl("div");
    panel.className = "rescue-vue2-panel";
    mapContainer.appendChild(panel);
    renderPanelInto(panel, ocvsBases, ocvsTotals);
  }

  // ── Panneau de détail OCVS ─────────────────────────────────────────────────

  /** Injecte les métriques et onglets OCVS dans el */
  function renderPanelInto(el, bases, totals) {
    const TABS = [
      { id: "nombre", label: "Nombre" },
      { id: "delai",  label: "Délai réponse" },
      { id: "dispo",  label: "Disponibilité" },
    ];

    let tabContent = "";

    if (currentTab === "nombre") {
      const sorted = [...bases].sort((a, b) => b.total - a.total);
      tabContent = sorted.map(b => `
        <div class="rescue-base-row">
          <span style="width:10px;height:10px;border-radius:50%;
                       background:${TYPE_COLOR[b.type]};display:inline-block"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.nom}</span>
          <strong>${b.total.toLocaleString("fr-CH")}</strong>
        </div>`).join("");

    } else if (currentTab === "delai") {
      const list     = bases.filter(b => b.delai).sort((a, b) => a.delai - b.delai);
      const maxDelai = d3.max(list, d => d.delai) || 1;
      tabContent = `<p style="font-size:11px;color:#666;margin:0 0 10px">
        Délai de réponse P1 médian (minutes)</p>`;
      tabContent += list.map(b => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
            <span style="display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:50%;
                           background:${TYPE_COLOR[b.type]};display:inline-block"></span>
              ${b.nom}
            </span>
            <span style="color:#666">${b.delai.toFixed(1)}'</span>
          </div>
          <div class="rescue-bar-track">
            <div class="rescue-bar-fill"
                 style="width:${Math.round((b.delai / maxDelai) * 100)}%;
                        background:${TYPE_COLOR[b.type]}"></div>
          </div>
        </div>`).join("");

    } else if (currentTab === "dispo") {
      const list = bases.filter(b => b.dispo !== null).sort((a, b) => b.dispo - a.dispo);
      tabContent = `<p style="font-size:11px;color:#666;margin:0 0 10px">
        Taux de disponibilité des véhicules (hors missions et entretien)</p>`;
      tabContent += list.map(b => `
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
        </div>`).join("");
    }

    el.innerHTML = `
      <div class="rescue-panel-header">
        <p class="rescue-panel-title">
          Valais — Services d'urgence 2024
          <span style="font-size:11px;font-weight:400;color:#666">(OCVS)</span>
        </p>
      </div>
      <div class="rescue-panel-grid">
        <div class="rescue-metric">
          <p class="rescue-metric-val">${totals.ambulances.toLocaleString("fr-CH")}</p>
          <p class="rescue-metric-lbl">Ambulances</p>
        </div>
        <div class="rescue-metric">
          <p class="rescue-metric-val">${totals.helicopteres.toLocaleString("fr-CH")}</p>
          <p class="rescue-metric-lbl">Hélicoptères</p>
        </div>
        <div class="rescue-metric">
          <p class="rescue-metric-val">${totals.smur.toLocaleString("fr-CH")}</p>
          <p class="rescue-metric-lbl">SMUR</p>
        </div>
        <div class="rescue-metric">
          <p class="rescue-metric-val" style="color:#1a6b3a">${totals.dispo.toFixed(1)} %</p>
          <p class="rescue-metric-lbl">Dispo. véhicules</p>
        </div>
      </div>
      <div class="rescue-tab-row">
        ${TABS.map(t => `
          <button class="rescue-tab ${currentTab === t.id ? "active" : ""}"
                  onclick="rescueSetTab('${t.id}')">${t.label}</button>
        `).join("")}
      </div>
      ${tabContent}
    `;
  }

  // Exposé globalement pour les onclick inline des onglets
  window.rescueSetTab = function (tab) {
    currentTab = tab;
    const panel = mapContainer.querySelector(".rescue-vue2-panel");
    if (panel) renderPanelInto(panel, cachedData.ocvsBases, cachedData.ocvsTotals);
  };

  // ── Graphique comparatif SAS 2020–2024 ────────────────────────────────────

  /** Construit le graphique en lignes SAS dans #rescue-chart-container */
  function buildSASChart() {
    const container = document.getElementById("rescue-chart-container");
    if (!container) return;

    const title = document.createElement("p");
    title.className   = "rescue-chart-title";
    title.textContent = "Interventions SAS par région — 2020 à 2024";
    container.appendChild(title);

    const margin = { top: 16, right: 100, bottom: 28, left: 36 };
    const CW = 860 - margin.left - margin.right;
    const CH = 200 - margin.top  - margin.bottom;

    const svgChart = d3
      .select(container)
      .append("svg")
      .attr("viewBox",
        `0 0 ${CW + margin.left + margin.right} ${CH + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(YEARS).range([0, CW]).padding(0.1);
    const allVals = Object.values(SAS_DATA).flatMap(r => r.values);
    const y = d3.scaleLinear().domain([0, d3.max(allVals) * 1.1]).range([CH, 0]);

    svgChart.append("g")
      .attr("transform", `translate(0,${CH})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(6))
      .select(".domain").remove();

    svgChart.append("g")
      .call(d3.axisLeft(y).ticks(4).tickSize(-CW))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "#e5e5e5")
        .attr("stroke-dasharray", "2,2"));

    const lineGen = d3.line()
      .x((_, i) => x(YEARS[i]))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    Object.entries(SAS_DATA).forEach(([code, r], i) => {
      const color = SAS_PALETTE[i];

      svgChart.append("path")
        .datum(r.values)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", lineGen);

      svgChart.selectAll(`.dot-${code}`)
        .data(r.values)
        .join("circle")
        .attr("class", `dot-${code}`)
        .attr("cx", (_, j) => x(YEARS[j]))
        .attr("cy", d => y(d))
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mousemove", (evt, d) =>
          showTip(evt,
            `${r.name} — ${YEARS[r.values.indexOf(d)]}`,
            `${d} interventions`)
        )
        .on("mouseleave", hideTip);

      svgChart.append("text")
        .attr("x", x(2024) + 8)
        .attr("y", y(r.values[4]))
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .attr("fill", color)
        .text(code);
    });
  }
})(); // Fin IIFE
