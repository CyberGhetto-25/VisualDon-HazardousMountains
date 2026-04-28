;(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const DATA_URL = 'data/accident/accidentsMortels.JSON';

  const SPORTS_CONFIG = [
    { key: 'Randonnée en montagne', slug: 'randonnee', icon: 'assets/img/icon-randonnee.png' },
    { key: 'Ski de randonnée',      slug: 'ski',       icon: 'assets/img/icon-ski.png'       },
    { key: 'Alpinisme',             slug: 'alpinisme', icon: 'assets/img/icon-alpinisme.png' },
    { key: 'Hors-piste',            slug: 'horspiste', icon: 'assets/img/icon-horspiste.png' },
    { key: 'Escalade',              slug: 'escalade',  icon: 'assets/img/icon-escalade.png'  },
    { key: 'Autres',                slug: 'autres',    icon: 'assets/img/icon-autres.png'    },
  ];

  const REGION_POSITIONS = {
    'Alpes valaisannes':                         { left: '48%', top: '66%' },
    'Grisons (sans Mesolcina)':                  { left: '73%', top: '52%' },
    'Alpes bernoises':                           { left: '33%', top: '56%' },
    'Suisse centrale (y.c. Alpes glaronnaises)': { left: '60%', top: '43%' },
    'Suisse orientale (Alpstein-Churfirsten)':   { left: '83%', top: '46%' },
    'Tessin (y.c. Mesolcina)':                   { left: '77%', top: '72%' },
    'Alpes vaudoises et fribourgeoises':         { left: '23%', top: '60%' },
    'Jura / zones vallonnées':                   { left: '14%', top: '50%' },
  };

  d3.json(DATA_URL).then(function (data) {
    buildDOM(data);
    buildSlides(data);
    buildRegionsChart(data);
    initHorizontalScroll(data.par_sport.length);
  });

  function buildDOM(data) {
    const root = d3.select('#accident');

    root.append('div').attr('id', 'accident-pin-section')
      .append('div').attr('id', 'accident-slides');

    root.append('div')
      .attr('class', 'accident-progress')
      .attr('id', 'accident-progress')
      .selectAll('.accident-progress-dot')
      .data(data.par_sport)
      .join('div')
      .attr('class', function (_, i) {
        return 'accident-progress-dot' + (i === 0 ? ' active' : '');
      });

    const sec = root.append('div').attr('class', 'accident-regions-section');
    sec.append('h3').text('Décès par région');
    sec.append('p').attr('class', 'subtitle')
      .text(data.meta.total_deces + ' décès au total — Suisse ' + data.meta.annee);
    sec.append('div').attr('id', 'accident-regions-chart');
  }

  function buildSlides(data) {
    const slides = d3.select('#accident-slides')
      .selectAll('.accident-slide')
      .data(data.par_sport)
      .join('div')
      .attr('class', function (_, i) {
        return 'accident-slide slide-' + SPORTS_CONFIG[i].slug;
      });

    slides.append('img')
      .attr('class', 'accident-mountain')
      .attr('src', 'assets/img/mountain.png')
      .attr('alt', '');

    slides.append('div')
      .attr('class', 'accident-region-labels')
      .each(function () {
        d3.select(this)
          .selectAll('.accident-region-tag')
          .data(data.par_region)
          .join('div')
          .attr('class', function (r) {
            var w = r.deces >= 20 ? 'weight-high'
                  : r.deces >= 8  ? 'weight-medium'
                  : 'weight-low';
            return 'accident-region-tag ' + w;
          })
          .style('left', function (r) {
            return (REGION_POSITIONS[r.region] || {}).left || '50%';
          })
          .style('top', function (r) {
            return (REGION_POSITIONS[r.region] || {}).top || '50%';
          })
          .text(function (r) { return r.region; });
      });

    slides.append('img')
      .attr('class', 'accident-cloud')
      .attr('src', 'assets/img/cloud.png')
      .attr('alt', '');

    const label = slides.append('div').attr('class', 'accident-sport-label');

    label.append('img')
      .attr('class', 'accident-sport-icon')
      .attr('src', function (_, i) { return SPORTS_CONFIG[i].icon; })
      .attr('alt', function (d) { return d.sport; });

    label.append('span')
      .attr('class', 'accident-sport-name')
      .text(function (d) { return d.sport; });

    const death = slides.append('div').attr('class', 'accident-death');

    death.append('div')
      .attr('class', 'accident-death-number')
      .text(function (d) { return d.deces; });

    death.append('div')
      .attr('class', 'accident-death-sub')
      .text('décès en 2024');
  }

  function buildRegionsChart(data) {
    var container = document.getElementById('accident-regions-chart');
    var margin    = { top: 10, right: 90, bottom: 10, left: 260 };
    var totalW    = Math.min(740, window.innerWidth - 32);
    var width     = totalW - margin.left - margin.right;
    var barH      = 36;
    var gap       = 12;
    var height    = data.par_region.length * (barH + gap);

    var svg = d3.select(container)
      .append('svg')
      .attr('width',  totalW)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleLinear()
      .domain([0, d3.max(data.par_region, function (d) { return d.deces; })])
      .range([0, width]);

    var yScale = d3.scaleBand()
      .domain(data.par_region.map(function (d) { return d.region; }))
      .range([0, height])
      .paddingInner(gap / (barH + gap));

    svg.selectAll('.region-track')
      .data(data.par_region)
      .join('rect')
      .attr('x', 0)
      .attr('y',      function (d) { return yScale(d.region); })
      .attr('width',  width)
      .attr('height', yScale.bandwidth())
      .attr('fill',   'rgba(255,255,255,0.07)')
      .attr('rx', 4);

    svg.selectAll('.region-bar')
      .data(data.par_region)
      .join('rect')
      .attr('class', 'region-bar')
      .attr('x', 0)
      .attr('y',      function (d) { return yScale(d.region); })
      .attr('width',  0)
      .attr('height', yScale.bandwidth())
      .attr('fill',   '#e74c3c')
      .attr('rx', 4);

    svg.selectAll('.region-label')
      .data(data.par_region)
      .join('text')
      .attr('x', -12)
      .attr('y', function (d) { return yScale(d.region) + yScale.bandwidth() / 2; })
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255,255,255,0.72)')
      .attr('font-size', '0.88rem')
      .text(function (d) { return d.region; });

    svg.selectAll('.region-value')
      .data(data.par_region)
      .join('text')
      .attr('x', function (d) { return xScale(d.deces) + 10; })
      .attr('y', function (d) { return yScale(d.region) + yScale.bandwidth() / 2; })
      .attr('dy', '0.35em')
      .attr('fill', 'rgba(255,255,255,0.45)')
      .attr('font-size', '0.8rem')
      .text(function (d) { return d.deces + '  (' + d.pourcentage + '%)'; });

    ScrollTrigger.create({
      trigger: container,
      start:   'top 75%',
      once:    true,
      onEnter: function () {
        d3.select(container).selectAll('.region-bar')
          .transition()
          .duration(900)
          .delay(function (_, i) { return i * 80; })
          .ease(d3.easeCubicOut)
          .attr('width', function (d) { return xScale(d.deces); });
      }
    });
  }

  function initHorizontalScroll(count) {
    var progress = document.getElementById('accident-progress');
    var dots     = Array.from(progress.querySelectorAll('.accident-progress-dot'));

    gsap.to('#accident-slides', {
      x:    function () { return -(count - 1) * window.innerWidth; },
      ease: 'none',
      scrollTrigger: {
        trigger:             '#accident-pin-section',
        pin:                 true,
        scrub:               1,
        snap: {
          snapTo:   1 / (count - 1),
          duration: { min: 0.2, max: 0.5 },
          ease:     'power1.inOut',
        },
        end:                 function () { return '+=' + (count - 1) * window.innerWidth; },
        invalidateOnRefresh: true,
        onToggle: function (self) {
          progress.classList.toggle('visible', self.isActive);
        },
        onUpdate: function (self) {
          var current = Math.round(self.progress * (count - 1));
          dots.forEach(function (d, i) {
            d.classList.toggle('active', i === current);
          });
        }
      }
    });
  }

})();