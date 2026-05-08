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

  // ── Titre de section ───────────────────────────────────────────────────────
  var rescueSection = document.getElementById("rescue");
  if (rescueSection && !document.getElementById("rescue-header")) {
    var header = document.createElement("div");
    header.id = "rescue-header";
    header.innerHTML =
      '<h2 id="rescue-title">Ces héros de l\'ombre qui veillent sur la montagne</h2>' +
      '<p id="rescue-subtitle">Chaque année en Valais, des centaines d\'interventions silencieuses sauvent des vies.</p>';
    rescueSection.prepend(header);
  }

  // ── Constantes ─────────────────────────────────────────────────────────────
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

  // Couleurs distinctes par type de service (fort contraste sur fond sombre)
  const TYPE_COLOR = {
    ambulance:   '#60a5fa',  // bleu  — terrestre
    helicoptere: '#f472b6',  // rose  — aérien
    smur:        '#34d399',  // vert  — médicalisation avancée
  };

  // Palette violette pour les régions SAS (ligne par région)
  const SAS_PALETTE = [
    "#9333ea",
    "#c084fc",
    "#a855f7",
    "#7c3aed",
    "#6d28d9",
    "#8b5cf6",
    "#4c1d95",
  ];

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

  const CANTON_INFO = {
    "1":  { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "2":  { region: "ARBE",   org: "Secours Alpin Bernois"             },
    "3":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  },
    "4":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  },
    "5":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  },
    "6":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  },
    "7":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  },
    "8":  { region: "ARGL",   org: "Secours Alpin Glaronnais"          },
    "9":  { region: "ARZ",    org: "Secours Alpin de Suisse centrale"  },
    "10": { region: "SARO",   org: "Secours Alpin Romand"              },
    "11": { region: null,      org: null                                },
    "12": { region: null,      org: null                                },
    "13": { region: null,      org: null                                },
    "14": { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "15": { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "16": { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "17": { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "18": { region: "ARG",    org: "Secours Alpin des Grisons"         },
    "19": { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "20": { region: "ARO",    org: "Secours Alpin de Suisse orientale" },
    "21": { region: "SATI",   org: "Secours Alpin Tessinois"           },
    "22": { region: "SARO",   org: "Secours Alpin Romand"              },
    "23": { region: "VALAIS", org: null                                 },
    "24": { region: "SARO",   org: "Secours Alpin Romand"              },
    "25": { region: null,      org: null                                },
    "26": { region: "SARO",   org: "Secours Alpin Romand"              },
  };

  const VALAIS_ID = "23";

  const CH_VIEW = { center: [8.3, 46.8], zoom: 7.2, pitch: 0, bearing: 0 };
  const VS_VIEW = { center: [7.53, 46.15], zoom: 8.6, pitch: 25, bearing: 0 };

  // ── État ───────────────────────────────────────────────────────────────────
  const currentYearIdx = 4;
  let currentTab        = "nombre";
  let cachedData        = null;
  var rescue_valaisData  = null;     // var = portée IIFE entière, jamais remis à null
  var rescue_activeMetric = 'nombre'; // métrique active persistée entre aller-retours
  let mapObj     = null;
  let mapReady   = false;
  let dataReady  = false;
  let redrawFn   = null;
  let svgLayer   = null;

  // ── Source unique de vérité : seuils + couleurs + labels ────────────────
  const RESCUE_COLOR_STOPS = [
    { threshold: 0,   color: '#e9d5ff', label: '< 10' },
    { threshold: 10,  color: '#a855f7', label: '10 – 50' },
    { threshold: 50,  color: '#7e22ce', label: '50 – 150' },
    { threshold: 150, color: '#4c1d95', label: '150 – 300' },
    { threshold: 300, color: '#2e1065', label: '> 300' },
  ];

  const colorScale = d3.scaleThreshold()
    .domain(RESCUE_COLOR_STOPS.slice(1).map(s => s.threshold))
    .range(RESCUE_COLOR_STOPS.map(s => s.color));

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
    if (id === VALAIS_ID) return "#9333ea";
    const region = CANTON_INFO[id]?.region;
    if (!region) return "#1a1a1a";
    const val = SAS_DATA[region]?.values[currentYearIdx];
    return val ? colorScale(val) : "#1a1a1a";
  }

  // ── Interactivité carte Mapbox ────────────────────────────────────────────
  function rescue_enableMapInteraction() {
    mapObj.dragPan.enable();
    mapObj.scrollZoom.enable();
    mapObj.doubleClickZoom.enable();
    mapObj.touchZoomRotate.enable();
  }

  function rescue_disableMapInteraction() {
    mapObj.dragPan.disable();
    mapObj.scrollZoom.disable();
    mapObj.doubleClickZoom.disable();
    mapObj.touchZoomRotate.disable();
  }

  // ── Légende choroplèthe (source unique : RESCUE_COLOR_STOPS) ─────────────
  function rescue_buildLegend() {
    const legend = document.getElementById('rescue-legend');
    if (!legend) return;
    legend.innerHTML = '<div class="rescue-legend-title">Interventions / an</div>';
    RESCUE_COLOR_STOPS.forEach(function(stop) {
      const item = document.createElement('div');
      item.className = 'rescue-legend-item';
      item.innerHTML =
        '<span class="rescue-legend-swatch" style="background:' + stop.color + '"></span>' +
        '<span class="rescue-legend-label">' + stop.label + '</span>';
      legend.appendChild(item);
    });
  }

  // ── Contenu tabulaire : retourne du HTML (pas de manipulation DOM) ────────
  function rescue_buildTabContent(bases, tab) {
    if (tab === 'nombre') {
      var sorted = bases.slice().sort(function (a, b) { return b.total - a.total; });
      return sorted.map(function (b) {
        return '<div class="rescue-base-row">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:' + TYPE_COLOR[b.type] + ';display:inline-block;flex-shrink:0"></span>' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + b.nom + '</span>' +
          '<strong>' + b.total.toLocaleString('fr-CH') + '</strong></div>';
      }).join('');
    }
    if (tab === 'delai') {
      var listD    = bases.filter(function (b) { return b.delai; }).sort(function (a, b) { return a.delai - b.delai; });
      var maxDelai = d3.max(listD, function (d) { return d.delai; }) || 1;
      var html = '<p style="font-size:11px;color:#aaaaaa;margin:0 0 10px">Délai de réponse P1 médian (minutes)</p>';
      return html + listD.map(function (b) {
        return '<div style="margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
            '<span style="display:flex;align-items:center;gap:6px">' +
              '<span style="width:8px;height:8px;border-radius:50%;background:' + TYPE_COLOR[b.type] + ';display:inline-block"></span>' +
              b.nom + '</span>' +
            '<span style="color:#aaaaaa">' + b.delai.toFixed(1) + "'</span>" +
          '</div>' +
          '<div class="rescue-bar-track"><div class="rescue-bar-fill" style="width:' +
            Math.round((b.delai / maxDelai) * 100) + '%;background:' + TYPE_COLOR[b.type] + '"></div></div></div>';
      }).join('');
    }
    if (tab === 'dispo') {
      var listDp = bases.filter(function (b) { return b.dispo !== null; }).sort(function (a, b) { return b.dispo - a.dispo; });
      var html2 = '<p style="font-size:11px;color:#aaaaaa;margin:0 0 10px">Taux de disponibilité des véhicules</p>';
      return html2 + listDp.map(function (b) {
        return '<div style="margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
            '<span style="display:flex;align-items:center;gap:6px">' +
              '<span style="width:8px;height:8px;border-radius:50%;background:' + TYPE_COLOR[b.type] + ';display:inline-block"></span>' +
              b.nom + '</span>' +
            '<strong>' + b.dispo.toFixed(1) + ' %</strong>' +
          '</div>' +
          '<div class="rescue-bar-track"><div class="rescue-bar-fill" style="width:' + b.dispo + '%;background:' + TYPE_COLOR[b.type] + '"></div></div></div>';
      }).join('');
    }
    return '';
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

    mapObj.on("render", () => {
      if (redrawFn && mapReady) redrawFn();
    });
  }

  // ── Projection D3 ↔ Mapbox ─────────────────────────────────────────────────
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
  function drawVue1() {
    rescue_disableMapInteraction();

    // Fermeture explicite des éléments Vue 2 avant le clearVueElements
    mapContainer.querySelectorAll(".rescue-vue2-panel").forEach(p => {
      p.classList.remove("is-open");
      p.style.display = "none";
    });
    mapContainer.querySelectorAll(".rescue-back-btn").forEach(b => {
      b.style.display = "none";
      b.disabled = true;
    });

    clearVueElements();
    svgLayer.selectAll("*").remove();
    redrawFn = null;

    const { cantons, ocvsTotals } = cachedData;
    let pathGen = makePathGen();

    mapObj.flyTo({ ...CH_VIEW, duration: 900 });

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

    // Badge SVG sur le Valais
    const valaisFeature = cantons.features.find(
      f => String(f.properties.id) === VALAIS_ID
    );
    const badgeG = svgLayer.append("g")
      .attr("class", "rescue-badge-group")
      .style("pointer-events", "all")
      .on("click", switchToVue2);
    badgeG.append("rect")
      .attr("width", 126).attr("height", 28).attr("rx", 14)
      .attr("fill", "rgba(0,0,0,0.82)")
      .attr("stroke", "#9333ea").attr("stroke-width", 1.5);
    badgeG.append("text")
      .attr("x", 63).attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px").attr("font-weight", "600")
      .attr("fill", "#ffffff")
      .attr("font-family", "'SUSE', sans-serif")
      .text("Voir le détail →");

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
    redrawFn();

    const controls = createVueEl("div");
    controls.id = "rescue-controls";
    controls.innerHTML = `<h2>Interventions de sauvetage — Suisse 2024</h2>`;
    mapContainer.appendChild(controls);

    const legend = createVueEl("div");
    legend.id = "rescue-legend";
    mapContainer.appendChild(legend);
    rescue_buildLegend();
  }

  // ── Transitions de vue ─────────────────────────────────────────────────────
  function switchToVue2() {
    hideTip();
    drawVue2();
  }

  function switchToVue1() {
    hideTip();
    drawVue1();
  }

  // ── VUE 2 — Focus Valais ───────────────────────────────────────────────────
  function drawVue2() {
    rescue_enableMapInteraction();
    clearVueElements();
    svgLayer.selectAll("*").remove();
    redrawFn = null;

    const { cantons, ocvsBases, ocvsTotals } = cachedData;
    let pathGen = makePathGen();

    mapObj.fitBounds(
      [[6.77, 45.83], [8.49, 46.64]],
      {
        padding:  { top: 60, bottom: 60, left: 60, right: 440 },
        pitch:    20,
        duration: 1200
      }
    );

    const valaisFeature = cantons.features.find(
      f => String(f.properties.id) === VALAIS_ID
    );

    let valaisPath = null;
    if (valaisFeature) {
      valaisPath = svgLayer.append("path")
        .datum(valaisFeature)
        .attr("d", pathGen)
        .attr("fill", "rgba(147,51,234,0.08)")
        .attr("fill-opacity", 1)
        .attr("stroke", "#9333ea")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.7);
    }

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
      .attr("stroke", "rgba(255,255,255,0.3)")
      .attr("stroke-width", 1)
      .style("pointer-events", "all")
      .on("mousemove", (evt, d) =>
        showTip(evt, d.nom,
          `${d.total.toLocaleString("fr-CH")} interventions` +
          (d.delai ? ` · délai médian ${d.delai.toFixed(1)}'` : "")
        )
      )
      .on("mouseleave", hideTip);

    redrawFn = () => {
      pathGen = makePathGen();
      if (valaisPath && valaisFeature) valaisPath.attr("d", pathGen);
      bubblesG.selectAll("circle")
        .attr("cx", d => mapObj.project([d.lng, d.lat]).x)
        .attr("cy", d => mapObj.project([d.lng, d.lat]).y);
    };

    // Bouton retour avec gestion d'état explicite
    const backBtn = createVueEl("button");
    backBtn.className = "rescue-back-btn";
    backBtn.textContent = "← Vue nationale";
    backBtn.disabled = false;
    backBtn.style.display = "block";
    backBtn.addEventListener("click", switchToVue1);
    mapContainer.appendChild(backBtn);

    // Persister les données pour le clone pattern des boutons
    rescue_valaisData = { bases: ocvsBases, totals: ocvsTotals };

    // Panneau métriques avec état is-open explicite
    const panel = createVueEl("div");
    panel.className = "rescue-vue2-panel is-open";
    panel.style.display = "block";
    mapContainer.appendChild(panel);
    renderPanelInto(panel, ocvsBases, ocvsTotals);

    // Délégation d'événement sur panel — persiste même si renderPanelInto reconstruit le HTML
    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('.rescue-metric-btn');
      if (!btn) return;
      panel.querySelectorAll('.rescue-metric-btn')
        .forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentTab = btn.dataset.metric;
      rescue_activeMetric = btn.dataset.metric;
      var contentEl = panel.querySelector('.rescue-tab-content');
      if (contentEl && rescue_valaisData) {
        contentEl.innerHTML = rescue_buildTabContent(rescue_valaisData.bases, currentTab);
      }
    });
  }

  // ── Panneau de détail OCVS ────────────────────────────────────────────────
  function renderPanelInto(el, bases, totals) {
    const TABS = [
      { id: "nombre", label: "Nombre" },
      { id: "delai",  label: "Délai réponse" },
      { id: "dispo",  label: "Disponibilité" },
    ];

    el.innerHTML = `
      <div class="rescue-panel-header">
        <p class="rescue-panel-title">
          Valais — Services d’urgence 2024
          <span style="font-size:11px;font-weight:400;color:#aaaaaa">(OCVS)</span>
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
          <p class="rescue-metric-val" style="color:#9333ea">${totals.dispo.toFixed(1)} %</p>
          <p class="rescue-metric-lbl">Dispo. véhicules</p>
        </div>
      </div>
      <div class="rescue-tab-row">
        ${TABS.map(t => `
          <button class="rescue-tab rescue-metric-btn ${currentTab === t.id ? "active" : ""}"
                  data-metric="${t.id}">${t.label}</button>
        `).join("")}
      </div>
      <div class="rescue-tab-content">${rescue_buildTabContent(bases, currentTab)}</div>
    `;
    // Pas de rescue_bindMetricButtons() — la délégation sur panel gère tout
  }

  // ── Graphique comparatif SAS 2020–2024 ────────────────────────────────────
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
      .attr("class", "rescue-axis")
      .attr("transform", `translate(0,${CH})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(6))
      .select(".domain").remove();

    svgChart.append("g")
      .attr("class", "rescue-grid")
      .call(d3.axisLeft(y).ticks(4).tickSize(-CW).tickFormat(""))
      .select(".domain").remove();

    svgChart.append("g")
      .attr("class", "rescue-axis")
      .call(d3.axisLeft(y).ticks(4))
      .select(".domain").remove();

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
        .attr("stroke", "rgba(0,0,0,0.5)")
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

    // Bloc éditorial narratif sous le graphique
    const editorial = document.createElement('div');
    editorial.id = 'rescue-editorial';
    editorial.innerHTML =
      '<div id="rescue-editorial-inner">' +
        '<p class="rescue-story-lead">' +
          'Il est 3h47 du matin. Quelque part sur les hauteurs de Zermatt,' +
          ' une balise de détresse vient de s\'activer.' +
        '</p>' +
        '<div id="rescue-editorial-grid">' +
          '<div class="rescue-editorial-item">' +
            '<div class="rescue-editorial-num">+41%</div>' +
            '<p>En dix ans, les interventions de secours en montagne valaisanne ont augmenté de plus de 40%. Pas parce que la montagne est devenue plus dangereuse — mais parce qu\'elle attire de plus en plus de monde, de plus en plus vite.</p>' +
            '<span class="rescue-editorial-src">Source : OCVS 2024</span>' +
          '</div>' +
          '<div class="rescue-editorial-item">' +
            '<div class="rescue-editorial-num">14 min</div>' +
            '<p>C\'est le délai moyen d\'intervention d\'une ambulance en Valais. En haute montagne, chaque minute compte. L\'hélicoptère prend le relais là où les routes s\'arrêtent — parfois à plus de 4\'000 mètres d\'altitude.</p>' +
            '<span class="rescue-editorial-src">Source : OCVS 2024</span>' +
          '</div>' +
          '<div class="rescue-editorial-item">' +
            '<div class="rescue-editorial-num">365&nbsp;j</div>' +
            '<p>Les équipes de secours valaisannes n\'ont pas de saison morte. Avalanches en hiver, chutes en été, épuisement au printemps. La montagne, elle, ne ferme jamais.</p>' +
            '<span class="rescue-editorial-src">Source : CAS 2025</span>' +
          '</div>' +
          '<div class="rescue-editorial-item">' +
            '<div class="rescue-editorial-num">~50%</div>' +
            '<p>La moitié de toutes les urgences montagne de Suisse se concentrent en Valais. Un canton, quatre mille mètres, et des hommes et des femmes qui partent quand les autres rentrent.</p>' +
            '<span class="rescue-editorial-src">Source : CAS, mars 2025</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    container.appendChild(editorial);
  }
})();
