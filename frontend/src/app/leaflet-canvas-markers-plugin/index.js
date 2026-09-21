/**
 * Leaflet Canvas Markers Layer Plugin
 * source: https://github.com/eJuke/Leaflet.Canvas-Markers
 * 
 * in this local copy:
 * factory modified for ts/es6 compatibility, .d.ts added
 * event handling chnaged, contextmenu handling added, marker options extended and css class util
 * tooltips and mouse move events removed
 */

'use strict';
import rbush from 'rbush'

function layerFactory(L) {

    if (typeof L.canvasIconLayer === "function") {
        // Already initialized, just use what's there.
        return
    }

    var CanvasIconLayer = (L.Layer ? L.Layer : L.Class).extend({

        //Add event listeners to initialized section.
        initialize: function (options) {

            L.setOptions(this, options);
            this._onClickListeners = [];
            this._onContextmenuListeners = [];
        },

        setOptions: function (options) {

            L.setOptions(this, options);
            return this.redraw();
        },

        redraw: function () {

            this._redraw(true);
        },

        //Multiple layers at a time for rBush performance
        addMarkers: function (markers) {

            var self = this;
            var tmpMark = [];
            var tmpLatLng = [];

            markers.forEach(function (marker) {

                if (!((marker.options.pane == 'markerPane') && marker.options.icon))
                {
                    console.error('Layer isn\'t a marker');
                    return;
                }

                var latlng = marker.getLatLng();
                var isDisplaying = self._map?.getBounds().contains(latlng) || false;
                var s = self._addMarker(marker,latlng,isDisplaying);

                //Only add to Point Lookup if we are on map
                if (isDisplaying ===true) tmpMark.push(s[0]);

                tmpLatLng.push(s[1]);
            });

            self._markers.load(tmpMark);
            self._latlngMarkers.load(tmpLatLng);
        },

        //Adds single layer at a time. Less efficient for rBush
        addMarker: function (marker) {

            var self = this;
            var latlng = marker.getLatLng();
            var isDisplaying = self._map?.getBounds().contains(latlng) || false;
            var dat = self._addMarker(marker,latlng,isDisplaying);

            //Only add to Point Lookup if we are on map
            if(isDisplaying ===true) self._markers.insert(dat[0]);

            self._latlngMarkers.insert(dat[1]);
        },

        addLayer: function (layer) {

            if ((layer.options.pane == 'markerPane') && layer.options.icon) this.addMarker(layer);
            else console.error('Layer isn\'t a marker');
        },

        addLayers: function (layers) {

            this.addMarkers(layers);
        },

        removeLayer: function (layer) {

            this.removeMarker(layer,true);
        },

        removeMarker: function (marker,redraw) {

            var self = this;

            //If we are removed point
            if(marker["minX"]) marker = marker.data;

            var latlng = marker.getLatLng();
            var isDisplaying = self._map?.getBounds().contains(latlng) || false;

            var markerData = {

                minX: latlng.lng,
                minY: latlng.lat,
                maxX: latlng.lng,
                maxY: latlng.lat,
                data: marker
            };

            self._latlngMarkers.remove(markerData, function (a,b) {

                return a.data._leaflet_id ===b.data._leaflet_id;
            });

            self._latlngMarkers.total--;
            self._latlngMarkers.dirty++;

            if(isDisplaying ===true && redraw ===true) {

                self._redraw(true);
            }
        },

        onAdd: function (map) {

            this._map = map;

            if (!this._canvas) this._initCanvas();

            if (this.options.pane) this.getPane().appendChild(this._canvas);
            else map._panes.overlayPane.appendChild(this._canvas);

            map.on('moveend', this._reset, this);
            map.on('resize',this._reset,this);

            map.on('click', this._executeListeners, this);
            map.on('contextmenu', this._executeListeners, this)
        },

        onRemove: function (map) {

            if (this.options.pane) this.getPane().removeChild(this._canvas);
            else map.getPanes().overlayPane.removeChild(this._canvas);

            map.off('click', this._executeListeners, this);
            map.off('contextmenu', this._executeListeners, this)

            map.off('moveend', this._reset, this);
            map.off('resize',this._reset,this);
        },

        addTo: function (map) {

            map.addLayer(this);
            return this;
        },

        clearLayers: function() {

            this._latlngMarkers = null;
            this._markers = null;
            this._redraw(true);
        },

        _addMarker: function(marker,latlng,isDisplaying) {

            var self = this;
            //Needed for pop-up & tooltip to work.
            // if(!self._map) return;
            marker._map = self._map;

            //_markers contains Points of markers currently displaying on map
            if (!self._markers) self._markers = new rbush();

            //_latlngMarkers contains Lat\Long coordinates of all markers in layer.
            if (!self._latlngMarkers) {
                self._latlngMarkers = new rbush();
                self._latlngMarkers.dirty=0;
                self._latlngMarkers.total=0;
            }

            L.Util.stamp(marker);

            var pointPos = self._map.latLngToContainerPoint(latlng);
            var iconSize = marker.options.icon.options.iconSize;

            var adj_x = iconSize[0]/2;
            var adj_y = iconSize[1]/2;
            var ret = [({
                minX: (pointPos.x - adj_x),
                minY: (pointPos.y - adj_y),
                maxX: (pointPos.x + adj_x),
                maxY: (pointPos.y + adj_y),
                data: marker
            }),({
                minX: latlng.lng,
                minY: latlng.lat,
                maxX: latlng.lng,
                maxY: latlng.lat,
                data: marker
            })];

            self._latlngMarkers.dirty++;
            self._latlngMarkers.total++;

            //Only draw if we are on map
            if(isDisplaying===true) self._drawMarker(marker, pointPos);

            return ret;
        },

        _drawMarker: function (marker, pointPos) {

            var self = this;

            if (!this._imageLookup) this._imageLookup = {};
            if (!pointPos) {

                pointPos = self._map.latLngToContainerPoint(marker.getLatLng());
            }

            var iconUrl = marker.options.icon.options.iconUrl;
            if(!iconUrl) return;

            if (marker.canvas_img) {

                // Cached reference may still belong to a load that hasn't settled yet or failed; only draw once it's actually usable.
                if (self._isImageDrawable(marker.canvas_img)) self._drawImage(marker, pointPos);
            }
            else {

                if(self._imageLookup[iconUrl]) {

                    marker.canvas_img = self._imageLookup[iconUrl][0];

                    if (self._imageLookup[iconUrl][1] ===false) {

                        self._imageLookup[iconUrl][2].push([marker,pointPos]);
                    }
                    else {

                        self._drawImage(marker,pointPos);
                    }
                }
                else {

                    var i = new Image();
                    i.src = iconUrl;
                    marker.canvas_img = i;

                    //Image,isLoaded,marker\pointPos ref
                    self._imageLookup[iconUrl] = [i, false, [[marker, pointPos]]];

                    i.onload = function() {

                        self._imageLookup[iconUrl][1] = true;
                        self._imageLookup[iconUrl][2].forEach(function (e) {

                            self._drawImage(e[0],e[1]);
                        });
                    }

                    i.onerror = function() {

                        console.error('Failed to load marker icon:', iconUrl, marker);
                        // Leave isLoaded=false so no queued marker is ever drawn with this broken image.
                        self._imageLookup[iconUrl][2] = [];
                    }
                }
            }
        },

        //An image can still be 'broken' after src is set (failed request, aborted load, etc.), which throws in drawImage.
        _isImageDrawable: function (img) {

            return !!img && img.complete && img.naturalWidth !== 0;
        },

        _drawImage: function (marker, pointPos) {

            if(marker.canvas_img===null) return
            if(!this._isImageDrawable(marker.canvas_img)) return
            var options = marker.options.icon.options;
            
            this._context.save()
            if(marker.options.highlight)
                this._context.filter = `
                    drop-shadow(0px 0px 4px yellow)
                    drop-shadow(0px 0px 8px yellow)
                    drop-shadow(0px 0px 12px yellow)
                `


            try {

                this._context.drawImage(
                    marker.canvas_img,
                    pointPos.x - options.iconAnchor[0],
                    pointPos.y - options.iconAnchor[1],
                    options.iconSize[0],
                    options.iconSize[1]
                )
            }
            catch (err) {

                console.error('Failed to draw marker icon:', err)
            }

            this._context.restore()
        },

        _reset: function () {

            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._canvas, topLeft);

            var size = this._map.getSize();

            this._canvas.width = size.x;
            this._canvas.height = size.y;

            this._redraw();
        },

        _redraw: function (clear) {

            var self = this;

            if (clear) this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
            if (!this._map || !this._latlngMarkers) return;

            var tmp = [];

            //If we are 10% individual inserts\removals, reconstruct lookup for efficiency
            if (self._latlngMarkers.dirty/self._latlngMarkers.total >= .1) {

                self._latlngMarkers.all().forEach(function(e) {

                    tmp.push(e);
                });

                self._latlngMarkers.clear();
                self._latlngMarkers.load(tmp);
                self._latlngMarkers.dirty=0;
                tmp = [];
            }

            var mapBounds = self._map.getBounds();

            //Only re-draw what we are showing on the map.

            var mapBoxCoords = {

                minX: mapBounds.getWest(),
                minY: mapBounds.getSouth(),
                maxX: mapBounds.getEast(),
                maxY: mapBounds.getNorth(),
            };

            self._latlngMarkers.search(mapBoxCoords).forEach(function (e) {

                //Readjust Point Map
                var pointPos = self._map.latLngToContainerPoint(e.data.getLatLng());

                var iconSize = e.data.options.icon.options.iconSize;
                var adj_x = iconSize[0]/2;
                var adj_y = iconSize[1]/2;

                var newCoords = {
                    minX: (pointPos.x - adj_x),
                    minY: (pointPos.y - adj_y),
                    maxX: (pointPos.x + adj_x),
                    maxY: (pointPos.y + adj_y),
                    data: e.data
                }

                tmp.push(newCoords);

                //Redraw points
                self._drawMarker(e.data, pointPos);
            });

            //Clear rBush & Bulk Load for performance
            this._markers.clear();
            this._markers.load(tmp);
        },

        _initCanvas: function () {

            this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-icon-layer leaflet-layer');
            var originProp = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);
            this._canvas.style[originProp] = '50% 50%';

            var size = this._map.getSize();
            this._canvas.width = size.x;
            this._canvas.height = size.y;

            this._context = this._canvas.getContext('2d');

            var animated = this._map.options.zoomAnimation && L.Browser.any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        },

        addOnClickListener: function (listener) {
            this._onClickListeners.push(listener);
        },

        addOnContextmenuListener: function (listener) {
            this._onContextmenuListeners.push(listener);
        },

        _executeListeners: function (event) {

            if (!this._markers) return;

            var me = this;
            var x = event.containerPoint.x;
            var y = event.containerPoint.y;

            var ret = this._markers.search({ minX: x, minY: y, maxX: x, maxY: y });

            if (ret && ret.length > 0)
            {
                const base = ret[0].data.options.base

                if (event.type==="click")
                    me._onClickListeners.forEach(function (listener) { listener(event, base); });

                if (event.type==="contextmenu")
                    me._onContextmenuListeners.forEach(function (listener) { listener(event, base); });
            }
        },

        // custom extension to add class to canvas element
        addClass: function (className) {
            L.DomUtil.addClass(this._canvas, className)
            return this
        }
    });



    L.canvasIconLayer = function (options) {
        return new CanvasIconLayer(options)
    }
};

export default layerFactory;