namespace L { 
    export type LeafletPasteCreated = { layer: L.Layer };
    export type LeafletPasteCreatedFn = (event: LeafletPasteCreated) => void

    export interface Evented {
        fire(event: "paste:layer-created", data: L.LeafletPasteCreated, context?: any): this
        on(event: "paste:layer-created", data: L.LeafletPasteCreatedFn, context?: any): this
        once(event: "paste:layer-created", data: L.LeafletPasteCreatedFn, context?: any): this
        off(event: "paste:layer-created", data: L.LeafletPasteCreatedFn, context?: any): this
    }
    export interface Map extends Evented {
        pasteHandler: L.Paste
    }
    export interface MapOptions {
        pasteHandler: boolean
    }
    export class Paste extends L.Handler {
        private _map: L.Map;
        private REGEXP_GEOJSON: RegExp = /.*?[{[].*[}\]].*?/
        initialize (map: L.Map) {
            this._map = map;
        }

        override addHooks() {
            if (this._map) {
                L.DomEvent.on(this._map.getContainer(), 'paste', this.onclipboard, this);
            }
        }

        override removeHooks() {
            if (this._map) {
                L.DomEvent.off(this._map.getContainer(), 'paste', this.onclipboard, this);
            }
        }

        onclipboard(e: ClipboardEvent) {
            if (e.clipboardData.items && e.clipboardData.items.length > 0) {
                for (let i = 0; i < e.clipboardData.items.length; i++){
                    try {
                        let type = e.clipboardData.items[i].type;
                        if (type === 'text/plain') {
                            let text = e.clipboardData.getData(type);
                            this.convertPastedTextToLayer(text);
                        }
                        else {
                            console.warn(`pasting objects of type ${type} is not supported`);
                        }
                    } catch (err) {
                        console.error(err.message);
                    }
                }
            }
        }
        getAndSubmitLink (text: string) {
            if (text.indexOf(Gis.Site.BackendAddress()) > -1 || text.indexOf(Gis.Site.Address()) > -1) {
                window.location.href = text;
            }
        }

        convertPastedTextToLayer (text: string) {
            let centerLatLng: L.LatLng;
            try {
                const isValidObject = Gis.Clipboard.canBeConvertedToLayer(text);
                if (isValidObject && text.indexOf('{') > -1 && text.indexOf('geometry') > -1) {
                    let geoJson = JSON.parse(text.match(this.REGEXP_GEOJSON)[0]);
                    if (geoJson) {
                        if (geoJson.length) {
                            for (let i = 0; i < geoJson.length; i++) {
                                createEditableFromGeoJSON(geoJson[i]);
                            }
                            this._map.fire('gis:notify', { message: `Вставлено объектов: ${geoJson.length}` })
                        } else {
                            createEditableFromGeoJSON(geoJson);
                            this._map.fire('gis:notify', { message: 'Вставлен новый объект' })
                        }
                    }
                } else {
                    const layers = Gis.Clipboard.gisTaskToLayer(text);
                    if (layers.length > 0) {
                        let i = 0;
                        for (; i < layers.length; i++) {
                            createEditableFromGeoJSON(layers[i].feature || layers[i]);  
                        }
                        const firstLayer = layers[0];
                        if (firstLayer instanceof L.EditableGisCircle || firstLayer instanceof L.EditableGisMarker)
                            centerLatLng = firstLayer.getLatLng();
                        else {
                            centerLatLng = firstLayer.getBounds && firstLayer.getBounds()[0][0] ||
                                firstLayer.getBounds && firstLayer.getBounds()[0]
                        }
                     
                        this._map.fire('gis:notify', { message: `Добавлено объектов: ${i}` })
                    }
                }
                if(centerLatLng) this._map.panTo(centerLatLng);
            } catch (e) {
                console.error(e);
            }
        }

        submit(e) {
            var value = e.target[0].value,
                type = e.target[1].value;

            try {
                this._process(value, type);
                this.disable();
            }
            catch (e) {
                var err = e;

                // Leaflet's fire() seems to clobber Error objects.
                if (e instanceof Error) {
                    err = { message: e.message };
                }
                this._map.fire('paste:error', err);
            }
        }

        _process(value, type) {
            var layer;

            if (!value) {
                throw new Error('You must add a valid geometry.');
            }

            if (!L.Paste.hasOwnProperty(type)) {
                throw new Error(`Unknown data type: ${type}`);
            }

            layer = L.Paste[type].call(this, value);
            const center = layer.getBounds().getCenter();

            layer.addTo(this._map);
            this._map.fire('paste:layer-created', { layer: layer });
            this._map.panTo(center);
        }
    }

    export function pasteHandler (map: L.Map) {
        return new L.Paste(map);
    }
}

L.Map.addInitHook('addHandler', 'pasteHandler', L.pasteHandler)