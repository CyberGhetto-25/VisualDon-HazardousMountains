# VisualDon-HazardousMountains
Repo GitHub pour le projet dans le cadre du cours "Visualisation des données"

# Contexte
La pratique de la haute montagne est une quête d'adrénaline qui exige une profonde humilité. Si certains passionnés ont compris l'équilibre entre recherche de sensations et respect des enjeux naturels, d'autres ignorent encore les conséquences d'une préparation défaillante. Cette réalité invisible est pourtant documentée : des organismes comme le Secours Alpin Suisse (SAS), l'OCVS ou l'association de défense des montagnes récoltent chaque année des milliers de données sur les interventions et les accidents. Si ces statistiques existent, ce n'est pas seulement pour la gestion administrative des risques, mais pour transformer des tragédies vécues, comme celles qui touchent de nombreuses familles valaisannes, en outils de prévention concrets. En analysant ces chiffres, on réalise que la montagne ne se dompte pas ; on apprend à mieux la lire. Car derrière chaque point sur une carte ou chaque courbe de tendance, il y a un rappel essentiel : en altitude, l'improvisation est le premier facteur de danger.

## Limites des données
- Les données ne documentent pas les pratiques informelles
- Les décès médiatisés sont surreprésentés
- Les accidents bénins sont sous-déclarés


# Description
Deux idées: 
1. Carte interactive avec les trançons représentés sous différentes couleurs en fonction de leur dangerosité.
2. Scrollytelling montrant et rappelant les risques et accidents mortels en montagne. Nous y aborderons également les sujets de société liés au respect ou non de la montagne comme le surtourisme, la pratique de sports à risque malgré un niveau débutant, la déterioration des glaciers par l'homme dans un but économique, ...

## Formats et types de données
Beaucoup de rapports PDF comportent des statistiques sur les variables suivantes: 
- Date
- Type d'accidents (ski, alpinisme, randonnée)
- Causes (chutes, avalanches, malaise)
- Gravité (blessé, mortel)
- Coordonnées GPS
- Région

Voici un exemple d'objet JSON qui pourrait être utilisé dans le cadre de notre projet. (généré à l'aide de ChatGPT 5.2)

```JSON
{
  "type": "regionRisk",
  "id": "ch-vs-canton-2024-winter",
  "region": {
    "level": "canton",
    "code": "VS",
    "name_fr": "Valais",
    "name_en": "Valais",
    "parent": { "level": "country", "code": "CH" }
  },
  "time": {
    "year": 2024,
    "season": "winter"
  },
  "sports": [
    { "code": "ski_touring", "label_fr": "Ski de randonnée", "label_en": "Ski touring" },
    { "code": "freeride", "label_fr": "Freeride", "label_en": "Freeride" },
    { "code": "alpinism", "label_fr": "Alpinisme", "label_en": "Alpinism" }
  ],
  "geometry": {
    "type": "Feature",
    "properties": {
      "region_level": "canton",
      "region_code": "VS"
    },
    "geometry": {
      "type": "MultiPolygon",
      "coordinates": [
        [
          [
            [7.0, 46.0],
            [7.2, 46.0],
            [7.2, 46.2],
            [7.0, 46.2],
            [7.0, 46.0]
          ]
        ]
      ]
    }
  },
  "metrics": {
    "accidents_total": 128,
    "fatalities_total": 9,
    "injuries_total": 54,
    "danger_score": 72,
    "danger_level": "high"
  },
  "causes": [
    { "code": "fall", "label_fr": "Chute", "accidents": 49, "fatalities": 2 },
    { "code": "avalanche", "label_fr": "Avalanche", "accidents": 22, "fatalities": 5 },
    { "code": "medical", "label_fr": "Malaise / médical", "accidents": 18, "fatalities": 1 },
    { "code": "lost_orientation", "label_fr": "Perte d’orientation", "accidents": 15, "fatalities": 0 },
    { "code": "rockfall", "label_fr": "Chute de pierres", "accidents": 9, "fatalities": 1 },
    { "code": "crevasse", "label_fr": "Crevasse", "accidents": 4, "fatalities": 0 },
    { "code": "weather", "label_fr": "Météo / conditions", "accidents": 3, "fatalities": 0 },
    { "code": "equipment_failure", "label_fr": "Défaillance matériel", "accidents": 2, "fatalities": 0 },
    { "code": "collision", "label_fr": "Collision", "accidents": 3, "fatalities": 0 },
    { "code": "water", "label_fr": "Chute / incident eau", "accidents": 1, "fatalities": 0 },
    { "code": "other", "label_fr": "Autre", "accidents": 2, "fatalities": 0 }
  ],
  "data_provenance": {
    "geometry_sources": [
      {
        "kind": "official",
        "label": "Couche administrative (ex: geo.admin / BFS)",
        "url": null,
        "retrieved_at": null
      },
      {
        "kind": "manual",
        "label": "Ajustements manuels (si nécessaire)",
        "tool": "QGIS",
        "notes": "Corrections ponctuelles de limites ou simplification géométrique."
      }
    ],
    "statistics_sources": [
      {
        "label": "Secours Alpin Suisse - Rapport annuel",
        "url": "https://www.secoursalpin.ch/publications/rapport-annuel"
      },
      {
        "label": "OCVS - Documents / statistiques",
        "url": "https://www.ocvs.ch/documents/"
      }
    ]
  },
  "notes": {
    "aggregation_rule": "Agrégé par region.level + region.code + year + season. Causes regroupées via vocabulaire contrôlé.",
    "limitations": [
      "Sous-déclaration possible selon la gravité et le canal de déclaration.",
      "Non normalisé par la fréquentation : une zone très fréquentée peut apparaître plus dangereuse.",
      "Différences de catégorisation des causes selon la source."
    ]
  }
}
```

