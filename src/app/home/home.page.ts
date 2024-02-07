import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import Map from 'ol/Map';
import View from 'ol/View';
import Geolocation from 'ol/Geolocation';
import { TileArcGISRest } from 'ol/source';
import TileWMS from 'ol/source/TileWMS';
import Feature from 'ol/Feature.js';

import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';

import Point from 'ol/geom/Point.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { Geometry } from 'ol/geom';
import { Projection } from 'ol/proj';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage {
  constructor() {
  }

  map: Map = new Map()

  ngOnInit() {

    const geolocation = new Geolocation({
      // enableHighAccuracy must be set to true to have the heading value.
      trackingOptions: {
        enableHighAccuracy: true,
      },
      // take the projection to use from the map's view
      projection: this.map.getView().getProjection(),
      tracking: true
    });

    this.map = new Map({
      view: new View({
        center: geolocation.getPosition(),
        zoom: 6,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          // extent: [309296.0823999997, 5457305.4717999995, 581790.3634000001, 6015812.6974],
          source: new TileArcGISRest({
            url: 'https://geospatial.alberta.ca/titan/rest/services/base/land_use_management_10tm_nad83_aep/MapServer/',
            params: {
              'LAYERS': "show:0,1"
            },
          }),
        }),
        new TileLayer({
          source: new TileWMS({
            url: 'https://cwfis.cfs.nrcan.gc.ca/geoserver/ows',
            params: { 'version': '1.3.0', 'layers': 'public:activefires_current', 'legend_format': 'image%2Fpng', 'feature_info_type': 'text%2Fplain' },
            serverType: 'geoserver',
            transition: 0,
          }),
        }),
      ],
      target: 'ol-map'
    });

    geolocation.on('change', (evt) => {
      this.map.getView().setCenter(geolocation.getPosition());
      console.log(geolocation.getPosition());
    });

    // listen to error
    geolocation.on('error', function (evt) {
      window.console.log(evt.message);
    });

    const accuracyFeature: Feature = new Feature();
    geolocation.on('change:accuracyGeometry', function () {
      let geometry = geolocation.getAccuracyGeometry()?.getSimplifiedGeometry(4);
      accuracyFeature.setGeometry(geometry);
    });

    const positionFeature = new Feature();
    positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#3399CC',
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2,
          }),
        }),
      })
    );

    geolocation.on('change:position', function () {
      const coordinates: any = geolocation.getPosition();
      let feature: Feature = new Feature()
      feature.getGeometry()
      positionFeature.setGeometry(new Point(coordinates))
    });

    new VectorLayer({
      map: this.map,
      source: new VectorSource({
        features: [accuracyFeature, positionFeature],
      }),
    });

    setTimeout(() => {
      geolocation.setTracking(true)
    }, 2000)
  }

  ionViewDidEnter() {
  }
}
