/**
 * source: https://github.com/Alberto-Amo-Marin/leaflet-textmarker-canvas
 * license: https://github.com/Alberto-Amo-Marin/leaflet-textmarker-canvas?tab=MIT-1-ov-file
 * 
 * modified _drawText for QAuartermaster Operating Base purposes
 */
import rbush from 'rbush'; //https://www.5axxw.com/wiki/content/7wjc4t
/**
 * @typedef {Object} MarkerData Marker's rubsh data
 * @property {Number} MarkerData.minX  The longitude of the marker
 * @property {Number} MarkerData.minY  The latitude of the marker
 * @property {Number} MarkerData.maxX  The longitude of the marker
 * @property {Number} MarkerData.maxY  The latitude of the marker
 * @property {L.Marker} MarkerData.data  marker object
 * @example
 * let latlng=marker.getLatlng();
 * let markerData={
 *      minX:latlng.lng,
 *      minY:latlng.lat,
 *      maxX:latlng.lng,
 *      maxY:latlng.lat,
 *      data:marker
 * }
 */

/**
 * @typedef {Object} MarkerBoundsData Marker's pixel boundary rubsh data
 * @property {Number} MarkerBoundsData.minX  The x-axis pixel coordinates of the upper left corner of the marker
 * @property {Number} MarkerBoundsData.minY  The y-axis pixel coordinates of the upper left corner of the marker
 * @property {Number} MarkerBoundsData.maxX  The x-axis pixel coordinates of the lower right corner of the marker
 * @property {Number} MarkerBoundsData.maxY  The y-axis pixel coordinates of the lower right corner of the marker
 * @property {L.Marker} MarkerBoundsData.data  marker object
 * @example
 * let options = marker.options.icon.options;
 * let minX, minY, maxX, maxY;
 * minX = pointPos.x - options.iconAnchor[0];
 * maxX = minX + options.iconSize[0];
 * minY = pointPos.y - options.iconAnchor[1];
 * maxY = minY + options.iconSize[1];
 *
 * let markerBounds = {
 *     minX,
 *     minY,
 *     maxX,
 *     maxY
 * };
 */

/**
 * A leaflet plugin for displaying markup on a canvas instead of the DOM. Use Singlepage 1.0.0 and above.
 */