## Storytelling
1. Historique et état actuel des montagnes et introduction à la problématique
2. Les cas d'accidents dans nos montagnes
3. Sauveteurs en montagnes, ces héros oubliés
4. Ce qu'on ne veut plus voir dans nos montagnes

# But
**Peut-on vraiment dompter la montagne ?**

Alpinisme de haute montagne, ski freeride, grimpe, Via-Ferrata, randonnées : tout autant de disciplines se déroulant en montagne et comportant de nombreux risques, parfois mortels. Ces sports, malgré les risques qu'on leur connaît, attirent toujours plus de monde.

Dans ce projet, nous souhaitons sensibiliser le spectateur aux risques encourrus lors de la pratique de ces différentes activités en Suisse.
Originaires du Valais, région montagneuse, nous avons tout les deux été confrontés à la disparitions de proches dans des accidents mortels en montagne.
Un autre pan de notre projet est la mise en lumière des sujets actuels de société liés au contexte de la montagne (pelleteuses sur le glacier à Zermatt, conséquence du surtourisme dans nos montagne, débutants s'adonnant à des pratiques de sport extrême) 

# Références
## Inspiration 

Scrollytelling dans lequel on monte en altitude en découvrant ce qui s'y trouve : https://neal.fun/space-elevator/ 

Dataviz des cas de morts lors de l'ascension de l'Everest : https://www.datawrapper.de/blog/mount-everest-deaths

Map interactive répertoriant les chemins de randonnée, spots de grimpe, stations de skis, etc. aux USA : https://www.onxmaps.com/backcountry/app

## Sets de données
Chemin de randonnée hivernale en Suisse : https://s.geo.admin.ch/ejvf3bnqlg9f 

Rapport annuel du SAS (Secours Alpin Suisse) : https://www.secoursalpin.ch/publications/rapport-annuel
- Organisation mandatée pour les secours en montagne.
- Objectif : documenter les interventions, améliorer prévention et coordination.

Rapport et statistiques de l'OCVS : https://www.ocvs.ch/documents/
- Données statistiques relatives aux sauvetages en montagnes
- Objectif : statistiques publiques, gestion des risques.

DB rapports incidents/accidents sport montagne Alpes : https://www.camptocamp.org/serac

## Recherches
Article du 24Heures sur les dangers en montagnes : https://www.24heures.ch/randonnee-en-suisse-les-zones-les-plus-dangereuses-399173683979

Statistiques 2019 des accidents de montagne : https://www.sac-cas.ch/fr/les-alpes/de-nouveau-moins-daccidents-23166/

Randonnée et sports de montagne : https://www.bfu.ch/fr/dossiers/sports-de-montagne-randonnee#:~:text=les%20accidents%20augmentent.-,Plus%20de%2045%20000,56%20d'entre%20elles%20mortellement

Association de défense des montagnes : https://mountainwilderness.ch/fr/

# Wireframe
Lien du projet figma : https://www.figma.com/design/Grn8ji6KCugtJDIM52EEeX/VisualDon-HazardousMountains?node-id=0-1&t=5Id5V14uTAr5P8vq-1
