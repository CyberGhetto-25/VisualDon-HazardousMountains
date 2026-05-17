;(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const DATA_URL = 'data/accident/accidentsMortels.json';

  const SPORTS_CONFIG = [
    { key: 'Randonnée en montagne', slug: 'randonnee', icon: 'assets/img/icon-randonnee.png' },
    { key: 'Ski de randonnée',      slug: 'ski',       icon: 'assets/img/icon-ski.png'       },
    { key: 'Alpinisme',             slug: 'alpinisme', icon: 'assets/img/icon-alpinisme.png' },
    { key: 'Hors-piste',            slug: 'horspiste', icon: 'assets/img/icon-horspiste.png' },
    { key: 'Escalade',              slug: 'escalade',  icon: 'assets/img/icon-escalade.png'  },
    { key: 'Autres',                slug: 'autres',    icon: 'assets/img/icon-autres.png'    },
  ];

  /* Positions des ronds sur la montagne + image au hover.
     Ajuste left/top selon l'image de ta montagne.
     Remplace les chemins img quand tu as les photos. */
  const DOTS_CONFIG = {
    'Randonnée en montagne': [
      { left: '28%', top: '62%', img: 'assets/img/dots/randonnee-1.jpg' },
      { left: '48%', top: '50%', img: 'assets/img/dots/randonnee-2.jpg' },
      { left: '67%', top: '60%', img: 'assets/img/dots/randonnee-3.jpg' },
    ],
    'Ski de randonnée': [
      { left: '25%', top: '58%', img: 'assets/img/dots/ski-1.jpg' },
      { left: '44%', top: '48%', img: 'assets/img/dots/ski-2.jpg' },
      { left: '62%', top: '56%', img: 'assets/img/dots/ski-3.jpg' },
      { left: '52%', top: '70%', img: 'assets/img/dots/ski-4.jpg' },
    ],
    'Alpinisme': [
      { left: '38%', top: '44%', img: 'assets/img/dots/alpinisme-1.jpg' },
      { left: '52%', top: '38%', img: 'assets/img/dots/alpinisme-2.jpg' },
      { left: '64%', top: '50%', img: 'assets/img/dots/alpinisme-3.jpg' },
    ],
    'Hors-piste': [
      { left: '30%', top: '55%', img: 'assets/img/dots/horspiste-1.jpg' },
      { left: '50%', top: '52%', img: 'assets/img/dots/horspiste-2.jpg' },
      { left: '68%', top: '58%', img: 'assets/img/dots/horspiste-3.jpg' },
      { left: '42%', top: '70%', img: 'assets/img/dots/horspiste-4.jpg' },
    ],
    'Escalade': [
      { left: '35%', top: '46%', img: 'assets/img/dots/escalade-1.jpg' },
      { left: '53%', top: '40%', img: 'assets/img/dots/escalade-2.jpg' },
      { left: '66%', top: '52%', img: 'assets/img/dots/escalade-3.jpg' },
    ],
    'Autres': [
      { left: '32%', top: '58%', img: 'assets/img/dots/autres-1.jpg' },
      { left: '50%', top: '50%', img: 'assets/img/dots/autres-2.jpg' },
      { left: '65%', top: '62%', img: 'assets/img/dots/autres-3.jpg' },
    ],
  };

  d3.json(DATA_URL).then(function (data) {
    buildDOM(data);
    buildSlides(data);
    buildRegionsChart(data);
    initHorizontalScroll(data.par_sport.length);
  });

  function buildDOM(data) {
    const accident = document.getElementById('accident');

    const titleScreen = document.createElement('div');
    titleScreen.className = 'accident-title-screen';
    titleScreen.innerHTML =
      '<div class="accident-title-inner">' +      
      '<h2 class="accident-title-heading">Accidents mortels</h2>' +
      '<p class="accident-title-label">Données 2024 - CAS</p>'
      '</div>';
    accident.appendChild(titleScreen);

    const pin = document.createElement('div');
    pin.id = 'accident-pin-section';

    const track = document.createElement('div');
    track.id = 'accident-slides';
    pin.appendChild(track);
    accident.appendChild(pin);

    const prog = document.createElement('div');
    prog.className = 'accident-progress';
    data.par_sport.forEach(function (_, i) {
      const dot = document.createElement('div');
      dot.className = 'accident-progress-dot' + (i === 0 ? ' active' : '');
      prog.appendChild(dot);
    });
    document.body.appendChild(prog);

    const regSection = document.createElement('div');
    regSection.className = 'accident-regions-section';
    regSection.innerHTML =
      '<h3>Décès par région — 2024</h3>' +
      '<p class="subtitle">Total : ' + data.meta.total_deces + ' décès</p>' +
      '<div id="accident-regions-chart"></div>';
    accident.appendChild(regSection);
  }

  function buildSlides(data) {
    const track = document.getElementById('accident-slides');

    d3.select(track)
      .selectAll('.accident-slide')
      .data(data.par_sport)
      .join('div')
      .attr('class', function (d) {
        const cfg = SPORTS_CONFIG.find(function (c) { return c.key === d.sport; });
        return 'accident-slide slide-' + (cfg ? cfg.slug : 'autres');
      })
      .each(function (d) {
        const slide = d3.select(this);
        const cfg = SPORTS_CONFIG.find(function (c) { return c.key === d.sport; }) || SPORTS_CONFIG[5];

        slide.append('div').attr('class', 'accident-sky-gradient');

        slide.append('img')
          .attr('class', 'accident-mountain')
          .attr('src', 'assets/img/mountain.png')
          .attr('alt', '');

        /* Ronds interactifs sur la montagne */
        const dots = DOTS_CONFIG[d.sport] || [];
        dots.forEach(function (dotData) {
          const dotEl = slide.append('div')
            .attr('class', 'accident-dot')
            .style('left', dotData.left)
            .style('top', dotData.top);

          dotEl.append('img')
            .attr('class', 'accident-dot-preview')
            .attr('src', dotData.img)
            .attr('alt', '');
        });

        /* Label sport + icône (haut gauche) */
        const labelDiv = slide.append('div').attr('class', 'accident-sport-label');
        labelDiv.append('img')
          .attr('class', 'accident-sport-icon')
          .attr('src', cfg.icon)
          .attr('alt', '');
        labelDiv.append('span').attr('class', 'accident-sport-name').text(d.sport);

        /* Compteur décès — juste sous le label sport */
        const deathDiv = slide.append('div').attr('class', 'accident-death');
        deathDiv.append('div').attr('class', 'accident-death-num').text(d.deces + ' décès');        
        deathDiv.append('div')
          .attr('class', 'accident-death-pct')
          .text('soit ' + Math.round(d.deces / data.meta.total_deces * 100) + '% des décès en 2024');
      });
  }

  function buildRegionsChart(data) {
    const margin = { top: 10, right: 40, bottom: 40, left: 290 };
    const W = Math.min(760, window.innerWidth - 40);
    const H = data.par_region.length * 80;
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select('#accident-regions-chart')
      .append('svg')
      .attr('width', W)
      .attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H);

    const g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const x = d3.scaleLinear()
      .domain([0, d3.max(data.par_region, function (d) { return d.deces; })])
      .range([0, innerW]);

    const y = d3.scaleBand()
      .domain(data.par_region.map(function (d) { return d.region; }))
      .range([0, innerH])
      .padding(0.1);

    g.append('g')
      .attr('transform', 'translate(0,' + innerH + ')')
      .call(d3.axisBottom(x).ticks(5).tickSize(-innerH))
      .call(function (ax) { ax.select('.domain').remove(); });

    g.append('g')
      .call(d3.axisLeft(y).tickSize(0).tickPadding(30))
      .call(function (ax) { ax.select('.domain').remove(); })
      .selectAll('text')
      .style('fill', 'rgba(255,255,255,0.78)')
      .style('font-size', '14px');

    const bars = g.selectAll('.acc-bar')
      .data(data.par_region)
      .join('rect')
      .attr('class', 'acc-bar')
      .attr('y', function (d) { return y(d.region); })
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('fill', '#9333ea')
      .attr('rx', 3);

    const labels = g.selectAll('.acc-bar-lbl')
      .data(data.par_region)
      .join('text')
      .attr('class', 'acc-bar-lbl')
      .attr('y', function (d) { return y(d.region) + y.bandwidth() / 2 + 4; })
      .attr('x', function (d) { return x(d.deces) + 6; })
      .text(function (d) { return d.deces; })
      .style('fill', 'rgba(255,255,255,0.65)')
      .style('font-size', '12px')
      .style('font-family', "'SUSE Mono', monospace")
      .style('opacity', 0);

    ScrollTrigger.create({
      trigger: '#accident-regions-chart',
      start: 'top 75%',
      once: true,
      onEnter: function () {
        bars.transition()
          .duration(800)
          .delay(function (_, i) { return i * 80; })
          .ease(d3.easeCubicOut)
          .attr('width', function (d) { return x(d.deces); });

        labels.transition()
          .duration(600)
          .delay(function (_, i) { return i * 80 + 350; })
          .style('opacity', 1);
      },
    });
  }

  function initHorizontalScroll(count) {
    const slides = document.getElementById('accident-slides');
    const dots   = document.querySelectorAll('.accident-progress-dot');

    gsap.to(slides, {
      x: -(count - 1) * window.innerWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: '#accident-pin-section',
        start: 'top top',
        end: function () { return '+=' + (count - 1) * window.innerHeight; },
        pin: true,
        scrub: 1,
        snap: {
          snapTo: 1 / (count - 1),
          duration: { min: 0.2, max: 0.5 },
          ease: 'power1.inOut',
        },
        onUpdate: function (self) {
          const idx = Math.round(self.progress * (count - 1));
          dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === idx);
          });
        },
      },
    });
  }

})();