export var CanvasMarkerLayer = (L.CanvasMarkerLayer = L.Layer.extend({
  options: {
    zIndex: null, //The stacking order of layer dom elements
    collisionFlg: false, //Impact checking
    moveReset: false, //Whether to refresh the map when moving
    opacity: 1, //layer transparency
  },
  //Add event listeners to initialized section.
  initialize: function (options) {
    L.setOptions(this, options);
    this._onClickListeners = [];
    this._onHoverListeners = [];
    this._onMouseDownListeners = [];
    this._onMouseUpListeners = [];

    /**
     * A collection of all markers
     * @type {rbush<MarkerData>}
     */
    this._markers = new rbush(10000);
    this._markers.dirty = 0; //single insert/delete
    this._markers.total = 0; //total

    /**
     * A collection of markers within the current extent of the map
     * @type {rbush<MarkerData>}
     */
    this._containMarkers = new rbush(10000);

    /**
     * The collection of markers currently displayed on the map
     * @type {rbush<MarkerData>}
     */
    this._showMarkers = new rbush(10000);

    /**
     * Range collection of markers currently displayed on the map
     * @type {rbush<MarkerBoundsData>}
     */
    this._showMarkerBounds = new rbush(10000);
  },

  setOptions: function (options) {
    L.setOptions(this, options);

    return this.redraw();
  },

  /**
   * redraw
   */
  redraw: function () {
    return this._redraw(true);
  },

  /**
   * get event object
   *
   * Indicates the listener added to the map
   * @return {Object} Listener/function key-value pairs
   */
  getEvents: function () {
    var events = {
      viewreset: this._reset,
      zoom: this._onZoom,
      moveend: this._reset,
      click: this._executeListeners,
      mousemove: this._executeListeners,
      mousedown: this._executeListeners,
      mouseup: this._executeListeners,
    };
    if (this._zoomAnimated) {
      events.zoomanim = this._onAnimZoom;
    }
    if (this.options.moveReset) {
      events.move = this._reset;
    }
    return events;
  },

  /**
   * add callout
   * @param {L/Marker} layer label
   * @return {Object} this
   */
  addLayer: function (layer, redraw = true) {
    if (!(layer.options.pane == 'markerPane' && layer.options.icon)) {
      console.error("Layer isn't a marker");
      return;
    }

    layer._map = this._map;
    var latlng = layer.getLatLng();

    L.Util.stamp(layer);

    this._markers.insert({
      minX: latlng.lng,
      minY: latlng.lat,
      maxX: latlng.lng,
      maxY: latlng.lat,
      data: layer,
    });

    this._markers.dirty++;
    this._markers.total++;

    var isDisplaying = this._map.getBounds().contains(latlng);
    if (redraw == true && isDisplaying) {
      this._redraw(true);
    }
    return this;
  },

  /**
   * Add an array of markers, using this function when adding many markers at once is more efficient than calling the marker function in a loop
   * @param {Array.<L/Marker>} layers label array
   * @return {Object} this
   */
  addLayers: function (layers, redraw = true) {
    layers.forEach((layer) => {
      this.addLayer(layer, false);
    });
    if (redraw) {
      this._redraw(true);
    }
    return this;
  },

  /**
   * delete callout
   * @param {*} layer label
   * @param {boolean=true} redraw Whether to redraw (the default is true), if you want to delete in batches, you can set it to false, and then manually update
   * @return {Object} this
   */
  removeLayer: function (layer, redraw = true) {
    var self = this;

    //If we are removed point
    if (layer['minX']) layer = layer.data;

    var latlng = layer.getLatLng();
    var isDisplaying = self._map.getBounds().contains(latlng);

    var markerData = {
      minX: latlng.lng,
      minY: latlng.lat,
      maxX: latlng.lng,
      maxY: latlng.lat,
      data: layer,
    };

    self._markers.remove(markerData, function (a, b) {
      return a.data._leaflet_id === b.data._leaflet_id;
    });

    self._markers.total--;
    self._markers.dirty++;

    if (isDisplaying === true && redraw === true) {
      self._redraw(true);
    }
    return this;
  },

  /**
   * clear all
   */
  clearLayers: function () {
    this._markers = new rbush(10000);
    this._markers.dirty = 0; //single insertion/deletion
    this._markers.total = 0; //total
    this._containMarkers = new rbush(10000);
    this._showMarkers = new rbush(10000);
    this._showMarkerBounds = new rbush(10000);

    this._redraw(true);
  },

  /**
   * Inherit the method that L.Layer must implement
   *
   * Layer Dom node creation added to the map container
   */
  onAdd: function (map) {
    this._map = map;

    if (!this._container) this._initCanvas();

    if (this.options.pane) this.getPane().appendChild(this._container);
    else map._panes.overlayPane.appendChild(this._container);

    this._reset();
  },

  /**
   * Inherit the method that L.Layer must implement
   *
   * Layer Dom node destruction
   */
  onRemove: function (map) {
    if (this.options.pane) this.getPane().removeChild(this._container);
    else map.getPanes().overlayPane.removeChild(this._container);
  },

  /**
   * draw text label
   * @param {L/Marker} marker label
   * @param {L/Point} pointPos The pixel position of the center point of the label on the screen
   */
  _drawMarker: function (marker, pointPos) {
    var self = this;

    // If no pixel position is passed in, the position of the marker itself is calculated
    if (!pointPos) {
      pointPos = self._map.latLngToContainerPoint(marker.getLatLng());
    }
    let options = marker.options.icon.options;
    let minX, minY, maxX, maxY;
    minX = pointPos.x - options.iconAnchor?.[0] || 0;
    maxX = minX + 50;
    minY = pointPos.y - options.iconAnchor?.[1] || 0;
    maxY = minY + 500;

    let markerBounds = {
      minX,
      minY,
      maxX,
      maxY,
    };

    if (this.options.collisionFlg == true) {
      if (this._showMarkerBounds.collides(markerBounds)) {
        return;
      } else {
        this._showMarkerBounds.insert(markerBounds);
        let latlng = marker.getLatLng();
        this._showMarkers.insert({
          minX,
          minY,
          maxX,
          maxY,
          lng: latlng.lng,
          lat: latlng.lat,
          data: marker,
        });
      }
    }

    // This layer only ever renders divIcon-based text labels, never image icons.
    self._drawText(marker, pointPos);
  },

  _drawText: function (marker, pointPos) {
    var options = marker.options.icon.options;
    var content = options.text;
    var iconAnchor = options.iconAnchor || L.point(0, 0);
    var rotationAngle = marker.options.rotationAngle;

    var canvas = this._ctx;
    var pos = L.point(pointPos).add(iconAnchor);

    // Clear the previous content
    canvas.clearRect(pos.x, pos.y - options.iconSize[1], options.iconSize[0], options.iconSize[1]);


    canvas.fillStyle = '#fff'
    canvas.shadowColor = '#000'
    canvas.shadowOffsetX = 1
    canvas.shadowOffsetY = 0
    canvas.shadowBlur = 2
    canvas.textAlign = 'center'
    canvas.strokeStyle = '#000'
    canvas.lineWidth = .5

    if (options.style === "Major")
    {
      canvas.font = '600 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }
    else
    {
      canvas.font = '600 13px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      canvas.fillStyle = '#eee'
      canvas.lineWidth = 0
    }


    // Rotate the canvas context
    canvas.save();
    canvas.translate(pos.x, pos.y);
    canvas.rotate((rotationAngle * Math.PI) / 180);

    canvas.strokeText(content, 0, 0);
    canvas.fillText(content, 0, 0);

    canvas.restore();
  },

  getBounds: function () {
    return this._bounds;
  },

  getAllLayers: function () {
    return this._markers.all();
  },

  /**
   * resetcanvas(size, position, content)
   */
  _reset: function () {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._container, topLeft);
    var size = this._map.getSize();
    this._container.width = size.x;
    this._container.height = size.y;
    this._update();
  },

  /**
   * repaint the canvas
   * @param {boolean} clear Whether to empty
   */
  _redraw: function (clear) {
    this._showMarkerBounds = new rbush(10000);
    this._showMarkers = new rbush(10000);
    var self = this;
    //clear canvas
    if (clear) this._ctx.clearRect(0, 0, this._container.width, this._container.height);
    if (!this._map || !this._markers) return;
    var tmp = [];
    //If the number of individual insertions/deletions exceeds 10% of the total, the lookup is rebuilt to improve efficiency
    if (self._markers.dirty / self._markers.total >= 0.1) {
      self._markers.all().forEach(function (e) {
        tmp.push(e);
      });
      self._markers.clear();
      self._markers.load(tmp);
      self._markers.dirty = 0;
      tmp = [];
    }
    //Map geographic coordinate boundaries
    var mapBounds = self._map.getBounds();
    //Boundary object for runsh
    var mapBoxCoords = {
      minX: mapBounds.getWest(),
      minY: mapBounds.getSouth(),
      maxX: mapBounds.getEast(),
      maxY: mapBounds.getNorth(),
    };
    //Icons within the query range
    self._markers.search(mapBoxCoords).forEach(function (e) {
      //Icon screen coordinates
      var pointPos = self._map.latLngToContainerPoint(e.data.getLatLng());
      var iconSize = e.data.options.icon.options.iconSize;
      var adj_x = iconSize[0] / 2;
      var adj_y = iconSize[1] / 2;
      var newCoords = {
        minX: pointPos.x - adj_x,
        minY: pointPos.y - adj_y,
        maxX: pointPos.x + adj_x,
        maxY: pointPos.y + adj_y,
        data: e.data,
        pointPos: pointPos,
      };
      tmp.push(newCoords);
    });
    /* Sort in descending order if collision detection is required, and draw first if the zIndex value is large; 
    sort in ascending order if collision detection is not required, and draw after the zIndex value */
    tmp
      .sort((layer1, layer2) => {
        let zIndex1 = layer1.data.options.zIndex ? layer1.data.options.zIndex : 1;
        let zIndex2 = layer2.data.options.zIndex ? layer2.data.options.zIndex : 1;
        return (-zIndex1 + zIndex2) * (this.options.collisionFlg ? 1 : -1);
      })
      .forEach((layer) => {
        //Icon screen coordinates
        var pointPos = layer.pointPos;
        self._drawMarker(layer.data, pointPos);
      });
    //Clear rBush & Bulk Load for performance
    this._containMarkers.clear();
    this._containMarkers.load(tmp);
    if (this.options.collisionFlg != true) {
      this._showMarkers = this._containMarkers;
    }
    return this;
  },

  /**
   * Initialize the container
   */
  _initCanvas: function () {
    this._container = L.DomUtil.create('canvas', 'leaflet-canvas-icon-layer leaflet-layer');
    if (this.options.zIndex) {
      this._container.style.zIndex = this.options.zIndex;
    }

    var size = this._map.getSize();
    this._container.width = size.x;
    this._container.height = size.y;

    this._ctx = this._container.getContext('2d');

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(this._container, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
  },

  /**
   * Add click listener
   */
  addOnClickListener: function (listener) {
    this._onClickListeners.push(listener);
  },

  /**
   * add hover listener
   */
  addOnHoverListener: function (listener) {
    this._onHoverListeners.push(listener);
  },

  /**
   * add mousedown listener
   */
  addOnMouseDownListener: function (listener) {
    this._onMouseDownListeners.push(listener);
  },

  /**
   * add mouseup listener
   */
  addOnMouseUpListener: function (listener) {
    this._onMouseUpListeners.push(listener);
  },

  /**
   * execute listener
   */
  _executeListeners: function (event) {
    if (!this._showMarkers) return;
    var me = this;
    var x = event.containerPoint.x;
    var y = event.containerPoint.y;

    if (me._openToolTip) {
      me._openToolTip.closeTooltip();
      delete me._openToolTip;
    }

    var ret = this._showMarkers.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y,
    });

    if (ret && ret.length > 0) {
      me._map._container.style.cursor = 'pointer';
      if (event.type === 'click') {
        var hasPopup = ret[0].data.getPopup();
        if (hasPopup) ret[0].data.openPopup();

        me._onClickListeners.forEach(function (listener) {
          listener(event, ret);
        });
      }
      if (event.type === 'mousemove') {
        var hasTooltip = ret[0].data.getTooltip();
        if (hasTooltip) {
          me._openToolTip = ret[0].data;
          ret[0].data.openTooltip();
        }

        me._onHoverListeners.forEach(function (listener) {
          listener(event, ret);
        });
      }
      if (event.type === 'mousedown') {
        me._onMouseDownListeners.forEach(function (listener) {
          listener(event, ret);
        });
      }

      if (event.type === 'mouseup') {
        me._onMouseUpListeners.forEach(function (listener) {
          listener(event, ret);
        });
      }
    } else {
      me._map._container.style.cursor = '';
    }
  },

  /**
   * Map Zoomanim event listener function
   * @param {Object} env {center:L.LatLng,zoom:number}format object
   */
  _onAnimZoom(ev) {
    this._updateTransform(ev.center, ev.zoom);
  },

  /**
   * Map modification zoom event listener function
   */
  _onZoom: function () {
    this._updateTransform(this._map.getCenter(), this._map.getZoom());
  },

  /**
   * Modify the original transform or position of dom
   * @param {L/LatLng} center center point
   * @param {number} zoom map zoom level
   */
  _updateTransform: function (center, zoom) {
    var scale = this._map.getZoomScale(zoom, this._zoom),
      position = L.DomUtil.getPosition(this._container),
      viewHalf = this._map.getSize().multiplyBy(0.5),
      currentCenterPoint = this._map.project(this._center, zoom),
      destCenterPoint = this._map.project(center, zoom),
      centerOffset = destCenterPoint.subtract(currentCenterPoint),
      topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

    if (L.Browser.any3d) {
      L.DomUtil.setTransform(this._container, topLeftOffset, scale);
    } else {
      L.DomUtil.setPosition(this._container, topLeftOffset);
    }
  },

  /**
   * Updating the pixel bounds of the renderer container (for later positioning/sizing/clipping)
   * subclasses are responsible for firing the "update" event.
   */
  _update: function () {
    var p = 0,
      size = this._map.getSize(),
      min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

    this._bounds = new L.Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

    this._center = this._map.getCenter();
    this._zoom = this._map.getZoom();

    this._redraw();
  },
  /**
   * Set layer transparency
   * @param {Number} opacity layer transparency
   */
  setOpacity(opacity) {
    this.options.opacity = opacity;
    return this._redraw(true);
  },

  // custom extension to add class to canvas element
  addClass: function (className) {
    L.DomUtil.addClass(this._container, className)
    return this
  }
}));

export var canvasMarkerLayer = (L.canvasMarkerLayer = function (options) {
  return new L.CanvasMarkerLayer(options);
});